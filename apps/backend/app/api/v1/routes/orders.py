from fastapi import APIRouter, Depends, HTTPException, Body, Query, Request
from sqlalchemy.orm import Session, object_session, joinedload
from sqlalchemy import or_, func, String, text
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from decimal import Decimal
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from app.services.email_service import send_order_status_email
import uuid, os
import secrets


# 🚀 INJECTED SECURE DEPENDENCIES
from app.core.dependencies import get_db, get_current_user, require_staff
from app.models import User, RoleEnum, Order, OrderItem, StockReservation, OrderStatusEnum, Arrangement, Transaction, PaymentMethodEnum, PaymentStatusEnum, Product, Inventory
from app.utils.lalamove import book_lalamove_delivery

# We use your dedicated PayMongo service instead of raw requests!
from app.services.paymongo_service import PayMongoError, create_checkout_session, to_paymongo_amount
from app.api.v1.routes.commerce import get_delivery_settings, validate_voucher

router = APIRouter(prefix="/orders", tags=["Orders"])

# ZoneInfo can crash on some environments if tzdata isn't installed.
# This must NOT break importing the router.
try:
    MANILA_TZ = ZoneInfo("Asia/Manila")
except Exception:
    MANILA_TZ = timezone.utc



def _created_order_response(order: Order) -> dict:
    return {
        "status": "success",
        "message": "Order created.",
        "order_ids": [str(order.id)],
        "checkout_url": order.transaction.checkout_url if order.transaction else None,
        "order": serialize_order(order),
    }

def _parse_datetime(value):
    if not value or isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid delivery date.")

