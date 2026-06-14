from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File, Body
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, text, func, cast, String
from typing import List, Optional
from decimal import Decimal
from datetime import datetime, timezone
import uuid, json
import io
from PIL import Image

from supabase import create_client, Client
from app.core.config import settings
from app.core.dependencies import get_db, get_current_user, require_staff
from app.models import User, RoleEnum, Product, Inventory, ProductStatusEnum, Review, Order, ProductRecipe, Notification

router = APIRouter()

# 🛡️ Hard limits for image uploads
MAX_FILE_SIZE = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}


# ── Helpers ───────────────────────────────────────────────────────────────────
def serialize_product(p: Product) -> dict:
    inv = p.inventory
    return {
        "id": str(p.id),
        "name": p.name,
        "description": p.description,
        "price": float(p.price) if p.price else 0,
        "product_group": p.product_group,
        "product_type": p.product_type,
        "category": p.category,
        "image_url": p.image_url,
        "is_available": p.is_available,
        "status": p.status.value if hasattr(p.status, "value") else p.status,
        "stock": inv.current_stock if inv else 0,
        "reorder_point": inv.reorder_point if inv else 10,
        "unit_type": inv.unit_type if (inv and inv.unit_type) else "piece",
        "cost_per_unit": float(inv.cost_per_unit) if (inv and inv.cost_per_unit is not None) else None,
        "composition": getattr(p, "composition", []),
        "occasions": getattr(p, "occasions", []),
        "branches": getattr(p, "branches", []),
        "is_visible": getattr(p, "is_visible", True),
        "tags": getattr(p, "tags", []),
        "original_price": float(p.original_price) if getattr(p, "original_price", None) else None,
    }


# ── Public endpoints (specific routes MUST come before wildcard) ──────────────

@router.get("/flash-sales", response_model=List[dict])
def get_flash_sales(db: Session = Depends(get_db)):
    """Fetch only items that are currently marked down."""
    try:
        products = (
            db.query(Product)
            .options(joinedload(Product.inventory))
            .filter(Product.original_price.isnot(None))
            .all()
        )
        return [serialize_product(p) for p in products]
    except Exception as e:
        print("CRITICAL ERROR IN FLASH SALES ROUTE:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search", response_model=List[dict])
def search_products(q: str = "", db: Session = Depends(get_db)):
    """Smart Content-Based Search Algorithm."""
    if not q:
        return []

    search_term = f"%{q.lower()}%"

    results = (
        db.query(Product)
        .options(joinedload(Product.inventory))
        .filter(
            or_(
                func.lower(Product.name).ilike(search_term),
                func.lower(Product.category).ilike(search_term),
                func.lower(Product.description).ilike(search_term),
                cast(Product.tags, String).ilike(search_term),
            )
        )
        .all()
    )

    return [serialize_product(p) for p in results]


@router.get("/customization/all", response_model=List[dict])
def get_customization_products(db: Session = Depends(get_db)):
    """Get all available products with customization attributes for Mix & Match."""
    products = (
        db.query(Product)
        .filter(Product.is_available == True, Product.is_visible == True)
        .options(
            joinedload(Product.inventory),
            joinedload(Product.flower),
            joinedload(Product.wrapping),
            joinedload(Product.accessory),
        )
        .order_by(Product.category, Product.name)
        .all()
    )

    result = []
    for p in products:
        inv = p.inventory
        stock = inv.current_stock if inv else 0
        reorder = inv.reorder_point if inv else 10
        stock_status = (
            "out_of_stock" if stock <= 0
            else "low_stock" if stock <= reorder
            else "in_stock"
        )

        raw_category = p.category.value if hasattr(p.category, "value") else str(p.category)
        clean_category = raw_category.strip().lower()

        item = {
            "id": str(p.id),
            "name": p.name,
            "price": float(p.price) if p.price else 0,
            "category": clean_category,
            "image_url": p.image_url,
            "is_available": p.is_available,
            "stock": stock,
            "stock_status": stock_status,
        }

        if p.flower:
            item["attrs"] = {
                "color": p.flower.color,
                "style": p.flower.style,
                "size": getattr(p.flower, "size", None),
                "quantity": p.flower.quantity,
            }
        elif p.wrapping:
            item["attrs"] = {
                "style": p.wrapping.style,
                "color": p.wrapping.color,
                "material": getattr(p.wrapping, "material", None),
                "size": p.wrapping.size,
                "quantity": p.wrapping.quantity,
            }
        elif p.accessory:
            item["attrs"] = {
                "name": p.accessory.name,
                "style": getattr(p.accessory, "style", None),
                "color": getattr(p.accessory, "color", None),
                "size": getattr(p.accessory, "size", None),
                "quantity": getattr(p.accessory, "quantity", 1),
            }

        result.append(item)

    return result


