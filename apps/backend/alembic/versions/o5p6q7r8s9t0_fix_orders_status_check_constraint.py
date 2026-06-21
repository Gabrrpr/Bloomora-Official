"""fix orders status check constraint

Revision ID: o5p6q7r8s9t0
Revises: n4o5p6q7r8s9, k1l2m3n4o5p6
Create Date: 2026-06-21
"""

from alembic import op
import sqlalchemy as sa

revision = "o5p6q7r8s9t0"
down_revision = ("n4o5p6q7r8s9", "k1l2m3n4o5p6")
branch_labels = None
depends_on = None

# All valid statuses — must match OrderStatusEnum in order.py
VALID_STATUSES = [
    "pending",
    "pending_payment",
    "paid",
    "confirmed",
    "preparing",
    "processing",
    "ready_for_pickup",
    "out_for_delivery",
    "delivered",
    "completed",
    "cancelled",
    "payment_failed",
]


def upgrade():
    conn = op.get_bind()

    # 1. Find all check constraints on orders that reference 'status'
    result = conn.execute(sa.text(
        """
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.orders'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%status%'
        """
    ))
    existing = [row[0] for row in result.fetchall()]

    # 2. Drop each one
    for name in existing:
        conn.execute(sa.text(f'ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS "{name}"'))

    # 3. Add the new constraint with all current valid statuses
    status_list = ", ".join(f"'{s}'" for s in VALID_STATUSES)
    conn.execute(sa.text(
        f"ALTER TABLE public.orders ADD CONSTRAINT orders_status_check "
        f"CHECK (status::text = ANY (ARRAY[{status_list}]::text[]))"
    ))


def downgrade():
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check"
    ))
    old_statuses = [
        "pending", "paid", "confirmed", "preparing",
        "out_for_delivery", "delivered", "completed", "cancelled",
    ]
    status_list = ", ".join(f"'{s}'" for s in old_statuses)
    conn.execute(sa.text(
        f"ALTER TABLE public.orders ADD CONSTRAINT orders_status_check "
        f"CHECK (status::text = ANY (ARRAY[{status_list}]::text[]))"
    ))
