"""add dedicated FAQ tables

Revision ID: d9e0f1a2b3c4
Revises: b8c9d0e1f2a3, c7d8e9f0a1b2
Create Date: 2026-07-17
"""

import json
import uuid

from alembic import op
import sqlalchemy as sa


revision = "d9e0f1a2b3c4"
down_revision = ("b8c9d0e1f2a3", "c7d8e9f0a1b2")
branch_labels = None
depends_on = None


def _unique_id(value, prefix, used):
    candidate = str(value or f"{prefix}-{uuid.uuid4()}").strip()[:100]
    if not candidate or candidate in used:
        candidate = f"{prefix}-{uuid.uuid4()}"
    used.add(candidate)
    return candidate


def upgrade() -> None:
    op.create_table(
        "faq_categories",
        sa.Column("id", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_faq_categories_sort_order", "faq_categories", ["sort_order"])
    op.create_table(
        "faq_items",
        sa.Column("id", sa.String(length=100), nullable=False),
        sa.Column("category_id", sa.String(length=100), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["category_id"], ["faq_categories.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_faq_items_category_id", "faq_items", ["category_id"])
    op.create_index("ix_faq_items_sort_order", "faq_items", ["sort_order"])

    bind = op.get_bind()
    if not sa.inspect(bind).has_table("store_settings"):
        return
    raw = bind.execute(sa.text(
        "SELECT setting_value FROM store_settings WHERE setting_key = 'homepage_layout'"
    )).scalar()
    if not raw:
        return
    try:
        settings = json.loads(raw) if isinstance(raw, str) else raw
        categories = settings.get("__faq__", []) if isinstance(settings, dict) else []
    except (TypeError, ValueError):
        return

    used_category_ids = set()
    used_item_ids = set()
    for category_index, category in enumerate(categories):
        if not isinstance(category, dict):
            continue
        category_id = _unique_id(category.get("id"), "cat", used_category_ids)
        name = str(category.get("category") or "FAQ").strip()[:160] or "FAQ"
        bind.execute(sa.text(
            "INSERT INTO faq_categories (id, name, sort_order) VALUES (:id, :name, :sort_order)"
        ), {"id": category_id, "name": name, "sort_order": category_index})
        for item_index, item in enumerate(category.get("items") or []):
            if not isinstance(item, dict):
                continue
            question = str(item.get("q") or "").strip()
            answer = str(item.get("a") or "").strip()
            if not question or not answer:
                continue
            item_id = _unique_id(item.get("id"), "q", used_item_ids)
            bind.execute(sa.text(
                """INSERT INTO faq_items
                   (id, category_id, question, answer, sort_order)
                   VALUES (:id, :category_id, :question, :answer, :sort_order)"""
            ), {
                "id": item_id,
                "category_id": category_id,
                "question": question,
                "answer": answer,
                "sort_order": item_index,
            })


def downgrade() -> None:
    op.drop_index("ix_faq_items_sort_order", table_name="faq_items")
    op.drop_index("ix_faq_items_category_id", table_name="faq_items")
    op.drop_table("faq_items")
    op.drop_index("ix_faq_categories_sort_order", table_name="faq_categories")
    op.drop_table("faq_categories")
