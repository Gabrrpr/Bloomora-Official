"""extend order items for mixed orders

Revision ID: l2m3n4o5p6q7
Revises: j0k1l2m3n4o5
"""

from alembic import context, op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "l2m3n4o5p6q7"
down_revision = "j0k1l2m3n4o5"
branch_labels = None
depends_on = None


def upgrade():
    table_exists = True if context.is_offline_mode() else sa.inspect(op.get_bind()).has_table("order_items")
    if not table_exists:
        op.create_table(
            "order_items",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("arrangement_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("quantity", sa.Integer(), nullable=False),
            sa.Column("price_at_purchase", sa.Numeric(10, 2), nullable=False),
            sa.CheckConstraint(
                "(product_id IS NOT NULL AND arrangement_id IS NULL) OR "
                "(product_id IS NULL AND arrangement_id IS NOT NULL)",
                name="ck_order_items_exactly_one_item_type",
            ),
            sa.ForeignKeyConstraint(["arrangement_id"], ["arrangements.id"], ondelete="RESTRICT"),
            sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_order_items_order_id", "order_items", ["order_id"])
        op.create_index("ix_order_items_product_id", "order_items", ["product_id"])
        return

    op.alter_column("order_items", "product_id", existing_type=postgresql.UUID(), nullable=True)
    op.alter_column(
        "order_items",
        "price_at_purchase",
        existing_type=sa.Float(),
        type_=sa.Numeric(10, 2),
        existing_nullable=False,
    )
    op.add_column(
        "order_items",
        sa.Column("arrangement_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_order_items_arrangement_id",
        "order_items",
        "arrangements",
        ["arrangement_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_check_constraint(
        "ck_order_items_exactly_one_item_type",
        "order_items",
        "(product_id IS NOT NULL AND arrangement_id IS NULL) OR "
        "(product_id IS NULL AND arrangement_id IS NOT NULL)",
    )


def downgrade():
    table_exists = True if context.is_offline_mode() else sa.inspect(op.get_bind()).has_table("order_items")
    if not table_exists:
        return
    op.drop_constraint("ck_order_items_exactly_one_item_type", "order_items", type_="check")
    op.drop_constraint("fk_order_items_arrangement_id", "order_items", type_="foreignkey")
    op.drop_column("order_items", "arrangement_id")
    op.alter_column(
        "order_items",
        "price_at_purchase",
        existing_type=sa.Numeric(10, 2),
        type_=sa.Float(),
        existing_nullable=False,
    )
    op.alter_column("order_items", "product_id", existing_type=postgresql.UUID(), nullable=False)
