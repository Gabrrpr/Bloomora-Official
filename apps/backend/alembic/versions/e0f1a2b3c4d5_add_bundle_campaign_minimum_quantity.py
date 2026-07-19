"""add bundle campaign minimum quantity

Revision ID: e0f1a2b3c4d5
Revises: d9e0f1a2b3c4
"""

from alembic import op
import sqlalchemy as sa


revision = "e0f1a2b3c4d5"
down_revision = "d9e0f1a2b3c4"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("campaigns", sa.Column("minimum_quantity", sa.Integer(), nullable=True))
    op.add_column("campaigns", sa.Column("eligible_category", sa.String(length=100), nullable=True))


def downgrade():
    op.drop_column("campaigns", "eligible_category")
    op.drop_column("campaigns", "minimum_quantity")
