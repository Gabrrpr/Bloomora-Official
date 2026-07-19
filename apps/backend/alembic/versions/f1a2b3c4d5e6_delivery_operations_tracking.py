"""Add dispatch planning and external shipment tracking.

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
    op.add_column("orders", sa.Column("delivery_pin_verified_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("orders", sa.Column("delivery_pin_verified_by_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_orders_delivery_pin_verified_by",
        "orders",
        "users",
        ["delivery_pin_verified_by_id"],
        ["id"],
    )

    op.add_column("deliveries", sa.Column("stop_sequence", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("deliveries", sa.Column("route_geometry", sa.JSON(), nullable=True))
    op.add_column("deliveries", sa.Column("route_distance_m", sa.Integer(), nullable=True))
    op.add_column("deliveries", sa.Column("route_duration_s", sa.Integer(), nullable=True))
    op.add_column("deliveries", sa.Column("route_generated_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("deliveries", sa.Column("status_before_issue", sa.String(length=40), nullable=True))
    op.add_column("deliveries", sa.Column("issue_code", sa.String(length=80), nullable=True))
    op.add_column("deliveries", sa.Column("issue_note", sa.Text(), nullable=True))
    op.add_column("deliveries", sa.Column("issue_reported_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("deliveries", sa.Column("issue_resolved_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("deliveries", sa.Column("issue_resolution_note", sa.Text(), nullable=True))
    op.alter_column("deliveries", "stop_sequence", server_default=None)

    op.add_column("delivery_orders", sa.Column("idempotency_key", sa.String(length=120), nullable=True))
    op.add_column("delivery_orders", sa.Column("route_geometry", sa.JSON(), nullable=True))
    op.add_column("delivery_orders", sa.Column("route_distance_m", sa.Integer(), nullable=True))
    op.add_column("delivery_orders", sa.Column("route_duration_s", sa.Integer(), nullable=True))
    op.add_column("delivery_orders", sa.Column("route_generated_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_delivery_orders_idempotency_key", "delivery_orders", ["idempotency_key"], unique=True)

    op.create_table(
        "branch_delivery_settings",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("branch", sa.String(length=50), nullable=False),
        sa.Column("pickup_address", sa.Text(), nullable=False),
        sa.Column("pickup_lat", sa.Numeric(precision=10, scale=7), nullable=False),
        sa.Column("pickup_lng", sa.Numeric(precision=10, scale=7), nullable=False),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("verified_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["verified_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("branch"),
    )
    op.create_index("ix_branch_delivery_settings_branch", "branch_delivery_settings", ["branch"], unique=True)

    op.create_table(
        "external_shipments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider_code", sa.String(length=50), nullable=False),
        sa.Column("provider_name", sa.String(length=120), nullable=True),
        sa.Column("external_reference", sa.String(length=255), nullable=True),
        sa.Column("tracking_url", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="awaiting_booking"),
        sa.Column("provider_status", sa.String(length=120), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("intervention_required", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("booked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("picked_up_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("in_transit_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_external_shipments_order_id", "external_shipments", ["order_id"])
    op.create_index("ix_external_shipments_provider_code", "external_shipments", ["provider_code"])
    op.create_index("ix_external_shipments_external_reference", "external_shipments", ["external_reference"])
    op.create_index("ix_external_shipments_status", "external_shipments", ["status"])
    op.create_index("ix_external_shipments_is_active", "external_shipments", ["is_active"])

    op.create_table(
        "external_shipment_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("shipment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_key", sa.String(length=180), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("provider_status", sa.String(length=120), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("raw_payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["shipment_id"], ["external_shipments.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("shipment_id", "event_key", name="uq_external_shipment_event_key"),
    )

    op.execute(
        """
        INSERT INTO external_shipments (
            id, order_id, provider_code, provider_name, external_reference, tracking_url,
            status, provider_status, is_active, intervention_required, created_at, updated_at
        )
        SELECT
            gen_random_uuid(), o.id, lower(o.delivery_provider), o.courier_selected,
            o.lalamove_order_id, o.lalamove_share_link,
            CASE
                WHEN upper(coalesce(o.lalamove_status, '')) IN ('COMPLETED', 'DELIVERED') THEN 'delivered'
                WHEN upper(coalesce(o.lalamove_status, '')) IN ('ON_GOING', 'PICKED_UP') THEN 'in_transit'
                WHEN upper(coalesce(o.lalamove_status, '')) IN ('ASSIGNING_DRIVER', 'DRIVER_ASSIGNED') THEN 'booked'
                WHEN upper(coalesce(o.lalamove_status, '')) LIKE '%FAIL%' THEN 'failed'
                ELSE 'awaiting_booking'
            END,
            o.lalamove_status, true,
            upper(coalesce(o.lalamove_status, '')) LIKE '%FAIL%', now(), now()
        FROM orders o
        WHERE lower(coalesce(o.delivery_provider, '')) IN ('lalamove', 'grabexpress', 'grab_express', 'move_it', 'lbc', 'jt_express')
        """
    )
    op.execute(
        """
        INSERT INTO delivery_orders (
            id, delivery_order_number, branch, rider_id, vehicle_id, status,
            notes, created_by_id, created_at, updated_at
        )
        SELECT
            gen_random_uuid(),
            'DO-LEGACY-' || upper(substr(replace(d.id::text, '-', ''), 1, 10)),
            coalesce(nullif(o.branch_name, ''), 'Pampanga'),
            d.rider_id,
            d.vehicle_id,
            'assigned',
            'Recovered from a legacy direct rider assignment.',
            NULL,
            coalesce(d.assigned_at, d.created_at, now()),
            coalesce(d.updated_at, now())
        FROM deliveries d
        JOIN orders o ON o.id = d.order_id
        WHERE d.delivery_order_id IS NULL
          AND d.rider_id IS NOT NULL
          AND lower(coalesce(o.delivery_provider, '')) = 'standard'
        """
    )
    op.execute(
        """
        INSERT INTO external_shipment_events (
            id, shipment_id, event_key, status, provider_status, message, created_at
        )
        SELECT
            gen_random_uuid(), shipment.id, 'legacy-backfill:' || shipment.id::text,
            shipment.status, shipment.provider_status,
            'Existing courier tracking imported during the delivery operations upgrade.',
            coalesce(shipment.updated_at, shipment.created_at, now())
        FROM external_shipments shipment
        """
    )
    op.execute(
        """
        UPDATE deliveries d
        SET delivery_order_id = delivery_order.id,
            stop_sequence = 1
        FROM delivery_orders delivery_order
        WHERE d.delivery_order_id IS NULL
          AND delivery_order.delivery_order_number = 'DO-LEGACY-' || upper(substr(replace(d.id::text, '-', ''), 1, 10))
        """
    )


def downgrade():
    op.drop_table("external_shipment_events")
    op.drop_index("ix_external_shipments_is_active", table_name="external_shipments")
    op.drop_index("ix_external_shipments_status", table_name="external_shipments")
    op.drop_index("ix_external_shipments_external_reference", table_name="external_shipments")
    op.drop_index("ix_external_shipments_provider_code", table_name="external_shipments")
    op.drop_index("ix_external_shipments_order_id", table_name="external_shipments")
    op.drop_table("external_shipments")
    op.drop_index("ix_branch_delivery_settings_branch", table_name="branch_delivery_settings")
    op.drop_table("branch_delivery_settings")
    op.drop_index("ix_delivery_orders_idempotency_key", table_name="delivery_orders")
    for name in ("route_generated_at", "route_duration_s", "route_distance_m", "route_geometry", "idempotency_key"):
        op.drop_column("delivery_orders", name)
    for name in (
        "issue_resolution_note", "issue_resolved_at", "issue_reported_at", "issue_note", "issue_code",
        "status_before_issue", "route_generated_at", "route_duration_s", "route_distance_m", "route_geometry", "stop_sequence",
    ):
        op.drop_column("deliveries", name)
    op.drop_constraint("fk_orders_delivery_pin_verified_by", "orders", type_="foreignkey")
    op.drop_column("orders", "delivery_pin_verified_by_id")
    op.drop_column("orders", "delivery_pin_verified_at")
