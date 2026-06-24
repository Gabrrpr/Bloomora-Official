from __future__ import annotations

import hashlib
import hmac
import json
import secrets
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.v1.routes.orders import _expire_pending_transaction, _release_reserved_stock, serialize_order
from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import CartItem, Inventory, Order, OrderStatusEnum, PaymentStatusEnum, Product, StockReservation, Transaction, User
from app.services.paymongo_service import (
    PayMongoError,
    create_checkout_session,
    retrieve_checkout_session,
    to_paymongo_amount,
)

router = APIRouter(prefix="/payments", tags=["Payments"])

class PayMongoCheckoutRequest(BaseModel):
    order_ids: list[str] = Field(..., min_length=1)
    payment_method_types: list[str] | None = None
    success_url: str | None = None
    cancel_url: str | None = None


def _order_number(order: Order) -> str:
    return f"ORD-{order.id.hex[:8].upper()}"

def _enum_value(value: Any) -> str:
    return str(value.value if hasattr(value, "value") else value)

def _line_item_name(order: Order) -> str:
    if order.product_id and getattr(order, "product", None):
        return order.product.name
    if order.arrangement_id and getattr(order, "arrangement", None):
        return getattr(order.arrangement, "name", None) or "Custom Arrangement"
    if getattr(order, "items", None):
        first_item = order.items[0] if order.items else None
        if first_item and first_item.product:
            suffix = f" + {len(order.items) - 1} more" if len(order.items) > 1 else ""
            return f"{first_item.product.name}{suffix}"
    return f"Bloomora order {_order_number(order)}"

def _paymongo_images(*urls: str | None) -> list[str]:
    images: list[str] = []
    for url in urls:
        value = str(url or "").strip()
        if value.startswith(("https://", "http://")):
            images.append(value)
            break
    return images

def _order_item_image(item: Any) -> list[str]:
    product = getattr(item, "product", None)
    arrangement = getattr(item, "arrangement", None)
    return _paymongo_images(
        getattr(product, "image_url", None),
        getattr(arrangement, "generated_image_url", None),
        getattr(arrangement, "image_url", None),
    )

def _order_image(order: Order) -> list[str]:
    product = getattr(order, "product", None)
    arrangement = getattr(order, "arrangement", None)
    first_item = order.items[0] if getattr(order, "items", None) else None
    return _paymongo_images(
        getattr(product, "image_url", None),
        getattr(arrangement, "generated_image_url", None),
        getattr(arrangement, "image_url", None),
        *(_order_item_image(first_item) if first_item else []),
    )

def _get_owned_orders(
    db: Session,
    order_ids: list[str],
    user: User,
    *,
    allow_paid: bool = False,
) -> list[Order]:
    parsed_ids = []
    for order_id in order_ids:
        try:
            parsed_ids.append(uuid.UUID(order_id))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid order ID: {order_id}")

    orders = db.query(Order).filter(Order.id.in_(parsed_ids)).all()
    found_ids = {order.id for order in orders}
    missing_ids = [str(order_id) for order_id in parsed_ids if order_id not in found_ids]
    if missing_ids:
        raise HTTPException(status_code=404, detail=f"Order not found: {', '.join(missing_ids)}")

    for order in orders:
        if order.user_id != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to pay for one or more orders.")
        if not order.transaction:
            raise HTTPException(status_code=400, detail=f"Order {_order_number(order)} has no transaction.")
        _expire_pending_transaction(db, order)
        payment_status = _enum_value(order.transaction.status)
        if not allow_paid and payment_status == PaymentStatusEnum.paid.value:
            raise HTTPException(status_code=400, detail=f"Order {_order_number(order)} is already paid.")
        if not allow_paid and payment_status != PaymentStatusEnum.pending.value:
            raise HTTPException(
                status_code=400,
                detail=f"Order {_order_number(order)} is no longer available for payment.",
            )

    return orders

