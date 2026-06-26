"""add missing activity_logs columns

Revision ID: 775de3090d61
Revises: d6ae715bb775
Create Date: 2026-06-26 19:53:47.629840

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '775de3090d61'
down_revision: Union[str, None] = 'd6ae715bb775'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('activity_logs', sa.Column('details', sa.Text, nullable=True))
    op.add_column('activity_logs', sa.Column('branch', sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column('activity_logs', 'branch')
    op.drop_column('activity_logs', 'details')