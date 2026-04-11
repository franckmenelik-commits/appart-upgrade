from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.listing import Listing
from app.schemas.listing import ListingCreate, ListingResponse
from app.services.extractor import extract_listing_data

router = APIRouter()


@router.post("/", response_model=ListingResponse, status_code=201)
async def create_listing(data: ListingCreate, db: Session = Depends(get_db)):
    """Crée une annonce et extrait les données structurées via Claude."""
    structured = None
    if data.description_raw:
        structured = await extract_listing_data(data.description_raw)

    listing = Listing(
        **data.model_dump(),
        structured_data=structured,
    )

    # Enrichir les champs depuis les données extraites si manquantes
    if structured:
        for field in ["rent_monthly", "surface_sqft", "num_bedrooms", "num_bathrooms", "floor"]:
            if getattr(listing, field) is None and structured.get(field) is not None:
                setattr(listing, field, structured[field])
        for field in ["has_balcony", "has_dishwasher", "has_laundry_inunit", "has_parking", "pet_friendly"]:
            if getattr(listing, field) is None and structured.get(field) is not None:
                setattr(listing, field, structured[field])

    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


@router.get("/", response_model=list[ListingResponse])
def list_listings(
    city: str = "Montréal",
    source: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    min_bedrooms: int | None = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    query = select(Listing).where(Listing.is_active, Listing.city == city)
    if source:
        query = query.where(Listing.source == source)
    if min_price is not None:
        query = query.where(Listing.rent_monthly >= min_price)
    if max_price is not None:
        query = query.where(Listing.rent_monthly <= max_price)
    if min_bedrooms is not None:
        query = query.where(Listing.num_bedrooms >= min_bedrooms)
    query = query.order_by(Listing.scraped_at.desc()).offset(offset).limit(limit)
    return list(db.scalars(query))


@router.get("/{listing_id}", response_model=ListingResponse)
def get_listing(listing_id: uuid.UUID, db: Session = Depends(get_db)):
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    return listing
