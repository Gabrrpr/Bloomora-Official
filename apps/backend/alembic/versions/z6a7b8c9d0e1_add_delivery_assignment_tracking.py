"""add delivery assignment tracking

Revision ID: z6a7b8c9d0e1
Revises: y5z6a7b8c9d0
Create Date: 2026-06-30
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "z6a7b8c9d0e1"
down_revision: Union[str, Sequence[str], None] = "y5z6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("deliveries", sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=True))
    op.execute("UPDATE deliveries SET assigned_at = created_at WHERE assigned_at IS NULL")
    op.add_column(
        "notifications",
        sa.Column("delivery_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_notifications_delivery_id_deliveries",
        "notifications",
        "deliveries",
        ["delivery_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_notifications_delivery_id_deliveries", "notifications", type_="foreignkey")
    op.drop_column("notifications", "delivery_id")
    op.drop_column("deliveries", "assigned_at")
