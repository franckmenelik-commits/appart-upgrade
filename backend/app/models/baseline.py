import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Baseline(Base):
    """L'appartement actuel de l'utilisateur — le point de référence pour le scoring."""

    __tablename__ = "baselines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, unique=True)
    address: Mapped[str] = mapped_column(String(500))
    city: Mapped[str] = mapped_column(String(100), default="Montréal")
    rent_monthly: Mapped[float] = mapped_column(Float)
    surface_sqft: Mapped[float] = mapped_column(Float)
    num_bedrooms: Mapped[int] = mapped_column(Integer)
    num_bathrooms: Mapped[int] = mapped_column(Integer, default=1)
    floor: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    has_balcony: Mapped[bool] = mapped_column(default=False)
    has_dishwasher: Mapped[bool] = mapped_column(default=False)
    has_laundry_inunit: Mapped[bool] = mapped_column(default=False)
    has_parking: Mapped[bool] = mapped_column(default=False)
    pet_friendly: Mapped[bool] = mapped_column(default=False)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    commute_work_address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    commute_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    photo_analysis: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    priorities: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        comment="Pondération des critères: {price: 0-10, space: 0-10, commute: 0-10, amenities: 0-10, quality: 0-10}",
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="baseline")
