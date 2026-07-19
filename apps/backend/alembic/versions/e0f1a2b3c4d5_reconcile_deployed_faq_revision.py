"""reconcile the deployed FAQ revision

Revision ID: e0f1a2b3c4d5
Revises: d9e0f1a2b3c4
Create Date: 2026-07-19

The configured database was migrated with this revision identifier before
the equivalent FAQ migration was committed as d9e0f1a2b3c4.  The deployed
schema contains the tables, columns, indexes, and foreign key created by
d9e0f1a2b3c4, so this compatibility revision reconnects that database state
to the repository history without replaying the FAQ DDL or stamping over it.
"""

from alembic import op
import sqlalchemy as sa


revision = "e0f1a2b3c4d5"
down_revision = "d9e0f1a2b3c4"
branch_labels = None
depends_on = None


REQUIRED_COLUMNS = {
    "faq_categories": {"id", "name", "sort_order", "created_at", "updated_at"},
    "faq_items": {
        "id",
        "category_id",
        "question",
        "answer",
        "sort_order",
        "created_at",
        "updated_at",
    },
}


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    tables = set(inspector.get_table_names())
    problems = []

    for table_name, required_columns in REQUIRED_COLUMNS.items():
        if table_name not in tables:
            problems.append(f"missing table {table_name}")
            continue
        columns = {column["name"] for column in inspector.get_columns(table_name)}
        missing_columns = sorted(required_columns - columns)
        if missing_columns:
            problems.append(f"{table_name} missing columns: {', '.join(missing_columns)}")

    if problems:
        raise RuntimeError(
            "Cannot reconcile deployed FAQ revision e0f1a2b3c4d5: "
            + "; ".join(problems)
        )


def downgrade() -> None:
    # This revision records equivalence with d9e0f1a2b3c4 and owns no DDL.
    pass
