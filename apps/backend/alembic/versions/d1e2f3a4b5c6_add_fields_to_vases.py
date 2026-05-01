"""Add fields to vases table

Revision ID: d1e2f3a4b5c6
Revises: df4567890123
Create Date: 2026-01-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd1e2f3a4b5c6'
down_revision = 'df4567890123'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to vases table
    op.add_column('vases', sa.Column('original_price', sa.Numeric(10, 2), nullable=True))
    op.add_column('vases', sa.Column('rating', sa.Numeric(2, 1), nullable=True))
    op.add_column('vases', sa.Column('reviews', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('vases', sa.Column('ribbon', sa.String(length=50), nullable=True))
    op.add_column('vases', sa.Column('category', sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column('vases', 'category')
    op.drop_column('vases', 'ribbon')
    op.drop_column('vases', 'reviews')
    op.drop_column('vases', 'rating')
    op.drop_column('vases', 'original_price')
