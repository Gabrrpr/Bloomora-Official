"""Back up and delete explicitly named orders and their dependent records."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from uuid import UUID

from sqlalchemy import String, cast, delete, func, select, update

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import SessionLocal
from app.models import (
    Delivery,
    DeliveryOrder,
    ExternalShipment,
    ExternalShipmentEvent,
    Notification,
    Order,
    OrderItem,
    Review,
    StockReservation,
    Transaction,
)


def json_value(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, (UUID, Decimal)):
        return str(value)
    raise TypeError(f"Unsupported backup value: {type(value).__name__}")


def normalize_order_number(value: str) -> str:
    normalized = str(value or "").strip().upper()
    if normalized.startswith("ORD-"):
        normalized = normalized[4:]
    if len(normalized) != 8 or any(character not in "0123456789ABCDEF" for character in normalized):
        raise argparse.ArgumentTypeError(f"Invalid order number: {value}")
    return f"ORD-{normalized}"


def rows_for(session, table, clause) -> list[dict]:
    return [dict(row) for row in session.execute(select(table).where(clause)).mappings()]


def find_orders(session, order_numbers: list[str]) -> tuple[list[Order], list[str]]:
    prefixes = [number.removeprefix("ORD-") for number in order_numbers]
    orders = session.execute(
        select(Order).where(
            func.upper(func.substr(cast(Order.id, String), 1, 8)).in_(prefixes)
        )
    ).scalars().all()
    found = {f"ORD-{str(order.id).replace('-', '')[:8].upper()}" for order in orders}
    return orders, [number for number in order_numbers if number not in found]


def build_backup(session, orders: list[Order], order_numbers: list[str]) -> tuple[dict, dict]:
    order_ids = [order.id for order in orders]
    order_items = rows_for(session, OrderItem.__table__, OrderItem.order_id.in_(order_ids))
    order_item_ids = [row["id"] for row in order_items]
    deliveries = rows_for(session, Delivery.__table__, Delivery.order_id.in_(order_ids))
    delivery_ids = [row["id"] for row in deliveries]
    delivery_order_ids = sorted(
        {row["delivery_order_id"] for row in deliveries if row["delivery_order_id"]},
        key=str,
    )
    shipments = rows_for(
        session,
        ExternalShipment.__table__,
        ExternalShipment.order_id.in_(order_ids),
    )
    shipment_ids = [row["id"] for row in shipments]

    tables = {
        "orders": rows_for(session, Order.__table__, Order.id.in_(order_ids)),
        "order_items": order_items,
        "stock_reservations": rows_for(
            session,
            StockReservation.__table__,
            StockReservation.order_item_id.in_(order_item_ids),
        ) if order_item_ids else [],
        "transactions": rows_for(
            session,
            Transaction.__table__,
            Transaction.order_id.in_(order_ids),
        ),
        "deliveries": deliveries,
        "delivery_orders": rows_for(
            session,
            DeliveryOrder.__table__,
            DeliveryOrder.id.in_(delivery_order_ids),
        ) if delivery_order_ids else [],
        "external_shipments": shipments,
        "external_shipment_events": rows_for(
            session,
            ExternalShipmentEvent.__table__,
            ExternalShipmentEvent.shipment_id.in_(shipment_ids),
        ) if shipment_ids else [],
        "reviews": rows_for(session, Review.__table__, Review.order_id.in_(order_ids)),
        "notifications": rows_for(
            session,
            Notification.__table__,
            Notification.order_id.in_(order_ids)
            | Notification.delivery_id.in_(delivery_ids),
        ) if delivery_ids else rows_for(
            session,
            Notification.__table__,
            Notification.order_id.in_(order_ids),
        ),
    }
    backup = {
        "created_at": datetime.now().astimezone().isoformat(),
        "scope": "explicit inconsistent order cleanup",
        "order_numbers": order_numbers,
        "tables": tables,
    }
    context = {
        "order_ids": order_ids,
        "order_item_ids": order_item_ids,
        "delivery_ids": delivery_ids,
        "delivery_order_ids": delivery_order_ids,
        "shipment_ids": shipment_ids,
    }
    return backup, context


def delete_orders(session, context: dict) -> dict[str, int]:
    order_ids = context["order_ids"]
    counts: dict[str, int] = {}

    def remove(name, model, clause):
        result = session.execute(delete(model).where(clause))
        counts[name] = result.rowcount or 0

    if context["shipment_ids"]:
        remove(
            "external_shipment_events",
            ExternalShipmentEvent,
            ExternalShipmentEvent.shipment_id.in_(context["shipment_ids"]),
        )
    remove("external_shipments", ExternalShipment, ExternalShipment.order_id.in_(order_ids))
    remove("reviews", Review, Review.order_id.in_(order_ids))
    session.execute(
        update(Notification)
        .where(Notification.order_id.in_(order_ids))
        .values(order_id=None)
    )
    if context["delivery_ids"]:
        session.execute(
            update(Notification)
            .where(Notification.delivery_id.in_(context["delivery_ids"]))
            .values(delivery_id=None)
        )
    remove("transactions", Transaction, Transaction.order_id.in_(order_ids))
    remove("deliveries", Delivery, Delivery.order_id.in_(order_ids))
    if context["order_item_ids"]:
        remove(
            "stock_reservations",
            StockReservation,
            StockReservation.order_item_id.in_(context["order_item_ids"]),
        )
    remove("order_items", OrderItem, OrderItem.order_id.in_(order_ids))
    remove("orders", Order, Order.id.in_(order_ids))

    orphaned_dispatches = []
    for delivery_order_id in context["delivery_order_ids"]:
        has_remaining_stop = session.execute(
            select(Delivery.id).where(Delivery.delivery_order_id == delivery_order_id).limit(1)
        ).scalar_one_or_none()
        if not has_remaining_stop:
            orphaned_dispatches.append(delivery_order_id)
    if orphaned_dispatches:
        remove(
            "delivery_orders",
            DeliveryOrder,
            DeliveryOrder.id.in_(orphaned_dispatches),
        )
    else:
        counts["delivery_orders"] = 0
    return counts


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("order_numbers", nargs="+", type=normalize_order_number)
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--backup-path", type=Path)
    args = parser.parse_args()

    if args.execute and not args.backup_path:
        parser.error("--backup-path is required with --execute")
    if args.backup_path and args.backup_path.exists():
        parser.error(f"backup path already exists: {args.backup_path}")

    order_numbers = list(dict.fromkeys(args.order_numbers))
    session = SessionLocal()
    try:
        orders, missing = find_orders(session, order_numbers)
        backup, context = build_backup(session, orders, order_numbers)
        summary = {
            "mode": "execute" if args.execute else "dry-run",
            "requested": order_numbers,
            "found": [
                f"ORD-{str(order.id).replace('-', '')[:8].upper()}"
                for order in orders
            ],
            "missing": missing,
            "record_counts": {
                name: len(rows) for name, rows in backup["tables"].items()
            },
        }
        print(json.dumps(summary, indent=2))

        if missing:
            raise RuntimeError(f"Requested orders were not found: {', '.join(missing)}")
        if not args.execute:
            session.rollback()
            return

        args.backup_path.write_text(
            json.dumps(backup, indent=2, default=json_value),
            encoding="utf-8",
        )
        removed = delete_orders(session, context)
        remaining, _ = find_orders(session, order_numbers)
        if remaining:
            raise RuntimeError("One or more requested orders remain; cleanup aborted.")
        session.commit()
        print(json.dumps({"backup": str(args.backup_path.resolve()), "removed": removed}, indent=2))
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
