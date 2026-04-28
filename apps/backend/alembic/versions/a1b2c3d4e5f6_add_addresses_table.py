"""add addresses table

Revision ID: a1b2c3d4e5f6
Revises: 5ae4b4032d96
Create Date: 2026-04-28 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '5ae4b4032d96'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'addresses',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('label', sa.String(length=50), nullable=False),
        sa.Column('recipient_name', sa.String(length=200), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('street', sa.Text(), nullable=False),
        sa.Column('barangay', sa.String(length=100), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('province', sa.String(length=100), nullable=False),
        sa.Column('zip_code', sa.String(length=20), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_addresses_user_id', 'addresses', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_addresses_user_id', table_name='addresses')
    op.drop_table('addresses')

