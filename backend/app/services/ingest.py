from __future__ import annotations

"""
Pipeline d'ingestion — orchestre le scraping, l'extraction IA, et le scoring.

Ce service est le coeur du système. Il :
1. Scrape les nouvelles annonces depuis Centris
2. Extrait les données structurées via Claude
3. Score chaque annonce vs le baseline de chaque utilisateur actif
4. Notifie les utilisateurs pour les scores élevés
"""

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.baseline import Baseline
from app.models.listing import Listing
from app.models.score import UpgradeScore
from app.services.centris import CentrisListing, scrape_centris
from app.services.extractor import extract_listing_data
from app.services.scoring import compute_upgrade_score

logger = logging.getLogger(__name__)


async def ingest_centris_listings(
    db: Session,
    min_price: int = 800,
    max_price: int = 3000,
    max_pages: int = 5,
) -> list[Listing]:
    """Scrape Centris et insère les nouvelles annonces en DB."""
    raw_listings = await scrape_centris(
        min_price=min_price,
        max_price=max_price,
        max_pages=max_pages,
    )

    new_listings = []
    for raw in raw_listings:
        # Skip si déjà en DB
        existing = db.scalars(
            select(Listing).where(Listing.source_id == raw.source_id)
        ).first()
        if existing:
            continue

        # Construire la description brute pour l'extraction IA
        description = _build_description(raw)

        # Extraire les données structurées via Claude
        structured = None
        try:
            structured = await extract_listing_data(description)
        except Exception as e:
            logger.warning("Extraction IA échouée pour %s: %s", raw.source_id, e)

        listing = Listing(
            source="centris",
            source_id=raw.source_id,
            source_url=raw.source_url,
            title=raw.title,
            description_raw=description,
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

        # Fallback : parser le prix directement depuis le texte Centris
        if listing.rent_monthly is None and raw.price_text:
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
    """Score une liste d'annonces vs le baseline d'un utilisateur."""
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

    scores = []
    for listing in listings:
        # Skip si déjà scoré
        existing_score = db.scalars(
            select(UpgradeScore).where(
                UpgradeScore.user_id == user_id,
                UpgradeScore.listing_id == listing.id,
            )
        ).first()
        if existing_score:
            continue

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
        except Exception as e:
            logger.warning("Scoring échoué pour listing %s: %s", listing.id, e)
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

    return scores


async def run_full_pipeline(db: Session) -> dict:
    """Pipeline complet : scrape → ingest → score pour tous les utilisateurs actifs."""
    # 1. Scrape Centris
    new_listings = await ingest_centris_listings(db)

    # 2. Score pour chaque utilisateur qui a un baseline
    baselines = list(db.scalars(select(Baseline)))
    total_scores = 0

    for baseline in baselines:
        scores = await score_listings_for_user(
            db,
            user_id=str(baseline.user_id),
            listings=new_listings,
        )
        total_scores += len(scores)

    return {
        "new_listings": len(new_listings),
        "users_scored": len(baselines),
        "new_scores": total_scores,
    }


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


def _parse_price(text: str) -> float | None:
    import re
    cleaned = re.sub(r"[^\d.,]", "", text).replace(",", "").replace(" ", "")
    try:
        return float(cleaned)
    except ValueError:
        return None
