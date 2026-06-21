"""harden payment reservations

Revision ID: n4o5p6q7r8s9
Revises: m3n4o5p6q7r8
"""

from alembic import op

revision = "n4o5p6q7r8s9"
down_revision = "m3n4o5p6q7r8"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY")
    op.execute(
        "ALTER FUNCTION public.expire_pending_bloomora_orders() "
        "SET search_path = public, pg_temp"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_order_items_order_id "
        "ON public.order_items (order_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_order_items_product_id "
        "ON public.order_items (product_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_order_items_arrangement_id "
        "ON public.order_items (arrangement_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_stock_reservations_product_id "
        "ON public.stock_reservations (product_id)"
    )


def downgrade():
    op.execute("DROP INDEX IF EXISTS public.ix_stock_reservations_product_id")
    op.execute("DROP INDEX IF EXISTS public.ix_order_items_arrangement_id")
    op.execute("DROP INDEX IF EXISTS public.ix_order_items_product_id")
    op.execute("DROP INDEX IF EXISTS public.ix_order_items_order_id")
    op.execute(
        "ALTER FUNCTION public.expire_pending_bloomora_orders() RESET search_path"
    )
    op.execute("ALTER TABLE public.stock_reservations DISABLE ROW LEVEL SECURITY")
