"""extend delivery rider workflow

Revision ID: s9t0u1v2w3x4
Revises: o5p6q7r8s9t0
Create Date: 2026-06-25
"""

from alembic import op
import sqlalchemy as sa

revision = "s9t0u1v2w3x4"
down_revision = "o5p6q7r8s9t0"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    for value in ("out_for_delivery", "arrived", "issue_reported"):
        conn.execute(sa.text(f"ALTER TYPE deliverystatusenum ADD VALUE IF NOT EXISTS '{value}'"))

    op.add_column("deliveries", sa.Column("picked_up_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("deliveries", sa.Column("in_transit_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("deliveries", sa.Column("arrived_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("deliveries", sa.Column("proof_photo_url", sa.Text(), nullable=True))
    op.add_column("deliveries", sa.Column("proof_note", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("deliveries", "proof_note")
    op.drop_column("deliveries", "proof_photo_url")
    op.drop_column("deliveries", "arrived_at")
    op.drop_column("deliveries", "in_transit_at")
    op.drop_column("deliveries", "picked_up_at")
