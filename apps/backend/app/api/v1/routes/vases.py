from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.dependencies import get_db
from app.models.arrangement import Vase

router = APIRouter()


def serialize_vase(v: Vase) -> dict:
    price = float(v.unit_price) if v.unit_price else 0
    return {
        "id": str(v.id),
        "name": v.name,
        "description": v.description,
        "price": price,
        "original": price * 1.2,   # ← add this
        "image_url": v.image_url,
        "style": v.style,
        "material": v.material,
        "color": v.color,
        "size": v.size,
        "quantity": v.quantity,
        "category": v.category,
        "is_available": v.is_available,
        "status": "active" if v.is_available else "inactive",
        "stock": v.quantity or 0,
        "reorder_point": 10,
    }


# ── specific routes first ─────────────────────────────────────────────────────

@router.get("/admin/all", response_model=List[dict])
def get_all_vases_admin(db: Session = Depends(get_db)):
    """Get all vases for admin panel."""
    vases = db.query(Vase).order_by(Vase.name).all()
    return [serialize_vase(v) for v in vases]


@router.get("/categories/all", response_model=List[str])
def get_vase_categories(db: Session = Depends(get_db)):
    """Get all unique vase categories."""
    categories = db.query(Vase.category).distinct().filter(Vase.category.isnot(None)).all()
    return ["All"] + [c[0] for c in categories if c[0]]


@router.get("/", response_model=List[dict])
def get_vases(
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: Session = Depends(get_db),
):
    """Get all available vases with optional filters."""
    query = db.query(Vase).filter(Vase.is_available == True)

    if category and category != "All":
        query = query.filter(Vase.category == category)
    if min_price is not None:
        query = query.filter(Vase.unit_price >= min_price)
    if max_price is not None:
        query = query.filter(Vase.unit_price <= max_price)

    return [serialize_vase(v) for v in query.all()]


# ── wildcard last ─────────────────────────────────────────────────────────────

@router.get("/{vase_id}", response_model=dict)
def get_vase(vase_id: str, db: Session = Depends(get_db)):
    """Get a single vase by ID."""
    vase = db.query(Vase).filter(Vase.id == vase_id).first()
    if not vase:
        raise HTTPException(status_code=404, detail="Vase not found")
    return serialize_vase(vase)