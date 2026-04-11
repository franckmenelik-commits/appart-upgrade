import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.listing import Listing
from app.models.score import UpgradeScore
from app.models.user import User
from app.schemas.score import ScoreResponse
from app.services.auth import get_current_user
from app.services.billing import check_user_quota
from app.services.scoring import compute_upgrade_score

router = APIRouter()


@router.post("/{listing_id}", response_model=ScoreResponse, status_code=201)
async def score_listing(
    listing_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Calcule le score d'upgrade d'une annonce pour l'utilisateur authentifié."""
    # Vérifier le quota
    if not check_user_quota(current_user.plan, current_user.scores_used_this_month):
        raise HTTPException(
            status_code=403,
            detail="Quota de scores atteint. Passe au plan Pro pour des scores illimités.",
        )

    user = current_user
    if not user or not user.baseline:
        raise HTTPException(status_code=404, detail="Utilisateur ou baseline non trouvé")

    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")

    baseline = user.baseline
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

    result = await compute_upgrade_score(baseline_dict, listing_dict, priorities)

    # Incrémenter le compteur de scores
    current_user.scores_used_this_month += 1

    score = UpgradeScore(
        user_id=current_user.id,
        listing_id=listing_id,
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
    db.commit()
    db.refresh(score)
    return score


@router.get("/", response_model=list[ScoreResponse])
def get_user_scores(
    min_score: int = Query(default=0, ge=0, le=100),
    limit: int = Query(default=20, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Récupère les top scores de l'utilisateur authentifié, triés par score décroissant."""
    query = (
        select(UpgradeScore)
        .options(joinedload(UpgradeScore.listing))
        .where(UpgradeScore.user_id == current_user.id, UpgradeScore.total_score >= min_score)
        .order_by(UpgradeScore.total_score.desc())
        .limit(limit)
    )
    return list(db.scalars(query))
