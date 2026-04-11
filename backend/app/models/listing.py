import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Listing(Base):
    """Une annonce d'appartement scrapée depuis une source externe."""

    __tablename__ = "listings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source: Mapped[str] = mapped_column(String(50), index=True)  # kijiji, zumper, centris, marketplace
    source_id: Mapped[str] = mapped_column(String(255), unique=True)
    source_url: Mapped[str] = mapped_column(String(1000))
    title: Mapped[str] = mapped_column(String(500))
    description_raw: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    city: Mapped[str] = mapped_column(String(100), default="Montréal", index=True)
    rent_monthly: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    surface_sqft: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    num_bedrooms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    num_bathrooms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    floor: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    has_balcony: Mapped[Optional[bool]] = mapped_column(nullable=True)
    has_dishwasher: Mapped[Optional[bool]] = mapped_column(nullable=True)
    has_laundry_inunit: Mapped[Optional[bool]] = mapped_column(nullable=True)
    has_parking: Mapped[Optional[bool]] = mapped_column(nullable=True)
    pet_friendly: Mapped[Optional[bool]] = mapped_column(nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    image_urls: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)
    structured_data: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True, comment="Données extraites par Claude depuis la description brute"
    )
    scraped_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    is_active: Mapped[bool] = mapped_column(default=True, index=True)

    scores: Mapped[List["UpgradeScore"]] = relationship(back_populates="listing")
