"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-04-11
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, index=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column("plan", sa.String(20), server_default="free", nullable=False),
        sa.Column("stripe_customer_id", sa.String(255), nullable=True),
        sa.Column("stripe_subscription_id", sa.String(255), nullable=True),
        sa.Column("scores_used_this_month", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Baselines
    op.create_table(
        "baselines",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), unique=True, nullable=False),
        sa.Column("address", sa.String(500), nullable=False),
        sa.Column("city", sa.String(100), server_default="Montréal", nullable=False),
        sa.Column("rent_monthly", sa.Float(), nullable=False),
        sa.Column("surface_sqft", sa.Float(), nullable=False),
        sa.Column("num_bedrooms", sa.Integer(), nullable=False),
        sa.Column("num_bathrooms", sa.Integer(), server_default="1", nullable=False),
        sa.Column("floor", sa.Integer(), nullable=True),
        sa.Column("has_balcony", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("has_dishwasher", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("has_laundry_inunit", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("has_parking", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("pet_friendly", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("commute_work_address", sa.String(500), nullable=True),
        sa.Column("commute_minutes", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("photo_analysis", postgresql.JSONB(), nullable=True),
        sa.Column("priorities", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Listings
    op.create_table(
        "listings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("source", sa.String(50), index=True, nullable=False),
        sa.Column("source_id", sa.String(255), unique=True, nullable=False),
        sa.Column("source_url", sa.String(1000), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description_raw", sa.Text(), nullable=True),
        sa.Column("address", sa.String(500), nullable=True),
        sa.Column("city", sa.String(100), server_default="Montréal", index=True, nullable=False),
        sa.Column("rent_monthly", sa.Float(), nullable=True),
        sa.Column("surface_sqft", sa.Float(), nullable=True),
        sa.Column("num_bedrooms", sa.Integer(), nullable=True),
        sa.Column("num_bathrooms", sa.Integer(), nullable=True),
        sa.Column("floor", sa.Integer(), nullable=True),
        sa.Column("has_balcony", sa.Boolean(), nullable=True),
        sa.Column("has_dishwasher", sa.Boolean(), nullable=True),
        sa.Column("has_laundry_inunit", sa.Boolean(), nullable=True),
        sa.Column("has_parking", sa.Boolean(), nullable=True),
        sa.Column("pet_friendly", sa.Boolean(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("image_urls", postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column("structured_data", postgresql.JSONB(), nullable=True),
        sa.Column("scraped_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", index=True, nullable=False),
    )

    # Upgrade Scores
    op.create_table(
        "upgrade_scores",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), index=True, nullable=False),
        sa.Column("listing_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("listings.id"), index=True, nullable=False),
        sa.Column("total_score", sa.Integer(), nullable=False),
        sa.Column("price_score", sa.Integer(), nullable=False),
        sa.Column("space_score", sa.Integer(), nullable=False),
        sa.Column("commute_score", sa.Integer(), nullable=False),
        sa.Column("amenities_score", sa.Integer(), nullable=False),
        sa.Column("quality_score", sa.Integer(), nullable=False),
        sa.Column("delta_rent", sa.Float(), nullable=False),
        sa.Column("delta_surface", sa.Float(), nullable=True),
        sa.Column("delta_commute_minutes", sa.Integer(), nullable=True),
        sa.Column("highlights", postgresql.JSONB(), nullable=True),
        sa.Column("recommendation", sa.Text(), nullable=True),
        sa.Column("breakdown", postgresql.JSONB(), nullable=True),
        sa.Column("computed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("upgrade_scores")
    op.drop_table("listings")
    op.drop_table("baselines")
    op.drop_table("users")