@router.get("/categories/hierarchy", response_model=List[dict])
def get_category_hierarchy(db: Session = Depends(get_db)):
    """Get dynamic category hierarchy grouped by Floral/Non-Floral for Navbars."""
    products = db.query(Product).filter(Product.is_available == True).all()
    hierarchy_dict = {}
    NON_FLORAL_CATS = ["wrapping", "accessory", "vase", "tools", "pot", "pot fillers", "candles"]

    for p in products:
        cat = (p.category or "").lower().strip()
        if cat in ["add-on", "addon"]:
            continue

        group = (p.product_group or "").lower().strip()
        if not group:
            group = "non-floral" if cat in NON_FLORAL_CATS else "uncategorized"

        if group not in hierarchy_dict:
            hierarchy_dict[group] = set()

        if cat:
            hierarchy_dict[group].add(cat)

    def title_case(s: str):
        return " ".join(w.capitalize() for w in s.replace("_", " ").split("-"))

    result = []
    for group_name, cats in hierarchy_dict.items():
        result.append({
            "title": title_case(group_name),
            "items": sorted([title_case(c) for c in cats]),
        })

    result.sort(
        key=lambda x: 0 if "floral" in x["title"].lower() and "non" not in x["title"].lower() else 1
    )
    return result


@router.get("/{product_id}/reviews", response_model=List[dict])
def get_product_reviews(product_id: str, db: Session = Depends(get_db)):
    """Fetch all reviews for a specific product."""
    reviews = (
        db.query(Review, User)
        .join(User, Review.user_id == User.id)
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .all()
    )

    return [
        {
            "id": str(r.Review.id),
            "user_name": f"{r.User.first_name} {r.User.last_name}",
            "star_rating": r.Review.star_rating,
            "comment": r.Review.comment,
            "image_url": r.Review.image_url,
            "created_at": r.Review.created_at.isoformat() if r.Review.created_at else None,
        }
        for r in reviews
    ]


