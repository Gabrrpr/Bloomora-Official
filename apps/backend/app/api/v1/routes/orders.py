from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session, object_session, joinedload
from sqlalchemy import or_, func, String, text
from typing import List, Optional
from decimal import Decimal
from app.services.email_service import send_order_status_email
import uuid, os
import secrets

# 🚀 INJECTED SECURE DEPENDENCIES
from app.core.dependencies import get_db, get_current_user, require_staff
from app.models import User, RoleEnum, Order, OrderStatusEnum, Arrangement, Transaction, PaymentMethodEnum, PaymentStatusEnum, Product, Inventory

# We use your dedicated PayMongo service instead of raw requests!
from app.services.paymongo_service import PayMongoError, create_checkout_session, to_paymongo_amount

router = APIRouter(prefix="/orders", tags=["Orders"])

def serialize_order(o) -> dict:
    db = object_session(o)
    img_url = ""
    is_custom = False
    display_name = "Unknown Item"
    total_qty = getattr(o, 'quantity', 1)

    if db and getattr(o, 'product_id', None):
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
            
    elif getattr(o, 'items', None) and len(o.items) > 0:
        first_item = o.items[0]
        if first_item.product:
            first_item_name = first_item.product.name
            img_url = getattr(first_item.product, 'image_url', "") or getattr(first_item.product, 'image', "")
        else:
            first_item_name = "Unknown Product"
            
        if len(o.items) > 1:
            display_name = f"{first_item_name} + {len(o.items) - 1} more"
        else:
            display_name = first_item_name
            
        total_qty = sum(item.quantity for item in o.items)
        is_custom = False

    # 🚀 SMART REFERENCE EXTRACTION
    payment_ref = None
    if hasattr(o, 'transaction') and o.transaction:
        payment_ref = getattr(o.transaction, 'provider_checkout_session_id', None) or getattr(o.transaction, 'reference_number', None)

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
        "scheduled_at": o.scheduled_at.isoformat() if getattr(o, 'scheduled_at', None) else None,
        "payment_status": o.transaction.status.value if hasattr(o, 'transaction') and o.transaction and hasattr(o.transaction.status, "value") else "pending",
        
        # 🚀 UPDATED: Now it grabs PayMongo IDs too!
        "payment_reference": payment_ref,
        
        "can_review": getattr(o, 'can_review', False),
        "has_reviewed": getattr(o, 'has_reviewed', False),
        "created_at": o.created_at.isoformat() if getattr(o, 'created_at', None) else None,
        "updated_at": o.updated_at.isoformat() if getattr(o, 'updated_at', None) else None,
        "items": [] 
    }

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
async def create_orders(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart_items = payload.get("items", [])
    delivery_address = payload.get("delivery_address", "")
    delivery_notes = payload.get("delivery_notes", "")
    scheduled_at = payload.get("scheduled_at")
    payment_method = payload.get("payment_method", "qrph").lower()
    special_note = payload.get("special_note", None)
    payment_reference = payload.get("payment_reference", "").strip()

    # 🚀 THE TROJAN HORSE EXTRACTION
    # 1. Try to get it normally
    raw_branch = payload.get("branch_name") or payload.get("branch")
    
    # 2. If api.js stripped it out, catch it from the delivery notes!
    if not raw_branch:
        if "[BRANCH:Pampanga]" in delivery_notes:
            raw_branch = "Pampanga"
        elif "[BRANCH:Manila]" in delivery_notes:
            raw_branch = "Manila"
        else:
            raw_branch = "Manila"

    # Ensures it saves cleanly as 'Pampanga' or 'Manila'
    final_branch_name = raw_branch.strip().title()

    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty.")
    
    if payment_method == "qrph" and not payment_reference:
        raise HTTPException(status_code=400, detail="Transaction Reference Number (TRN) is required to verify your payment.")

    created_orders = []
    total_checkout_amount = Decimal("0.00")

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

        # 🚀 SAVING THE BRANCH CORRECTLY (NO CRASHES!)
        order = Order(
            id=uuid.uuid4(),
            user_id=current_user.id,
            product_id=product_id,
            arrangement_id=arrangement_id,
            quantity=qty,
            total_amount=item_total,
            status=OrderStatusEnum.pending,
            delivery_address=delivery_address,
            delivery_notes=delivery_notes,
            special_note=special_note,
            scheduled_at=scheduled_at,
            branch_name=final_branch_name, 
        )
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

    checkout_url = None
    
    if payment_method in ["gcash", "paymaya", "card", "qrph", "paymongo"]:
        try:
            checkout = await create_checkout_session(
                line_items=[{
                    "name": f"Bloomora Order ({len(created_orders)} items)",
                    "amount": to_paymongo_amount(total_checkout_amount),
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