"""add payment expiration statuses

Revision ID: m3n4o5p6q7r8
Revises: l2m3n4o5p6q7
"""

from alembic import op
import sqlalchemy as sa

revision = "m3n4o5p6q7r8"
down_revision = "l2m3n4o5p6q7"
branch_labels = None
depends_on = None


def upgrade():
    for value in ("pending_payment", "paid", "processing", "ready_for_pickup", "completed", "payment_failed"):
        op.execute(f"""
            DO $$
            BEGIN
              IF to_regtype('public.orderstatusenum') IS NOT NULL THEN
                EXECUTE 'ALTER TYPE public.orderstatusenum ADD VALUE IF NOT EXISTS ''{value}''';
              END IF;
            END $$;
        """)
    for value in ("expired", "credited"):
        op.execute(f"""
            DO $$
            BEGIN
              IF to_regtype('public.paymentstatusenum') IS NOT NULL THEN
                EXECUTE 'ALTER TYPE public.paymentstatusenum ADD VALUE IF NOT EXISTS ''{value}''';
              END IF;
            END $$;
        """)
    inspector = sa.inspect(op.get_bind())
    transaction_columns = {column["name"] for column in inspector.get_columns("transactions")}
    if "expires_at" not in transaction_columns:
        op.add_column("transactions", sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True))
    if "stock_released_at" not in transaction_columns:
        op.add_column("transactions", sa.Column("stock_released_at", sa.DateTime(timezone=True), nullable=True))

    order_columns = {column["name"] for column in inspector.get_columns("orders")}
    order_column_definitions = (
        ("checkout_attempt_id", sa.String(64)),
        ("recipient_first_name", sa.String(120)),
        ("recipient_last_name", sa.String(120)),
        ("recipient_phone", sa.String(40)),
        ("recipient_type", sa.String(20)),
        ("is_anonymous", sa.Boolean()),
        ("fulfillment_method", sa.String(20)),
        ("delivery_provider", sa.String(50)),
        ("time_slot", sa.String(50)),
        ("subtotal_amount", sa.Numeric(10, 2)),
        ("delivery_fee", sa.Numeric(10, 2)),
    )
    for column_name, column_type in order_column_definitions:
        if column_name not in order_columns:
            op.add_column("orders", sa.Column(column_name, column_type, nullable=True))

    unique_constraint_names = {
        constraint["name"] for constraint in inspector.get_unique_constraints("orders")
    }
    if "uq_orders_checkout_attempt_id" not in unique_constraint_names:
        op.create_unique_constraint("uq_orders_checkout_attempt_id", "orders", ["checkout_attempt_id"])

    if not inspector.has_table("stock_reservations"):
        op.create_table(
            "stock_reservations",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("order_item_id", sa.UUID(), nullable=False),
            sa.Column("product_id", sa.UUID(), nullable=False),
            sa.Column("quantity", sa.Integer(), nullable=False),
            sa.Column("status", sa.String(20), nullable=False),
            sa.Column("reserved_until", sa.DateTime(timezone=True), nullable=False),
            sa.Column("converted_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("released_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["order_item_id"], ["order_items.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("order_item_id"),
        )
    op.execute("UPDATE transactions SET expires_at = created_at + interval '1 hour' WHERE expires_at IS NULL")
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog")
    op.execute("""
        CREATE OR REPLACE FUNCTION public.expire_pending_bloomora_orders()
        RETURNS void LANGUAGE plpgsql AS $$
        BEGIN
          UPDATE stock_reservations sr
          SET status = 'released', released_at = now()
          FROM order_items oi, orders o, transactions t
          WHERE sr.order_item_id = oi.id
            AND oi.order_id = o.id
            AND t.order_id = o.id
            AND sr.status = 'active'
            AND t.status = 'pending'
            AND t.expires_at <= now();

          UPDATE orders o
          SET status = 'payment_failed'
          FROM transactions t
          WHERE t.order_id = o.id AND t.status = 'pending' AND t.expires_at <= now();

          UPDATE transactions
          SET status = 'expired', stock_released_at = now()
          WHERE status = 'pending' AND expires_at <= now();
        END $$;
    """)
    op.execute("""
        SELECT cron.schedule(
          'expire-bloomora-orders',
          '* * * * *',
          'SELECT public.expire_pending_bloomora_orders()'
        )
        WHERE NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-bloomora-orders')
    """)


def downgrade():
    op.execute("SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'expire-bloomora-orders'")
    op.execute("DROP FUNCTION IF EXISTS public.expire_pending_bloomora_orders()")
    op.drop_table("stock_reservations")
    op.drop_constraint("uq_orders_checkout_attempt_id", "orders", type_="unique")
    for column in ("delivery_fee", "subtotal_amount", "time_slot", "delivery_provider", "fulfillment_method", "is_anonymous", "recipient_type", "recipient_phone", "recipient_last_name", "recipient_first_name", "checkout_attempt_id"):
        op.drop_column("orders", column)
    op.drop_column("transactions", "stock_released_at")
    op.drop_column("transactions", "expires_at")
