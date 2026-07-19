"""Back up and remove generated delivery history without deleting business records."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from uuid import UUID

from sqlalchemy import text

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import SessionLocal


BACKUP_TABLES = (
    "external_shipment_events",
    "external_shipments",
    "deliveries",
    "delivery_orders",
)


def json_value(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, (UUID, Decimal)):
        return str(value)
    raise TypeError(f"Unsupported backup value: {type(value).__name__}")


def fetch_rows(session, table_name: str) -> list[dict]:
    rows = session.execute(text(f"SELECT * FROM {table_name}"))
    return [dict(row._mapping) for row in rows]


def delivery_notifications(session) -> list[dict]:
    rows = session.execute(
        text("SELECT * FROM notifications WHERE delivery_id IS NOT NULL")
    )
    return [dict(row._mapping) for row in rows]


def account_counts(session) -> dict[str, int]:
    return {
        "users": session.execute(text("SELECT COUNT(*) FROM users")).scalar_one(),
        "riders": session.execute(
            text("SELECT COUNT(*) FROM users WHERE role = 'delivery'")
        ).scalar_one(),
        "orders": session.execute(text("SELECT COUNT(*) FROM orders")).scalar_one(),
        "vehicles": session.execute(text("SELECT COUNT(*) FROM vehicles")).scalar_one(),
        "branch_settings": session.execute(
            text("SELECT COUNT(*) FROM branch_delivery_settings")
        ).scalar_one(),
    }


def operational_counts(session) -> dict[str, int]:
    counts = {
        table_name: session.execute(
            text(f"SELECT COUNT(*) FROM {table_name}")
        ).scalar_one()
        for table_name in BACKUP_TABLES
    }
    counts["delivery_notifications"] = session.execute(
        text("SELECT COUNT(*) FROM notifications WHERE delivery_id IS NOT NULL")
    ).scalar_one()
    return counts


def build_backup(session) -> dict:
    return {
        "created_at": datetime.now().astimezone().isoformat(),
        "scope": "delivery operational history only",
        "preserved_counts": account_counts(session),
        "tables": {
            **{table_name: fetch_rows(session, table_name) for table_name in BACKUP_TABLES},
            "delivery_notifications": delivery_notifications(session),
        },
    }


def clean(session) -> None:
    session.execute(text("DELETE FROM notifications WHERE delivery_id IS NOT NULL"))
    session.execute(text("DELETE FROM external_shipment_events"))
    session.execute(text("DELETE FROM external_shipments"))
    session.execute(text("DELETE FROM deliveries"))
    session.execute(text("DELETE FROM delivery_orders"))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Commit the cleanup. Without this flag the script performs a dry run.",
    )
    parser.add_argument(
        "--backup-path",
        type=Path,
        help="Required with --execute. The path must not already exist.",
    )
    args = parser.parse_args()

    if args.execute and not args.backup_path:
        parser.error("--backup-path is required with --execute")
    if args.backup_path and args.backup_path.exists():
        parser.error(f"backup path already exists: {args.backup_path}")

    session = SessionLocal()
    try:
        before_accounts = account_counts(session)
        before_operations = operational_counts(session)
        summary = {
            "mode": "execute" if args.execute else "dry-run",
            "remove": before_operations,
            "preserve": before_accounts,
        }
        print(json.dumps(summary, indent=2))

        if not args.execute:
            session.rollback()
            return

        backup = build_backup(session)
        args.backup_path.write_text(
            json.dumps(backup, indent=2, default=json_value),
            encoding="utf-8",
        )
        clean(session)

        after_accounts = account_counts(session)
        after_operations = operational_counts(session)
        if after_accounts != before_accounts:
            raise RuntimeError("Preserved account/order/vehicle counts changed; cleanup aborted.")
        if any(after_operations.values()):
            raise RuntimeError(f"Delivery operational records remain: {after_operations}")

        session.commit()
        print(
            json.dumps(
                {
                    "backup": str(args.backup_path.resolve()),
                    "removed": before_operations,
                    "preserved": after_accounts,
                },
                indent=2,
            )
        )
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
