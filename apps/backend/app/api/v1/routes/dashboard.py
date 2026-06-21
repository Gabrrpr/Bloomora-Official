from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text, extract, desc
from datetime import datetime, timezone, timedelta
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.order import Order
from app.models import RoleEnum, Transaction, PaymentStatusEnum, Product, OrderItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

# Philippine Timezone (UTC+8)
PH_TZ = timezone(timedelta(hours=8))

@router.get("/revenue")
def get_revenue(
    period: str = "week",
    branch: str = "all",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ph_created_at = func.timezone('Asia/Manila', Order.created_at)

    if period == "week":
        trunc = "day"
        date_filter = ph_created_at >= func.now() - text("interval '8 days'")
    elif period == "month":
        trunc = "month"
        date_filter = extract("year", ph_created_at) == datetime.now(PH_TZ).year
    elif period == "year":
        trunc = "year"
        date_filter = None
    else:
        trunc = "day"
        date_filter = ph_created_at >= func.now() - text("interval '8 days'")

    period_col = func.date_trunc(trunc, ph_created_at).label("period")

    q = db.query(
        func.sum(Order.total_amount).label("revenue"),
        Order.branch_name,
        period_col,
    ).join(
        Transaction, Order.id == Transaction.order_id
    ).filter(
        Order.status.in_(["delivered", "confirmed", "preparing", "out_for_delivery"]),
        Transaction.status == PaymentStatusEnum.paid
    )

    if date_filter is not None:
        q = q.filter(date_filter)

    clean_branch = branch.strip().lower()
    if clean_branch not in ["all", "all branches"]:
        q = q.filter(func.lower(Order.branch_name) == clean_branch)

    q = q.group_by(
        period_col,
        Order.branch_name,
    ).order_by(period_col)

    rows = q.all()

    return [
        {
            "revenue": float(row.revenue or 0),
            "branch": row.branch_name,
            "period": row.period.isoformat() if row.period else None,
        }
        for row in rows
    ]


@router.get("/summary")
def get_summary(
    branch: str = "all",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now_ph = datetime.now(PH_TZ)
    start_of_today_ph = now_ph.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_today_utc = start_of_today_ph.astimezone(timezone.utc)

    q_revenue = db.query(func.sum(Order.total_amount)).join(
        Transaction, Order.id == Transaction.order_id
    ).filter(
        Order.created_at >= start_of_today_utc,
        Order.status.in_(["delivered", "confirmed", "preparing", "out_for_delivery"]),
        Transaction.status == PaymentStatusEnum.paid,
    )

    # 🚀 THE FIX: Removed the requirement for pending orders to be 'paid'
    q_pending = db.query(func.count(Order.id)).filter(
        Order.status == "pending"
    )

    q_today_count = db.query(func.count(Order.id)).join(
        Transaction, Order.id == Transaction.order_id
    ).filter(
        Order.created_at >= start_of_today_utc,
        Transaction.status == PaymentStatusEnum.paid,
    )

    clean_branch = branch.strip().lower()
    if clean_branch not in ["all", "all branches"]:
        q_revenue = q_revenue.filter(func.lower(Order.branch_name) == clean_branch)
        q_pending = q_pending.filter(func.lower(Order.branch_name) == clean_branch)
        q_today_count = q_today_count.filter(func.lower(Order.branch_name) == clean_branch)

    return {
        "revenue_today": float(q_revenue.scalar() or 0),
        "pending_orders": q_pending.scalar() or 0,
        "orders_today": q_today_count.scalar() or 0,
    }


@router.get("/recent-orders")
def get_recent_orders(
    branch: str = "all",
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if getattr(current_user, "role", None) not in [RoleEnum.admin, RoleEnum.staff]:
        return []

    q = db.query(Order).join(
        Transaction, Order.id == Transaction.order_id
    ).filter(
        Transaction.status == PaymentStatusEnum.paid
    ).order_by(
        Order.created_at.desc()
    ).limit(limit)

    clean_branch = branch.strip().lower()
    if clean_branch not in ["all", "all branches"]:
        q = q.filter(func.lower(Order.branch_name) == clean_branch)

    orders = q.all()

    def _customer_name(o: Order):
        u = getattr(o, "user", None)
        if not u:
            return getattr(o, "customer_name", None) or "Unknown"
        first = getattr(u, "first_name", None) or ""
        last = getattr(u, "last_name", None) or ""
        name = f"{first} {last}".strip()
        return name or getattr(u, "email", None) or "Unknown"

    return [
        {
            "id": str(o.id),
            "order_number": f"ORD-{o.id.hex[:8].upper()}",
            "customer_name": _customer_name(o),
            "status": o.status.value if hasattr(o.status, "value") else o.status,
            "total_amount": float(o.total_amount or 0),
            "branch": o.branch_name,
        }
        for o in orders
    ]


@router.get("/trending")
def get_trending_products(
    branch: str = "all",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(
        Product.id,
        Product.name,
        func.sum(OrderItem.quantity).label("sold")
    ).join(
        OrderItem, OrderItem.product_id == Product.id
    ).join(
        Order, Order.id == OrderItem.order_id
    ).join(
        Transaction, Order.id == Transaction.order_id
    ).filter(
        Order.status.in_(["delivered", "confirmed", "preparing", "out_for_delivery"]),
        Transaction.status == PaymentStatusEnum.paid
    )

    clean_branch = branch.strip().lower()
    if clean_branch not in ["all", "all branches"]:
        q = q.filter(func.lower(Order.branch_name) == clean_branch)

    results = q.group_by(Product.id, Product.name).order_by(desc("sold")).limit(5).all()

    return [
        {
            "id": str(r.id),
            "name": r.name,
            "sold": int(r.sold or 0)
        }
        for r in results
    ]
