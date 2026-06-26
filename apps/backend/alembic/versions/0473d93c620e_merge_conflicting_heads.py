"""merge conflicting heads

Revision ID: 0473d93c620e
Revises: 7d808a1577bf, u1v2w3x4y5z6
Create Date: 2026-06-26 10:52:48.229809

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0473d93c620e'
down_revision: Union[str, None] = ('7d808a1577bf', 'u1v2w3x4y5z6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass