"""add shipping methods

Revision ID: a7b8c9d0e1f2
Revises: z6a7b8c9d0e1
Create Date: 2026-07-11
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, Sequence[str], None] = "z6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "shipping_methods",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("courier_name", sa.String(length=120), nullable=False),
        sa.Column("delivery_type", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("service_area", sa.String(length=40), nullable=False, server_default="nationwide"),
        sa.Column("base_rate", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("supports_live_booking", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index(op.f("ix_shipping_methods_code"), "shipping_methods", ["code"], unique=False)
    op.add_column("orders", sa.Column("shipping_method_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("orders", sa.Column("courier_selected", sa.String(length=120), nullable=True))
    op.add_column("orders", sa.Column("shipping_delivery_type", sa.String(length=120), nullable=True))
    op.create_foreign_key(
        "fk_orders_shipping_method_id_shipping_methods",
        "orders",
        "shipping_methods",
        ["shipping_method_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.execute(
        """
        INSERT INTO shipping_methods
            (id, code, courier_name, delivery_type, description, service_area, base_rate, sort_order, is_active, supports_live_booking, created_at, updated_at)
        VALUES
            (gen_random_uuid(), 'move_it', 'Move It', 'Same-day motorcycle', 'Best for compact bouquets within Metro Manila.', 'manila', 80, 10, true, false, now(), now()),
            (gen_random_uuid(), 'lalamove', 'Lalamove', 'Same-day MPV / motorcycle', 'Recommended for fragile or larger arrangements in Metro Manila.', 'manila', 250, 20, true, true, now(), now()),
            (gen_random_uuid(), 'grabexpress', 'GrabExpress', 'Same-day delivery', 'Fast same-day Metro Manila delivery.', 'manila', 180, 30, true, false, now(), now()),
            (gen_random_uuid(), 'lbc', 'LBC Express', 'Standard 1-3 days', 'Standard delivery for supported provincial addresses.', 'nationwide', 120, 40, true, false, now(), now()),
            (gen_random_uuid(), 'jt_express', 'J&T Express', 'Standard 1-3 days', 'Budget-friendly standard courier option.', 'nationwide', 110, 50, true, false, now(), now())
        ON CONFLICT (code) DO NOTHING
        """
    )


def downgrade() -> None:
    op.drop_constraint("fk_orders_shipping_method_id_shipping_methods", "orders", type_="foreignkey")
    op.drop_column("orders", "shipping_delivery_type")
    op.drop_column("orders", "courier_selected")
    op.drop_column("orders", "shipping_method_id")
    op.drop_index(op.f("ix_shipping_methods_code"), table_name="shipping_methods")
    op.drop_table("shipping_methods")
