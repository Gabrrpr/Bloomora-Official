import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from supabase import create_client

from app.core.config import settings
from app.core.dependencies import get_current_user, get_db, require_staff
from app.models import Arrangement, Order, OrderItem, OrderStatusEnum, Product, Review, User


router = APIRouter(prefix="/reviews", tags=["Reviews"])


def serialize_review(review: Review) -> dict:
    user = getattr(review, "user", None)
    product = getattr(review, "product", None)
    arrangement = getattr(review, "arrangement", None)
    customer_name = (
        f"{getattr(user, 'first_name', '') or ''} {getattr(user, 'last_name', '') or ''}".strip()
        or "Customer"
    )
    return {
        "id": str(review.id),
        "user_id": str(review.user_id),
        "customer_name": customer_name,
        "user_name": customer_name,
        "product_id": str(review.product_id) if review.product_id else None,
        "product_name": getattr(product, "name", None),
        "product_image_url": getattr(product, "image_url", None),
        "arrangement_id": str(review.arrangement_id) if review.arrangement_id else None,
        "arrangement_name": getattr(arrangement, "name", None) or "Custom Arrangement",
        "arrangement_image_url": getattr(arrangement, "generated_image_url", None),
        "order_id": str(review.order_id),
        "star_rating": review.star_rating,
        "comment": review.comment,
        "image_url": review.image_url,
        "profile_picture_url": getattr(user, "profile_picture_url", None),
        "created_at": review.created_at.isoformat() if review.created_at else None,
    }


def _order_product_ids(order: Order) -> list[uuid.UUID]:
    ids = [item.product_id for item in order.items if item.product_id]
    if order.product_id:
        ids.append(order.product_id)
    return list(dict.fromkeys(ids))


def _order_arrangement_ids(order: Order) -> list[uuid.UUID]:
    ids = [item.arrangement_id for item in order.items if item.arrangement_id]
    if order.arrangement_id:
        ids.append(order.arrangement_id)
    return list(dict.fromkeys(ids))


def _get_customer_order(db: Session, order_id: str, user_id: uuid.UUID) -> Order:
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id, Order.user_id == user_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    if order.status not in {OrderStatusEnum.delivered, OrderStatusEnum.completed}:
        raise HTTPException(status_code=400, detail="You can review products after the order is completed.")
    return order


