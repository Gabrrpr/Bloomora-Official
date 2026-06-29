"""add delivery orders

Revision ID: 9b4f2c7d8e10
Revises: 0473d93c620e
Create Date: 2026-06-26
"""

from alembic import op
import sqlalchemy as sa


revision = "9b4f2c7d8e10"
down_revision = "0473d93c620e"
branch_labels = None
depends_on = None


def _table_exists(inspector, table_name):
    return table_name in inspector.get_table_names()


def _column_exists(inspector, table_name, column_name):
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def _index_exists(inspector, table_name, index_name):
    return any(index["name"] == index_name for index in inspector.get_indexes(table_name))


def _foreign_key_exists(inspector, table_name, constraint_name):
    return any(fk["name"] == constraint_name for fk in inspector.get_foreign_keys(table_name))


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _table_exists(inspector, "delivery_orders"):
        op.create_table(
            "delivery_orders",
            sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("delivery_order_number", sa.String(40), nullable=False),
            sa.Column("branch", sa.String(50), nullable=False, server_default="Pampanga"),
            sa.Column("rider_id", sa.UUID(as_uuid=True), nullable=False),
            sa.Column("vehicle_id", sa.UUID(as_uuid=True), nullable=True),
            sa.Column("status", sa.String(50), nullable=False, server_default="assigned"),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_by_id", sa.UUID(as_uuid=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["rider_id"], ["users.id"], name="fk_delivery_orders_rider"),
            sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"], name="fk_delivery_orders_vehicle"),
            sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], name="fk_delivery_orders_created_by"),
            sa.CheckConstraint(
                "status IN ('draft', 'assigned', 'picked_up', 'in_progress', 'completed', 'cancelled')",
                name="delivery_orders_status_check",
            ),
        )

    inspector = sa.inspect(bind)
    if not _index_exists(inspector, "delivery_orders", "ix_delivery_orders_number"):
        op.create_index("ix_delivery_orders_number", "delivery_orders", ["delivery_order_number"], unique=True)
    if not _index_exists(inspector, "delivery_orders", "ix_delivery_orders_rider"):
        op.create_index("ix_delivery_orders_rider", "delivery_orders", ["rider_id"])
    if not _index_exists(inspector, "delivery_orders", "ix_delivery_orders_status"):
        op.create_index("ix_delivery_orders_status", "delivery_orders", ["status"])

    if not _column_exists(inspector, "deliveries", "delivery_order_id"):
        op.add_column("deliveries", sa.Column("delivery_order_id", sa.UUID(as_uuid=True), nullable=True))

    inspector = sa.inspect(bind)
    if not _foreign_key_exists(inspector, "deliveries", "fk_deliveries_delivery_order"):
        op.create_foreign_key(
            "fk_deliveries_delivery_order",
            "deliveries",
            "delivery_orders",
            ["delivery_order_id"],
            ["id"],
        )
    if not _index_exists(inspector, "deliveries", "ix_deliveries_delivery_order"):
        op.create_index("ix_deliveries_delivery_order", "deliveries", ["delivery_order_id"])


def downgrade():
    op.drop_index("ix_deliveries_delivery_order", table_name="deliveries")
    op.drop_constraint("fk_deliveries_delivery_order", "deliveries", type_="foreignkey")
    op.drop_column("deliveries", "delivery_order_id")

    op.drop_index("ix_delivery_orders_status", table_name="delivery_orders")
    op.drop_index("ix_delivery_orders_rider", table_name="delivery_orders")
    op.drop_index("ix_delivery_orders_number", table_name="delivery_orders")
    op.drop_table("delivery_orders")
