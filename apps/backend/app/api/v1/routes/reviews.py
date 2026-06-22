from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import os
import shutil

from app.core.dependencies import get_db, get_current_user
from app.models import User, RoleEnum, Product, Order, Review, OrderStatusEnum

router = APIRouter(prefix="/reviews", tags=["Reviews"])

def serialize_review(r: Review) -> dict:
    return {
        "id": str(r.id),
        "user_id": str(r.user_id),
        "customer_name": customer_name,
        "product_id": str(r.product_id),
        "star_rating": r.star_rating,
        "comment": r.comment,
        "image_url": getattr(r, "image_url", None), # Safely grab image if your DB has it
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
async def submit_review(
    # 🚀 THE FIX: Catch FormData instead of JSON!
    order_id: str = Form(...),
    star_rating: int = Form(...),
    comment: str = Form(""),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a review for a delivered order with an optional photo."""
    
    try:
        order_uuid = uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Order ID format")

    order = db.query(Order).filter(Order.id == order_uuid).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # 🛡️ SECURITY SAFEGUARD
    if str(order.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to review this order")
    
    # 🚀 RELAXED CHECK: Allow both 'delivered' and 'completed' to pass
    current_status = str(order.status.value if hasattr(order.status, 'value') else order.status).lower()
    if current_status not in ["delivered", "completed"]:
        if not getattr(order, "can_review", False):
            raise HTTPException(status_code=400, detail="You can only review delivered orders")
    
    if order.has_reviewed:
        raise HTTPException(status_code=400, detail="You have already reviewed this order")

    # 🚀 THE FIX: Process and save the uploaded image!
    image_url = None
    if image and image.filename:
        upload_dir = "static/reviews"
        os.makedirs(upload_dir, exist_ok=True)
        file_ext = image.filename.split(".")[-1]
        new_filename = f"rev_{uuid.uuid4().hex[:8]}.{file_ext}"
        file_path = os.path.join(upload_dir, new_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        # Creates the URL React will use to display the photo
        image_url = f"http://127.0.0.1:8000/static/reviews/{new_filename}"
    
    # Collect all product IDs to review
    product_ids_to_review = []
    if getattr(order, 'product_id', None):
        product_ids_to_review.append(order.product_id)
        
    if getattr(order, 'items', None) and len(order.items) > 0:
        for item in order.items:
            if item.product_id:
                product_ids_to_review.append(item.product_id)

    product_ids_to_review = list(set(product_ids_to_review))

    if not product_ids_to_review:
        raise HTTPException(status_code=400, detail="No reviewable catalog products found in this order")
    
    # Generate the database review records
    for prod_id in product_ids_to_review:
        review = Review(
            id=uuid.uuid4(),
            user_id=current_user.id,
            product_id=prod_id,
            star_rating=star_rating,
            comment=comment,
        )
        
        # Attach image if your database model supports it
        if hasattr(review, "image_url"):
            review.image_url = image_url

        db.add(review)
    
    # Mark order as reviewed
    order.has_reviewed = True
    db.commit()
    
    return {
        "status": "success", 
        "message": "Review submitted successfully!",
        "image_url": image_url
    }

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