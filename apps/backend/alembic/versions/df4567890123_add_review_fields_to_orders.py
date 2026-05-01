"""Add can_review and has_reviewed to orders

Revision ID: df4567890123
Revises: b2c3d4e5f6a7
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by alembic.
revision = 'df4567890123'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade():
    # Add can_review column
    op.add_column('orders', sa.Column('can_review', sa.Boolean(), default=False, nullable=False))
    # Add has_reviewed column
    op.add_column('orders', sa.Column('has_reviewed', sa.Boolean(), default=False, nullable=False))


def downgrade():
    op.drop_column('orders', 'has_reviewed')
    op.drop_column('orders', 'can_review')
