"""extend cart items for web

Revision ID: j0k1l2m3n4o5
Revises: i9j0k1l2m3n4
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "j0k1l2m3n4o5"
down_revision = "i9j0k1l2m3n4"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"]: column for column in inspector.get_columns("cart_items")}

    if "item_key" not in columns:
        op.add_column("cart_items", sa.Column("item_key", sa.String(length=300), nullable=True))

    if "item_data" not in columns:
        op.add_column(
            "cart_items",
            sa.Column(
                "item_data",
                postgresql.JSONB(astext_type=sa.Text()),
                nullable=False,
                server_default=sa.text("'{}'::jsonb"),
            ),
        )

    op.execute(
        """
        UPDATE cart_items
        SET item_key = CASE
            WHEN product_id IS NOT NULL THEN 'product:' || product_id::text
            ELSE 'legacy:' || id::text
        END
        WHERE item_key IS NULL
        """
    )

    columns = {column["name"]: column for column in sa.inspect(bind).get_columns("cart_items")}
    if columns["item_key"]["nullable"]:
        op.alter_column("cart_items", "item_key", nullable=False)
    if not columns["product_id"]["nullable"]:
        op.alter_column("cart_items", "product_id", nullable=True)

    unique_constraints = sa.inspect(bind).get_unique_constraints("cart_items")
    for constraint in unique_constraints:
        column_names = set(constraint.get("column_names") or [])
        constraint_name = constraint.get("name")
        if constraint_name and (
            column_names == {"user_id", "product_id"}
            or (constraint_name == "uq_cart_items_user_key" and column_names != {"user_id", "item_key"})
        ):
            op.drop_constraint(constraint_name, "cart_items", type_="unique")

    unique_constraints = sa.inspect(bind).get_unique_constraints("cart_items")
    if not any(
        set(constraint.get("column_names") or []) == {"user_id", "item_key"}
        for constraint in unique_constraints
    ):
        op.create_unique_constraint("uq_cart_items_user_key", "cart_items", ["user_id", "item_key"])


def downgrade():
    bind = op.get_bind()
    unique_constraints = sa.inspect(bind).get_unique_constraints("cart_items")

    for constraint in unique_constraints:
        if (
            constraint.get("name")
            and set(constraint.get("column_names") or []) == {"user_id", "item_key"}
        ):
            op.drop_constraint(constraint["name"], "cart_items", type_="unique")

    unique_constraints = sa.inspect(bind).get_unique_constraints("cart_items")
    if not any(
        set(constraint.get("column_names") or []) == {"user_id", "product_id"}
        for constraint in unique_constraints
    ):
        op.create_unique_constraint("uq_cart_items_user_product", "cart_items", ["user_id", "product_id"])

    columns = {column["name"]: column for column in sa.inspect(bind).get_columns("cart_items")}
    if columns["product_id"]["nullable"]:
        op.alter_column("cart_items", "product_id", nullable=False)
    if "item_data" in columns:
        op.drop_column("cart_items", "item_data")
    if "item_key" in columns:
        op.drop_column("cart_items", "item_key")
