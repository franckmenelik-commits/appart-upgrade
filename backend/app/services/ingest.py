from __future__ import annotations

"""
Pipeline d'ingestion v2 — Vivenza.

Améliorations v2 :
- Scoring CONCURRENT avec asyncio.gather (5-10x plus rapide)
- Extraction IA en batch
- Limite de concurrence pour respecter les rate limits Gemini (10 req/s)
"""

import asyncio
import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.baseline import Baseline
from app.models.listing import Listing
from app.models.score import UpgradeScore
from app.models.user import User
from app.services.centris import CentrisListing, scrape_centris
from app.services.email_alerts import send_score_alert
from app.services.push_alerts import send_premium_alert
from app.services.extractor import extract_listing_data
from app.services.kijiji import scrape_kijiji
from app.services.zumper import scrape_zumper
from app.services.rentals import scrape_rentals
from app.services.scoring import compute_upgrade_score

logger = logging.getLogger(__name__)

# Nombre max de requêtes IA simultanées (respecte les limites Gemini free tier)
CONCURRENCY_LIMIT = 5


async def ingest_centris_listings(
    db: Session,
    min_price: int = 800,
    max_price: int = 3500,
    max_pages: int = 5,
) -> list[Listing]:
    """Scrape Centris et insère les nouvelles annonces en DB."""
    raw_listings = await scrape_centris(
        min_price=min_price,
        max_price=max_price,
        max_pages=max_pages,
    )

    # Filtrer les doublons en une seule requête DB
    existing_ids = set(
        db.scalars(select(Listing.source_id)).all()
    )
    new_raws = [r for r in raw_listings if r.source_id not in existing_ids]

    if not new_raws:
        logger.info("Centris: 0 nouvelles annonces (tout déjà en DB)")
        return []

    # Extraction IA en parallèle (avec semaphore pour le rate limiting)
    sem = asyncio.Semaphore(CONCURRENCY_LIMIT)

    async def extract_one(raw: CentrisListing) -> Optional[dict]:
        async with sem:
            description = _build_description(raw)
            try:
                return await extract_listing_data(description)
            except Exception as e:
                logger.warning("Extraction échouée pour %s: %s", raw.source_id, e)
                return None

    descriptions_map = {r.source_id: _build_description(r) for r in new_raws}
    structured_results = await asyncio.gather(*[extract_one(r) for r in new_raws])

    new_listings = []
    for raw, structured in zip(new_raws, structured_results):
        listing = Listing(
            source="centris",
            source_id=raw.source_id,
            source_url=raw.source_url,
            title=raw.title,
            description_raw=descriptions_map[raw.source_id],
            address=raw.address,
            city=raw.city,
            image_urls=[raw.image_url] if raw.image_url else None,
            structured_data=structured,
        )

        # Enrichir depuis les données extraites
        if structured:
            for field in ["rent_monthly", "surface_sqft", "num_bedrooms", "num_bathrooms", "floor"]:
                if getattr(listing, field) is None and structured.get(field) is not None:
                    setattr(listing, field, structured[field])
            for field in ["has_balcony", "has_dishwasher", "has_laundry_inunit", "has_parking", "pet_friendly"]:
                if getattr(listing, field) is None and structured.get(field) is not None:
                    setattr(listing, field, structured[field])

        # Fallback prix
        if listing.rent_monthly is None and raw.price_value:
            listing.rent_monthly = raw.price_value
        elif listing.rent_monthly is None and raw.price_text:
            listing.rent_monthly = _parse_price(raw.price_text)

        db.add(listing)
        new_listings.append(listing)

    if new_listings:
        db.commit()
        for l in new_listings:
            db.refresh(l)

    logger.info("Centris: %d nouvelles annonces sur %d scrapées", len(new_listings), len(raw_listings))
    return new_listings