def serialize_order(o) -> dict:
    _expire_pending_transaction(object_session(o), o)
    db = object_session(o)
    img_url = ""
    is_custom = False
    display_name = "Unknown Item"
    total_qty = getattr(o, 'quantity', 1)

    serialized_items = []
    if getattr(o, "items", None):
        for item in o.items:
            product = item.product
            arrangement = item.arrangement
            unit_price = Decimal(str(item.price_at_purchase or 0))
            serialized_items.append({
                "id": str(item.id),
                "product_id": str(item.product_id) if item.product_id else None,
                "arrangement_id": str(item.arrangement_id) if item.arrangement_id else None,
                "product_name": product.name if product else (arrangement.name or "Custom Arrangement"),
                "image_url": product.image_url if product else arrangement.generated_image_url,
                "is_custom": arrangement is not None,
                "quantity": item.quantity,
                "unit_price": float(unit_price),
                "line_total": float(unit_price * item.quantity),
                "card_message": getattr(item, "card_message", None),
                "card_enabled": bool(getattr(item, "card_enabled", False)),
            })

    if serialized_items:
        first_item = serialized_items[0]
        display_name = first_item["product_name"]
        img_url = first_item["image_url"] or ""
        is_custom = first_item["is_custom"]
        total_qty = sum(item["quantity"] for item in serialized_items)
        if len(serialized_items) > 1:
            display_name = f"{display_name} + {len(serialized_items) - 1} more"
    elif db and getattr(o, 'product_id', None):
        product = db.query(Product).filter(Product.id == o.product_id).first()
        if product:
            display_name = product.name
            img_url = getattr(product, 'image_url', "") or getattr(product, 'image', "")
            is_custom = False

    elif db and getattr(o, 'arrangement_id', None):
        arrangement = db.query(Arrangement).filter(Arrangement.id == o.arrangement_id).first()
        if arrangement:
            display_name = getattr(arrangement, 'name', 'Custom Arrangement')
            img_url = getattr(arrangement, 'generated_image_url', "") or getattr(arrangement, 'image_url', "") or getattr(arrangement, 'image', "")
            is_custom = True
            
    # 🚀 SMART REFERENCE EXTRACTION
    payment_ref = None
    payment_provider = None
    checkout_url = None
    paid_at = None
    if hasattr(o, 'transaction') and o.transaction:
        payment_ref = getattr(o.transaction, 'provider_checkout_session_id', None) or getattr(o.transaction, 'reference_number', None)
        payment_provider = getattr(o.transaction, 'provider', None)
        checkout_url = getattr(o.transaction, 'checkout_url', None)
        paid_at = getattr(o.transaction, 'paid_at', None)

    return {
        "id": str(o.id),
        "order_number": f"ORD-{o.id.hex[:8].upper()}",
        "user_id": str(o.user_id),
        "customer_name": f"{getattr(o.user, 'first_name', '') or ''} {getattr(o.user, 'last_name', '') or ''}".strip() or getattr(o.user, 'email', 'Unknown'),
        "customer_email": o.user.email,
        "customer_phone": o.user.phone_number,
        "branch": o.branch_name or (o.user.branch.value if o.user.branch and hasattr(o.user.branch, "value") else (o.user.branch or "—")),
        "special_note": getattr(o,'special_note', None),
        "product_name": display_name,
        "image_url": img_url,
        "is_custom": is_custom,
        "quantity": total_qty,
        "total_amount": float(o.total_amount),
        "status": o.status.value if hasattr(o.status, "value") else o.status,
        "delivery_address": o.delivery_address,
        "delivery_notes": o.delivery_notes,
        "recipient_first_name": o.recipient_first_name,
        "recipient_last_name": o.recipient_last_name,
        "recipient_phone": o.recipient_phone,
        "recipient_type": o.recipient_type,
        "fulfillment_method": o.fulfillment_method or "delivery",
        "delivery_provider": o.delivery_provider,
        "time_slot": o.time_slot,
        "subtotal_amount": float(o.subtotal_amount or o.total_amount),
        "delivery_fee": float(o.delivery_fee or 0),
        "voucher_code": getattr(o, "voucher_code", None),
        "discount_amount": float(getattr(o, "discount_amount", 0) or 0),
        "scheduled_at": o.scheduled_at.isoformat() if getattr(o, 'scheduled_at', None) else None,
        "payment_status": (
            o.transaction.status.value
            if o.transaction and hasattr(o.transaction.status, "value")
            else (str(o.transaction.status) if o.transaction else "pending")
        ),
        "payment_provider": payment_provider,
        "checkout_url": checkout_url,
        "paid_at": paid_at.isoformat() if paid_at else None,
        "transaction_id": str(o.transaction.id) if o.transaction else None,
        "expires_at": o.transaction.expires_at.isoformat() if o.transaction and o.transaction.expires_at else None,
        
        # 🚀 UPDATED: Now it grabs PayMongo IDs too!
        "payment_reference": payment_ref,
        
        "can_review": getattr(o, 'can_review', False),
        "has_reviewed": getattr(o, 'has_reviewed', False),
        "created_at": o.created_at.isoformat() if getattr(o, 'created_at', None) else None,
        "updated_at": o.updated_at.isoformat() if getattr(o, 'updated_at', None) else None,
        "items": serialized_items,
    }


def _derive_delivery_branch(address: str) -> str:
    normalized = (address or "").lower()
    if any(value in normalized for value in ("pampanga", "angeles", "mabalacat", "san fernando")):
        return "Pampanga"
    if any(value in normalized for value in ("metro manila", "national capital region", " ncr", "manila")):
        return "Manila"
    raise HTTPException(
        status_code=400,
        detail="Delivery is currently available only within Metro Manila and Pampanga.",
    )


def _validate_delivery_date(value, fulfillment_method: str, cutoff: str = "14:00") -> datetime:
    scheduled = _parse_datetime(value)
    if not scheduled:
        raise HTTPException(status_code=400, detail="Select a delivery date.")
    if scheduled.tzinfo is None:
        scheduled = scheduled.replace(tzinfo=MANILA_TZ)
    local_date = scheduled.astimezone(MANILA_TZ).date()
    now = datetime.now(MANILA_TZ)
    today = now.date()
    if local_date < today or local_date > today + timedelta(days=30):
        raise HTTPException(status_code=400, detail="Delivery date must be within the next 30 days.")
    cutoff_hour, cutoff_minute = (int(part) for part in cutoff.split(":", 1))
    if fulfillment_method == "delivery" and local_date == today and (now.hour, now.minute) >= (cutoff_hour, cutoff_minute):
        display_hour = cutoff_hour % 12 or 12
        suffix = "AM" if cutoff_hour < 12 else "PM"
        raise HTTPException(status_code=400, detail=f"Same-day delivery is unavailable after {display_hour}:{cutoff_minute:02d} {suffix}.")
    return scheduled


