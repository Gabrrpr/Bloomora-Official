"""add mobile feed cms

Revision ID: q7r8s9t0u1v2
Revises: p6q7r8s9t0u1
Create Date: 2026-06-23
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "q7r8s9t0u1v2"
down_revision = "p6q7r8s9t0u1"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column("campaigns", "end_at", existing_type=sa.DateTime(timezone=True), nullable=True)
    op.add_column("campaigns", sa.Column("status", sa.String(20), nullable=False, server_default="draft"))
    op.add_column(
        "campaigns",
        sa.Column("branches", postgresql.JSONB(), nullable=False, server_default=sa.text("'[\"all\"]'::jsonb")),
    )
    op.add_column("campaigns", sa.Column("accessible_title", sa.String(160), nullable=True))
    op.add_column("campaigns", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("campaigns", sa.Column("badge", sa.String(80), nullable=True))
    op.add_column("campaigns", sa.Column("cta_label", sa.String(80), nullable=True))
    op.add_column("campaigns", sa.Column("cta_destination", sa.String(500), nullable=True))
    op.add_column("campaigns", sa.Column("web_banner_url", sa.Text(), nullable=True))
    op.add_column("campaigns", sa.Column("mobile_banner_url", sa.Text(), nullable=True))
    op.add_column("campaigns", sa.Column("feed_media_type", sa.String(10), nullable=False, server_default="image"))
    op.add_column("campaigns", sa.Column("feed_media_url", sa.Text(), nullable=True))
    op.add_column("campaigns", sa.Column("feed_poster_url", sa.Text(), nullable=True))
    op.add_column("campaigns", sa.Column("voucher_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("campaigns", sa.Column("linked_product_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key("fk_campaigns_voucher", "campaigns", "promo_codes", ["voucher_id"], ["id"], ondelete="SET NULL")
    op.create_foreign_key(
        "fk_campaigns_linked_product",
        "campaigns",
        "products",
        ["linked_product_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "feed_placements",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tab", sa.String(20), nullable=False),
        sa.Column("branch", sa.String(20), nullable=False, server_default="all"),
        sa.Column("slot", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("slot >= 1", name="ck_feed_placement_slot_positive"),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("campaign_id", "tab", "branch", name="uq_feed_placement_campaign_tab_branch"),
    )
    op.create_index("ix_feed_placements_campaign_id", "feed_placements", ["campaign_id"])
    op.create_index("ix_feed_placements_tab", "feed_placements", ["tab"])
    op.create_index("ix_feed_placements_branch", "feed_placements", ["branch"])

    op.create_table(
        "product_feed_controls",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("branch", sa.String(20), nullable=False, server_default="all"),
        sa.Column("is_hidden", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("boost_level", sa.String(10), nullable=False, server_default="none"),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("product_id", "branch", name="uq_product_feed_control_product_branch"),
    )
    op.create_index("ix_product_feed_controls_product_id", "product_feed_controls", ["product_id"])
    op.create_index("ix_product_feed_controls_branch", "product_feed_controls", ["branch"])

    op.create_table(
        "campaign_reactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("installation_id", sa.String(120), nullable=True),
        sa.Column("actor_key", sa.String(160), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("campaign_id", "actor_key", name="uq_campaign_reaction_actor"),
    )
    op.create_index("ix_campaign_reactions_campaign_id", "campaign_reactions", ["campaign_id"])

    op.create_table(
        "wishlist_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "product_id", name="uq_wishlist_user_product"),
    )
    op.create_index("ix_wishlist_items_user_id", "wishlist_items", ["user_id"])
    op.create_index("ix_wishlist_items_product_id", "wishlist_items", ["product_id"])

    op.create_table(
        "feed_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.String(40), nullable=False),
        sa.Column("item_type", sa.String(20), nullable=False),
        sa.Column("item_id", sa.String(120), nullable=False),
        sa.Column("tab", sa.String(20), nullable=False),
        sa.Column("branch", sa.String(20), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("installation_id", sa.String(120), nullable=True),
        sa.Column("session_id", sa.String(120), nullable=True),
        sa.Column("event_metadata", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_feed_events_event_type", "feed_events", ["event_type"])
    op.create_index("ix_feed_events_item_id", "feed_events", ["item_id"])
    op.create_index("ix_feed_events_tab", "feed_events", ["tab"])
    op.create_index("ix_feed_events_branch", "feed_events", ["branch"])
    op.create_index("ix_feed_events_created_at", "feed_events", ["created_at"])


def downgrade():
    op.drop_table("feed_events")
    op.drop_table("wishlist_items")
    op.drop_table("campaign_reactions")
    op.drop_table("product_feed_controls")
    op.drop_table("feed_placements")
    op.drop_constraint("fk_campaigns_linked_product", "campaigns", type_="foreignkey")
    op.drop_constraint("fk_campaigns_voucher", "campaigns", type_="foreignkey")
    for column in [
        "linked_product_id",
        "voucher_id",
        "feed_poster_url",
        "feed_media_url",
        "feed_media_type",
        "mobile_banner_url",
        "web_banner_url",
        "cta_destination",
        "cta_label",
        "badge",
        "description",
        "accessible_title",
        "branches",
        "status",
    ]:
        op.drop_column("campaigns", column)
    op.execute("UPDATE campaigns SET end_at = start_at + interval '100 years' WHERE end_at IS NULL")
    op.alter_column("campaigns", "end_at", existing_type=sa.DateTime(timezone=True), nullable=False)