@router.post("/paymongo/checkout", response_model=dict)
async def create_paymongo_checkout(
    payload: PayMongoCheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    orders = _get_owned_orders(db, payload.order_ids, current_user)

    if len(orders) == 1:
        transaction = orders[0].transaction
        if transaction.provider_checkout_session_id and transaction.checkout_url:
            return {
                "status": "pending",
                "provider": "paymongo",
                "checkout_session_id": transaction.provider_checkout_session_id,
                "checkout_url": transaction.checkout_url,
                "reference_number": transaction.reference_number,
                "order_ids": [str(orders[0].id)],
            }

    reference_number = f"PMO-{secrets.token_hex(6).upper()}"

    line_items = []
    for order in orders:
        if order.items:
            for item in order.items:
                name = item.product.name if item.product else (item.arrangement.name or "Custom Arrangement")
                line_item = {
                    "name": name,
                    "amount": to_paymongo_amount(Decimal(item.price_at_purchase)),
                    "currency": "PHP",
                    "quantity": item.quantity,
                }
                images = _order_item_image(item)
                if images:
                    line_item["images"] = images
                line_items.append(line_item)
            if Decimal(order.delivery_fee or 0) > 0:
                line_items.append({
                    "name": "Delivery fee",
                    "amount": to_paymongo_amount(Decimal(order.delivery_fee)),
                    "currency": "PHP",
                    "quantity": 1,
                })
            continue
        print(f"DEBUG: Processing order {order.id} | Database total_amount: {order.total_amount}")
        
        amount_val = order.total_amount or 0
        
        if amount_val <= 0:
            print("⚠️ WARNING: Database amount is 0! Forcing amount to 500 for testing.")
            amount_val = Decimal("500.00")
            
        line_item = {
            "name": _line_item_name(order),
            "amount": to_paymongo_amount(Decimal(amount_val)),
            "currency": "PHP",
            "quantity": 1,
        }
        images = _order_image(order)
        if images:
            line_item["images"] = images
        line_items.append(line_item)
        if Decimal(order.delivery_fee or 0) > 0:
            line_items.append({
                "name": "Delivery fee",
                "amount": to_paymongo_amount(Decimal(order.delivery_fee)),
                "currency": "PHP",
                "quantity": 1,
            })

    if any(item["amount"] <= 0 for item in line_items):
        raise HTTPException(status_code=400, detail="PayMongo checkout amount must be greater than zero.")

    try:
        checkout = await create_checkout_session(
            cancel_url=payload.cancel_url,
            line_items=line_items,
            reference_number=reference_number,
            metadata={
                "order_ids": ",".join(str(order.id) for order in orders),
                "user_id": str(current_user.id),
            },
            payment_method_types=payload.payment_method_types,
            success_url=payload.success_url,
        )
    except PayMongoError as error:
        raise HTTPException(status_code=502, detail=str(error))

    checkout_data = checkout.get("data", {})
    checkout_id = checkout_data.get("id")
    checkout_attributes = checkout_data.get("attributes", {})
    checkout_url = checkout_attributes.get("checkout_url")

    if not checkout_id or not checkout_url:
        raise HTTPException(status_code=502, detail="PayMongo did not return a checkout URL.")

    for order in orders:
        order.transaction.provider = "paymongo"
        order.transaction.provider_checkout_session_id = checkout_id
        order.transaction.checkout_url = checkout_url
        order.transaction.reference_number = reference_number
        order.transaction.status = PaymentStatusEnum.pending.value

    db.commit()

    return {
        "status": "pending",
        "provider": "paymongo",
        "checkout_session_id": checkout_id,
        "checkout_url": checkout_url,
        "reference_number": reference_number,
        "order_ids": [str(order.id) for order in orders],
    }

def _checkout_payment(checkout: dict[str, Any]) -> dict[str, Any]:
    attributes = checkout.get("data", {}).get("attributes", {})
    payments = attributes.get("payments") or []

    return payments[-1] if payments else {}


def _checkout_is_paid(checkout: dict[str, Any]) -> bool:
    attributes = checkout.get("data", {}).get("attributes", {})
    payment = _checkout_payment(checkout)
    payment_attributes = payment.get("attributes", {})
    payment_intent = attributes.get("payment_intent") or {}
    intent_attributes = payment_intent.get("attributes", {})
    paid_statuses = {"paid", "succeeded"}

    return any(
        str(status or "").lower() in paid_statuses
        for status in (
            attributes.get("payment_status"),
            attributes.get("status"),
            payment_attributes.get("status"),
            intent_attributes.get("status"),
        )
    ) or bool(attributes.get("paid_at") or payment_attributes.get("paid_at"))


def _convert_reservations(db: Session, order: Order):
    for item in order.items or []:
        reservation = db.query(StockReservation).filter(
            StockReservation.order_item_id == item.id,
            StockReservation.status == "active",
        ).with_for_update().first()
        if not reservation:
            continue
        inventory = db.query(Inventory).filter(
            Inventory.product_id == reservation.product_id
        ).with_for_update().first()
        if not inventory or inventory.current_stock < reservation.quantity:
            raise HTTPException(status_code=409, detail="Reserved stock is no longer available.")
        inventory.current_stock -= reservation.quantity
        reservation.status = "converted"
        reservation.converted_at = datetime.now(timezone.utc)

def _increment_sold_count(db: Session, order: Order):
    """Safely increments the sold_count for all standard products in a paid order."""
    for item in order.items or []:
        if item.product_id:
            # with_for_update() locks the row briefly to prevent race conditions if multiple people buy at once
            product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            if product:
                current_count = getattr(product, "sold_count", 0) or 0
                product.sold_count = current_count + item.quantity

def _reconcile_paid_checkout(
    db: Session,
    checkout_session_id: str,
    checkout: dict[str, Any],
) -> None:
    attributes = checkout.get("data", {}).get("attributes", {})
    payment = _checkout_payment(checkout)
    payment_attributes = payment.get("attributes", {})
    payment_intent = attributes.get("payment_intent") or {}
    source = payment_attributes.get("source") or {}
    paid_at = _datetime_from_unix(attributes.get("paid_at") or payment_attributes.get("paid_at"))
    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.provider == "paymongo",
            Transaction.provider_checkout_session_id == checkout_session_id,
        )
        .all()
    )

    for transaction in transactions:
        transaction.status = PaymentStatusEnum.paid.value
        transaction.order.status = OrderStatusEnum.paid
        transaction.provider_payment_intent_id = (
            payment_intent.get("id") or payment_attributes.get("payment_intent_id")
        )
        transaction.provider_payment_id = payment.get("id")
        transaction.paid_at = paid_at or datetime.now(timezone.utc)
        transaction.raw_webhook_event = {
            "source": "checkout_session_reconciliation",
            "checkout_session": checkout,
        }
        _convert_reservations(db, transaction.order)
        _increment_sold_count(db, transaction.order)

        raw_method = str(source.get("type") or transaction.payment_method or "ewallet").lower()
        if raw_method in {"card", "qrph"}:
            transaction.payment_method = raw_method
        elif raw_method in {"gcash", "paymaya", "pay_maya", "ewallet", "wallet"}:
            transaction.payment_method = "ewallet"

    paid_product_pairs = set()
    for transaction in transactions:
        order = transaction.order
        if order.product_id:
            paid_product_pairs.add((order.user_id, order.product_id))
        for item in order.items or []:
            if item.product_id:
                paid_product_pairs.add((order.user_id, item.product_id))
    for user_id, product_id in paid_product_pairs:
        db.query(CartItem).filter(
            CartItem.user_id == user_id,
            CartItem.product_id == product_id,
        ).delete(synchronize_session=False)

    db.commit()


