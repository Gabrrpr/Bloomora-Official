"""add campaign discounts

Revision ID: t0u1v2w3x4y5
Revises: s9t0u1v2w3x4
Create Date: 2026-06-25 20:20:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "t0u1v2w3x4y5"
down_revision = "s9t0u1v2w3x4"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("campaigns", sa.Column("discount_type", sa.String(length=20), nullable=True))
    op.add_column("campaigns", sa.Column("discount_value", sa.Numeric(10, 2), nullable=True))


def downgrade():
    op.drop_column("campaigns", "discount_value")
    op.drop_column("campaigns", "discount_type")
