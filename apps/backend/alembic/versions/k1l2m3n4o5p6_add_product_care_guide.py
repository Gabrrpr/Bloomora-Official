"""add product care guide

Revision ID: k1l2m3n4o5p6
Revises: j0k1l2m3n4o5
"""

from alembic import op
import sqlalchemy as sa

revision = "k1l2m3n4o5p6"
down_revision = "j0k1l2m3n4o5"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("products", sa.Column("care_guide", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("products", "care_guide")
