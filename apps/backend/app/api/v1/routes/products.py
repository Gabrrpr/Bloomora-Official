from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File, Body
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, text
from typing import List, Optional
from decimal import Decimal
import uuid

from supabase import create_client, Client
from app.core.config import settings
from app.core.dependencies import get_db, get_current_user
# 👇 Notice we removed ProductCategoryEnum from this import list!
from app.models import User, RoleEnum, Product, Inventory, ProductStatusEnum, Review

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
        "product_group": p.product_group, # ADD THIS
        "product_type": p.product_type,   # ADD THIS
        "category": p.category, 
        "image_url": p.image_url,
        "is_available": p.is_available,
        "status": p.status.value if hasattr(p.status, "value") else p.status,
        "stock": inv.current_stock if inv else 0,
        "reorder_point": inv.reorder_point if inv else 10,
        "unit_type": inv.unit_type if (inv and inv.unit_type) else "piece",
        "cost_per_unit": float(inv.cost_per_unit) if (inv and inv.cost_per_unit is not None) else None,
    }

# ── Public endpoints ──────────────────────────────────────────────────────────

@router.get("/{product_id}/reviews", response_model=List[dict])
def get_product_reviews(product_id: str, db: Session = Depends(get_db)):
    """Fetch all reviews for a specific product."""

    # We join with User to get the name for the frontend display
    reviews = (
        db.query(Review, User)
        .join(User, Review.user_id == User.id)
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .all()
    )

    return [{
        "id": str(r.Review.id),
        "user_name": f"{r.User.firstName} {r.User.lastName}",
        "star_rating": r.Review.star_rating,
        "comment": r.Review.comment,
        "image_url": r.Review.image_url,
        "created_at": r.Review.created_at.isoformat() if r.Review.created_at else None
    } for r in reviews]

@router.get("/", response_model=List[dict])
def get_products(db: Session = Depends(get_db)):
    """Get all available products for public catalog, including stock."""
    # We use outerjoin to get the inventory data for public products
    products = (
        db.query(Product)
        .outerjoin(Inventory, Product.id == Inventory.product_id)
        .filter(Product.is_available == True)
        .options(joinedload(Product.inventory))
        .all()
    )
    
    return [{
        "id": str(p.id),
        "name": p.name,
        "price": float(p.price) if p.price else 0,
        "category": p.category.lower().strip() if p.category else "",
        "product_group": p.product_group.lower().strip() if p.product_group else "floral",
        "product_type": p.product_type.lower().strip() if p.product_type else "",
        "image_url": p.image_url,
        "is_available": p.is_available,
        "stock": p.inventory.current_stock if p.inventory else 0, # Live stock!
        "season_key": p.season_key,
        "limited_start_at": p.limited_start_at.isoformat() if p.limited_start_at else None,
        "limited_end_at": p.limited_end_at.isoformat() if p.limited_end_at else None,
    } for p in products]

@router.get("/customization/all", response_model=List[dict])
def get_customization_products(db: Session = Depends(get_db)):
    """Get all available products with customization attributes for Mix & Match."""
    # Ensure we load relationships to avoid N+1 queries
    products = (
        db.query(Product)
        .filter(Product.is_available == True)
        .options(
            joinedload(Product.inventory),
            joinedload(Product.flower),
            joinedload(Product.wrapping),
            joinedload(Product.accessory)
            # Add joinedload(Product.vase) here if you have a Vase relationship
        )
        .order_by(Product.category, Product.name)
        .all()
    )

    result = []
    for p in products:
        inv = p.inventory
        stock = inv.current_stock if inv else 0
        reorder = inv.reorder_point if inv else 10
        stock_status = "out_of_stock" if stock <= 0 else "low_stock" if stock <= reorder else "in_stock"
        
        # Clean the category string to match frontend expectations exactly
        raw_category = p.category.value if hasattr(p.category, "value") else str(p.category)
        clean_category = raw_category.strip().lower()

        item = {
            "id": str(p.id),
            "name": p.name,
            "price": float(p.price) if p.price else 0,
            "category": clean_category, # Use the cleaned category!
            "image_url": p.image_url,
            "is_available": p.is_available,
            "stock": stock,
            "stock_status": stock_status,
        }

        # Safely extract attributes if the relationship exists
        if p.flower:
            item["attrs"] = {
                "color": p.flower.color,
                "style": p.flower.style,
                "size": getattr(p.flower, 'size', None),
                "quantity": p.flower.quantity,
            }
        elif p.wrapping:
            item["attrs"] = {
                "style": p.wrapping.style,
                "color": p.wrapping.color,
                "material": getattr(p.wrapping, 'material', None),
                "size": p.wrapping.size,
                "quantity": p.wrapping.quantity,
            }
        elif p.accessory:
            item["attrs"] = {
                "name": p.accessory.name,
                "style": getattr(p.accessory, 'style', None),
                "color": getattr(p.accessory, 'color', None),
                "size": getattr(p.accessory, 'size', None),
                "quantity": getattr(p.accessory, 'quantity', 1),
            }
            
        # We don't necessarily need a specific 'elif p.vase:' block unless 
        # your Vase model has specific attributes (like 'material' or 'height') 
        # that you want the frontend to use in the prompt generation. 
        # The base 'item' dictionary is enough to display the card!

        result.append(item)
        
    return result