@router.get("/paymongo/status/{order_id}", response_model=dict)
async def get_paymongo_payment_status(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    orders = _get_owned_orders(db, [order_id], current_user, allow_paid=True)
    order = orders[0]
    _expire_pending_transaction(db, order)
    transaction = order.transaction

    if (
        _enum_value(transaction.status) != PaymentStatusEnum.paid.value
        and transaction.provider == "paymongo"
        and transaction.provider_checkout_session_id
    ):
        try:
            checkout = await retrieve_checkout_session(transaction.provider_checkout_session_id)
            if _checkout_is_paid(checkout):
                _reconcile_paid_checkout(
                    db,
                    transaction.provider_checkout_session_id,
                    checkout,
                )
                db.refresh(order)
                db.refresh(transaction)
        except PayMongoError:
            # Keep the database status available when PayMongo is temporarily unreachable.
            pass

    return {
        "order": serialize_order(order),
        "provider": transaction.provider,
        "checkout_session_id": transaction.provider_checkout_session_id,
        "checkout_url": transaction.checkout_url,
        "payment_status": transaction.status,
        "paid_at": transaction.paid_at.isoformat() if transaction.paid_at else None,
        "expires_at": transaction.expires_at.isoformat() if transaction.expires_at else None,
        "transaction_id": str(transaction.id),
    }

def _parse_signature_header(signature_header: str) -> dict[str, str]:
    parts = {}
    for part in signature_header.split(","):
        if "=" in part:
            key, value = part.split("=", 1)
            parts[key.strip()] = value.strip()
    return parts

def _verify_paymongo_signature(raw_body: bytes, signature_header: str | None) -> None:
    if not settings.PAYMONGO_WEBHOOK_SECRET:
        return

    if not signature_header:
        raise HTTPException(status_code=401, detail="Missing PayMongo signature.")

    parts = _parse_signature_header(signature_header)
    timestamp = parts.get("t")
    signature_key = "te" if settings.PAYMONGO_SECRET_KEY.startswith("sk_test_") else "li"
    expected_signature = parts.get(signature_key)

    if not timestamp or not expected_signature:
        raise HTTPException(status_code=401, detail="Invalid PayMongo signature header.")

    signed_payload = timestamp.encode("utf-8") + b"." + raw_body
    computed_signature = hmac.new(
        settings.PAYMONGO_WEBHOOK_SECRET.encode("utf-8"),
        signed_payload,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(computed_signature, expected_signature):
        raise HTTPException(status_code=401, detail="Invalid PayMongo signature.")

def _datetime_from_unix(value: Any) -> datetime | None:
    if value is None:
        return None
    try:
        return datetime.fromtimestamp(int(value), tz=timezone.utc)
    except (TypeError, ValueError):
        return None

@router.post("/paymongo/webhook", response_model=dict)
async def paymongo_webhook(
    request: Request,
    paymongo_signature: str | None = Header(None, alias="Paymongo-Signature"),
    db: Session = Depends(get_db),
):
    raw_body = await request.body()
    _verify_paymongo_signature(raw_body, paymongo_signature)

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    event_attributes = payload.get("data", {}).get("attributes", {})
    event_type = event_attributes.get("type")
    resource = event_attributes.get("data", {})
    resource_attributes = resource.get("attributes", {})
    checkout_session_id = resource.get("id")
    reference_number = resource_attributes.get("reference_number")

    # 🚀 ALLOW BOTH SUCCESS AND FAILED EVENTS
    if event_type not in ["checkout_session.payment.paid", "payment.failed"]:
        return {"status": "ignored", "event_type": event_type}

    payment_intent = resource_attributes.get("payment_intent") or {}
    payments = resource_attributes.get("payments") or []
    payment = payments[-1] if payments else {}
    payment_attributes = payment.get("attributes", {})
    source = payment_attributes.get("source") or {}

    query = db.query(Transaction).filter(Transaction.provider == "paymongo")
    if checkout_session_id and reference_number:
        query = query.filter(
            or_(
                Transaction.provider_checkout_session_id == checkout_session_id,
                Transaction.reference_number == reference_number,
            )
        )
    elif checkout_session_id:
        query = query.filter(Transaction.provider_checkout_session_id == checkout_session_id)
    elif reference_number:
        query = query.filter(Transaction.reference_number == reference_number)
    else:
        raise HTTPException(status_code=400, detail="Webhook payload has no checkout session or reference number.")

    transactions = query.all()
    if not transactions:
        return {"status": "not_found", "event_type": event_type}

    allowed_methods = {"cash", "ewallet", "card", "bank_transfer", "qrph"}

    method_map = {
        "gcash": "ewallet",
        "paymaya": "ewallet",
        "pay_maya": "ewallet",
        "card": "card",
        "debit_card": "card",
        "credit_card": "card",
        "bank_transfer": "bank_transfer",
        "bank-transfer": "bank_transfer",
        "banktransfer": "bank_transfer",
        "ewallet": "ewallet",
        "wallet": "ewallet",
        "qrph": "qrph",
        "qr_ph": "qrph",
        "qr": "qrph",
        "cash": "cash",
    }

    paid_at = _datetime_from_unix(resource_attributes.get("paid_at") or payment_attributes.get("paid_at"))

    try:
        for transaction in transactions:
            # 🚀 DYNAMICALLY SET PAID OR FAILED
            if event_type == "checkout_session.payment.paid":
                transaction.status = PaymentStatusEnum.paid.value
                transaction.order.status = OrderStatusEnum.paid
                _convert_reservations(db, transaction.order)
                _increment_sold_count(db, transaction.order)
            else:
                transaction.status = PaymentStatusEnum.failed.value
                transaction.order.status = OrderStatusEnum.payment_failed
                _release_reserved_stock(db, transaction.order)

            transaction.provider_checkout_session_id = checkout_session_id or transaction.provider_checkout_session_id
            transaction.provider_payment_intent_id = payment_intent.get("id") or payment_attributes.get("payment_intent_id")
            transaction.provider_payment_id = payment.get("id")

            raw_method = str(source.get("type") or transaction.payment_method or "ewallet").lower().strip()
            normalized = method_map.get(raw_method)

            if normalized is None:
                current = str(getattr(transaction, "payment_method", "") or "").lower().strip()
                normalized = current if current in allowed_methods else "ewallet"

            if normalized not in allowed_methods:
                normalized = "ewallet"

            transaction.payment_method = normalized
            transaction.paid_at = paid_at or datetime.now(timezone.utc)
            transaction.raw_webhook_event = payload

            if event_type == "checkout_session.payment.paid":
                product_ids = {
                    item.product_id
                    for item in transaction.order.items or []
                    if item.product_id
                }
                if transaction.order.product_id:
                    product_ids.add(transaction.order.product_id)
                if product_ids:
                    db.query(CartItem).filter(
                        CartItem.user_id == transaction.order.user_id,
                        CartItem.product_id.in_(product_ids),
                    ).delete(synchronize_session=False)

        db.commit()
    except Exception as e:
        db.rollback()
        import logging
        logging.getLogger(__name__).exception("PayMongo webhook database error: %s", e)
        raise HTTPException(status_code=500, detail="Database update failed.")

    return {
        "status": "success",
        "event_type": event_type,
        "updated_transactions": len(transactions),
    }
