"""add mobile commerce settings

Revision ID: p6q7r8s9t0u1
Revises: o5p6q7r8s9t0
Create Date: 2026-06-23
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "p6q7r8s9t0u1"
down_revision = "o5p6q7r8s9t0"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("orders", sa.Column("voucher_code", sa.String(length=50), nullable=True))
    op.add_column(
        "orders",
        sa.Column("discount_amount", sa.Numeric(10, 2), nullable=False, server_default="0"),
    )
    op.add_column("order_items", sa.Column("card_message", sa.Text(), nullable=True))
    op.add_column(
        "order_items",
        sa.Column("card_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    op.add_column("reviews", sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("reviews", sa.Column("image_url", sa.Text(), nullable=True))
    op.execute(
        """
        UPDATE reviews r
        SET order_id = candidate.order_id
        FROM (
            SELECT DISTINCT ON (r2.id) r2.id AS review_id, oi.order_id
            FROM reviews r2
            JOIN order_items oi ON oi.product_id = r2.product_id
            JOIN orders o ON o.id = oi.order_id AND o.user_id = r2.user_id
            ORDER BY r2.id, o.created_at DESC
        ) candidate
        WHERE r.id = candidate.review_id
        """
    )
    op.execute(
        """
        INSERT INTO promo_codes
          (id, code, discount_type, discount_value, min_spend, expires_at, is_active, created_at, updated_at)
        VALUES
          (gen_random_uuid(), 'BLOOM10', 'percent', 10, 0, '2026-12-31 23:59:59+08', true, now(), now()),
          (gen_random_uuid(), 'FRESH50', 'fixed', 50, 500, '2026-12-31 23:59:59+08', true, now(), now()),
          (gen_random_uuid(), 'WELCOME100', 'fixed', 100, 1000, '2026-12-31 23:59:59+08', true, now(), now())
        ON CONFLICT (code) DO NOTHING
        """
    )
    op.execute("DELETE FROM reviews WHERE order_id IS NULL")
    op.alter_column("reviews", "order_id", nullable=False)
    op.create_foreign_key(
        "fk_reviews_order_id_orders",
        "reviews",
        "orders",
        ["order_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.execute(
        """
        DELETE FROM reviews newer
        USING reviews older
        WHERE newer.user_id = older.user_id
          AND newer.product_id = older.product_id
          AND (
            newer.created_at > older.created_at
            OR (newer.created_at = older.created_at AND newer.id::text > older.id::text)
          )
        """
    )
    op.create_unique_constraint("uq_reviews_user_product", "reviews", ["user_id", "product_id"])
    op.create_check_constraint(
        "ck_reviews_star_rating",
        "reviews",
        "star_rating >= 1 AND star_rating <= 5",
    )

    op.create_table(
        "commerce_settings",
        sa.Column("key", sa.String(length=80), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("key"),
    )
    op.create_table(
        "advertisements",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.execute(
        """
        INSERT INTO commerce_settings (key, value, updated_at)
        VALUES
          ('delivery', '{"delivery_fee":100,"minimum_order":0,"same_day_cutoff":"14:00","timezone":"Asia/Manila"}', now())
        ON CONFLICT (key) DO NOTHING
        """
    )


def downgrade():
    op.drop_table("advertisements")
    op.drop_table("commerce_settings")
    op.drop_constraint("ck_reviews_star_rating", "reviews", type_="check")
    op.drop_constraint("uq_reviews_user_product", "reviews", type_="unique")
    op.drop_constraint("fk_reviews_order_id_orders", "reviews", type_="foreignkey")
    op.drop_column("reviews", "image_url")
    op.drop_column("reviews", "order_id")
    op.drop_column("order_items", "card_enabled")
    op.drop_column("order_items", "card_message")
    op.drop_column("orders", "discount_amount")
    op.drop_column("orders", "voucher_code")
