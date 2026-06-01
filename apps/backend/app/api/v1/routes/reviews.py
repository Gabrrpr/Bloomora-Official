from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.core.dependencies import get_db, get_current_user
from app.models import User, RoleEnum, Product, Order, Review, OrderStatusEnum

router = APIRouter()

# 🚀 1. Define exactly what JSON React will send us
class ReviewSubmitSchema(BaseModel):
    order_id: str
    star_rating: int
    comment: Optional[str] = None

def serialize_review(r: Review) -> dict:
    return {
        "id": str(r.id),
        "user_id": str(r.user_id),
        "product_id": str(r.product_id),
        "star_rating": r.star_rating,
        "comment": r.comment,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }

# ── Public: Get reviews for a product ─────────────────────────────────────────────
@router.get("/product/{product_id}", response_model=List[dict])
def get_product_reviews(product_id: str, db: Session = Depends(get_db)):
    """Get all reviews for a specific product."""
    reviews = db.query(Review).filter(Review.product_id == product_id).order_by(Review.created_at.desc()).all()
    return [serialize_review(r) for r in reviews]

# ── Public: Get average rating for a product ─────────────────────────────────────────
@router.get("/product/{product_id}/rating")
def get_product_rating(product_id: str, db: Session = Depends(get_db)):
    """Get average rating and count for a product."""
    reviews = db.query(Review).filter(Review.product_id == product_id).all()
    if not reviews:
        return {"average_rating": 0, "review_count": 0}
    
    total = sum(r.star_rating for r in reviews)
    return {
        "average_rating": round(total / len(reviews), 1),
        "review_count": len(reviews),
    }

# ── Customer: Submit a review ───────────────────────────────────────────────────────
# ── Customer: Submit a review ───────────────────────────────────────────────────────
@router.post("/submit", response_model=dict)
def submit_review(
    payload: ReviewSubmitSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a review for a delivered order."""
    
    # 🚀 FIX 1: Safely string-cast to UUID to prevent database driver panic
    try:
        order_uuid = uuid.UUID(payload.order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Order ID format")

    order = db.query(Order).filter(Order.id == order_uuid).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # 🛡️ SECURITY SAFEGUARD: Safe against IDOR
    if str(order.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to review this order")
    
    if not order.can_review:
        raise HTTPException(status_code=400, detail="You can only review delivered orders")
    
    if order.has_reviewed:
        raise HTTPException(status_code=400, detail="You have already reviewed this order")
    
    # 🚀 FIX 2: Collect all product IDs from BOTH single-item columns and multi-item arrays
    product_ids_to_review = []
    
    if getattr(order, 'product_id', None):
        product_ids_to_review.append(order.product_id)
        
    if getattr(order, 'items', None) and len(order.items) > 0:
        for item in order.items:
            if item.product_id:
                product_ids_to_review.append(item.product_id)

    # Dedup IDs just in case
    product_ids_to_review = list(set(product_ids_to_review))

    if not product_ids_to_review:
        raise HTTPException(status_code=400, detail="No reviewable catalog products found in this order")
    
    # 🚀 3. Generate the database review records safely
    for prod_id in product_ids_to_review:
        review = Review(
            id=uuid.uuid4(),
            user_id=current_user.id,
            product_id=prod_id,
            star_rating=payload.star_rating,
            comment=payload.comment,
        )
        db.add(review)
    
    # Mark order as reviewed
    order.has_reviewed = True
    db.commit()
    
    return {"status": "success", "message": "Review submitted successfully!"}

# ── Customer: Get my reviews ─────────────────────────────────────────────────────
@router.get("/my-reviews", response_model=List[dict])
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all reviews submitted by the current user."""
    reviews = db.query(Review).filter(Review.user_id == current_user.id).order_by(Review.created_at.desc()).all()
    return [serialize_review(r) for r in reviews]

# ── Admin: Get all reviews ─────────────────────────────────────────────────
@router.get("/admin/all", response_model=List[dict])
def get_all_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all reviews. Admin only."""
    if current_user.role not in [RoleEnum.admin, RoleEnum.staff]:
        raise HTTPException(status_code=403, detail="Admin or staff access required")
    
    reviews = db.query(Review).order_by(Review.created_at.desc()).all()
    return [serialize_review(r) for r in reviews]

# ── Admin: Delete a review ─────────────────────────────────────────────────
@router.delete("/admin/{review_id}", response_model=dict)
def delete_review(
    review_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a review. Admin only."""
    if current_user.role not in [RoleEnum.admin, RoleEnum.staff]:
        raise HTTPException(status_code=403, detail="Admin or staff access required")
    
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    db.delete(review)
    db.commit()
    
    return {"status": "success", "message": "Review deleted"}