from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from typing import List, Optional
from decimal import Decimal
import uuid

from supabase import create_client, Client
from app.core.config import settings
from app.core.dependencies import get_db, get_current_user
from app.models import User, RoleEnum, Product, Inventory, ProductCategoryEnum, ProductStatusEnum

router = APIRouter()

# ── Helpers ───────────────────────────────────────────────────────────────────
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
        "original_price": float(p.price) * 1.2 if p.price else 0,
        "category": p.category.value if hasattr(p.category, "value") else p.category,
        "image_url": p.image_url,
        "is_available": p.is_available,
        "status": p.status.value if hasattr(p.status, "value") else p.status,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        "stock": inv.current_stock if inv else 0,
        "reorder_point": inv.reorder_point if inv else 10,
    }

# ── Public endpoints ──────────────────────────────────────────────────────────
@router.get("/", response_model=List[dict])
def get_products(db: Session = Depends(get_db)):
    """Get all available products for public catalog."""
    products = db.query(Product).filter(Product.is_available == True).all()
    return [{
        "id": str(p.id),
        "name": p.name,
        "price": float(p.price) if p.price else 0,
        "category": p.category.value if hasattr(p.category, "value") else p.category,
        "image_url": p.image_url,
        "is_available": p.is_available,
    } for p in products]

@router.get("/customization/all", response_model=List[dict])
def get_customization_products(db: Session = Depends(get_db)):
    """Get all available products with customization attributes for Mix & Match."""
    products = (
        db.query(Product)
        .filter(Product.is_available == True)
        .order_by(Product.category, Product.name)
        .all()
    )

    result = []
    for p in products:
        inv = p.inventory
        stock = inv.current_stock if inv else 0
        reorder = inv.reorder_point if inv else 10
        stock_status = "out_of_stock" if stock <= 0 else "low_stock" if stock <= reorder else "in_stock"

        item = {
            "id": str(p.id),
            "name": p.name,
            "price": float(p.price) if p.price else 0,
            "category": p.category.value if hasattr(p.category, "value") else p.category,
            "image_url": p.image_url,
            "is_available": p.is_available,
            "stock": stock,
            "stock_status": stock_status,
        }

        if p.flower:
            item["attrs"] = {
                "color": p.flower.color,
                "style": p.flower.style,
                "size": p.flower.size,
                "quantity": p.flower.quantity,
            }
        elif p.wrapping:
            item["attrs"] = {
                "style": p.wrapping.style,
                "color": p.wrapping.color,
                "material": p.wrapping.material,
                "size": p.wrapping.size,
                "quantity": p.wrapping.quantity,
            }
        elif p.accessory:
            item["attrs"] = {
                "name": p.accessory.name,
                "style": p.accessory.style,
                "color": p.accessory.color,
                "size": p.accessory.size,
                "quantity": p.accessory.quantity,
            }
        result.append(item)
    return result

# ── Admin endpoints ───────────────────────────────────────────────────────────
@router.get("/admin/all", response_model=List[dict])
def get_admin_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all products including inactive for admin panel."""
    require_admin_or_staff(current_user)
    products = (
        db.query(Product)
        .options(joinedload(Product.inventory))
        .order_by(Product.created_at.desc())
        .all()
    )
    return [serialize_product(p) for p in products]

@router.get("/low-stock", response_model=List[dict])
def get_low_stock(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get low stock products. Admin/Staff only."""
    require_admin_or_staff(current_user)
    products = (
        db.query(Product)
        .outerjoin(Inventory, Product.id == Inventory.product_id)
        .filter(
            and_(
                Inventory.current_stock <= Inventory.reorder_point,
                Product.status != ProductStatusEnum.inactive
            )
        )
        .order_by(Inventory.current_stock.asc())
        .limit(limit)
        .all()
    )
    return [serialize_product(p) for p in products]

# ── Admin Image Upload ────────────────────────────────────────────────────────
@router.post("/admin/upload-image", response_model=dict)
async def upload_product_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload product image to Supabase Storage and return public URL."""
    require_admin_or_staff(current_user)
    
    if not settings.SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase Service Key is not configured.")

    # 🛡️ STRICT FILE TYPE CHECK
    try:
        ext = file.filename.split(".")[-1].lower()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid filename.")
        
    allowed_extensions = {"jpg", "jpeg", "png", "webp", "gif"}
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Only {', '.join(allowed_extensions)} images are allowed.")
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Must be an image.")

    try:
        supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        
        # Generate unique filename to prevent overwrites
        filename = f"products/{uuid.uuid4()}.{ext}"
        
        file_bytes = await file.read()
        
        # Upload using service role key
        supabase_admin.storage.from_(settings.SUPABASE_BUCKET).upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )
        
        # Get public URL
        public_url = supabase_admin.storage.from_(settings.SUPABASE_BUCKET).get_public_url(filename)
        
        return {"status": "success", "url": public_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

# ── Admin CRUD ────────────────────────────────────────────────────────────────
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
        # Treat empty string as “no image”
        product.image_url = image_url or None


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
    """Soft-delete a product. Admin/Staff only."""
    require_admin_or_staff(current_user)

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_available = False
    product.status = ProductStatusEnum.inactive
    db.commit()

    return {"status": "success", "message": "Product deactivated successfully."}

# ── Public wildcard route — MUST be last ─────────────────────────────────────
@router.get("/{product_id}", response_model=dict)
def get_product(product_id: str, db: Session = Depends(get_db)):
    """Get single product details."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": str(product.id),
        "name": product.name,
        "description": product.description,
        "price": float(product.price) if product.price else 0,
        "category": product.category.value if hasattr(product.category, "value") else product.category,
        "image_url": product.image_url,
        "is_available": product.is_available,
        "status": product.status.value if hasattr(product.status, "value") else product.status,
    }