"""merge conflicting heads

Revision ID: 7d808a1577bf
Revises: 060de938764d, s9t0u1v2w3x4
Create Date: 2026-06-25 14:46:27.561542

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7d808a1577bf'
down_revision: Union[str, None] = ('060de938764d', 's9t0u1v2w3x4')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass