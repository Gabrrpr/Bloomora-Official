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
@router.post("/submit", response_model=dict)
def submit_review(
    payload: ReviewSubmitSchema,  # 🚀 2. Catch the JSON here
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a review for a delivered order."""
    # Find the order
    order = db.query(Order).filter(Order.id == payload.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check ownership
    if str(order.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your order")
    
    # Check if order can be reviewed
    if not order.can_review:
        raise HTTPException(status_code=400, detail="You can only review delivered orders")
    
    if order.has_reviewed:
        raise HTTPException(status_code=400, detail="You have already reviewed this order")
    
    # Check if product exists in the new items array
    if not getattr(order, 'items', None) or len(order.items) == 0:
        raise HTTPException(status_code=400, detail="No products in this order to review")
    
    # 🚀 3. Apply the review to all items in the order
    for item in order.items:
        if item.product_id:
            review = Review(
                id=uuid.uuid4(),
                user_id=current_user.id,
                product_id=item.product_id,
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