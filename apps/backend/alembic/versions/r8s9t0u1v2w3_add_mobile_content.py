"""add mobile content

Revision ID: r8s9t0u1v2w3
Revises: q7r8s9t0u1v2
Create Date: 2026-06-23
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "r8s9t0u1v2w3"
down_revision = "q7r8s9t0u1v2"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "feed_posts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("internal_title", sa.String(160), nullable=False),
        sa.Column("title", sa.String(160), nullable=False),
        sa.Column("caption", sa.Text(), nullable=True),
        sa.Column("badge", sa.String(80), nullable=True),
        sa.Column("media_kind", sa.String(10), nullable=False, server_default="image"),
        sa.Column("media_url", sa.Text(), nullable=False),
        sa.Column("poster_url", sa.Text(), nullable=True),
        sa.Column("media_width", sa.Integer(), nullable=False),
        sa.Column("media_height", sa.Integer(), nullable=False),
        sa.Column("media_duration_seconds", sa.Integer(), nullable=True),
        sa.Column("media_mime_type", sa.String(80), nullable=False),
        sa.Column("media_size_bytes", sa.Integer(), nullable=True),
        sa.Column("action", postgresql.JSONB(), nullable=False, server_default=sa.text("'{\"type\":\"none\"}'::jsonb")),
        sa.Column("tab", sa.String(20), nullable=False),
        sa.Column("branch", sa.String(20), nullable=False, server_default="all"),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("media_kind in ('image','video')", name="ck_feed_posts_media_kind"),
        sa.CheckConstraint("tab in ('explore','new','for-you')", name="ck_feed_posts_tab"),
        sa.CheckConstraint("branch in ('all','manila','pampanga')", name="ck_feed_posts_branch"),
        sa.CheckConstraint("status in ('draft','published')", name="ck_feed_posts_status"),
        sa.PrimaryKeyConstraint("id"),
        if_not_exists=True,
    )
    for column in ["tab", "branch", "status", "scheduled_at", "expires_at"]:
        op.create_index(f"ix_feed_posts_{column}", "feed_posts", [column], if_not_exists=True)

    op.create_table(
        "feed_post_reactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("feed_post_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("installation_id", sa.String(120), nullable=True),
        sa.Column("actor_key", sa.String(160), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["feed_post_id"], ["feed_posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("feed_post_id", "actor_key", name="uq_feed_post_reaction_actor"),
        if_not_exists=True,
    )
    op.create_index("ix_feed_post_reactions_feed_post_id", "feed_post_reactions", ["feed_post_id"], if_not_exists=True)
    op.create_index("ix_feed_post_reactions_user_id", "feed_post_reactions", ["user_id"], if_not_exists=True)

    op.create_table(
        "category_banners",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("internal_title", sa.String(160), nullable=False),
        sa.Column("accessible_label", sa.String(240), nullable=False),
        sa.Column("media_url", sa.Text(), nullable=False),
        sa.Column("media_width", sa.Integer(), nullable=False, server_default="1080"),
        sa.Column("media_height", sa.Integer(), nullable=False, server_default="500"),
        sa.Column("media_mime_type", sa.String(80), nullable=False, server_default="image/webp"),
        sa.Column("media_size_bytes", sa.Integer(), nullable=True),
        sa.Column("action", postgresql.JSONB(), nullable=False, server_default=sa.text("'{\"type\":\"none\"}'::jsonb")),
        sa.Column("branch", sa.String(20), nullable=False, server_default="all"),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("branch in ('all','manila','pampanga')", name="ck_category_banners_branch"),
        sa.CheckConstraint("status in ('draft','published')", name="ck_category_banners_status"),
        sa.PrimaryKeyConstraint("id"),
        if_not_exists=True,
    )
    for column in ["branch", "status", "scheduled_at", "expires_at"]:
        op.create_index(f"ix_category_banners_{column}", "category_banners", [column], if_not_exists=True)

    op.execute(
        """
        INSERT INTO feed_posts (
            id, internal_title, title, caption, badge, media_kind, media_url,
            poster_url, media_width, media_height, media_duration_seconds,
            media_mime_type, action, tab, branch, status, scheduled_at,
            expires_at, sort_order, created_at, updated_at
        )
        SELECT DISTINCT ON (c.id)
            c.id,
            c.name,
            COALESCE(c.accessible_title, c.name),
            c.description,
            c.badge,
            CASE WHEN c.feed_media_type = 'video' THEN 'video' ELSE 'image' END,
            c.feed_media_url,
            c.feed_poster_url,
            CASE WHEN c.feed_media_type = 'video' THEN 1080 ELSE 1440 END,
            CASE WHEN c.feed_media_type = 'video' THEN 1920 ELSE 2560 END,
            NULL,
            CASE WHEN c.feed_media_type = 'video' THEN 'video/mp4' ELSE 'image/webp' END,
            CASE
                WHEN c.linked_product_id IS NOT NULL THEN jsonb_build_object(
                    'type', 'product', 'targetId', c.linked_product_id::text,
                    'label', COALESCE(c.cta_label, 'View product')
                )
                WHEN c.voucher_id IS NOT NULL THEN jsonb_build_object(
                    'type', 'voucher', 'targetId', c.voucher_id::text,
                    'code', pc.code, 'label', COALESCE(c.cta_label, 'Use voucher')
                )
                WHEN c.cta_destination IS NOT NULL THEN jsonb_build_object(
                    'type', 'feature', 'targetId', 'categories',
                    'route', c.cta_destination, 'label', COALESCE(c.cta_label, 'Learn more')
                )
                ELSE '{"type":"none"}'::jsonb
            END,
            COALESCE(fp.tab, 'explore'),
            COALESCE(fp.branch, 'all'),
            CASE WHEN c.status = 'published' AND c.is_active THEN 'published' ELSE 'draft' END,
            c.start_at,
            c.end_at,
            COALESCE(fp.slot, 1) * 10,
            now(),
            now()
        FROM campaigns c
        LEFT JOIN feed_placements fp ON fp.campaign_id = c.id
        LEFT JOIN promo_codes pc ON pc.id = c.voucher_id
        WHERE c.feed_media_url IS NOT NULL
        ORDER BY c.id, fp.slot ASC NULLS LAST
        ON CONFLICT (id) DO NOTHING
        """
    )
    op.execute(
        """
        INSERT INTO category_banners (
            id, internal_title, accessible_label, media_url, media_width,
            media_height, media_mime_type, action, branch, status,
            scheduled_at, expires_at, sort_order, created_at, updated_at
        )
        SELECT
            c.id,
            c.name,
            COALESCE(c.accessible_title, c.name),
            c.mobile_banner_url,
            1080,
            500,
            'image/webp',
            CASE
                WHEN c.linked_product_id IS NOT NULL THEN jsonb_build_object(
                    'type', 'product', 'targetId', c.linked_product_id::text,
                    'label', COALESCE(c.cta_label, 'View product')
                )
                WHEN c.voucher_id IS NOT NULL THEN jsonb_build_object(
                    'type', 'voucher', 'targetId', c.voucher_id::text,
                    'code', pc.code, 'label', COALESCE(c.cta_label, 'Use voucher')
                )
                WHEN c.cta_destination IS NOT NULL THEN jsonb_build_object(
                    'type', 'feature', 'targetId', 'categories',
                    'route', c.cta_destination, 'label', COALESCE(c.cta_label, 'Learn more')
                )
                ELSE '{"type":"none"}'::jsonb
            END,
            CASE
                WHEN jsonb_array_length(c.branches) = 1
                    AND c.branches->>0 IN ('all', 'manila', 'pampanga')
                THEN c.branches->>0
                ELSE 'all'
            END,
            CASE WHEN c.status = 'published' AND c.is_active THEN 'published' ELSE 'draft' END,
            c.start_at,
            c.end_at,
            10,
            now(),
            now()
        FROM campaigns c
        LEFT JOIN promo_codes pc ON pc.id = c.voucher_id
        WHERE c.mobile_banner_url IS NOT NULL
        ON CONFLICT (id) DO NOTHING
        """
    )

    op.execute("ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE feed_post_reactions ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE category_banners ENABLE ROW LEVEL SECURITY")


def downgrade():
    op.drop_table("category_banners")
    op.drop_table("feed_post_reactions")
    op.drop_table("feed_posts")
