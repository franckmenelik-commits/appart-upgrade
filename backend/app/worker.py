"""
Celery worker + tâches périodiques — Vivenza.

Le worker est le coeur de l'automatisation :
1. Scraping Centris toutes les 3h (pas 6h — on veut battre le marché)
2. Scoring automatique de chaque nouvelle annonce vs chaque user actif
3. Alertes par email pour les scores élevés (users Pro/Premium)
4. Reset des quotas mensuels

Démarrer :
    celery -A app.worker worker --beat --loglevel=info --concurrency=2
"""

from __future__ import annotations

import asyncio
import logging

from celery import Celery
from celery.schedules import crontab

from app.config import settings

logger = logging.getLogger(__name__)

celery_app = Celery(
    "vivenza",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Montreal",
    enable_utc=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)

# === Tâches périodiques ===
celery_app.conf.beat_schedule = {
    # Scrape Centris toutes les 3 heures — on bat le marché de 24-48h
    "scrape-centris-every-3h": {
        "task": "app.worker.scrape_and_score_task",
        "schedule": crontab(minute=15, hour="*/3"),  # x:15 pour éviter les heures pile
        "args": (800, 3500),
    },
    # Reset des quotas mensuels (1er du mois à 00:05)
    "reset-monthly-quotas": {
        "task": "app.worker.reset_monthly_quotas_task",
        "schedule": crontab(minute=5, hour=0, day_of_month=1),
    },
}


def _run_async(coro):
    """Helper pour exécuter une coroutine dans un task Celery synchrone."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="app.worker.scrape_and_score_task", bind=True, max_retries=3)
def scrape_and_score_task(self, min_price: int = 800, max_price: int = 3500):
    """
    Pipeline automatique complet :
    1. Scrape Centris
    2. Score chaque nouvelle annonce pour chaque user avec un baseline
    3. Log les résultats

    C'est ÇA le service qu'on facture — pas de clic nécessaire côté client.
    """
    from app.database import SessionLocal
    from app.services.ingest import run_full_pipeline

    logger.info("Pipeline auto démarré (prix: %d-%d$)...", min_price, max_price)

    db = SessionLocal()
    try:
        result = _run_async(run_full_pipeline(db))
        logger.info(
            "Pipeline terminé: %d nouvelles annonces, %d scores pour %d utilisateurs",
            result["new_listings"],
            result["new_scores"],
            result["users_scored"],
        )
        return result
    except Exception as exc:
        logger.error("Erreur pipeline: %s", exc)
        raise self.retry(exc=exc, countdown=60 * 5)
    finally:
        db.close()


@celery_app.task(name="app.worker.reset_monthly_quotas_task")
def reset_monthly_quotas_task():
    """Remet les compteurs de scores à 0 pour tous les utilisateurs le 1er du mois."""
    from sqlalchemy import update

    from app.database import SessionLocal
    from app.models.user import User

    db = SessionLocal()
    try:
        result = db.execute(update(User).values(scores_used_this_month=0))
        db.commit()
        count = result.rowcount
        logger.info("Quotas mensuels reset pour %d utilisateurs", count)
        return {"reset_count": count}
    finally:
        db.close()


@celery_app.task(name="app.worker.score_listing_task")
def score_listing_task(user_id: str, listing_id: str):
    """Score une annonce spécifique pour un utilisateur (appelé par l'extension Chrome)."""
    import uuid

    from app.database import SessionLocal
    from app.models.listing import Listing
    from app.services.ingest import score_listings_for_user

    db = SessionLocal()
    try:
        listing = db.get(Listing, uuid.UUID(listing_id))
        if not listing:
            logger.warning("Listing %s non trouvé", listing_id)
            return None

        scores = _run_async(score_listings_for_user(db, user_id, [listing]))
        if scores:
            return {"score": scores[0].total_score, "listing_id": listing_id}
        return None
    finally:
        db.close()
