"""add branch-specific flash sale discounts

Revision ID: f1a2b3c4d5e6
Revises: e0f1a2b3c4d5
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "f1a2b3c4d5e6"
down_revision = "e0f1a2b3c4d5"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "products",
        sa.Column(
            "flash_sale_discounts",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )

    # Preserve existing global flash sales for both branches, while restoring
    # price as the product's regular/base price.
    op.execute(
        """
        UPDATE products
        SET flash_sale_discounts = jsonb_build_object(
                'manila', ROUND((1 - price / original_price) * 100, 2),
                'pampanga', ROUND((1 - price / original_price) * 100, 2)
            ),
            price = original_price,
            original_price = NULL
        WHERE original_price IS NOT NULL
          AND original_price > 0
          AND price < original_price
        """
    )
    op.alter_column("products", "flash_sale_discounts", server_default=None)


def downgrade():
    # A single legacy price cannot represent two different branch discounts.
    # Prefer Manila when present, otherwise Pampanga, to retain one sale.
    op.execute(
        """
        UPDATE products
        SET original_price = price,
            price = ROUND(
                price * (100 - COALESCE(
                    NULLIF(flash_sale_discounts->>'manila', '')::numeric,
                    NULLIF(flash_sale_discounts->>'pampanga', '')::numeric,
                    0
                )) / 100,
                2
            )
        WHERE flash_sale_discounts <> '{}'::jsonb
        """
    )
    op.drop_column("products", "flash_sale_discounts")
