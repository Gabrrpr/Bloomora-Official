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
    op.add_column("cart_items", sa.Column("item_key", sa.String(length=300), nullable=True))
    op.add_column(
        "cart_items",
        sa.Column("item_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
    )
    op.execute("UPDATE cart_items SET item_key = 'product:' || product_id::text WHERE item_key IS NULL")
    op.alter_column("cart_items", "item_key", nullable=False)
    op.alter_column("cart_items", "product_id", nullable=True)
    op.drop_constraint("uq_cart_items_user_product", "cart_items", type_="unique")
    op.create_unique_constraint("uq_cart_items_user_key", "cart_items", ["user_id", "item_key"])


def downgrade():
    op.drop_constraint("uq_cart_items_user_key", "cart_items", type_="unique")
    op.create_unique_constraint("uq_cart_items_user_product", "cart_items", ["user_id", "product_id"])
    op.alter_column("cart_items", "product_id", nullable=False)
    op.drop_column("cart_items", "item_data")
    op.drop_column("cart_items", "item_key")