def _product_supports_branch(product: Product, branch: str) -> bool:
    branches = getattr(product, "branches", None) or []
    if not branches:
        return True
    normalized = {str(value).strip().lower() for value in branches}
    return branch.lower() in normalized or "all" in normalized

@router.get("/my", response_model=List[dict])
def get_my_orders(
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Order).filter(Order.user_id == current_user.id)
    if status:
        try: query = query.filter(Order.status == OrderStatusEnum(status.lower()))
        except ValueError: raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    orders = query.order_by(Order.created_at.desc()).all()
    return [serialize_order(o) for o in orders]

@router.get("/", response_model=List[dict])
def list_orders(
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by order number or customer name/email"),
    branch: Optional[str] = Query(None, description="Filter by branch"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    query = db.query(Order).options(joinedload(Order.transaction))
    
    if status:
        try: query = query.filter(Order.status == OrderStatusEnum(status.lower()))
        except ValueError: raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    # 🚀 THE SILVER BULLET: Filter by the Order's delivery branch, NOT the User's profile!
    if branch:
        query = query.filter(func.lower(Order.branch_name) == branch.lower())

    if search:
        search_term = f"%{search}%"
        # We still join User here so we can search by customer name/email
        query = query.join(User).filter(
            or_(
                func.cast(Order.id, String).ilike(search_term),
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term),
                User.email.ilike(search_term),
            )
        )

    orders = query.order_by(Order.created_at.desc()).offset(offset).limit(limit).all()
    return [serialize_order(o) for o in orders]

@router.get("/{order_id}", response_model=dict)
def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try: order_uuid = uuid.UUID(order_id)
    except ValueError: raise HTTPException(status_code=400, detail="Invalid order ID")

    order = db.query(Order).filter(Order.id == order_uuid).first()
    if not order: raise HTTPException(status_code=404, detail="Order not found")

    role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if order.user_id != current_user.id and role_val not in ["admin", "staff"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this order")

    return serialize_order(order)

@router.get("/{customer_id}/recent", response_model=List[dict])
def get_customer_recent_orders(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    orders = db.query(Order).filter(Order.user_id == customer_id).order_by(Order.created_at.desc()).limit(5).all()
    return [serialize_order(o) for o in orders]

@router.post("/", response_model=dict, status_code=201)
async def create_order(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart_items = payload.get("items", [])
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty.")

    attempt_id = str(payload.get("attemptId") or payload.get("checkout_attempt_id") or "").strip() or None
    if attempt_id:
        existing_order = db.query(Order).filter(
            Order.user_id == current_user.id,
            Order.checkout_attempt_id == attempt_id,
        ).first()
        if existing_order:
            return _created_order_response(existing_order)

    delivery_notes = payload.get("delivery_notes", "")
    fulfillment_method = payload.get("fulfillmentMethod") or payload.get("fulfillment_method") or "delivery"
    delivery_address = payload.get("delivery_address", "")
    raw_branch = (
        _derive_delivery_branch(delivery_address)
        if fulfillment_method == "delivery"
        else str(payload.get("branch_name") or payload.get("branch") or "Manila").strip().title()
    )
    if raw_branch not in {"Manila", "Pampanga"}:
        raise HTTPException(status_code=400, detail="Select either the Manila or Pampanga branch.")
    delivery_settings = get_delivery_settings(db)
    scheduled_at = _validate_delivery_date(
        payload.get("scheduled_at") or payload.get("delivery_date"),
        fulfillment_method,
        delivery_settings["same_day_cutoff"],
    )
    payment_method = payload.get("payment_method", "ewallet").lower()
    checkout_url = None

    try:
        prepared_items = []
        total_amount = Decimal("0.00")
        for incoming in cart_items:
            item_id = incoming.get("id", "")
            quantity = int(incoming.get("qty", 1))
            if quantity < 1:
                raise HTTPException(status_code=400, detail="Item quantity must be at least 1.")
            try:
                item_uuid = uuid.UUID(str(item_id).replace("arr-", ""))
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid ID format: {item_id}")

            arrangement = db.query(Arrangement).filter(
                Arrangement.id == item_uuid
            ).with_for_update().first()
            if arrangement:
                if getattr(arrangement, "items", None):
                    for component in arrangement.items:
                        required = component.quantity * quantity
                        inventory = db.query(Inventory).filter(
                            Inventory.product_id == component.product_id
                        ).with_for_update().first()
                        if not inventory or inventory.current_stock < required:
                            raise HTTPException(status_code=400, detail="Insufficient raw materials for custom order.")
                        inventory.current_stock -= required
                unit_price = Decimal(str(arrangement.estimated_price or 0))
                prepared_items.append(("arrangement", arrangement, quantity, unit_price))
            else:
                product = db.query(Product).filter(Product.id == item_uuid).first()
                inventory = db.query(Inventory).filter(
                    Inventory.product_id == item_uuid
                ).with_for_update().first()
                if not product or not product.is_available or not inventory:
                    raise HTTPException(status_code=404, detail=f"Product unavailable: {item_id}")
                if not _product_supports_branch(product, raw_branch):
                    raise HTTPException(
                        status_code=400,
                        detail=f"{product.name} is not available in the {raw_branch} branch.",
                    )
                active_reserved = db.query(func.coalesce(func.sum(StockReservation.quantity), 0)).filter(
                    StockReservation.product_id == item_uuid,
                    StockReservation.status == "active",
                    StockReservation.reserved_until > datetime.now(timezone.utc),
                ).scalar()
                available = inventory.current_stock - int(active_reserved or 0)
                if available < quantity:
                    raise HTTPException(status_code=400, detail=f"Insufficient stock. Only {available} available.")
                unit_price = Decimal(str(product.price or 0))
                prepared_items.append(("product", product, quantity, unit_price))

            if unit_price <= 0:
                raise HTTPException(status_code=400, detail=f"Invalid price for item: {item_id}")
            total_amount += unit_price * quantity

        delivery_fee = (
            Decimal(str(delivery_settings["delivery_fee"]))
            if fulfillment_method == "delivery"
            else Decimal("0.00")
        )
        minimum_order = Decimal(str(delivery_settings["minimum_order"]))
        if total_amount < minimum_order:
            raise HTTPException(
                status_code=400,
                detail=f"Minimum order is ₱{float(minimum_order):,.2f}.",
            )
        voucher_code = str(payload.get("voucher_code") or payload.get("voucherCode") or "").strip()
        discount_amount = Decimal("0.00")
        normalized_voucher = None
        if voucher_code:
            promo, discount_amount = validate_voucher(db, voucher_code, total_amount)
            normalized_voucher = promo.code

        order = Order(
            id=uuid.uuid4(),
            user_id=current_user.id,
            product_id=None,
            arrangement_id=None,
            quantity=sum(item[2] for item in prepared_items),
            total_amount=total_amount,
            status=OrderStatusEnum.pending_payment,
            delivery_address=delivery_address,
            delivery_notes=delivery_notes,
            special_note=payload.get("special_note"),
            scheduled_at=scheduled_at,
            branch_name=raw_branch,
            checkout_attempt_id=attempt_id,
            recipient_first_name=(payload.get("recipient") or {}).get("firstName") or payload.get("recipient_first_name"),
            recipient_last_name=(payload.get("recipient") or {}).get("lastName") or payload.get("recipient_last_name"),
            recipient_phone=(payload.get("recipient") or {}).get("phoneNumber") or payload.get("recipient_phone_number"),
            recipient_type=payload.get("recipientType") or payload.get("recipient_type"),
            is_anonymous=bool(payload.get("isAnonymous") or payload.get("is_anonymous")),
            fulfillment_method=fulfillment_method,
            delivery_provider=payload.get("deliveryProvider") or payload.get("delivery_provider"),
            time_slot=payload.get("timeSlot") or payload.get("time_slot") or "anytime",
            subtotal_amount=total_amount,
            delivery_fee=delivery_fee,
            voucher_code=normalized_voucher,
            discount_amount=discount_amount,
        )
        order.total_amount = max(Decimal("0.00"), order.subtotal_amount + order.delivery_fee - order.discount_amount)
        db.add(order)
        db.flush()

        reserved_until = datetime.now(timezone.utc) + timedelta(hours=1)
        incoming_by_id = {str(item.get("id")): item for item in cart_items}
        for item_type, entity, quantity, unit_price in prepared_items:
            incoming = incoming_by_id.get(str(entity.id), {})
            card_message = str(incoming.get("card_message") or incoming.get("cardMessage") or "").strip() or None
            order_item = OrderItem(
                order_id=order.id,
                product_id=entity.id if item_type == "product" else None,
                arrangement_id=entity.id if item_type == "arrangement" else None,
                quantity=quantity,
                price_at_purchase=unit_price,
                card_message=card_message,
                card_enabled=bool(card_message),
            )
            db.add(order_item)
            db.commit()
            db.flush()
            if item_type == "product":
                db.add(StockReservation(
                    order_item_id=order_item.id,
                    product_id=entity.id,
                    quantity=quantity,
                    status="active",
                    reserved_until=reserved_until,
                ))

        try:
            method_enum = PaymentMethodEnum(payment_method)
        except ValueError:
            method_enum = PaymentMethodEnum.ewallet
        is_online = payment_method in {"gcash", "paymaya", "card", "qrph", "paymongo", "ewallet"}
        transaction = Transaction(
            id=uuid.uuid4(),
            order_id=order.id,
            payment_method=method_enum.value,
            total_amount=order.total_amount,
            status=PaymentStatusEnum.pending.value,
            expires_at=reserved_until,
            reference_number=payload.get("payment_reference") or None,
            provider="paymongo" if is_online else "manual",
        )
        db.add(transaction)
        db.flush()

        db.commit()

        if payload.get("delivery_method") == "lalamove":
            try:
                print("Dispatching Lalamove rider...")
                lalamove_res = book_lalamove_delivery(
                    customer_name=f"{current_user.first_name} {current_user.last_name}",

                    customer_phone=current_user.phone_number or "09000000000",
                    dropoff_address=payload.get("delivery_address", ""),
                    dropoff_lat=str(payload.get("delivery_lat", "14.5995")),
                    dropoff_lng=str(payload.get("delivery_lng", "120.9842")),
                )

                # Save the Lalamove IDs back to the order
                order.delivery_provider = "lalamove"
                order.lalamove_order_id = lalamove_res["lalamove_order_id"]
                order.lalamove_share_link = lalamove_res["share_link"]
                order.status = OrderStatusEnum.preparing
                db.commit()
                print(f"Lalamove Order Created: {order.lalamove_order_id}")

            except Exception as e:
                print(f"❌ Lalamove Booking Failed: {str(e)}")
                # Even if Lalamove fails, the order is already placed.
                # You might want to email the staff to book manually.

        return _created_order_response(order)

    except HTTPException:
        db.rollback()
        raise
    except PayMongoError as error:
        db.rollback()
        raise HTTPException(status_code=502, detail=str(error))
    except IntegrityError:
        db.rollback()
        if attempt_id:
            existing_order = db.query(Order).filter(
                Order.user_id == current_user.id,
                Order.checkout_attempt_id == attempt_id,
            ).first()
            if existing_order:
                return _created_order_response(existing_order)
        raise
    except Exception:
        db.rollback()
        raise


def _release_reserved_stock(db: Session, order: Order):
    transaction = order.transaction
    if not transaction or transaction.stock_released_at:
        return
    for item in order.items or []:
        reservation = db.query(StockReservation).filter(
            StockReservation.order_item_id == item.id,
            StockReservation.status == "active",
        ).first()
        if reservation:
            reservation.status = "released"
            reservation.released_at = datetime.now(timezone.utc)
    transaction.stock_released_at = datetime.now(timezone.utc)


def _expire_pending_transaction(db: Session, order: Order):
    transaction = order.transaction
    if not db or not transaction or transaction.status != PaymentStatusEnum.pending:
        return
    if transaction.expires_at and datetime.now(timezone.utc) >= transaction.expires_at:
        transaction.status = PaymentStatusEnum.expired
        order.status = OrderStatusEnum.payment_failed
        _release_reserved_stock(db, order)
        db.commit()


async def create_orders(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart_items = payload.get("items", [])
    delivery_notes = payload.get("delivery_notes", "")
    scheduled_at = payload.get("scheduled_at")
    payment_method = payload.get("payment_method", "qrph").lower()
    special_note = payload.get("special_note", None)
    payment_reference = payload.get("payment_reference", "").strip()
    
    # 🚀 NEW: Walk-in Customer Capture & Fulfillment Method
    fulfillment_method = str(payload.get("fulfillment_method") or payload.get("fulfillmentMethod") or "delivery").lower()
    walk_in_customer_name = payload.get("customer_name", "").strip()
    walk_in_customer_phone = payload.get("customer_phone", "").strip()
    delivery_address = payload.get("delivery_address", "") if fulfillment_method == "delivery" else "PICKUP"
    
    # 🚀 THE TROJAN HORSE EXTRACTION
    raw_branch = payload.get("branch_name") or payload.get("branch")
    if not raw_branch:
        if "[BRANCH:Pampanga]" in delivery_notes:
            raw_branch = "Pampanga"
        elif "[BRANCH:Manila]" in delivery_notes:
            raw_branch = "Manila"
        else:
            raw_branch = "Manila"

    final_branch_name = raw_branch.strip().title()

    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty.")
    
    if payment_method == "qrph" and not payment_reference:
        raise HTTPException(status_code=400, detail="Transaction Reference Number (TRN) is required to verify your payment.")

    created_orders = []
    total_checkout_amount = Decimal("0.00")

    # 🚀 NEW: Dynamic Delivery Fee
    delivery_settings = get_delivery_settings(db)
    delivery_fee = (
        Decimal(str(delivery_settings.get("delivery_fee", 0)))
        if fulfillment_method == "delivery"
        else Decimal("0.00") # Force 0 for pickup/walk-in
    )

    for item in cart_items:
        arrangement_id = None
        product_id = None
        item_id = item.get("id", "")
        qty = int(item.get("qty", 1))

        try:
            clean_id = str(item_id).replace("arr-", "")
            item_uuid = uuid.UUID(clean_id)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid ID format: {item_id}")

        db_price = Decimal("0.00")
        arrangement = db.query(Arrangement).filter(Arrangement.id == item_uuid).with_for_update().first()

        if arrangement:
            if hasattr(arrangement, 'items') and arrangement.items:
                for component in arrangement.items:
                    inv = db.query(Inventory).filter(Inventory.product_id == component.product_id).with_for_update().first()
                    if not inv or inv.current_stock < (component.quantity * qty):
                        raise HTTPException(status_code=400, detail="Insufficient raw materials for custom order.")
                    inv.current_stock -= (component.quantity * qty)
                    if inv.current_stock <= 0:
                        prod = db.query(Product).filter(Product.id == component.product_id).first()
                        if prod: prod.is_available = False

            raw_price = getattr(arrangement, 'estimated_price', 0) or 0
            db_price = Decimal(str(raw_price))
            arrangement_id = arrangement.id
            
        else:
            product = db.query(Product).filter(Product.id == item_uuid).first()
            inventory = db.query(Inventory).filter(Inventory.product_id == item_uuid).with_for_update().first()
            
            if not product or not product.is_available or not inventory:
                raise HTTPException(status_code=404, detail=f"Product unavailable: {item_id}")
            if inventory.current_stock < qty:
                raise HTTPException(status_code=400, detail=f"Insufficient stock. Only {inventory.current_stock} left.")
            
            inventory.current_stock -= qty
            if inventory.current_stock <= 0:
                product.is_available = False
            
            raw_price = getattr(product, 'price', 0) or 0
            db_price = Decimal(str(raw_price))
            product_id = product.id

        if db_price <= 0:
            db_price = Decimal("500.00")

        item_total = db_price * qty
        total_checkout_amount += item_total

        # 🚀 SAVING WALK-IN DETAILS TO THE ORDER
        # For walk-in POS, we overwrite the recipient fields with the captured customer info.
        order = Order(
            id=uuid.uuid4(),
            user_id=current_user.id,
            product_id=product_id,
            arrangement_id=arrangement_id,
            quantity=qty,
            total_amount=item_total, # We will update this with delivery fee later if applicable
            subtotal_amount=item_total,
            status=OrderStatusEnum.pending,
            delivery_address=delivery_address,
            delivery_notes=delivery_notes,
            special_note=special_note,
            scheduled_at=scheduled_at,
            branch_name=final_branch_name, 
            fulfillment_method=fulfillment_method,
            delivery_fee=delivery_fee,
            # If walk_in_customer_name exists, force it into recipient_first_name
            recipient_first_name=walk_in_customer_name if walk_in_customer_name else ((payload.get("recipient") or {}).get("firstName") or payload.get("recipient_first_name")),
            recipient_last_name=(payload.get("recipient") or {}).get("lastName") or payload.get("recipient_last_name"),
            recipient_phone=walk_in_customer_phone if walk_in_customer_phone else ((payload.get("recipient") or {}).get("phoneNumber") or payload.get("recipient_phone_number")),
        )
        
        # Calculate final amount for this specific order record (Total + Fee)
        order.total_amount = max(Decimal("0.00"), order.subtotal_amount + order.delivery_fee - order.discount_amount)

        db.add(order)
        db.commit()
        db.refresh(order)

        try: pm = PaymentMethodEnum(payment_method)
        except ValueError: pm = PaymentMethodEnum.qrph

        is_online_payment = payment_method in ["gcash", "paymaya", "card", "qrph", "paymongo"]

        transaction = Transaction(
            id=uuid.uuid4(),
            order_id=order.id,
            payment_method=pm.value,
            total_amount=order.total_amount,
            status='pending',
            reference_number=payment_reference,
            provider='paymongo' if is_online_payment else 'manual',
        )
        db.add(transaction)
        db.commit()
        created_orders.append(str(order.id))

    # Add the delivery fee to the global PayMongo checkout total ONLY ONCE
    final_paymongo_amount = total_checkout_amount + delivery_fee
    checkout_url = None
    
    if payment_method in ["gcash", "paymaya", "card", "qrph", "paymongo"]:
        try:
            checkout = await create_checkout_session(
                line_items=[{
                    "name": f"Bloomora POS Order ({len(created_orders)} items)",
                    "amount": to_paymongo_amount(final_paymongo_amount), # 🚀 Uses the total + dynamic delivery fee
                    "currency": "PHP",
                    "quantity": 1
                }],
                reference_number=f"PMO-{secrets.token_hex(6).upper()}",
                metadata={
                    "order_ids": ",".join(created_orders),
                    "user_id": str(current_user.id)
                },
                payment_method_types=["gcash", "paymaya", "card", "qrph"]
            )
            
            checkout_data = checkout.get("data", {})
            checkout_id = checkout_data.get("id")
            checkout_url = checkout_data.get("attributes", {}).get("checkout_url")

            db.query(Transaction).filter(
                Transaction.order_id.in_(created_orders)
            ).update(
                {
                    "provider_checkout_session_id": checkout_id,
                    "checkout_url": checkout_url
                }, 
                synchronize_session=False
            )
            db.commit()

        except PayMongoError as error:
            print("❌ PayMongo Generation Error:", str(error))

    return {
        "status": "success",
        "message": f"{len(created_orders)} order(s) created.",
        "order_ids": created_orders,
        "checkout_url": checkout_url 
    }

def _notify_order(db: Session, order: Order, status: str):
    status_messages = {
        "confirmed":        ("Order Confirmed 🌸",        "Your order {num} has been confirmed and is being processed."),
        "preparing":        ("We're Preparing Your Order 🌿", "Your order {num} is now being prepared by our florists."),
        "out_for_delivery": ("On Its Way! 🚚",             "Your order {num} is out for delivery. Expect it soon!"),
        "delivered":        ("Order Delivered 🎉",         "Your order {num} has been delivered. Enjoy your blooms!"),
        "cancelled":        ("Order Cancelled",            "Your order {num} has been cancelled. Contact us if this was a mistake."),
    }

    cfg = status_messages.get(status)
    if not cfg: return

    order_number = f"ORD-{order.id.hex[:8].upper()}"
    title   = cfg[0]
    message = cfg[1].format(num=order_number)

    db.execute(
        text("""
            INSERT INTO notifications (user_id, type, title, message, order_id)
            VALUES (:uid, 'order', :title, :message, :oid)
        """),
        {
            "uid":     str(order.user_id),
            "title":   title,
            "message": message,
            "oid":     str(order.id),
        }
    )
    db.commit()

    pref = db.execute(
        text("SELECT order_updates FROM user_notification_preferences WHERE user_id = :uid"),
        {"uid": str(order.user_id)}
    ).fetchone()

    if pref is None or pref.order_updates:
        send_order_status_email(
            to_email=order.user.email,
            first_name=order.user.first_name or "there",
            order_number=order_number,
            status=status,
            message=message,
        )

@router.post("/{order_id}/pay", response_model=dict)
def confirm_payment(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try: order_uuid = uuid.UUID(order_id)
    except ValueError: raise HTTPException(status_code=400, detail="Invalid order ID")

    order = db.query(Order).filter(Order.id == order_uuid).first()
    if not order: raise HTTPException(status_code=404, detail="Order not found")

    if order.user_id != current_user.id: raise HTTPException(status_code=403, detail="Not authorized")
    if not order.transaction: raise HTTPException(status_code=400, detail="No transaction found for this order")
    if order.transaction.status == PaymentStatusEnum.paid: raise HTTPException(status_code=400, detail="Payment already confirmed")

    order.transaction.status = PaymentStatusEnum.paid
    order.status = OrderStatusEnum.confirmed
    db.commit()
    db.refresh(order)
    db.refresh(order.transaction)

    _notify_order(db, order, "confirmed")

    return {
        "status": "success",
        "message": "Payment confirmed successfully",
        "order_id": str(order.id),
        "order_number": f"ORD-{order.id.hex[:8].upper()}",
        "payment_status": order.transaction.status.value if hasattr(order.transaction.status, "value") else order.transaction.status,
        "order_status": order.status.value if hasattr(order.status, "value") else order.status,
    }

@router.get("/transactions", response_model=List[dict])
def list_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    transactions = db.query(Transaction, Order, User).join(Order).join(User, Order.user_id == User.id).all()
    
    return [
        {
            "id": str(t.Transaction.id),
            "order_number": f"ORD-{t.Order.id.hex[:8].upper()}",
            "customer_name": f"{t.User.first_name} {t.User.last_name}",
            "type": "Sale", 
            "method": t.Transaction.payment_method.value if hasattr(t.Transaction.payment_method, 'value') else t.Transaction.payment_method,
            "status": t.Transaction.status.value if hasattr(t.Transaction.status, 'value') else t.Transaction.status,
            
            # 🚀 UPDATED: Prioritizes PayMongo ID, falls back to manual reference
            "trn": getattr(t.Transaction, 'provider_checkout_session_id', None) or t.Transaction.reference_number, 
            
            "created_at": t.Transaction.created_at.isoformat()
        }
        for t in transactions
    ]
    
@router.get("/admin/settings/lalamove")
def get_lalamove_setting(db: Session = Depends(get_db)):
    query = text("SELECT setting_value FROM store_settings WHERE setting_key = 'lalamove_enabled'")
    result = db.execute(query).fetchone()
    # Default to False if not set
    if result and result[0] == "true":
        return {"enabled": True}
    return {"enabled": False}

@router.post("/admin/settings/lalamove")
def save_lalamove_setting(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    enabled = str(payload.get("enabled", False)).lower()
    query = text("""
        INSERT INTO store_settings (setting_key, setting_value, updated_at)
        VALUES ('lalamove_enabled', :val, now())
        ON CONFLICT (setting_key) DO UPDATE
        SET setting_value = EXCLUDED.setting_value, updated_at = now()
    """)
    db.execute(query, {"val": enabled})
    db.commit()
    return {"status": "success", "enabled": enabled == "true"}

# In app/api/v1/routes/orders.py
@router.patch("/{order_id}/force-status")
def force_order_status(
    order_id: str,
    payload: dict = Body(...), # Receive a simple dict
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    status = payload.get("status")
    order = db.query(Order).filter(Order.id == uuid.UUID(order_id)).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if status == "paid":
        order.status = OrderStatusEnum.paid
        if order.transaction:
            order.transaction.status = PaymentStatusEnum.paid.value
        _convert_reservations(db, order) 
        _increment_sold_count(db, order)
    elif status == "delivered":
        order.status = OrderStatusEnum.delivered
        
    db.commit()
    return {"status": "success", "new_status": order.status}
