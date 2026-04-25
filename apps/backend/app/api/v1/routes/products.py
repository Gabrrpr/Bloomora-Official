from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
import uuid

from app.core.dependencies import get_db, get_current_user
from app.models import User, RoleEnum, Product, Inventory, ProductCategoryEnum, ProductStatusEnum

router = APIRouter()


# ── Helpers ──────────────────────────────────────────────────────────────────
def require_admin_or_staff(current_user: User):
    if current_user.role not in [RoleEnum.admin, RoleEnum.staff]:
        raise HTTPException(status_code=403, detail="Admin or staff access required.")


def serialize_product(p: Product) -> dict:
    inv = p.inventory
    return {
        "id": str(p.id),
        "name": p.name,
        "description": p.description,
        "price": float(p.price) if p.price else 0,
        "original_price": float(p.price) * 1.2 if p.price else 0,  # placeholder markup
        "category": p.category.value if hasattr(p.category, "value") else p.category,
        "image_url": p.image_url,
        "is_available": p.is_available,
        "status": p.status.value if hasattr(p.status, "value") else p.status,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        "stock": inv.current_stock if inv else 0,
        "reorder_point": inv.reorder_point if inv else 10,
    }


# ── Public catalog endpoints ─────────────────────────────────────────────────
@router.get("/", response_model=List[dict])
def get_products(db: Session = Depends(get_db)):
    """Get all available products for public catalog."""
    products = db.query(Product).filter(Product.is_available == True).all()
    return [{
        "id": p.id,
        "name": p.name,
        "price": float(p.price) if p.price else 0,
        "category": p.category.value if hasattr(p.category, "value") else p.category,
        "image_url": p.image_url,
        "is_available": p.is_available,
    } for p in products]


@router.get("/{product_id}", response_model=dict)
def get_product(product_id: str, db: Session = Depends(get_db)):
    """Get single product details."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": float(product.price) if product.price else 0,
        "category": product.category.value if hasattr(product.category, "value") else product.category,
        "image_url": product.image_url,
        "is_available": product.is_available,
        "status": product.status.value if hasattr(product.status, "value") else product.status,
    }


# ── Admin endpoints ──────────────────────────────────────────────────────────
@router.get("/admin/all", response_model=List[dict])
def get_admin_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all products (including inactive) for admin panel."""
    require_admin_or_staff(current_user)
    products = db.query(Product).order_by(Product.created_at.desc()).all()
    return [serialize_product(p) for p in products]


@router.post("/admin", response_model=dict, status_code=201)
def create_product(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    price: str = Form(...),
    category: str = Form(...),
    status: str = Form("active"),
    is_available: bool = Form(True),
    image_url: Optional[str] = Form(None),
    stock: int = Form(0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new product. Admin/Staff only."""
    require_admin_or_staff(current_user)

    try:
        cat_enum = ProductCategoryEnum(category.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid category: {category}")

    try:
        status_enum = ProductStatusEnum(status.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    try:
        price_val = Decimal(price)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid price value.")

    new_product = Product(
        id=uuid.uuid4(),
        name=name,
        description=description,
        price=price_val,
        category=cat_enum,
        status=status_enum,
        is_available=is_available,
        image_url=image_url,
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    # Create inventory entry
    inventory = Inventory(
        product_id=new_product.id,
        current_stock=stock,
        reorder_point=10,
    )
    db.add(inventory)
    db.commit()

    return {"status": "success", "product": serialize_product(new_product)}


@router.put("/admin/{product_id}", response_model=dict)
def update_product(
    product_id: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    price: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    is_available: Optional[bool] = Form(None),
    image_url: Optional[str] = Form(None),
    stock: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing product. Admin/Staff only."""
    require_admin_or_staff(current_user)

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if name is not None:
        product.name = name
    if description is not None:
        product.description = description
    if price is not None:
        try:
            product.price = Decimal(price)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid price value.")
    if category is not None:
        try:
            product.category = ProductCategoryEnum(category.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid category: {category}")
    if status is not None:
        try:
            product.status = ProductStatusEnum(status.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    if is_available is not None:
        product.is_available = is_available
    if image_url is not None:
        product.image_url = image_url

    db.commit()
    db.refresh(product)

    if stock is not None:
        inv = db.query(Inventory).filter(Inventory.product_id == product.id).first()
        if inv:
            inv.current_stock = stock
        else:
            inv = Inventory(product_id=product.id, current_stock=stock, reorder_point=10)
            db.add(inv)
        db.commit()

    return {"status": "success", "product": serialize_product(product)}


@router.delete("/admin/{product_id}", response_model=dict)
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft-delete a product by setting inactive. Admin/Staff only."""
    require_admin_or_staff(current_user)

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_available = False
    product.status = ProductStatusEnum.inactive
    db.commit()

    return {"status": "success", "message": "Product deactivated successfully."}

