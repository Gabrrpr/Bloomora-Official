"""merge delivery coordinates head

Revision ID: d6ae715bb775
Revises: 0473d93c620e, v2w3x4y5z6a7
Create Date: 2026-06-26 18:08:29.125912

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd6ae715bb775'
down_revision: Union[str, None] = ('0473d93c620e', 'v2w3x4y5z6a7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass