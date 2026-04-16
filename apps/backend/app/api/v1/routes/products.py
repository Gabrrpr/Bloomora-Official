from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db
from app.core.config import settings
from app.models.product import Product

router = APIRouter()

@router.get("/", response_model=List[dict])
def get_products(db: Session = Depends(get_db)):
    """
    Get all available products for catalog.
    """
    products = db.query(Product).filter(Product.is_available == True).all()
    return [{"id": p.id, "name": p.name, "price": p.price, "category": p.category, "image_url": p.image_url} for p in products]

@router.get("/{product_id}", response_model=dict)
def get_product(product_id: str, db: Session = Depends(get_db)):
    """
    Get single product details.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return {"error": "Product not found"}
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "category": product.category,
        "image_url": product.image_url,
        "is_available": product.is_available
    }

