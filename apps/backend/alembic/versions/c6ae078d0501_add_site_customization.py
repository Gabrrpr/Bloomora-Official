"""add site_customization

Revision ID: c6ae078d0501
Revises: 
Create Date: 2026-04-26 05:37:09.185336

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c6ae078d0501'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('site_customizations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('key', sa.String(length=100), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_site_customizations_key'), 'site_customizations', ['key'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_site_customizations_key'), table_name='site_customizations')
    op.drop_table('site_customizations')

