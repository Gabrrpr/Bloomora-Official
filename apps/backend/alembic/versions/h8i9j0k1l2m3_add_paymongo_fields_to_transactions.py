"""Add PayMongo fields to transactions

Revision ID: h8i9j0k1l2m3
Revises: e12345678901, g7h8i9j0k1l2
Create Date: 2026-06-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "h8i9j0k1l2m3"
down_revision: Union[str, tuple[str, str], None] = ("e12345678901", "g7h8i9j0k1l2")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "transactions",
        sa.Column("provider", sa.String(length=50), nullable=False, server_default="manual"),
    )
    op.add_column("transactions", sa.Column("provider_checkout_session_id", sa.String(length=255), nullable=True))
    op.add_column("transactions", sa.Column("provider_payment_intent_id", sa.String(length=255), nullable=True))
    op.add_column("transactions", sa.Column("provider_payment_id", sa.String(length=255), nullable=True))
    op.add_column("transactions", sa.Column("checkout_url", sa.Text(), nullable=True))
    op.add_column("transactions", sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("transactions", sa.Column("raw_webhook_event", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("transactions", "raw_webhook_event")
    op.drop_column("transactions", "paid_at")
    op.drop_column("transactions", "checkout_url")
    op.drop_column("transactions", "provider_payment_id")
    op.drop_column("transactions", "provider_payment_intent_id")
    op.drop_column("transactions", "provider_checkout_session_id")
    op.drop_column("transactions", "provider")
