"""add rider availability

Revision ID: b6c7d8e9f0a1
Revises: y5z6a7b8c9d0
Create Date: 2026-06-29
"""

from alembic import op
import sqlalchemy as sa


revision = "b6c7d8e9f0a1"
down_revision = "y5z6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column("rider_is_available", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.alter_column("users", "rider_is_available", server_default=None)


def downgrade():
    op.drop_column("users", "rider_is_available")
