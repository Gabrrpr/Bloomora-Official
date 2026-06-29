"""add rider availability

Revision ID: b6c7d8e9f0a1
Revises: y5z6a7b8c9d0
Create Date: 2026-06-29
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "b6c7d8e9f0a1"
down_revision = "y5z6a7b8c9d0"
branch_labels = None
depends_on = None


def _has_column(table, column):
    insp = inspect(op.get_bind())
    return any(col["name"] == column for col in insp.get_columns(table))


def upgrade():
    # Idempotent: the column may already exist (added outside Alembic / auto-create).
    if not _has_column("users", "rider_is_available"):
        op.add_column(
            "users",
            sa.Column("rider_is_available", sa.Boolean(), nullable=False, server_default=sa.true()),
        )
        op.alter_column("users", "rider_is_available", server_default=None)


def downgrade():
    if _has_column("users", "rider_is_available"):
        op.drop_column("users", "rider_is_available")
