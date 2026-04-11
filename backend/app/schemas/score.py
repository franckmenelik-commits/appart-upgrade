from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.listing import ListingResponse


class ScoreResponse(BaseModel):
    id: uuid.UUID
    listing: ListingResponse
    total_score: int
    price_score: int
    space_score: int
    commute_score: int
    amenities_score: int
    quality_score: int
    delta_rent: float
    delta_surface: float | None
    delta_commute_minutes: int | None
    highlights: dict | None
    recommendation: str | None
    computed_at: datetime

    model_config = {"from_attributes": True}