async def _upload_review_image(image: UploadFile | None) -> str | None:
    if not image:
        return None
    contents = await image.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be smaller than 5MB.")
    if not (image.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Review attachment must be an image.")
    extension = (image.filename or "review.jpg").rsplit(".", 1)[-1].lower()
    path = f"reviews/{uuid.uuid4().hex}.{extension}"
    key = settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_KEY
    client = create_client(settings.SUPABASE_URL, key)
    client.storage.from_("products").upload(
        path=path,
        file=contents,
        file_options={"content-type": image.content_type, "upsert": "false"},
    )
    return client.storage.from_("products").get_public_url(path)


@router.get("/product/{product_id}")
def get_product_reviews(product_id: str, db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .options(joinedload(Review.user), joinedload(Review.product))
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [serialize_review(review) for review in reviews]


@router.get("/custom-arrangements")
def get_custom_arrangement_reviews(db: Session = Depends(get_db)):
    """Return only reviews attached to delivered/completed custom orders."""
    reviews = (
        db.query(Review)
        .join(Order, Review.order_id == Order.id)
        .options(joinedload(Review.user), joinedload(Review.arrangement))
        .filter(
            Review.arrangement_id.isnot(None),
            Order.status.in_({OrderStatusEnum.delivered, OrderStatusEnum.completed}),
        )
        .order_by(Review.created_at.desc())
        .limit(24)
        .all()
    )
    return [serialize_review(review) for review in reviews]


@router.get("/product/{product_id}/rating")
def get_product_rating(product_id: str, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.product_id == product_id).all()
    if not reviews:
        return {"average_rating": 0, "review_count": 0}
    return {
        "average_rating": round(sum(review.star_rating for review in reviews) / len(reviews), 1),
        "review_count": len(reviews),
    }


@router.get("/order/{order_id}/eligibility")
def review_eligibility(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = _get_customer_order(db, order_id, current_user.id)
    product_ids = _order_product_ids(order)
    arrangement_ids = _order_arrangement_ids(order)
    existing_ids = {
        row[0]
        for row in db.query(Review.product_id)
        .filter(Review.user_id == current_user.id, Review.product_id.in_(product_ids))
        .all()
    }
    existing_arrangement_ids = {
        row[0]
        for row in db.query(Review.arrangement_id)
        .filter(Review.user_id == current_user.id, Review.arrangement_id.in_(arrangement_ids))
        .all()
    } if arrangement_ids else set()
    products = db.query(Product).filter(Product.id.in_(product_ids)).all() if product_ids else []
    arrangements = db.query(Arrangement).filter(Arrangement.id.in_(arrangement_ids)).all() if arrangement_ids else []
    return {
        "order_id": str(order.id),
        "products": [
            {
                "id": str(product.id),
                "name": product.name,
                "image_url": product.image_url,
                "reviewed": product.id in existing_ids,
            }
            for product in products
        ],
        "arrangements": [
            {
                "id": str(arrangement.id),
                "name": arrangement.name or "Custom Arrangement",
                "image_url": arrangement.generated_image_url,
                "reviewed": arrangement.id in existing_arrangement_ids,
                "review_type": "arrangement",
            }
            for arrangement in arrangements
        ],
    }


@router.post("/submit", status_code=201)
async def submit_review(
    order_id: str = Form(...),
    product_id: str | None = Form(None),
    arrangement_id: str | None = Form(None),
    star_rating: int = Form(...),
    comment: str = Form(""),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not 1 <= star_rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5.")
    order = _get_customer_order(db, order_id, current_user.id)
    if bool(product_id) == bool(arrangement_id):
        raise HTTPException(status_code=400, detail="Choose exactly one product or arrangement to review.")
    try:
        product_uuid = uuid.UUID(product_id) if product_id else None
        arrangement_uuid = uuid.UUID(arrangement_id) if arrangement_id else None
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid review target ID.")
    product_ids = _order_product_ids(order)
    arrangement_ids = _order_arrangement_ids(order)
    if product_uuid and product_uuid not in product_ids:
        raise HTTPException(status_code=403, detail="This product is not part of the completed order.")
    if arrangement_uuid and arrangement_uuid not in arrangement_ids:
        raise HTTPException(status_code=403, detail="This arrangement is not part of the completed order.")
    duplicate_filter = Review.product_id == product_uuid if product_uuid else Review.arrangement_id == arrangement_uuid
    if db.query(Review).filter(Review.user_id == current_user.id, duplicate_filter).first():
        raise HTTPException(status_code=409, detail="You have already reviewed this item.")

    image_url = await _upload_review_image(image)
    review = Review(
        id=uuid.uuid4(),
        user_id=current_user.id,
        order_id=order.id,
        product_id=product_uuid,
        arrangement_id=arrangement_uuid,
        star_rating=star_rating,
        comment=comment.strip()[:500] or None,
        image_url=image_url,
    )
    db.add(review)
    try:
        db.flush()
        reviewed_ids = {
            row[0]
            for row in db.query(Review.product_id)
            .filter(Review.user_id == current_user.id, Review.product_id.in_(product_ids))
            .all()
        }
        reviewed_arrangement_ids = {
            row[0]
            for row in db.query(Review.arrangement_id)
            .filter(Review.user_id == current_user.id, Review.arrangement_id.in_(arrangement_ids))
            .all()
        } if arrangement_ids else set()
        order.has_reviewed = all(product in reviewed_ids for product in product_ids) and all(arrangement in reviewed_arrangement_ids for arrangement in arrangement_ids)
        order.can_review = not order.has_reviewed
        db.commit()
        db.refresh(review)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="You have already reviewed this product.")
    return {"status": "success", "review": serialize_review(review)}


@router.get("/my-reviews")
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reviews = (
        db.query(Review)
        .options(joinedload(Review.user), joinedload(Review.product))
        .filter(Review.user_id == current_user.id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [serialize_review(review) for review in reviews]


@router.get("/admin/all")
def get_all_reviews(db: Session = Depends(get_db), _: User = Depends(require_staff)):
    reviews = db.query(Review).options(joinedload(Review.user), joinedload(Review.product)).order_by(Review.created_at.desc()).all()
    return [serialize_review(review) for review in reviews]


@router.delete("/admin/{review_id}")
def delete_review(review_id: str, db: Session = Depends(get_db), _: User = Depends(require_staff)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found.")
    db.delete(review)
    db.commit()
    return {"status": "success", "message": "Review deleted"}
