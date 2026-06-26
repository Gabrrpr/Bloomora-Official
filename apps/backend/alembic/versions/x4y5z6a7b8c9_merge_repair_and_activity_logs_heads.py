"""merge repair and activity logs heads

Revision ID: x4y5z6a7b8c9
Revises: 775de3090d61, w3x4y5z6a7b8
Create Date: 2026-06-27
"""

from typing import Sequence, Union


revision: str = "x4y5z6a7b8c9"
down_revision: Union[str, Sequence[str], None] = ("775de3090d61", "w3x4y5z6a7b8")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
