from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.core.dependencies import get_db, get_current_user
from app.models import User, RoleEnum, Product, Order, Review, OrderStatusEnum

router = APIRouter()


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
    order_id: str = Form(...),
    star_rating: int = Form(..., ge=1, le=5),
    comment: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a review for a delivered order."""
    # Find the order
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check ownership
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your order")
    
    # Check if order can be reviewed
    if not order.can_review:
        raise HTTPException(status_code=400, detail="You can only review delivered orders")
    
    if order.has_reviewed:
        raise HTTPException(status_code=400, detail="You have already reviewed this order")
    
    # Check if product exists
    if not order.product_id:
        raise HTTPException(status_code=400, detail="No product in this order")
    
    # Create the review
    review = Review(
        id=uuid.uuid4(),
        user_id=current_user.id,
        product_id=order.product_id,
        star_rating=star_rating,
        comment=comment,
    )
    db.add(review)
    
    # Mark order as reviewed
    order.has_reviewed = True
    db.commit()
    
    return {"status": "success", "review": serialize_review(review)}


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
