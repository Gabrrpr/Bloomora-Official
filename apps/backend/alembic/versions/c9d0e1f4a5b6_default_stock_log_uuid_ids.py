"""default stock log UUID IDs on newer schemas

Revision ID: c9d0e1f4a5b6
Revises: b8c9d0e1f4a5

Legacy stock_logs tables use an auto-incrementing integer ID, while clean
installations use UUID. The application omits the ID on insert, so ensure the
UUID variant also has a database-generated default.
"""

from alembic import op


revision = "c9d0e1f4a5b6"
down_revision = "b8c9d0e1f4a5"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'stock_logs'
                  AND column_name = 'id'
                  AND data_type = 'uuid'
            ) THEN
                ALTER TABLE stock_logs ALTER COLUMN id SET DEFAULT gen_random_uuid();
            END IF;
        END
        $$
        """
    )


def downgrade():
    # Preserve whichever database-generated ID strategy the installation uses.
    pass