async def score_listings_for_user(
    db: Session,
    user_id: str,
    listings: list[Listing],
) -> list[UpgradeScore]:
    """Score une liste d'annonces vs le baseline d'un utilisateur — CONCURRENT."""
    baseline = db.scalars(
        select(Baseline).where(Baseline.user_id == user_id)
    ).first()

    if not baseline:
        logger.warning("Pas de baseline pour user %s — skip scoring", user_id)
        return []

    priorities = baseline.priorities or {"price": 5, "space": 5, "commute": 5, "amenities": 5, "quality": 5}

    baseline_dict = {
        "address": baseline.address,
        "rent_monthly": baseline.rent_monthly,
        "surface_sqft": baseline.surface_sqft,
        "num_bedrooms": baseline.num_bedrooms,
        "num_bathrooms": baseline.num_bathrooms,
        "floor": baseline.floor,
        "has_balcony": baseline.has_balcony,
        "has_dishwasher": baseline.has_dishwasher,
        "has_laundry_inunit": baseline.has_laundry_inunit,
        "has_parking": baseline.has_parking,
        "pet_friendly": baseline.pet_friendly,
        "commute_minutes": baseline.commute_minutes,
    }

    # Filtrer les déjà scorés
    already_scored = set(
        db.scalars(
            select(UpgradeScore.listing_id).where(UpgradeScore.user_id == user_id)
        ).all()
    )
    to_score = [l for l in listings if l.id not in already_scored]

    if not to_score:
        return []

    # Score CONCURRENT avec semaphore
    sem = asyncio.Semaphore(CONCURRENCY_LIMIT)

    async def score_one(listing: Listing):
        async with sem:
            listing_dict = {
                "address": listing.address,
                "rent_monthly": listing.rent_monthly,
                "surface_sqft": listing.surface_sqft,
                "num_bedrooms": listing.num_bedrooms,
                "num_bathrooms": listing.num_bathrooms,
                "floor": listing.floor,
                "has_balcony": listing.has_balcony,
                "has_dishwasher": listing.has_dishwasher,
                "has_laundry_inunit": listing.has_laundry_inunit,
                "has_parking": listing.has_parking,
                "pet_friendly": listing.pet_friendly,
                "description_raw": listing.description_raw,
            }
            try:
                result = await compute_upgrade_score(baseline_dict, listing_dict, priorities)
                return listing, result
            except Exception as e:
                logger.warning("Scoring échoué pour listing %s: %s", listing.id, e)
                return listing, None

    results = await asyncio.gather(*[score_one(l) for l in to_score])

    scores = []
    for listing, result in results:
        if result is None:
            continue
        score = UpgradeScore(
            user_id=user_id,
            listing_id=listing.id,
            total_score=result["total_score"],
            price_score=result["price_score"],
            space_score=result["space_score"],
            commute_score=result["commute_score"],
            amenities_score=result["amenities_score"],
            quality_score=result["quality_score"],
            delta_rent=(listing.rent_monthly or 0) - baseline.rent_monthly,
            delta_surface=(listing.surface_sqft or 0) - baseline.surface_sqft if listing.surface_sqft else None,
            highlights={"points": result.get("highlights", [])},
            recommendation=result.get("recommendation"),
            breakdown=result,
        )
        db.add(score)
        scores.append(score)

    if scores:
        db.commit()
        for s in scores:
            db.refresh(s)

        # Alertes email pour les scores élevés (users Pro/Premium)
        user = db.get(User, user_id)
        if user and user.plan in ("pro", "premium") and user.email:
            from app.config import settings
            threshold = settings.alert_score_threshold
            high_scores = [
                (s, db.get(Listing, s.listing_id))
                for s in scores
                if s.total_score >= threshold
            ]
            for score_obj, listing in high_scores:
                if not listing:
                    continue
                # Email (Pro + Premium)
                await send_score_alert(
                    to_email=user.email,
                    user_name=user.name,
                    score=score_obj.total_score,
                    listing_title=listing.title,
                    listing_address=listing.address,
                    delta_rent=score_obj.delta_rent,
                    delta_surface=score_obj.delta_surface,
                    delta_commute=score_obj.delta_commute_minutes,
                    recommendation=score_obj.recommendation,
                    listing_url=listing.source_url,
                )
                # Push ntfy (Premium seulement)
                if user.plan == "premium" and user.ntfy_topic:
                    await send_premium_alert(
                        user_ntfy_topic=user.ntfy_topic,
                        score=score_obj.total_score,
                        listing_title=listing.title,
                        listing_address=listing.address,
                        delta_rent=score_obj.delta_rent,
                        recommendation=score_obj.recommendation,
                        listing_url=listing.source_url,
                    )

    logger.info(
        "Scoring: %d scores créés pour user %s (sur %d listings, 5 en parallèle)",
        len(scores), user_id[:8], len(to_score),
    )
    return scores


