"""add vehicles table and vehicle_id to deliveries

Revision ID: u1v2w3x4y5z6
Revises: t0u1v2w3x4y5
Create Date: 2026-06-25
"""

from alembic import op
import sqlalchemy as sa

revision = "u1v2w3x4y5z6"
down_revision = "t0u1v2w3x4y5"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "vehicles",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("plate_number", sa.String(20), nullable=False, unique=True),
        sa.Column("vehicle_type", sa.String(50), nullable=False),
        sa.Column("brand", sa.String(100), nullable=True),
        sa.Column("model", sa.String(100), nullable=True),
        sa.Column("color", sa.String(50), nullable=True),
        sa.Column("capacity", sa.String(50), nullable=True),
        sa.Column("document_url", sa.Text(), nullable=True),
        sa.Column("assigned_rider_id", sa.UUID(as_uuid=True), nullable=True),
        sa.Column("branch", sa.String(50), nullable=False, default="Manila"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), onupdate=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["assigned_rider_id"], ["users.id"], name="fk_vehicles_rider"),
    )
    op.create_index("ix_vehicles_plate_number", "vehicles", ["plate_number"], unique=True)
    op.create_index("ix_vehicles_rider", "vehicles", ["assigned_rider_id"])

    op.add_column("deliveries", sa.Column("vehicle_id", sa.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key("fk_deliveries_vehicle", "deliveries", "vehicles", ["vehicle_id"], ["id"])


def downgrade():
    op.drop_constraint("fk_deliveries_vehicle", "deliveries", type_="foreignkey")
    op.drop_column("deliveries", "vehicle_id")

    op.drop_index("ix_vehicles_rider", table_name="vehicles")
    op.drop_index("ix_vehicles_plate_number", table_name="vehicles")
    op.drop_constraint("fk_vehicles_rider", "vehicles", type_="foreignkey")
    op.drop_table("vehicles")
