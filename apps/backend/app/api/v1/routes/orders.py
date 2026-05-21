from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, String
from typing import List, Optional
from decimal import Decimal
from sqlalchemy import text
from app.services.email_service import send_order_status_email
import uuid
import secrets

from app.core.dependencies import get_db, get_current_user
from app.models import User, RoleEnum, Order, OrderStatusEnum, Arrangement, Transaction, PaymentMethodEnum, PaymentStatusEnum

router = APIRouter(prefix="/orders", tags=["Orders"])


def serialize_order(o) -> dict:
    """Serialize an Order for API responses."""
    
    # 🚀 1. Calculate a dynamic display name based on the cart items
    display_name = "Empty Order"
    total_qty = 0
    
    if getattr(o, 'items', None) and len(o.items) > 0:
        # Get the name of the first item in the cart
        first_item_name = o.items[0].product.name if o.items[0].product else "Unknown Product"
        
        # If they bought multiple different items, summarize it
        if len(o.items) > 1:
            display_name = f"{first_item_name} + {len(o.items) - 1} more"
        else:
            display_name = first_item_name
            
        # Calculate total number of physical items bought
        total_qty = sum(item.quantity for item in o.items)
        
    elif getattr(o, 'arrangement', None):
        display_name = o.arrangement.name
        total_qty = getattr(o, 'quantity', 1)
    else:
        display_name = "Custom Arrangement"

    return {
        "id": str(o.id),
        "order_number": f"ORD-{o.id.hex[:8].upper()}",
        "user_id": str(o.user_id),
        "customer_name": f"{getattr(o.user, 'first_name', '') or ''} {getattr(o.user, 'last_name', '') or ''}".strip() or getattr(o.user, 'email', 'Unknown'),
        "customer_email": o.user.email,
        "customer_phone": o.user.phone_number,
        "branch": o.branch_name or (o.user.branch.value if o.user.branch and hasattr(o.user.branch, "value") else (o.user.branch or "—")),
        
        # 🚀 2. Use the dynamically calculated summaries
        "product_name": display_name,
        "quantity": total_qty,
        
        # 🚀 3. Removed the broken "product" dict since we use "items" now
        
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
        
        # 🚀 4. Your correct items array
        "items": [
            {
                "item_id": str(item.id),
                "product_id": str(item.product.id) if item.product else None,
                "product_name": item.product.name if item.product else "Unknown Product",
                "quantity": item.quantity,
                "price_at_purchase": item.price_at_purchase,
                "image_url": item.product.image_url if item.product and hasattr(item.product, 'image_url') else None
            }
            for item in o.items
        ] if getattr(o, 'items', None) else []
    }
    
def require_admin_or_staff(current_user: User):
    if current_user.role not in [RoleEnum.admin, RoleEnum.staff]:
        raise HTTPException(status_code=403, detail="Admin or staff access required.")