@router.get("/", response_model=List[dict])
def get_products(db: Session = Depends(get_db)):
    """Get all available products for public catalog, including stock."""
    products = (
        db.query(Product)
        .outerjoin(Inventory, Product.id == Inventory.product_id)
        .filter(
            and_(
                Product.is_available == True,
                or_(Product.is_visible == True, Product.category == "advertisement"),
            )
        )
        .options(joinedload(Product.inventory))
        .all()
    )

    return [
        {
            "id": str(p.id),
            "name": p.name,
            "price": float(p.price) if p.price else 0,
            "category": p.category.lower().strip() if p.category else "",
            "product_group": p.product_group.lower().strip() if p.product_group else "floral",
            "product_type": p.product_type.lower().strip() if p.product_type else "",
            "original_price": float(p.original_price) if getattr(p, "original_price", None) else None,
            "image_url": p.image_url,
            "is_available": p.is_available,
            "stock": p.inventory.current_stock if p.inventory else 0,
            "season_key": p.season_key,
            "limited_start_at": p.limited_start_at.isoformat() if p.limited_start_at else None,
            "limited_end_at": p.limited_end_at.isoformat() if p.limited_end_at else None,
            "occasions": getattr(p, "occasions", []),
            "branches": getattr(p, "branches", []),
        }
        for p in products
    ]


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.get("/admin/all", response_model=List[dict])
def get_admin_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """Get all products including inactive for admin panel."""
    try:
        if not settings.SUPABASE_SERVICE_KEY:
            raise HTTPException(status_code=500, detail="Supabase Service Key is not configured.")

        supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

        inv_rows = []
        try:
            inv_resp = supabase_admin.table("inventory").select(
                "product_id,current_stock,reorder_point,unit_type,cost_per_unit"
            ).execute()
            inv_rows = inv_resp.data if inv_resp and hasattr(inv_resp, "data") and inv_resp.data else []
        except Exception:
            inv_rows = []

        inv_by_product_id = {}
        for r in inv_rows:
            pid = str(r.get("product_id")) if r.get("product_id") else None
            if not pid:
                continue
            inv_by_product_id[pid] = r

        products = db.query(Product).order_by(Product.created_at.desc()).all()

        result: List[dict] = []
        for p in products:
            pid = str(p.id)
            inv = inv_by_product_id.get(pid)

            result.append({
                "id": pid,
                "name": p.name,
                "description": p.description,
                "price": float(p.price) if p.price else 0,
                "category": p.category.value if hasattr(p.category, "value") else p.category,
                "image_url": p.image_url,
                "is_available": p.is_available,
                "status": p.status.value if hasattr(p.status, "value") else p.status,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                "stock": int(inv.get("current_stock") or 0) if inv else 0,
                "reorder_point": int(inv.get("reorder_point") or 10) if inv else 10,
                "unit_type": inv.get("unit_type") if inv and inv.get("unit_type") else "piece",
                "cost_per_unit": float(inv.get("cost_per_unit")) if inv and inv.get("cost_per_unit") is not None else None,
                "occasions": getattr(p, "occasions", []),
                "branches": getattr(p, "branches", []),
                "composition": getattr(p, "composition", []),
                "is_visible": getattr(p, "is_visible", True),
                "tags": getattr(p, "tags", []),
                "original_price": float(p.original_price) if p.original_price else None,
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
    current_user: User = Depends(require_staff),
):
    """Get low stock products. Admin/Staff only."""
    products = (
        db.query(Product)
        .outerjoin(Inventory, Product.id == Inventory.product_id)
        .filter(
            and_(
                Inventory.current_stock <= Inventory.reorder_point,
                Product.status != ProductStatusEnum.inactive,
            )
        )
        .options(joinedload(Product.inventory))
        .order_by(Inventory.current_stock.asc())
        .limit(limit)
        .all()
    )
    return [serialize_product(p) for p in products]


# ── Admin Image Upload ────────────────────────────────────────────────────────

@router.post("/admin/upload-image", response_model=dict)
async def upload_product_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_staff),
):
    """Upload product image to Supabase Storage safely."""
    if not settings.SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase Service Key is not configured.")

    try:
        file_bytes = await file.read()

        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

        ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Only {', '.join(ALLOWED_EXTENSIONS)} images are allowed.",
            )

        try:
            img = Image.open(io.BytesIO(file_bytes))
            img.verify()
        except Exception:
            raise HTTPException(status_code=400, detail="Malicious or corrupted file detected. Upload rejected.")

        supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        filename = f"products/{uuid.uuid4()}.{ext}"

        supabase_admin.storage.from_(settings.SUPABASE_BUCKET).upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": f"image/{ext}"},
        )

        public_url = supabase_admin.storage.from_(settings.SUPABASE_BUCKET).get_public_url(filename)
        return {"status": "success", "url": public_url}

    except HTTPException:
        raise
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
    season_key: Optional[str] = Form(None),
    limited_start_at: Optional[str] = Form(None),
    limited_end_at: Optional[str] = Form(None),
    composition: Optional[str] = Form(None),
    occasions: Optional[str] = Form(None),
    branches: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """Create a new product. Admin/Staff only."""
    try:
        status_enum = ProductStatusEnum(status.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    try:
        price_val = Decimal(price)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid price value.")

    parsed_comp = []
    if composition:
        try:
            parsed_comp = json.loads(composition)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid composition JSON format.")

    parsed_occasions = []
    if occasions:
        try:
            parsed_occasions = json.loads(occasions)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid occasions JSON format.")

    parsed_branches = []
    if branches:
        try:
            parsed_branches = json.loads(branches)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid branches JSON.")

    # ✅ FIX: Create the product object FIRST before referencing new_product.id
    new_product = Product(
        id=uuid.uuid4(),
        name=name,
        product_group=group.lower().strip(),
        description=description,
        price=price_val,
        category=category.lower().strip(),
        product_type=product_type.lower().strip() if product_type else None,
        status=status_enum,
        is_available=is_available,
        image_url=image_url,
        season_key=season_key or None,
        limited_start_at=limited_start_at or None,
        limited_end_at=limited_end_at or None,
        composition=parsed_comp,
        occasions=parsed_occasions,
        branches=parsed_branches,
    )
    db.add(new_product)
    db.flush()  # Flush so new_product.id is available for recipe links

    # ✅ FIX: Composition loop now runs AFTER flush so new_product.id exists
    if parsed_comp:
        for item in parsed_comp:
            comp_id = item.get("id")
            qty = item.get("qty") or item.get("quantity") or 1

            if comp_id:
                new_recipe_link = ProductRecipe(
                    parent_product_id=new_product.id,
                    component_product_id=comp_id,
                    quantity_required=qty,
                )
                db.add(new_recipe_link)

    inventory = Inventory(
        product_id=new_product.id,
        current_stock=stock,
        reorder_point=10,
    )
    db.add(inventory)
    db.commit()
    db.refresh(new_product)

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
    is_visible: Optional[bool] = Form(None),
    image_url: Optional[str] = Form(None),
    stock: Optional[int] = Form(None),
    unit_type: Optional[str] = Form(None),
    reorder_point: Optional[int] = Form(None),
    cost_per_unit: Optional[float] = Form(None),
    season_key: Optional[str] = Form(None),
    limited_start_at: Optional[str] = Form(None),
    limited_end_at: Optional[str] = Form(None),
    composition: Optional[str] = Form(None),
    occasions: Optional[str] = Form(None),
    branches: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """Update an existing product. Admin/Staff only."""
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
    if is_visible is not None:
        product.is_visible = is_visible
    if image_url is not None:
        product.image_url = image_url or None
    if season_key is not None:
        product.season_key = season_key or None
    if limited_start_at is not None:
        product.limited_start_at = limited_start_at or None
    if limited_end_at is not None:
        product.limited_end_at = limited_end_at or None
    if composition is not None:
        try:
            parsed_comp = json.loads(composition)
            product.composition = parsed_comp

            db.query(ProductRecipe).filter(ProductRecipe.parent_product_id == product.id).delete()

            for item in parsed_comp:
                comp_id = item.get("id")
                qty = item.get("qty") or item.get("quantity") or 1

                if comp_id:
                    new_recipe_link = ProductRecipe(
                        parent_product_id=product.id,
                        component_product_id=comp_id,
                        quantity_required=qty,
                    )
                    db.add(new_recipe_link)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid composition JSON format.")
    if occasions is not None:
        try:
            product.occasions = json.loads(occasions)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid occasions JSON format.")
    if branches is not None:
        try:
            parsed_branches = json.loads(branches)
            product.branches = parsed_branches
            print(f"DEBUG: Saving branches for {product.name}: {parsed_branches}")
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid branches JSON format.")

    db.commit()
    db.refresh(product)

    if any(v is not None for v in [stock, unit_type, reorder_point, cost_per_unit]):
        inv = db.query(Inventory).filter(Inventory.product_id == product.id).first()
        if not inv:
            inv = Inventory(
                product_id=product.id,
                current_stock=stock or 0,
                reorder_point=reorder_point or 10,
            )
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
    current_user: User = Depends(require_staff),
):
    """Save the homepage layout configuration. Admin/Staff only."""
    layout_json = json.dumps(layout)

    query = text("""
        INSERT INTO store_settings (setting_key, setting_value, updated_at)
        VALUES ('homepage_layout', :val, now())
        ON CONFLICT (setting_key) DO UPDATE
        SET setting_value = EXCLUDED.setting_value, updated_at = now()
    """)
    db.execute(query, {"val": layout_json})
    db.commit()

    return {"status": "success", "message": "Homepage layout updated live."}


