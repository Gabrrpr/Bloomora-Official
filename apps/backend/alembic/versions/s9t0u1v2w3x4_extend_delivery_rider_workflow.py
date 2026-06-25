"""extend delivery rider workflow

Revision ID: s9t0u1v2w3x4
Revises: o5p6q7r8s9t0
Create Date: 2026-06-25
"""

from alembic import op
import sqlalchemy as sa

revision = "s9t0u1v2w3x4"
down_revision = "o5p6q7r8s9t0"
branch_labels = None
depends_on = None

def upgrade():
    # 1. Drop the old check constraint
    op.drop_constraint("deliveries_status_check", "deliveries", type_="check")

    # 2. Add the new check constraint with the expanded list of allowed values
    op.create_check_constraint(
        "deliveries_status_check",
        "deliveries",
        sa.column("status").in_([
            "assigned", 
            "picked_up", 
            "in_transit", 
            "delivered", 
            "failed", 
            "out_for_delivery", 
            "arrived", 
            "issue_reported"
        ])
    )

    # 3. Add the new columns
    op.add_column("deliveries", sa.Column("picked_up_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("deliveries", sa.Column("in_transit_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("deliveries", sa.Column("arrived_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("deliveries", sa.Column("proof_photo_url", sa.Text(), nullable=True))
    op.add_column("deliveries", sa.Column("proof_note", sa.Text(), nullable=True))


def downgrade():
    # 1. Remove the new columns
    op.drop_column("deliveries", "proof_note")
    op.drop_column("deliveries", "proof_photo_url")
    op.drop_column("deliveries", "arrived_at")
    op.drop_column("deliveries", "in_transit_at")
    op.drop_column("deliveries", "picked_up_at")

    # 2. Revert the constraint back to the original list
    op.drop_constraint("deliveries_status_check", "deliveries", type_="check")
    op.create_check_constraint(
        "deliveries_status_check",
        "deliveries",
        sa.column("status").in_([
            "assigned", 
            "picked_up", 
            "in_transit", 
            "delivered", 
            "failed"
        ])
    )