# ── Public: My Orders ───────────────────────────────────────────────────────
@router.get("/my", response_model=List[dict])
def get_my_orders(
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all orders for the currently authenticated user."""
    query = db.query(Order).filter(Order.user_id == current_user.id)

    if status:
        try:
            query = query.filter(Order.status == OrderStatusEnum(status.lower()))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    orders = query.order_by(Order.created_at.desc()).all()
    return [serialize_order(o) for o in orders]


# ── Admin: All Orders ───────────────────────────────────────────────────────
@router.get("/", response_model=List[dict])
def list_orders(
    status: Optional[str] = Query(None, description="Filter by status: pending, confirmed, preparing, out_for_delivery, delivered, cancelled"),
    search: Optional[str] = Query(None, description="Search by order number or customer name/email"),
    branch: Optional[str] = Query(None, description="Filter by branch"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all orders. Admin/Staff only."""
    require_admin_or_staff(current_user)

    query = db.query(Order)

    if status:
        try:
            query = query.filter(Order.status == OrderStatusEnum(status.lower()))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    if branch:
        from app.models import BranchEnum
        try:
            query = query.join(User).filter(User.branch == BranchEnum(branch.lower()))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid branch: {branch}")

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


# ── Admin/Staff: Get recent orders for a customer ───────────────────────────
# ── Get Single Order ─────────────────────────────────────────────────────
@router.get("/{order_id}", response_model=dict)
def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single order by ID. Only the order owner or admin can view."""
    try:
        order_uuid = uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order ID")

    order = db.query(Order).filter(Order.id == order_uuid).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check if user owns the order or is admin
    if order.user_id != current_user.id and current_user.role not in [RoleEnum.admin, RoleEnum.staff]:
        raise HTTPException(status_code=403, detail="Not authorized to view this order")

    return serialize_order(order)


@router.get("/{customer_id}/recent", response_model=List[dict])
def get_customer_recent_orders(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get last 5 recent orders for a customer (staff/admin only)."""
    require_admin_or_staff(current_user)

    orders = db.query(Order)\
        .filter(Order.user_id == customer_id)\
        .order_by(Order.created_at.desc())\
        .limit(5)\
        .all()

    return [serialize_order(o) for o in orders]


# ── Create Orders from Cart ─────────────────────────────────────────────────
@router.post("/", response_model=dict, status_code=201)
def create_orders(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create orders from cart items. Orders are created with 'pending' status and await payment."""
    cart_items = payload.get("items", [])
    delivery_address = payload.get("delivery_address", "")
    delivery_notes = payload.get("delivery_notes", "")
    scheduled_at = payload.get("scheduled_at")
    payment_method = payload.get("payment_method", "qrph")

    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty.")

    created_orders = []

    for item in cart_items:
        arrangement_id = None
        product_id = None

        item_id = item.get("id", "")
        group = item.get("group", "")
        name = item.get("name", "Custom Arrangement")
        desc = item.get("desc", "")
        price = Decimal(str(item.get("price", 0)))
        qty = int(item.get("qty", 1))
        img = item.get("img", "")

        # If it's a custom arrangement, create arrangement record
        if group in ("Describe your arrangement", "Mix and Match") or str(item_id).startswith("arr-"):
            arrangement = Arrangement(
                id=uuid.uuid4(),
                name=name,
                description=desc,
                generated_image_url=img,
                estimated_price=price,
            )
            db.add(arrangement)
            db.commit()
            db.refresh(arrangement)
            arrangement_id = arrangement.id
        else:
            # Try to parse as product UUID
            try:
                product_id = uuid.UUID(str(item_id))
            except ValueError:
                # Fallback: create arrangement
                arrangement = Arrangement(
                    id=uuid.uuid4(),
                    name=name,
                    description=desc,
                    generated_image_url=img,
                    estimated_price=price,
                )
                db.add(arrangement)
                db.commit()
                db.refresh(arrangement)
                arrangement_id = arrangement.id

        order = Order(
            id=uuid.uuid4(),
            user_id=current_user.id,
            product_id=product_id,
            arrangement_id=arrangement_id,
            quantity=qty,
            total_amount=price * qty,
            status=OrderStatusEnum.pending,
            delivery_address=delivery_address,
            delivery_notes=delivery_notes,
            scheduled_at=scheduled_at,
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        # Create a transaction record for this order
        try:
            pm = PaymentMethodEnum(payment_method)
        except ValueError:
            pm = PaymentMethodEnum.qrph

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
        "message": f"{len(created_orders)} order(s) created. Please confirm payment to proceed.",
        "order_ids": created_orders,
    }


# ── Confirm Payment for Order ───────────────────────────────────────────────────
@router.post("/{order_id}/pay", response_model=dict)
def confirm_payment(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    """Confirm payment for an order. Updates transaction status and order status."""
    try:
        order_uuid = uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order ID")

    order = db.query(Order).filter(Order.id == order_uuid).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Verify ownership
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Check if transaction exists
    if not order.transaction:
        raise HTTPException(status_code=400, detail="No transaction found for this order")

    # Check if already paid
    if order.transaction.status == PaymentStatusEnum.paid:
        raise HTTPException(status_code=400, detail="Payment already confirmed for this order")

    # Update transaction to paid
    order.transaction.status = PaymentStatusEnum.paid
    # Update order status to confirmed
    order.status = OrderStatusEnum.confirmed
    db.commit()
    db.refresh(order)
    db.refresh(order.transaction)

    return {
        "status": "success",
        "message": "Payment confirmed successfully",
        "order_id": str(order.id),
        "order_number": f"ORD-{order.id.hex[:8].upper()}",
        "payment_status": order.transaction.status.value,
        "order_status": order.status.value,
    }


@router.post("/{order_id}/action", response_model=dict)
def admin_order_action(
    order_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin/Staff action to update an order status."""
    require_admin_or_staff(current_user)

    action_status = payload.get("status")
    if not action_status:
        raise HTTPException(status_code=400, detail="Missing 'status' in payload")

    # Normalize to backend enum value (expects: pending|confirmed|preparing|out_for_delivery|delivered|cancelled)
    status_key = str(action_status).lower().replace(" ", "_")

    try:
        new_status = OrderStatusEnum(status_key)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {action_status}")

    try:
        order_uuid = uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order ID")

    order = db.query(Order).filter(Order.id == order_uuid).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Optional transition rules could be enforced here.
    order.status = new_status
    db.commit()
    db.refresh(order)

    return {
        "status": "success",
        "message": "Order status updated",
        **serialize_order(order),
    }

def _notify_order(db: Session, order: Order, status: str):
    """Create a notification row + send email if user has order_updates enabled."""

    status_messages = {
        "confirmed":        ("Order Confirmed 🌸",        "Your order {num} has been confirmed and is being processed."),
        "preparing":        ("We're Preparing Your Order 🌿", "Your order {num} is now being prepared by our florists."),
        "out_for_delivery": ("On Its Way! 🚚",             "Your order {num} is out for delivery. Expect it soon!"),
        "delivered":        ("Order Delivered 🎉",         "Your order {num} has been delivered. Enjoy your blooms!"),
        "cancelled":        ("Order Cancelled",            "Your order {num} has been cancelled. Contact us if this was a mistake."),
    }

    cfg = status_messages.get(status)
    if not cfg:
        return

    order_number = f"ORD-{order.id.hex[:8].upper()}"
    title   = cfg[0]
    message = cfg[1].format(num=order_number)

    # 1. Insert notification row
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

    # 2. Check preferences before sending email
    pref = db.execute(
        text("SELECT order_updates FROM user_notification_preferences WHERE user_id = :uid"),
        {"uid": str(order.user_id)}
    ).fetchone()

    # Default to True if no preference row yet
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
    try:
        order_uuid = uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order ID")

    order = db.query(Order).filter(Order.id == order_uuid).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if not order.transaction:
        raise HTTPException(status_code=400, detail="No transaction found for this order")

    if order.transaction.status == PaymentStatusEnum.paid:
        raise HTTPException(status_code=400, detail="Payment already confirmed for this order")

    order.transaction.status = PaymentStatusEnum.paid
    order.status = OrderStatusEnum.confirmed
    db.commit()
    db.refresh(order)
    db.refresh(order.transaction)

    # Fire notification + email
    _notify_order(db, order, "confirmed")

    return {
        "status": "success",
        "message": "Payment confirmed successfully",
        "order_id": str(order.id),
        "order_number": f"ORD-{order.id.hex[:8].upper()}",
        "payment_status": order.transaction.status.value,
        "order_status": order.status.value,
    }


# ── Admin/Staff: Update Order Status ───────────────────────────────────────────
@router.post("/{order_id}/action", response_model=dict)
def admin_order_action(
    order_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin_or_staff(current_user)

    action_status = payload.get("status")
    if not action_status:
        raise HTTPException(status_code=400, detail="Missing 'status' in payload")

    status_key = str(action_status).lower().replace(" ", "_")

    try:
        new_status = OrderStatusEnum(status_key)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {action_status}")

    try:
        order_uuid = uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order ID")

    order = db.query(Order).filter(Order.id == order_uuid).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = new_status
    db.commit()
    db.refresh(order)

    # Fire notification + email
    _notify_order(db, order, status_key)

    return {
        "status": "success",
        "message": "Order status updated",
        **serialize_order(order),
    }

