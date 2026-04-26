"""add_address_to_users

Revision ID: 5ae4b4032d96
Revises: c6ae078d0501
Create Date: 2026-04-27 02:45:38.055084

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '5ae4b4032d96'
down_revision = 'c6ae078d0501'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('address', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'address')

