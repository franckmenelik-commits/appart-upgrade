import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UpgradeScore(Base):
    """Le score d'upgrade calculé pour une annonce par rapport au baseline d'un utilisateur."""

    __tablename__ = "upgrade_scores"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    listing_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("listings.id"), index=True)
    total_score: Mapped[int] = mapped_column(Integer, comment="Score global 0-100")
    price_score: Mapped[int] = mapped_column(Integer, comment="Rapport qualité/prix 0-100")
    space_score: Mapped[int] = mapped_column(Integer, comment="Gain d'espace 0-100")
    commute_score: Mapped[int] = mapped_column(Integer, comment="Amélioration trajet 0-100")
    amenities_score: Mapped[int] = mapped_column(Integer, comment="Équipements gagnés 0-100")
    quality_score: Mapped[int] = mapped_column(Integer, comment="Qualité des finitions 0-100")
    delta_rent: Mapped[float] = mapped_column(Float, comment="Différence de loyer en $")
    delta_surface: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    delta_commute_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    highlights: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True, comment='Points forts: ["balcon ajouté", "+20 sqft"]'
    )
    recommendation: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="Phrase de recommandation générée par Claude"
    )
    breakdown: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True, comment="Détail complet du scoring")
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="scores")
    listing: Mapped["Listing"] = relationship(back_populates="scores")
