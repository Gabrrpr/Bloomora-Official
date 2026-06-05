from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, object_session 
from sqlalchemy import or_, func, String
from typing import List, Optional
from decimal import Decimal
from sqlalchemy import text
from app.services.email_service import send_order_status_email
import uuid
import secrets

# 🚀 INJECTED SECURE DEPENDENCIES
from app.core.dependencies import get_db, get_current_user, require_staff
from app.models import User, RoleEnum, Order, OrderStatusEnum, Arrangement, Transaction, PaymentMethodEnum, PaymentStatusEnum, Product

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
        "can_review": getattr(o, 'can_review', False),
        "has_reviewed": getattr(o, 'has_reviewed', False),
        "created_at": o.created_at.isoformat() if getattr(o, 'created_at', None) else None,
        "updated_at": o.updated_at.isoformat() if getattr(o, 'updated_at', None) else None,
        "items": [] 
    }

# ── Public: My Orders ───────────────────────────────────────────────────────
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


# ── Admin: All Orders ───────────────────────────────────────────────────────
@router.get("/", response_model=List[dict])
def list_orders(
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by order number or customer name/email"),
    branch: Optional[str] = Query(None, description="Filter by branch"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff), # 🚀 SECURED
):
    query = db.query(Order)
    if status:
        try: query = query.filter(Order.status == OrderStatusEnum(status.lower()))
        except ValueError: raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    if branch:
        from app.models import BranchEnum
        try: query = query.join(User).filter(User.branch == BranchEnum(branch.lower()))
        except ValueError: raise HTTPException(status_code=400, detail=f"Invalid branch: {branch}")

    if search:
        search_term = f"%{search}%"
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

# ── Get Single Order ─────────────────────────────────────────────────────
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

    # 🚀 SECURED ENUM CHECK
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if order.user_id != current_user.id and role_val not in ["admin", "staff"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this order")

    return serialize_order(order)


@router.get("/{customer_id}/recent", response_model=List[dict])
def get_customer_recent_orders(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff) # 🚀 SECURED
):
    orders = db.query(Order).filter(Order.user_id == customer_id).order_by(Order.created_at.desc()).limit(5).all()
    return [serialize_order(o) for o in orders]


# ── Create Orders from Cart ─────────────────────────────────────────────────
@router.post("/", response_model=dict, status_code=201)
def create_orders(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart_items = payload.get("items", [])
    delivery_address = payload.get("delivery_address", "")
    delivery_notes = payload.get("delivery_notes", "")
    scheduled_at = payload.get("scheduled_at")
    payment_method = payload.get("payment_method", "qrph")
    special_note = payload.get("special_note", None)

    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty.")

    created_orders = []

    for item in cart_items:
        arrangement_id = None
        product_id = None

        item_id = item.get("id", "")
        group = str(item.get("group", "")).lower()
        qty = int(item.get("qty", 1))

        is_custom_request = "describe" in group or "mix" in group or "custom" in group or str(item_id).startswith("arr-")
        
        # 🚀 ZERO-DOLLAR EXPLOIT FIX: Force backend price calculation
        db_price = Decimal("0.00")

        if is_custom_request:
            try:
                # Attempt to find the pre-generated AI arrangement in the database
                arr_uuid = uuid.UUID(str(item_id))
                arrangement = db.query(Arrangement).filter(Arrangement.id == arr_uuid).first()
                if not arrangement:
                    raise HTTPException(status_code=404, detail="Custom arrangement session expired or invalid.")
                
                db_price = arrangement.estimated_price
                arrangement_id = arrangement.id
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid custom arrangement ID.")
        else:
            try:
                product_id = uuid.UUID(str(item_id))
                
                # We use with_for_update() to lock the row temporarily. 
                # This prevents two customers from buying the exact same last item at the exact same millisecond!
                product = db.query(Product).filter(Product.id == product_id).with_for_update().first()
                
                if not product or not product.is_available:
                    raise HTTPException(status_code=404, detail=f"Product unavailable: {item_id}")
                
                # 🚀 INVENTORY CHECK: Do we have enough?
                # (Change 'stock' to 'quantity' if your database column is named differently)
                current_stock = getattr(product, 'stock', 0) 
                if current_stock < qty:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Insufficient stock for {product.name}. Only {current_stock} left."
                    )
                
                # 🚀 INVENTORY DEDUCTION: Take it off the shelf!
                product.stock -= qty
                
                # Optional: If stock hits 0, automatically mark it as unavailable so it hides from the store
                if product.stock <= 0:
                    product.is_available = False
                
                # 🚀 The golden rule: Extract price from DB
                db_price = product.price
                
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid Product ID: {item_id}")

        order = Order(
            id=uuid.uuid4(),
            user_id=current_user.id,
            product_id=product_id,
            arrangement_id=arrangement_id,
            quantity=qty,
            total_amount=db_price * qty, # 🚀 Uses secure backend price
            status=OrderStatusEnum.pending,
            delivery_address=delivery_address,
            delivery_notes=delivery_notes,
            special_note=special_note,
            scheduled_at=scheduled_at,
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        try: pm = PaymentMethodEnum(payment_method)
        except ValueError: pm = PaymentMethodEnum.qrph

        transaction = Transaction(
            id=uuid.uuid4(),
            order_id=order.id,
            payment_method=pm,
            total_amount=order.total_amount,
            status=PaymentStatusEnum.pending,
            reference_number=f"REF-{secrets.token_hex(6).upper()}",
        )
        db.add(transaction)
        db.commit()

        created_orders.append(str(order.id))

    return {
        "status": "success",
        "message": f"{len(created_orders)} order(s) created.",
        "order_ids": created_orders,
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

# ── Confirm Payment for Order ───────────────────────────────────────────────────
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

# ── Admin/Staff: Update Order Status ───────────────────────────────────────────
@router.post("/{order_id}/action", response_model=dict)
def admin_order_action(
    order_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff), # 🚀 SECURED
):
    action_status = payload.get("status")
    if not action_status: raise HTTPException(status_code=400, detail="Missing 'status' in payload")

    status_key = str(action_status).lower().replace(" ", "_")
    try: new_status = OrderStatusEnum(status_key)
    except ValueError: raise HTTPException(status_code=400, detail=f"Invalid status: {action_status}")

    try: order_uuid = uuid.UUID(order_id)
    except ValueError: raise HTTPException(status_code=400, detail="Invalid order ID")

    order = db.query(Order).filter(Order.id == order_uuid).first()
    if not order: raise HTTPException(status_code=404, detail="Order not found")

    order.status = new_status
    db.commit()
    db.refresh(order)

    _notify_order(db, order, status_key)

    return {
        "status": "success",
        "message": "Order status updated",
        **serialize_order(order),
    }