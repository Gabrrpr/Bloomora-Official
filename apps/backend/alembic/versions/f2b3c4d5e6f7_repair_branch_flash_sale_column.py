"""repair missing branch flash sale column

Revision ID: f2b3c4d5e6f7
Revises: f1a2b3c4d5e6

Some databases were stamped at the preceding revision without the physical
column. Keep this repair idempotent so it is also safe on databases where the
original migration completed normally.
"""

from alembic import op


revision = "f2b3c4d5e6f7"
down_revision = "f1a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS flash_sale_discounts jsonb NOT NULL DEFAULT '{}'::jsonb
        """
    )
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
          AND flash_sale_discounts = '{}'::jsonb
        """
    )
    op.execute(
        """
        ALTER TABLE products
        ALTER COLUMN flash_sale_discounts DROP DEFAULT
        """
    )


def downgrade():
    # The preceding revision owns this column; rolling back this repair should
    # retain it and only move the Alembic revision marker back.
    pass
