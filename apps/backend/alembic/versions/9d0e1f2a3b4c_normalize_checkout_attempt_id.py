"""normalize checkout attempt id to text

The application treats checkout_attempt_id as an optional string supplied by
the web and mobile clients. One deployed database created the column as UUID,
which causes PostgreSQL to reject ORM inserts because SQLAlchemy binds the
model's String value as VARCHAR.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "9d0e1f2a3b4c"
down_revision = "8c4e2a91b607"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"]: column for column in inspector.get_columns("orders")}
    column = columns.get("checkout_attempt_id")
    if not column:
        return

    if isinstance(column["type"], postgresql.UUID):
        op.alter_column(
            "orders",
            "checkout_attempt_id",
            existing_type=postgresql.UUID(as_uuid=True),
            type_=sa.String(length=64),
            existing_nullable=True,
            postgresql_using="checkout_attempt_id::text",
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"]: column for column in inspector.get_columns("orders")}
    column = columns.get("checkout_attempt_id")
    if not column:
        return

    if isinstance(column["type"], sa.String):
        op.alter_column(
            "orders",
            "checkout_attempt_id",
            existing_type=sa.String(length=64),
            type_=postgresql.UUID(as_uuid=True),
            existing_nullable=True,
            postgresql_using="NULLIF(checkout_attempt_id, '')::uuid",
        )
