"""repair delivery coordinate columns

Revision ID: w3x4y5z6a7b8
Revises: d6ae715bb775
Create Date: 2026-06-27
"""

from alembic import op
import sqlalchemy as sa


revision = "w3x4y5z6a7b8"
down_revision = "d6ae715bb775"
branch_labels = None
depends_on = None


def _add_column_if_missing(table_name, column):
    inspector = sa.inspect(op.get_bind())
    existing_columns = {existing["name"] for existing in inspector.get_columns(table_name)}
    if column.name not in existing_columns:
        op.add_column(table_name, column)


def upgrade():
    _add_column_if_missing("addresses", sa.Column("latitude", sa.Numeric(10, 7), nullable=True))
    _add_column_if_missing("addresses", sa.Column("longitude", sa.Numeric(10, 7), nullable=True))
    _add_column_if_missing("addresses", sa.Column("geocode_precision", sa.String(50), nullable=True))

    _add_column_if_missing("orders", sa.Column("delivery_lat", sa.Numeric(10, 7), nullable=True))
    _add_column_if_missing("orders", sa.Column("delivery_lng", sa.Numeric(10, 7), nullable=True))
    _add_column_if_missing("orders", sa.Column("delivery_geocode_precision", sa.String(50), nullable=True))
    _add_column_if_missing("orders", sa.Column("lalamove_order_id", sa.String(255), nullable=True))
    _add_column_if_missing("orders", sa.Column("lalamove_share_link", sa.Text(), nullable=True))
    _add_column_if_missing("orders", sa.Column("lalamove_status", sa.String(80), nullable=True))


def downgrade():
    pass
