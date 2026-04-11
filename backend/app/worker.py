"""
Celery worker + tâches périodiques.

Démarrer le worker :
    celery -A app.worker worker --loglevel=info

Démarrer le scheduler (beat) :
    celery -A app.worker beat --loglevel=info

Ou les deux ensemble (dev) :
    celery -A app.worker worker --beat --loglevel=info
"""

from __future__ import annotations

import asyncio
import logging

from celery import Celery
from celery.schedules import crontab

from app.config import settings

logger = logging.getLogger(__name__)

celery_app = Celery(
    "appart_upgrade",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Montreal",
    enable_utc=True,
    # Retry sur échec
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)

# Tâches périodiques
celery_app.conf.beat_schedule = {
    # Scrape Centris toutes les 6 heures (pour les users Pro/Premium)
    "scrape-centris-every-6h": {
        "task": "app.worker.scrape_centris_task",
        "schedule": crontab(minute=0, hour="*/6"),
        "args": (800, 3000),
    },
    # Reset des quotas mensuels (1er du mois à minuit)
    "reset-monthly-quotas": {
        "task": "app.worker.reset_monthly_quotas_task",
        "schedule": crontab(minute=0, hour=0, day_of_month=1),
    },
}


def _run_async(coro):
    """Helper pour exécuter une coroutine dans un task Celery synchrone."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="app.worker.scrape_centris_task", bind=True, max_retries=3)
def scrape_centris_task(self, min_price: int = 800, max_price: int = 3000):
    """Scrape Centris et score les nouvelles annonces pour tous les users Pro/Premium."""
    from app.database import SessionLocal
    from app.services.ingest import run_full_pipeline

    logger.info("Démarrage du scraping Centris périodique...")

    db = SessionLocal()
    try:
        result = _run_async(run_full_pipeline(db))
        logger.info(
            "Pipeline terminé: %d nouvelles annonces, %d scores calculés pour %d utilisateurs",
            result["new_listings"],
            result["new_scores"],
            result["users_scored"],
        )
        return result
    except Exception as exc:
        logger.error("Erreur pipeline: %s", exc)
        raise self.retry(exc=exc, countdown=60 * 5)  # retry dans 5 min
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
