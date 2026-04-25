from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, get_current_user
from app.models import User, RoleEnum, Order
# from app.schemas.order_schemas import RecentOrderOut  # No schema needed for dict response

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.get("/{customer_id}/recent", response_model=List[dict])
def get_customer_recent_orders(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get last 5 recent orders for a customer (staff/admin only)."""
    
    if current_user.role not in [RoleEnum.admin, RoleEnum.staff]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    orders = db.query(Order)\
        .filter(Order.customer_id == customer_id)\
        .order_by(Order.created_at.desc())\
        .limit(5)\
        .all()
    
    # Simple response with product info
    return [{
        "id": str(o.id),
        "order_number": f"ORD-{o.id.hex[:8].upper()}",
        "status": o.status.value,
        "product": o.product.name if o.product else "Custom Arrangement",
        "amount": float(o.total_amount),
        "created_at": o.created_at.isoformat()
    } for o in orders]

