"""add target role and branch to notifications

Revision ID: 060de938764d
Revises: r8s9t0u1v2w3
Create Date: 2026-06-24 17:21:15.125746

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '060de938764d'
down_revision: Union[str, None] = 'r8s9t0u1v2w3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('notifications', sa.Column('target_role', sa.String(50), nullable=True))
    op.add_column('notifications', sa.Column('target_branch', sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column('notifications', 'target_branch')
    op.drop_column('notifications', 'target_role')