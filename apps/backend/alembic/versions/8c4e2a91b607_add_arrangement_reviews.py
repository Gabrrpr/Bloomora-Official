"""allow verified reviews for custom arrangements

Revision ID: 8c4e2a91b607
Revises: f2b3c4d5e6f7, c9d0e1f4a5b6
Create Date: 2026-10-05
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "8c4e2a91b607"
down_revision = ("f2b3c4d5e6f7", "c9d0e1f4a5b6")
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("reviews")}
    if "arrangement_id" not in columns:
        op.add_column("reviews", sa.Column("arrangement_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.alter_column("reviews", "product_id", existing_type=postgresql.UUID(as_uuid=True), nullable=True)
    foreign_keys = {fk.get("name") for fk in inspector.get_foreign_keys("reviews")}
    if "fk_reviews_arrangement_id" not in foreign_keys:
        op.create_foreign_key("fk_reviews_arrangement_id", "reviews", "arrangements", ["arrangement_id"], ["id"])
    indexes = {index.get("name") for index in inspector.get_indexes("reviews")}
    if "uq_reviews_user_arrangement" not in indexes:
        op.create_index("uq_reviews_user_arrangement", "reviews", ["user_id", "arrangement_id"], unique=True)
    constraints = {constraint.get("name") for constraint in inspector.get_check_constraints("reviews")}
    if "ck_reviews_exactly_one_item_type" not in constraints:
        op.create_check_constraint(
            "ck_reviews_exactly_one_item_type",
            "reviews",
            "(product_id IS NOT NULL AND arrangement_id IS NULL) OR (product_id IS NULL AND arrangement_id IS NOT NULL)",
        )


def downgrade():
    # Refuse a rollback that would erase custom reviews or leave null product IDs.
    if op.get_bind().execute(sa.text("SELECT EXISTS (SELECT 1 FROM reviews WHERE arrangement_id IS NOT NULL)")).scalar():
        raise RuntimeError("Cannot downgrade while custom arrangement reviews exist; export and resolve them first.")
    op.drop_constraint("ck_reviews_exactly_one_item_type", "reviews", type_="check")
    op.drop_index("uq_reviews_user_arrangement", table_name="reviews")
    op.drop_constraint("fk_reviews_arrangement_id", "reviews", type_="foreignkey")
    op.drop_column("reviews", "arrangement_id")
    op.alter_column("reviews", "product_id", existing_type=postgresql.UUID(as_uuid=True), nullable=False)
