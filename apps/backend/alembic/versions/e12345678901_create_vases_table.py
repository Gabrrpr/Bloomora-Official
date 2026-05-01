"""Create vases table

Revision ID: e12345678901
Revises: d1e2f3a4b5c6
Create Date: 2026-01-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'e12345678901'
down_revision = 'd1e2f3a4b5c6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create vases table if it doesn't exist
    op.create_table(
        'vases',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('style', sa.String(length=100), nullable=True),
        sa.Column('material', sa.String(length=100), nullable=True),
        sa.Column('color', sa.String(length=100), nullable=True),
        sa.Column('size', sa.String(length=100), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=True, server_default='1'),
        sa.Column('unit_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('original_price', sa.Numeric(10, 2), nullable=True),
        sa.Column('rating', sa.Numeric(2, 1), nullable=True),
        sa.Column('reviews', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('ribbon', sa.String(length=50), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
    )


def downgrade() -> None:
    op.drop_table('vases')
