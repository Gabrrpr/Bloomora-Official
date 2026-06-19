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

from app.api.v1.routes.orders import serialize_order
from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import Order, OrderStatusEnum, PaymentStatusEnum, Transaction, User
from app.services.paymongo_service import PayMongoError, create_checkout_session, to_paymongo_amount

router = APIRouter(prefix="/payments", tags=["Payments"])

class PayMongoCheckoutRequest(BaseModel):
    order_ids: list[str] = Field(..., min_length=1)
    payment_method_types: list[str] | None = None

def _order_number(order: Order) -> str:
    return f"ORD-{order.id.hex[:8].upper()}"

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

def _get_owned_orders(db: Session, order_ids: list[str], user: User) -> list[Order]:
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
        if str(order.transaction.status) == PaymentStatusEnum.paid.value:
            raise HTTPException(status_code=400, detail=f"Order {_order_number(order)} is already paid.")

    return orders

@router.post("/paymongo/checkout", response_model=dict)
async def create_paymongo_checkout(
    payload: PayMongoCheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    orders = _get_owned_orders(db, payload.order_ids, current_user)
    reference_number = f"PMO-{secrets.token_hex(6).upper()}"

    line_items = []
    for order in orders:
        # 🚀 DEBUG PRINT: This will appear in your Python Terminal/Logs
        print(f"DEBUG: Processing order {order.id} | total_amount: {order.total_amount}")
        
        amount_val = order.total_amount or 0
        line_items.append({
            "name": _line_item_name(order),
            "amount": to_paymongo_amount(Decimal(amount_val)),
            "currency": "PHP",
            "quantity": 1,
        })

    if any(item["amount"] <= 0 for item in line_items):
        raise HTTPException(status_code=400, detail="PayMongo checkout amount must be greater than zero.")

    try:
        checkout = await create_checkout_session(
            line_items=line_items,
            reference_number=reference_number,
            metadata={
                "order_ids": ",".join(str(order.id) for order in orders),
                "user_id": str(current_user.id),
            },
            payment_method_types=payload.payment_method_types,
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

@router.get("/paymongo/status/{order_id}", response_model=dict)
def get_paymongo_payment_status(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    orders = _get_owned_orders(db, [order_id], current_user)
    order = orders[0]

    return {
        "order": serialize_order(order),
        "provider": order.transaction.provider,
        "checkout_session_id": order.transaction.provider_checkout_session_id,
        "checkout_url": order.transaction.checkout_url,
        "payment_status": order.transaction.status,
        "paid_at": order.transaction.paid_at.isoformat() if order.transaction.paid_at else None,
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

    if event_type != "checkout_session.payment.paid":
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

    paid_at = _datetime_from_unix(resource_attributes.get("paid_at") or payment_attributes.get("paid_at"))
    for transaction in transactions:
        transaction.status = PaymentStatusEnum.paid.value
        transaction.provider_checkout_session_id = checkout_session_id or transaction.provider_checkout_session_id
        transaction.provider_payment_intent_id = payment_intent.get("id") or payment_attributes.get("payment_intent_id")
        transaction.provider_payment_id = payment.get("id")
        transaction.payment_method = source.get("type") or transaction.payment_method
        transaction.paid_at = paid_at or datetime.now(timezone.utc)
        transaction.raw_webhook_event = payload
        transaction.order.status = OrderStatusEnum.confirmed

    db.commit()

    return {
        "status": "success",
        "event_type": event_type,
        "updated_transactions": len(transactions),
    }