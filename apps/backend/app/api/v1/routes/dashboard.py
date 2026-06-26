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

# 🚀 THE FIX: The VIP List of statuses that actually count as "Revenue"
REVENUE_STATUSES = ["delivered", "confirmed", "preparing", "out_for_delivery", "completed", "paid"]
DEMAND_STATUSES = [
    "paid",
    "confirmed",
    "preparing",
    "processing",
    "ready_for_pickup",
    "out_for_delivery",
    "delivered",
    "completed",
]

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
        # 🚀 THE FIX: Applied the expanded status list here!
        Order.status.in_(REVENUE_STATUSES),
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
        # 🚀 THE FIX: Applied the expanded status list here!
        Order.status.in_(REVENUE_STATUSES),
        Transaction.status == PaymentStatusEnum.paid,
    )

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
    # Never let this dashboard card crash the whole page.
    try:
        if getattr(current_user, "role", None) not in [RoleEnum.admin, RoleEnum.staff]:
            return []

        clean_branch = (branch or "all").strip().lower()
        capped_limit = max(1, min(int(limit or 5), 20))
        params = {"limit": capped_limit}
        branch_filter = ""
        if clean_branch not in ["all", "all branches"]:
            branch_filter = "AND LOWER(COALESCE(o.branch_name, '')) = :branch"
            params["branch"] = clean_branch

        rows = db.execute(
            text(f"""
                SELECT
                    o.id,
                    CAST(o.status AS TEXT) AS status,
                    o.total_amount,
                    o.branch_name,
                    NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), '') AS customer_name,
                    u.email AS customer_email
                FROM orders o
                LEFT JOIN users u ON u.id = o.user_id
                WHERE 1 = 1
                {branch_filter}
                ORDER BY o.created_at DESC
                LIMIT :limit
            """),
            params,
        ).all()

        result = []
        for row in rows:
            data = dict(row._mapping)
            order_id = str(data.get("id") or "")

            try:
                total_amount = float(data.get("total_amount") or 0)
            except Exception:
                total_amount = 0.0

            result.append({
                "id": order_id,
                "order_number": f"ORD-{order_id.replace('-', '')[:8].upper()}" if order_id else "ORD-UNKNOWN",
                "customer_name": data.get("customer_name") or data.get("customer_email") or "Unknown",
                "status": data.get("status") or "pending",
                "total_amount": total_amount,
                "branch": data.get("branch_name") or "—",
            })

        return result
    except Exception:
        return []



@router.get("/trending")
def get_trending_products(
    branch: str = "all",
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    window_days = max(1, min(days, 365))
    since = datetime.now(timezone.utc) - timedelta(days=window_days)

    q = db.query(
        Product.id,
        Product.name,
        func.sum(OrderItem.quantity).label("sold"),
        (func.sum(OrderItem.quantity) / window_days).label("avg_daily_demand"),
    ).join(
        OrderItem, OrderItem.product_id == Product.id
    ).join(
        Order, Order.id == OrderItem.order_id
    ).join(
        Transaction, Transaction.order_id == Order.id
    ).filter(
        Order.created_at >= since,
        Order.status.in_(DEMAND_STATUSES),
        Transaction.status == PaymentStatusEnum.paid,
    )

    clean_branch = branch.strip().lower()
    if clean_branch not in ["all", "all branches"]:
        q = q.filter(func.lower(Order.branch_name) == clean_branch)

    results = q.group_by(Product.id, Product.name).order_by(desc("sold")).limit(5).all()
    
    return [
        {
            "id": str(r.id),
            "name": r.name,
            "sold": int(r.sold or 0),
            "period_days": window_days,
            "avg_daily_demand": round(float(r.avg_daily_demand or 0), 2),
            "forecast_next_7_days": int(round(float(r.avg_daily_demand or 0) * 7)),
        }
        for r in results
    ]