@router.post("/admin/{product_id}/promote", response_model=dict)
def apply_promotion(
    product_id: str,
    discount_percent: int = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """Apply a direct discount to a product and broadcast a global notification."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if discount_percent <= 0:
        if product.original_price:
            product.price = product.original_price
            product.original_price = None
        db.commit()
        return {"status": "success", "message": "Promotion removed."}

    raw_original = getattr(product, "original_price", None)
    base_price = raw_original if raw_original else product.price
    discount_multiplier = Decimal((100 - discount_percent) / 100.0)

    product.original_price = base_price
    product.price = base_price * discount_multiplier

    alert = Notification(
        title="🎉 Flash Sale Alert!",
        message=f"{product.name} is now {discount_percent}% OFF! Shop now.",
        type="promotion",
        is_global=True,
        is_read=False,
    )
    db.add(alert)
    db.commit()
    db.refresh(product)

    return {
        "status": "success",
        "message": "Promotion applied!",
        "product": serialize_product(product),
    }


@router.delete("/admin/{product_id}", response_model=dict)
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """Smart-delete a product. Admin/Staff only."""
    try:
        prod_uuid = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid product ID format")

    product = db.query(Product).filter(Product.id == prod_uuid).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    orders_count = db.query(Order).filter(Order.product_id == prod_uuid).count()

    if orders_count == 0:
        db.query(Inventory).filter(Inventory.product_id == prod_uuid).delete(synchronize_session=False)
        db.delete(product)
        db.commit()
        return {"status": "success", "delete_type": "hard", "message": "Product permanently deleted."}
    else:
        product.status = ProductStatusEnum.inactive
        product.is_available = False
        db.commit()
        return {"status": "success", "delete_type": "soft", "message": "Product archived to protect order history."}


# ── Public wildcard route — MUST be last ─────────────────────────────────────

@router.get("/{product_id}", response_model=dict)
def get_product(product_id: str, db: Session = Depends(get_db)):
    """Get single product details."""
    try:
        prod_uuid = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid product ID format")

    product = db.query(Product).filter(Product.id == prod_uuid).first()
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