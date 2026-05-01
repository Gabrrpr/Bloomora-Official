from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.dependencies import get_db
from app.models.arrangement import Vase
from app.models.product import Product, ProductCategoryEnum

router = APIRouter()


def serialize_vase(v: Vase, product: Product) -> dict:
    """Serialize a vase record with its related product data."""
    return {
        "id": str(v.id),
        "product_id": str(v.product_id),
        "name": product.name,
        "description": product.description,
        "price": float(v.unit_price) if v.unit_price else 0,
        "original": float(v.original_price) if v.original_price else 0,
        "rating": float(v.rating) if v.rating else 0,
        "reviews": v.reviews or 0,
        "ribbon": v.ribbon,
        "category": v.category,
        "image_url": product.image_url,
        "style": v.style,
        "material": v.material,
        "color": v.color,
        "size": v.size,
        "quantity": v.quantity,
        "is_available": product.is_available,
    }


@router.get("/", response_model=List[dict])
def get_vases(
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: Session = Depends(get_db),
):
    """
    Get all vases from the vases table.
    Optional filters:
    - category: Filter by vase category (e.g., "Green", "White", "Gold", "Marble", "Pink", "Pots")
    - min_price: Minimum price filter
    - max_price: Maximum price filter
    """
    query = db.query(Vase).join(Product).filter(Product.category == ProductCategoryEnum.vase)

    if category and category != "All":
        query = query.filter(Vase.category == category)

    if min_price is not None:
        query = query.filter(Vase.unit_price >= min_price)

    if max_price is not None:
        query = query.filter(Vase.unit_price <= max_price)

    vases = query.all()

    return [serialize_vase(v, v.product) for v in vases]


@router.get("/{vase_id}", response_model=dict)
def get_vase(vase_id: str, db: Session = Depends(get_db)):
    """Get a single vase by ID."""
    vase = db.query(Vase).filter(Vase.id == vase_id).first()
    if not vase:
        return {"error": "Vase not found"}

    product = vase.product
    return serialize_vase(vase, product)


@router.get("/categories/all", response_model=List[str])
def get_vase_categories(db: Session = Depends(get_db)):
    """Get all unique vase categories."""
    categories = db.query(Vase.category).distinct().filter(Vase.category.isnot(None)).all()
    return ["All"] + [c[0] for c in categories if c[0]]
