from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class Priorities(BaseModel):
    price: int = 5
    space: int = 5
    commute: int = 5
    amenities: int = 5
    quality: int = 5


class BaselineCreate(BaseModel):
    address: str
    city: str = "Montréal"
    rent_monthly: float
    surface_sqft: float
    num_bedrooms: int
    num_bathrooms: int = 1
    floor: int | None = None
    has_balcony: bool = False
    has_dishwasher: bool = False
    has_laundry_inunit: bool = False
    has_parking: bool = False
    pet_friendly: bool = False
    commute_work_address: str | None = None
    commute_uni_address: str | None = None
    prefer_equidistance: bool = False
    amenities_current: list[str] | None = []
    amenities_desired: list[str] | None = []
    notes: str | None = None
    priorities: Priorities = Priorities()


class BaselineUpdate(BaseModel):
    address: str | None = None
    rent_monthly: float | None = None
    surface_sqft: float | None = None
    num_bedrooms: int | None = None
    num_bathrooms: int | None = None
    floor: int | None = None
    has_balcony: bool | None = None
    has_dishwasher: bool | None = None
    has_laundry_inunit: bool | None = None
    has_parking: bool | None = None
    pet_friendly: bool | None = None
    commute_work_address: str | None = None
    commute_uni_address: str | None = None
    prefer_equidistance: bool | None = None
    amenities_current: list[str] | None = None
    amenities_desired: list[str] | None = None
    notes: str | None = None
    priorities: Priorities | None = None


class BaselineResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    address: str
    city: str
    rent_monthly: float
    surface_sqft: float
    num_bedrooms: int
    num_bathrooms: int
    floor: int | None
    has_balcony: bool
    has_dishwasher: bool
    has_laundry_inunit: bool
    has_parking: bool
    pet_friendly: bool
    commute_work_address: str | None
    commute_uni_address: str | None
    commute_minutes: int | None
    prefer_equidistance: bool
    amenities_current: list[str] | None
    amenities_desired: list[str] | None
    priorities: dict | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
