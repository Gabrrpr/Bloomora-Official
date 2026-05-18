from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, text, extract
from datetime import datetime


from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.order import Order
from app.models import RoleEnum

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])





@router.get("/revenue")
def get_revenue(
    period: str = "week",
    branch: str = "all",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if period == "week":
        trunc = "day"
        date_filter = Order.created_at >= func.now() - text("interval '8 days'")
    elif period == "month":
        trunc = "month"
        date_filter = extract("year", Order.created_at) == datetime.now().year
    elif period == "year":
        trunc = "year"
        date_filter = None
    else:
        trunc = "day"
        date_filter = Order.created_at >= func.now() - text("interval '8 days'")

    # Use date_trunc as the period column — no raw created_at in SELECT
    period_col = func.date_trunc(trunc, Order.created_at).label("period")

    q = db.query(
        func.sum(Order.total_amount).label("revenue"),
        Order.branch_name,
        period_col,
    ).filter(
        Order.status.in_(["delivered", "confirmed", "preparing", "out_for_delivery"])
    )

    if date_filter is not None:
        q = q.filter(date_filter)

    if branch != "all":
        q = q.filter(Order.branch_name == branch)

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
    today = datetime.now().date()

    q_revenue = db.query(func.sum(Order.total_amount)).filter(
        func.date(Order.created_at) == today,
        Order.status.in_(["delivered", "confirmed", "preparing", "out_for_delivery"]),
    )
    q_pending = db.query(func.count(Order.id)).filter(
        Order.status == "pending"
    )
    q_today_count = db.query(func.count(Order.id)).filter(
        func.date(Order.created_at) == today
    )

    if branch != "all":
        q_revenue = q_revenue.filter(Order.branch_name == branch)
        q_pending = q_pending.filter(Order.branch_name == branch)
        q_today_count = q_today_count.filter(Order.branch_name == branch)

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
    """Return the most recent orders for dashboard cards."""
    if getattr(current_user, "role", None) not in [RoleEnum.admin, RoleEnum.staff]:
        # Keep consistent with other admin/staff endpoints: deny staff if not allowed.
        # (Dashboard is intended for admin/staff only.)
        return []

    q = db.query(Order).order_by(Order.created_at.desc()).limit(limit)

    if branch and branch != "all":
        q = q.filter(Order.branch_name == branch)

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

