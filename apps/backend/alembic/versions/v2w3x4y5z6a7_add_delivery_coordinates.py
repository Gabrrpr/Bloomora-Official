"""add delivery coordinates

Revision ID: v2w3x4y5z6a7
Revises: u1v2w3x4y5z6
Create Date: 2026-06-26
"""

from alembic import op
import sqlalchemy as sa

revision = "v2w3x4y5z6a7"
down_revision = "u1v2w3x4y5z6"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    address_columns = {column["name"] for column in inspector.get_columns("addresses")}
    if "latitude" not in address_columns:
        op.add_column("addresses", sa.Column("latitude", sa.Numeric(10, 7), nullable=True))
    if "longitude" not in address_columns:
        op.add_column("addresses", sa.Column("longitude", sa.Numeric(10, 7), nullable=True))
    if "geocode_precision" not in address_columns:
        op.add_column("addresses", sa.Column("geocode_precision", sa.String(50), nullable=True))

    order_columns = {column["name"] for column in inspector.get_columns("orders")}
    if "delivery_lat" not in order_columns:
        op.add_column("orders", sa.Column("delivery_lat", sa.Numeric(10, 7), nullable=True))
    if "delivery_lng" not in order_columns:
        op.add_column("orders", sa.Column("delivery_lng", sa.Numeric(10, 7), nullable=True))
    if "delivery_geocode_precision" not in order_columns:
        op.add_column("orders", sa.Column("delivery_geocode_precision", sa.String(50), nullable=True))
    if "lalamove_order_id" not in order_columns:
        op.add_column("orders", sa.Column("lalamove_order_id", sa.String(255), nullable=True))
    if "lalamove_share_link" not in order_columns:
        op.add_column("orders", sa.Column("lalamove_share_link", sa.Text(), nullable=True))
    if "lalamove_status" not in order_columns:
        op.add_column("orders", sa.Column("lalamove_status", sa.String(80), nullable=True))


def downgrade():
    op.drop_column("orders", "lalamove_status")
    op.drop_column("orders", "lalamove_share_link")
    op.drop_column("orders", "lalamove_order_id")
    op.drop_column("orders", "delivery_geocode_precision")
    op.drop_column("orders", "delivery_lng")
    op.drop_column("orders", "delivery_lat")

    op.drop_column("addresses", "geocode_precision")
    op.drop_column("addresses", "longitude")
    op.drop_column("addresses", "latitude")