async def ingest_kijiji_listings(
    db: Session,
    min_price: int = 800,
    max_price: int = 3500,
) -> list[Listing]:
    """Scrape Kijiji et insère les nouvelles annonces en DB."""
    raw_listings = await scrape_kijiji(min_price=min_price, max_price=max_price)

    existing_ids = set(db.scalars(select(Listing.source_id)).all())
    new_raws = [r for r in raw_listings if r.source_id not in existing_ids]

    if not new_raws:
        return []

    new_listings = []
    for raw in new_raws:
        listing = Listing(
            source="kijiji",
            source_id=raw.source_id,
            source_url=raw.source_url,
            title=raw.title,
            description_raw=raw.description_raw,
            address=raw.address,
            city=raw.city,
            rent_monthly=raw.price_value,
            image_urls=[raw.image_url] if raw.image_url else None,
        )
        db.add(listing)
        new_listings.append(listing)

    if new_listings:
        db.commit()
        for l in new_listings:
            db.refresh(l)

    logger.info("Kijiji: %d nouvelles annonces", len(new_listings))
    return new_listings


async def ingest_zumper_listings(db: Session, min_price: int = 800, max_price: int = 4000) -> list[Listing]:
    raw_listings = await scrape_zumper(min_price=min_price, max_price=max_price)
    existing_ids = set(db.scalars(select(Listing.source_id)).all())
    new_raws = [r for r in raw_listings if r.source_id not in existing_ids]
    if not new_raws: return []
    new_listings = []
    for raw in new_raws:
        listing = Listing(
            source="zumper", source_id=raw.source_id, source_url=raw.source_url,
            title=raw.title, description_raw=raw.description_raw, rent_monthly=raw.price_value,
            image_urls=[raw.image_url] if raw.image_url else None
        )
        db.add(listing)
        new_listings.append(listing)
    db.commit()
    return new_listings


async def ingest_rentals_listings(db: Session, min_price: int = 800, max_price: int = 4000) -> list[Listing]:
    raw_listings = await scrape_rentals(min_price=min_price, max_price=max_price)
    existing_ids = set(db.scalars(select(Listing.source_id)).all())
    new_raws = [r for r in raw_listings if r.source_id not in existing_ids]
    if not new_raws: return []
    new_listings = []
    for raw in new_raws:
        listing = Listing(
            source="rentals", source_id=raw.source_id, source_url=raw.source_url,
            title=raw.title, description_raw=raw.description_raw, rent_monthly=raw.price_value,
            image_urls=[raw.image_url] if raw.image_url else None
        )
        db.add(listing)
        new_listings.append(listing)
    db.commit()
    return new_listings


async def run_full_pipeline() -> dict:
    """Pipeline complet : scrape Centris + Kijiji → score → alertes email."""
    from app.database import SessionLocal
    
    # On crée une nouvelle session dédiée pour le background task
    db = SessionLocal()
    try:
        # Scrape les sources en parallèle
        centris_task = ingest_centris_listings(db)
        kijiji_task = ingest_kijiji_listings(db)
        zumper_task = ingest_zumper_listings(db)
        rentals_task = ingest_rentals_listings(db)
        
        results = await asyncio.gather(centris_task, kijiji_task, zumper_task, rentals_task)
        new_listings = [l for sublist in results for l in sublist]

        baselines = list(db.scalars(select(Baseline)))
        total_scores = 0

        # Score pour chaque user en parallèle si plusieurs users
        if len(baselines) == 1:
            scores = await score_listings_for_user(db, str(baselines[0].user_id), new_listings)
            total_scores = len(scores)
        else:
            # Multi-user : on score aussi les anciennes annonces non encore scorées
            all_listings = list(db.scalars(select(Listing).where(Listing.is_active)).all())
            tasks = [score_listings_for_user(db, str(b.user_id), all_listings) for b in baselines]
            all_scores = await asyncio.gather(*tasks)
            total_scores = sum(len(s) for s in all_scores)

        return {
            "new_listings": len(new_listings),
            "users_scored": len(baselines),
            "new_scores": total_scores,
        }
    finally:
        db.close()


def _build_description(raw: CentrisListing) -> str:
    parts = [raw.title, raw.price_text, raw.address]
    if raw.bedrooms_text:
        parts.append(f"Chambres: {raw.bedrooms_text}")
    if raw.bathrooms_text:
        parts.append(f"Salles de bain: {raw.bathrooms_text}")
    if raw.area_text:
        parts.append(f"Superficie: {raw.area_text}")
    if raw.features:
        parts.append("Caractéristiques: " + ", ".join(raw.features))
    return " — ".join(filter(None, parts))


def _parse_price(text: str) -> Optional[float]:
    import re
    cleaned = re.sub(r"[^\d.]", "", text.replace(",", "").replace("\u00a0", "").replace(" ", ""))
    try:
        return float(cleaned)
    except ValueError:
        return None
