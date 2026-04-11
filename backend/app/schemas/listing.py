from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class ListingCreate(BaseModel):
    source: str
    source_id: str
    source_url: str
    title: str
    description_raw: str | None = None
    address: str | None = None
    city: str = "Montréal"
    rent_monthly: float | None = None
    surface_sqft: float | None = None
    num_bedrooms: int | None = None
    num_bathrooms: int | None = None
    image_urls: list[str] | None = None


class ListingResponse(BaseModel):
    id: uuid.UUID
    source: str
    source_url: str
    title: str
    address: str | None
    city: str
    rent_monthly: float | None
    surface_sqft: float | None
    num_bedrooms: int | None
    num_bathrooms: int | None
    has_balcony: bool | None
    has_dishwasher: bool | None
    has_laundry_inunit: bool | None
    has_parking: bool | None
    pet_friendly: bool | None
    image_urls: list[str] | None
    structured_data: dict | None
    scraped_at: datetime
    is_active: bool

    model_config = {"from_attributes": True}