@router.get("/categories/hierarchy", response_model=List[dict])
def get_category_hierarchy(db: Session = Depends(get_db)):
    """Get dynamic category hierarchy grouped by Floral/Non-Floral for Navbars."""
    
    products = db.query(Product).filter(Product.is_available == True).all()

    hierarchy_dict = {}
    
    # 🚀 Define our strict Non-Floral categories here
    NON_FLORAL_CATS = ["wrapping", "accessory", "vase", "tools"]

    for p in products:
        cat = (p.category or "").lower().strip()
        
        # 1. Completely hide add-ons from all navigation menus
        if cat in ['add-on', 'addon']:
            continue
        
        # 2. Smart Grouping Logic
        # If the admin set a group, use it. If not, auto-sort it based on the category name.
        group = (p.product_group or "").lower().strip()
        
        if not group:
            if cat in NON_FLORAL_CATS:
                group = "non-floral"
            else:
                group = "floral"

        if group not in hierarchy_dict:
            hierarchy_dict[group] = set()
        
        if cat:
            hierarchy_dict[group].add(cat)

    # 3. Format for the frontend mega menu
    def title_case(s: str):
        return " ".join(w.capitalize() for w in s.replace("_", " ").split("-"))

    result = []
    for group_name, cats in hierarchy_dict.items():
        result.append({
            "title": title_case(group_name), # "Floral" or "Non Floral"
            "items": sorted([title_case(c) for c in cats]) # ["Arrangement", "Wrapping", etc.]
        })

    # Force "Floral" to always be the left column, "Non-Floral" to be the right column
    result.sort(key=lambda x: 0 if "floral" in x["title"].lower() and "non" not in x["title"].lower() else 1)

    return result

    # Build bouquet group
    bouquet_subtypes = set()
    other_categories = set()

    for cat in distinct_categories:
        sub = parse_bouquet(cat)
        if sub:
            bouquet_subtypes.add(sub)
        else:
            other_categories.add(cat)

    hierarchy: List[dict] = []

    if bouquet_subtypes:
        bouquet_items = sorted({title_case(s.replace("_", " ")) for s in bouquet_subtypes})
        hierarchy.append({"title": "Bouquet", "items": bouquet_items})

    # Put remaining categories as single-item groups so nothing disappears from Mega Menu
    for cat in sorted(other_categories):
        clean = cat.strip()
        if not clean:
            continue
        hierarchy.append({"title": title_case(clean), "items": [title_case(clean)]})

    return hierarchy


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.get("/admin/all", response_model=List[dict])
def get_admin_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all products including inactive for admin panel.

    Inventory fields (stock/reorder/unit_type/cost_per_unit) are sourced from Supabase
    `inventory` table so the admin inventory view matches Supabase.
    """

    require_admin_or_staff(current_user)

    try:
        if not settings.SUPABASE_SERVICE_KEY:
            raise HTTPException(status_code=500, detail="Supabase Service Key is not configured.")

        supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

        # Fetch inventory from Supabase
        # If Supabase fails (RLS, wrong key, etc.), we still return products with default stock.
        inv_rows = []
        try:
            inv_resp = supabase_admin.table("inventory").select(
                "product_id,current_stock,reorder_point,unit_type,cost_per_unit"
            ).execute()
            inv_rows = inv_resp.data if inv_resp and hasattr(inv_resp, "data") and inv_resp.data else []
        except Exception:
            inv_rows = []


        # Index by product_id (Supabase returns UUID as string)
        inv_by_product_id = {}
        for r in inv_rows:
            pid = str(r.get("product_id")) if r.get("product_id") else None
            if not pid:
                continue
            inv_by_product_id[pid] = r

        # Fetch products from backend DB (includes product name/category/image/etc.)
        products = (
            db.query(Product)
            .order_by(Product.created_at.desc())
            .all()
        )

        result: List[dict] = []
        for p in products:
            pid = str(p.id)
            inv = inv_by_product_id.get(pid)

            result.append({
                "id": pid,
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
                # Inventory from Supabase
                "stock": int(inv.get("current_stock") or 0) if inv else 0,
                "reorder_point": int(inv.get("reorder_point") or 10) if inv else 10,
                "unit_type": inv.get("unit_type") if inv and inv.get("unit_type") else "piece",
                "cost_per_unit": float(inv.get("cost_per_unit")) if inv and inv.get("cost_per_unit") is not None else None,
            })

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load admin inventory from Supabase: {str(e)}")

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
    group: str = Form(..., alias="group"),
    product_type: str = Form(None),
    price: str = Form(...),
    category: str = Form(...),
    status: str = Form("active"),
    is_available: bool = Form(True),
    image_url: Optional[str] = Form(None),
    stock: int = Form(0),

    # Seasonal button fields (optional)
    season_key: Optional[str] = Form(None),
    limited_start_at: Optional[str] = Form(None),
    limited_end_at: Optional[str] = Form(None),

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new product. Admin/Staff only."""
    require_admin_or_staff(current_user)

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
        product_group=group.lower().strip(),
        description=description,
        price=price_val,
        category=category.lower().strip(),  # 👇 Directly use string instead of Enum
        product_type=product_type.lower().strip() if product_type else None,  
        status=status_enum,
        is_available=is_available,
        image_url=image_url,

        # Seasonal button fields (optional)
        season_key=season_key or None,
        limited_start_at=(limited_start_at or None),
        limited_end_at=(limited_end_at or None),
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
    group: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    price: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    product_type: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    is_available: Optional[bool] = Form(None),
    image_url: Optional[str] = Form(None),
    stock: Optional[int] = Form(None),

    # 🚀 NEW: Added the missing inventory fields!
    unit_type: Optional[str] = Form(None),
    reorder_point: Optional[int] = Form(None),
    cost_per_unit: Optional[float] = Form(None),

    # Seasonal button fields
    season_key: Optional[str] = Form(None),
    limited_start_at: Optional[str] = Form(None),
    limited_end_at: Optional[str] = Form(None),

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
    if group is not None:
        product.product_group = group.lower().strip()
    if description is not None:
        product.description = description
    if price is not None:
        try:
            product.price = Decimal(price)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid price value.")
    if category is not None:
        product.category = category.lower().strip() 
    if product_type is not None:
        product.product_type = product_type.lower().strip() if product_type.strip() else None
    if status is not None:
        try:
            product.status = ProductStatusEnum(status.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    if is_available is not None:
        product.is_available = is_available
    if image_url is not None:
        product.image_url = image_url or None
    if season_key is not None:
        product.season_key = season_key or None
    if limited_start_at is not None:
        product.limited_start_at = limited_start_at or None
    if limited_end_at is not None:
        product.limited_end_at = limited_end_at or None

    db.commit()
    db.refresh(product)

    # 🚀 NEW: Update all the inventory fields safely
    if stock is not None or unit_type is not None or reorder_point is not None or cost_per_unit is not None:
        inv = db.query(Inventory).filter(Inventory.product_id == product.id).first()
        if not inv:
            inv = Inventory(product_id=product.id, current_stock=stock or 0, reorder_point=reorder_point or 10)
            db.add(inv)
        
        if stock is not None:
            inv.current_stock = stock
        if unit_type is not None:
            inv.unit_type = unit_type
        if reorder_point is not None:
            inv.reorder_point = reorder_point
        if cost_per_unit is not None:
            inv.cost_per_unit = cost_per_unit
            
        db.commit()

    return {"status": "success", "product": serialize_product(product)}

@router.get("/admin/settings/homepage")
def get_homepage_layout(db: Session = Depends(get_db)):
    """Fetch the live homepage layout configuration."""
    query = text("SELECT setting_value FROM store_settings WHERE setting_key = 'homepage_layout'")
    result = db.execute(query).fetchone()
    
    if result and result[0]:
        return result[0]
    return {}

@router.post("/admin/settings/homepage")
def save_homepage_layout(
    layout: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save the homepage layout configuration. Admin/Staff only."""
    # require_admin_or_staff(current_user) # Ensure you enforce admin permissions here

    import json
    layout_json = json.dumps(layout)
    
    # Upsert the JSON data into the settings table
    query = text("""
        INSERT INTO store_settings (setting_key, setting_value, updated_at) 
        VALUES ('homepage_layout', :val, now())
        ON CONFLICT (setting_key) DO UPDATE 
        SET setting_value = EXCLUDED.setting_value, updated_at = now()
    """)
    db.execute(query, {"val": layout_json})
    db.commit()
    
    return {"status": "success", "message": "Homepage layout updated live."}

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
    
    # 🚀 THE FIX: Do not use db.delete(product)
    # Instead, just update the status to match your React frontend!
    product.status = ProductStatusEnum.inactive
    product.is_available = False
    
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