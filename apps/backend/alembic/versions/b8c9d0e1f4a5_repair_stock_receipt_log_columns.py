"""repair stock receipt log columns on legacy databases

Revision ID: b8c9d0e1f4a5
Revises: a7b8c9d0e1f3

The preceding migration creates ``stock_logs`` when it is absent, but
``CREATE TABLE IF NOT EXISTS`` does not add columns to an older table that
already exists. Add every receipt column independently so this migration is
safe for both legacy and clean databases.
"""

from alembic import op


revision = "b8c9d0e1f4a5"
down_revision = "a7b8c9d0e1f3"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        ALTER TABLE stock_logs
            ADD COLUMN IF NOT EXISTS purchasing_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS date_of_issuance DATE,
            ADD COLUMN IF NOT EXISTS branch VARCHAR(50),
            ADD COLUMN IF NOT EXISTS notes TEXT,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        """
    )

    # Existing log records predate branch-aware stock receipts. Keep those
    # records usable without falsely assigning them to Manila or Pampanga.
    op.execute(
        """
        UPDATE stock_logs
        SET date_of_issuance = COALESCE(date_of_issuance, created_at::date, CURRENT_DATE),
            branch = COALESCE(NULLIF(BTRIM(branch), ''), 'Unspecified')
        WHERE date_of_issuance IS NULL
           OR branch IS NULL
           OR BTRIM(branch) = ''
        """
    )
    op.execute("ALTER TABLE stock_logs ALTER COLUMN date_of_issuance SET NOT NULL")
    op.execute("ALTER TABLE stock_logs ALTER COLUMN branch SET NOT NULL")
    op.execute("CREATE INDEX IF NOT EXISTS ix_stock_logs_product_id ON stock_logs (product_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_stock_logs_created_at ON stock_logs (created_at)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_stock_logs_branch ON stock_logs (branch)")


def downgrade():
    # Preserve stock audit history and columns that may have existed before
    # this repair migration.
    pass
