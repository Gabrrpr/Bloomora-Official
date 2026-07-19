"""ensure stock receipt logs

Revision ID: a7b8c9d0e1f3
Revises: z6a7b8c9d0e1
"""

from alembic import op


revision = "a7b8c9d0e1f3"
down_revision = "z6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade():
    # Some deployed databases already have this legacy table. Keep the
    # migration safe for both existing installations and clean deployments.
    op.execute("""
        CREATE TABLE IF NOT EXISTS stock_logs (
            id UUID PRIMARY KEY,
            product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            qty_change INTEGER NOT NULL,
            purchasing_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
            date_of_issuance DATE NOT NULL,
            branch VARCHAR(50) NOT NULL,
            notes TEXT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_stock_logs_product_id ON stock_logs (product_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_stock_logs_created_at ON stock_logs (created_at)")


def downgrade():
    # Intentionally preserve receipt history and legacy installations.
    pass
