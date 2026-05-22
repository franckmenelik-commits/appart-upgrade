"""add search criteria, equidistance, and scraper sources to baselines

Revision ID: 003
Revises: 002
Create Date: 2026-05-22
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    # Utilise IF NOT EXISTS pour que la migration soit idempotente
    cols = [
        "ALTER TABLE baselines ADD COLUMN IF NOT EXISTS search_budget_max FLOAT",
        "ALTER TABLE baselines ADD COLUMN IF NOT EXISTS search_surface_min FLOAT",
        "ALTER TABLE baselines ADD COLUMN IF NOT EXISTS search_neighborhoods JSONB",
        "ALTER TABLE baselines ADD COLUMN IF NOT EXISTS commute_uni_address VARCHAR(500)",
        "ALTER TABLE baselines ADD COLUMN IF NOT EXISTS prefer_equidistance BOOLEAN DEFAULT false",
        "ALTER TABLE baselines ADD COLUMN IF NOT EXISTS amenities_current JSONB",
        "ALTER TABLE baselines ADD COLUMN IF NOT EXISTS amenities_desired JSONB",
    ]
    for col_sql in cols:
        conn.execute(sa.text(col_sql))


def downgrade() -> None:
    conn = op.get_bind()
    cols_to_drop = [
        "amenities_desired", "amenities_current", "prefer_equidistance",
        "commute_uni_address", "search_neighborhoods", "search_surface_min", "search_budget_max"
    ]
    for col in cols_to_drop:
        conn.execute(sa.text(f"ALTER TABLE baselines DROP COLUMN IF EXISTS {col}"))

