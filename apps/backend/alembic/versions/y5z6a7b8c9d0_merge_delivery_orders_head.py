"""merge delivery orders head

Revision ID: y5z6a7b8c9d0
Revises: 9b4f2c7d8e10, x4y5z6a7b8c9
Create Date: 2026-06-29
"""

from typing import Sequence, Union


revision: str = "y5z6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = ("9b4f2c7d8e10", "x4y5z6a7b8c9")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
