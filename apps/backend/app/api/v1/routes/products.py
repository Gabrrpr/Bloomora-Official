from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File, Body, Query, Request 
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, text, func, cast, String
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import datetime, timezone
import uuid, json
import io
from PIL import Image

from supabase import create_client, Client
from app.core.config import settings
from app.core.dependencies import get_db, get_current_user, require_staff
from app.models import User, RoleEnum, Product, Inventory, ProductStatusEnum, Review, Order, OrderItem, ProductRecipe, StockReservation
from app.models.campaigns import Campaign
from app.utils.logger import log_activity

class StockLogCreate(BaseModel):
    product_id: str
    qty_change: int
    purchasing_price: float
    date_of_issuance: str
    branch: str
    notes: Optional[str] = None

class RenameCategorySchema(BaseModel):
    old_category: str
    new_category: str

router = APIRouter()

MAX_FILE_SIZE = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}

def product_status_value(product: Product) -> str:
    return product.status.value if hasattr(product.status, "value") else str(product.status)

def stock_from_inventory(inv) -> int:
    if not inv:
        return 0
    if isinstance(inv, dict):
        return int(inv.get("current_stock") or 0)
    return int(getattr(inv, "current_stock", 0) or 0)

def effective_is_available(product: Product, inv=None) -> bool:
    status = product_status_value(product)
    if status == ProductStatusEnum.inactive.value:
        return False
    return stock_from_inventory(inv or product.inventory) > 0

def sync_product_availability(product: Product, inv=None) -> None:
    if product_status_value(product) == ProductStatusEnum.inactive.value:
        product.is_available = False
        return

    has_stock = stock_from_inventory(inv or product.inventory) > 0
    product.is_available = has_stock
    if has_stock and product_status_value(product) == ProductStatusEnum.out_of_stock.value:
        product.status = ProductStatusEnum.active
    elif not has_stock and product_status_value(product) == ProductStatusEnum.active.value:
        product.status = ProductStatusEnum.out_of_stock

def _branch_stock_key(branch: str) -> Optional[str]:
    normalized = str(branch or "").strip().lower()
    if normalized == "manila":
        return "stock_manila"
    if normalized == "pampanga":
        return "stock_pampanga"
    return None

def _active_reservations_by_product(db: Session, product_ids: list[uuid.UUID]) -> dict[str, dict[str, int]]:
    if not product_ids:
        return {}

    rows = (
        db.query(
            StockReservation.product_id,
            Order.branch_name,
            func.coalesce(func.sum(StockReservation.quantity), 0),
        )
        .join(OrderItem, OrderItem.id == StockReservation.order_item_id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(
            StockReservation.product_id.in_(product_ids),
            StockReservation.status == "active",
            StockReservation.reserved_until > datetime.now(timezone.utc),
        )
        .group_by(StockReservation.product_id, Order.branch_name)
        .all()
    )

    summary: dict[str, dict[str, int]] = {}
    for product_id, branch_name, reserved_qty in rows:
        pid = str(product_id)
        qty = int(reserved_qty or 0)
        bucket = summary.setdefault(pid, {"stock": 0, "stock_manila": 0, "stock_pampanga": 0})
        bucket["stock"] += qty
        key = _branch_stock_key(branch_name)
        if key:
            bucket[key] += qty
    return summary

def _subtract_reserved_stock(stock_value: int, reserved_value: int) -> int:
    return max(0, int(stock_value or 0) - int(reserved_value or 0))

def _is_customization_material_product(product: Product) -> bool:
    raw = " ".join([
        str(getattr(product, "category", "") or ""),
        str(getattr(product, "product_type", "") or ""),
        str(getattr(product, "product_group", "") or ""),
        str(getattr(product, "name", "") or ""),
    ]).lower()
    if any(term in raw for term in ("arrangement", "bouquet", "gift set", "floral design")):
        return False
    if bool(getattr(product, "is_customization_material", False)):
        return True
    return any(term in raw for term in (
        "flower", "rose", "tulip", "carnation", "sunflower", "stem",
        "vase", "wrapping", "wrapper", "ribbon", "accessory", "add-on",
        "addon", "filler", "box", "container", "foam", "material", "raw",
    ))

def serialize_product(p: Product) -> dict:
    inv = p.inventory

    cost_per_unit = float(inv.cost_per_unit) if (inv and inv.cost_per_unit is not None) else None
    current_price = float(p.price) if p.price else 0
    
    markup_percentage = None
    if cost_per_unit and cost_per_unit > 0 and current_price > 0:
        markup_percentage = round(((current_price - cost_per_unit) / cost_per_unit) * 100, 2)

    return {
        "id": str(p.id),
        "name": p.name,
        "description": p.description,
        "care_guide": getattr(p, "care_guide", None),
        "price": current_price,
        "product_group": p.product_group,
        "product_type": p.product_type,
        "category": p.category,
        "is_customization_material": bool(getattr(p, "is_customization_material", False)),
        "image_url": p.image_url,
        "image": p.image_url,
        "is_available": effective_is_available(p, inv),
        "status": product_status_value(p),
        
        "stock": inv.current_stock if inv else 0,
        "stock_manila": getattr(inv, "stock_manila", 0) if inv else 0,
        "stock_pampanga": getattr(inv, "stock_pampanga", 0) if inv else 0,
        
        "reorder_point": inv.reorder_point if inv else 10,
        "unit_type": inv.unit_type if (inv and inv.unit_type) else "piece",
        "cost_per_unit": cost_per_unit,
        "composition": getattr(p, "composition", []),
        "occasions": getattr(p, "occasions", []),
        "branches": getattr(p, "branches", []),
        "is_visible": getattr(p, "is_visible", True),
        "tags": getattr(p, "tags", []),
        "original_price": float(p.original_price) if getattr(p, "original_price", None) else None,
        "base_price": cost_per_unit,
        "labor_cost": getattr(p, "labor_cost", 0), 
        "markup_percentage": markup_percentage,
        "season_key": getattr(p, "season_key", None),
        "limited_start_at": getattr(p, "limited_start_at", None),
        "limited_end_at": getattr(p, "limited_end_at", None),
    }


def apply_campaign_discount(product_data: dict, campaign: Optional[Campaign]) -> dict:
    if not campaign or not campaign.discount_type or not campaign.discount_value:
        return product_data

    base_price = float(product_data.get("price") or 0)
    if base_price <= 0:
        return product_data

    discount_value = float(campaign.discount_value or 0)
    if campaign.discount_type == "percent":
        campaign_price = base_price * max(0, 100 - discount_value) / 100
    elif campaign.discount_type == "fixed":
        campaign_price = max(0, base_price - discount_value)
    else:
        return product_data

    product_data["original_price"] = product_data.get("original_price") or base_price
    product_data["price"] = round(campaign_price, 2)
    product_data["campaign"] = {
        "id": str(campaign.id),
        "name": campaign.name,
        "campaign_key": campaign.campaign_key,
        "discount_type": campaign.discount_type,
        "discount_value": discount_value,
    }
    return product_data


def get_review_summaries(db: Session, product_ids: list[uuid.UUID]) -> dict[uuid.UUID, dict[str, float | int]]:
    if not product_ids:
        return {}

    rows = (
        db.query(
            Review.product_id,
            func.avg(Review.star_rating).label("average_rating"),
            func.count(Review.id).label("review_count"),
        )
        .filter(Review.product_id.in_(product_ids))
        .group_by(Review.product_id)
        .all()
    )

    return {
        row.product_id: {
            "average_rating": round(float(row.average_rating or 0), 1),
            "review_count": int(row.review_count or 0),
        }
        for row in rows
    }


def with_review_summary(payload: dict, summary: dict[str, float | int] | None) -> dict:
    payload["average_rating"] = float(summary["average_rating"]) if summary else 0
    payload["review_count"] = int(summary["review_count"]) if summary else 0
    return payload

@router.get("/flash-sales", response_model=List[dict])
def get_flash_sales(db: Session = Depends(get_db)):
    try:
        products = (
            db.query(Product)
            .options(joinedload(Product.inventory))
            .filter(Product.original_price.isnot(None))
        .filter(Product.is_visible == True)
        .filter(Product.status == ProductStatusEnum.active)
        .all()
    )

        review_summaries = get_review_summaries(db, [p.id for p in products])
        return [with_review_summary(serialize_product(p), review_summaries.get(p.id)) for p in products]
    except Exception as e:
        print("CRITICAL ERROR IN FLASH SALES ROUTE:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search", response_model=List[dict])
def search_products(q: str = "", db: Session = Depends(get_db)):
    if not q or not q.strip():
        return []

    # Only return products that are meant to be shown on the customer storefront.
    # This prevents hidden inventory (is_visible=false) from appearing when searching.


    search_term = f"%{q.lower().strip()}%"

    results = (
        db.query(Product)
        .options(joinedload(Product.inventory))
        .filter(
            and_(
                Product.is_visible == True,
                Product.status == ProductStatusEnum.active,
                or_(
                    func.lower(Product.name).ilike(search_term),
                    func.lower(Product.category).ilike(search_term),
                    and_(
                        Product.description.isnot(None),
                        func.lower(Product.description).ilike(search_term),
                    ),
                    Product.tags.cast(String).ilike(search_term),
                )
            )
        )
        .all()
    )


    review_summaries = get_review_summaries(db, [p.id for p in results])
    return [with_review_summary(serialize_product(p), review_summaries.get(p.id)) for p in results]

@router.get("/customization/all", response_model=List[dict])
def get_customization_products(db: Session = Depends(get_db)):
    products = (
        db.query(Product)
        # 🚀 THE FIX: We removed `Product.is_available == True` and `Product.is_visible == True`.
        # Now we only check if the product hasn't been completely deleted/archived.
        .filter(Product.status == ProductStatusEnum.active)
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
        if not _is_customization_material_product(p):
            continue

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
            "description": p.description,
            "care_guide": getattr(p, "care_guide", None),
            "price": float(p.price) if p.price else 0,
            "category": clean_category,
            "image_url": p.image_url,
            "is_available": effective_is_available(p, inv),
            "is_visible": p.is_visible,
            "product_group": p.product_group.lower().strip() if p.product_group else "",
            "product_type": p.product_type.lower().strip() if p.product_type else "",
            "is_customization_material": bool(getattr(p, "is_customization_material", False)),
            "stock": stock,
            "stock_manila": getattr(inv, "stock_manila", 0) if inv else 0,
            "stock_pampanga": getattr(inv, "stock_pampanga", 0) if inv else 0,
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
    products = db.query(Product).filter(Product.status != ProductStatusEnum.inactive, Product.is_visible == True).all()
    hierarchy_dict = {}
    NON_FLORAL_CATS = ["wrapping", "accessory", "vase", "tools", "pot", "pot fillers", "candles"]

    for p in products:
        cat = (p.category or "").lower().strip()
        if cat in ["add-on", "addon", "wrapping", "ribbon", "filler"]:
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
            "image_url": getattr(r.Review, "image_url", None),
            "created_at": r.Review.created_at.isoformat() if r.Review.created_at else None,
        }
        for r in reviews
    ]

@router.get("/", response_model=List[dict])
def get_products(
    branch: Optional[str] = Query(None),
    campaign_key: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Product)
        .outerjoin(Inventory, Product.id == Inventory.product_id)
        .filter(
            and_(
                Product.is_visible == True,
                Product.status == ProductStatusEnum.active,
            )
        )
        .options(joinedload(Product.inventory))
    )
    normalized_branch = (branch or "").strip().lower()
    if normalized_branch in {"manila", "pampanga"}:
        query = query.filter(
            or_(
                Product.branches == [],
                Product.branches.is_(None),
                Product.branches.cast(String).ilike(f'%"{normalized_branch}"%'),
                Product.branches.cast(String).ilike(f'%"{normalized_branch.title()}"%'),
            )
        )

    active_campaign = None
    normalized_campaign_key = (campaign_key or "").strip()
    if normalized_campaign_key:
        now = datetime.now(timezone.utc)
        active_campaign = (
            db.query(Campaign)
            .filter(
                Campaign.campaign_key == normalized_campaign_key,
                Campaign.is_active == True,
                Campaign.start_at <= now,
                or_(Campaign.end_at.is_(None), Campaign.end_at >= now),
            )
            .first()
        )
        if not active_campaign:
            return []
        query = query.filter(Product.campaigns.any(Campaign.id == active_campaign.id))

    products = query.all()
    review_summaries = get_review_summaries(db, [p.id for p in products])

    rows = []
    for p in products:
        product_data = {
            "id": str(p.id),
            "name": p.name,
            "description": p.description,
            "care_guide": getattr(p, "care_guide", None),
            "price": float(p.price) if p.price else 0,
            "category": (p.category.value if hasattr(p.category, "value") else str(p.category)).lower().strip() if p.category else "",
            "product_group": p.product_group.lower().strip() if p.product_group else "floral",
            "product_type": p.product_type.lower().strip() if p.product_type else "",
            "original_price": float(p.original_price) if getattr(p, "original_price", None) else None,
            "image_url": p.image_url,
            "is_available": effective_is_available(p, p.inventory),
            "is_visible": p.is_visible,
            "status": product_status_value(p),
            "stock": p.inventory.current_stock if p.inventory else 0,
            
            "stock_manila": getattr(p.inventory, "stock_manila", 0) if p.inventory else 0,
            "stock_pampanga": getattr(p.inventory, "stock_pampanga", 0) if p.inventory else 0,
            
            "season_key": p.season_key,
            "limited_start_at": p.limited_start_at.isoformat() if p.limited_start_at else None,
            "limited_end_at": p.limited_end_at.isoformat() if p.limited_end_at else None,
            "occasions": getattr(p, "occasions", []),
            "branches": getattr(p, "branches", []),
            "tags": getattr(p, "tags", []), 
            "average_rating": review_summaries.get(p.id, {}).get("average_rating", 0),
            "review_count": review_summaries.get(p.id, {}).get("review_count", 0),
        }
        rows.append(apply_campaign_discount(product_data, active_campaign))
    return rows

@router.get("/admin/all", response_model=List[dict])
def get_admin_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    try:
        if not settings.SUPABASE_SERVICE_KEY:
            raise HTTPException(status_code=500, detail="Supabase Service Key is not configured.")

        supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

        inv_rows = []
        try:
            inv_resp = supabase_admin.table("inventory").select(
            "product_id,current_stock,stock_manila,stock_pampanga,reorder_point,unit_type,cost_per_unit"
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
        reservations_by_product = _active_reservations_by_product(db, [p.id for p in products])

        result: List[dict] = []
        for p in products:
            pid = str(p.id)
            inv = inv_by_product_id.get(pid)
            reserved = reservations_by_product.get(pid, {})
            raw_stock = int(inv.get("current_stock") or 0) if inv else 0
            raw_stock_manila = int(inv.get("stock_manila") or 0) if inv else 0
            raw_stock_pampanga = int(inv.get("stock_pampanga") or 0) if inv else 0
            available_stock = _subtract_reserved_stock(raw_stock, reserved.get("stock", 0))
            available_stock_manila = _subtract_reserved_stock(raw_stock_manila, reserved.get("stock_manila", 0))
            available_stock_pampanga = _subtract_reserved_stock(raw_stock_pampanga, reserved.get("stock_pampanga", 0))
            availability_inv = {
                **(inv or {}),
                "current_stock": available_stock,
                "stock_manila": available_stock_manila,
                "stock_pampanga": available_stock_pampanga,
            }
            
            cost_per_unit = float(inv.get("cost_per_unit")) if inv and inv.get("cost_per_unit") is not None else None
            current_price = float(p.price) if p.price else 0
            
            markup_percentage = None
            if cost_per_unit and cost_per_unit > 0 and current_price > 0:
                markup_percentage = round(((current_price - cost_per_unit) / cost_per_unit) * 100, 2)

            result.append({
                "id": pid,
                "name": p.name,
                "description": p.description,
                "care_guide": getattr(p, "care_guide", None),
                "price": current_price,
                "product_group": p.product_group,
                "product_type": p.product_type,
                "category": p.category.value if hasattr(p.category, "value") else p.category,
                "image_url": p.image_url,
                "image": p.image_url,
                "is_customization_material": bool(getattr(p, "is_customization_material", False)),
                "is_available": effective_is_available(p, availability_inv),
                "status": product_status_value(p),
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                "stock": available_stock,
                "stock_manila": available_stock_manila,
                "stock_pampanga": available_stock_pampanga,
                "reserved_stock": int(reserved.get("stock", 0) or 0),
                "reserved_stock_manila": int(reserved.get("stock_manila", 0) or 0),
                "reserved_stock_pampanga": int(reserved.get("stock_pampanga", 0) or 0),
                "reorder_point": int(inv.get("reorder_point") or 10) if inv else 10,
                "unit_type": inv.get("unit_type") if inv and inv.get("unit_type") else "piece",
                "cost_per_unit": cost_per_unit,
                "base_price": cost_per_unit,
                "markup_percentage": markup_percentage,
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

@router.post("/admin/upload-image", response_model=dict)
async def upload_product_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_staff),
):
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

@router.post("/admin", response_model=dict, status_code=201)
def create_product(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    care_guide: Optional[str] = Form(None),
    group: str = Form(..., alias="group"),
    product_type: str = Form(None),
    price: str = Form(...),
    base_price: Optional[str] = Form(None),
    markup_percentage: Optional[str] = Form(None),
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
    tags: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
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

    parsed_tags = []
    if tags:
        try:
            parsed_tags = json.loads(tags)
        except json.JSONDecodeError:
            if tags:
                parsed_tags = [t.strip() for t in tags.split(",") if t.strip()]

    new_product = Product(
        id=uuid.uuid4(),
        name=name,
        product_group=group.lower().strip(),
        description=description,
        care_guide=care_guide,
        price=price_val,
        original_price=None, 
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
        tags=parsed_tags,
    )
    db.add(new_product)
    db.flush() 

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

    cost_val = 0.0
    if base_price:
        try:
            cost_val = float(base_price)
        except Exception:
            pass

    inventory = Inventory(
        product_id=new_product.id,
        current_stock=stock,
        reorder_point=10,
        cost_per_unit=cost_val, 
    )
    db.add(inventory)
    sync_product_availability(new_product, inventory)
    db.commit()
    db.refresh(new_product)

    return {"status": "success", "product": serialize_product(new_product)}

@router.put("/admin/{product_id}", response_model=dict)
def update_product(
    product_id: str,
    request: Request,
    name: Optional[str] = Form(None),
    group: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    care_guide: Optional[str] = Form(None),
    price: Optional[str] = Form(None),
    base_price: Optional[str] = Form(None),
    markup_percentage: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    product_type: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    is_available: Optional[bool] = Form(None),
    is_visible: Optional[bool] = Form(None),
    image_url: Optional[str] = Form(None),
    stock: Optional[int] = Form(None),
    stock_manila: Optional[int] = Form(None),
    stock_pampanga: Optional[int] = Form(None),
    unit_type: Optional[str] = Form(None),
    reorder_point: Optional[int] = Form(None),
    cost_per_unit: Optional[float] = Form(None),
    season_key: Optional[str] = Form(None),
    limited_start_at: Optional[str] = Form(None),
    limited_end_at: Optional[str] = Form(None),
    composition: Optional[str] = Form(None),
    occasions: Optional[str] = Form(None),
    branches: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        if name is not None:
            product.name = name
        if group is not None:
            product.product_group = group.lower().strip()
        if description is not None:
            product.description = description
        if care_guide is not None:
            product.care_guide = care_guide or None
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
                product.branches = json.loads(branches)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid branches JSON format.")

        if tags is not None:
            try:
                product.tags = json.loads(tags)
            except json.JSONDecodeError:
                product.tags = [t.strip() for t in tags.split(",") if t.strip()] if tags else []

        cost_val = cost_per_unit
        if base_price is not None:
            try:
                cost_val = float(base_price)
            except Exception:
                pass

        if any(v is not None for v in [stock, stock_manila, stock_pampanga, unit_type, reorder_point, cost_val]):
            inv = db.query(Inventory).filter(Inventory.product_id == product.id).first()
            if not inv:
                inv = Inventory(product_id=product.id, current_stock=stock or 0, reorder_point=reorder_point or 10)
                db.add(inv)

            if stock is not None: inv.current_stock = stock
            if stock_manila is not None: inv.stock_manila = stock_manila   
            if stock_pampanga is not None: inv.stock_pampanga = stock_pampanga 
            if unit_type is not None: inv.unit_type = unit_type
            if cost_val is not None: inv.cost_per_unit = cost_val
            sync_product_availability(product, inv)
        elif is_available is not None or status is not None:
            sync_product_availability(product)

        db.commit()
        db.refresh(product)
        
        log_activity(
            db=db,
            action=f"Update Record: Staff/Admin updated details for product '{product.name}'",
            user_id=str(current_user.id), 
            role=current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
            ip_address=request.client.host if request.client else "Unknown"
        )

        return {"status": "success", "product": serialize_product(product)}

    except Exception as e:
        db.rollback()
        error_msg = str(e)
        print("CRITICAL DATABASE ERROR DURING SAVE:", error_msg)
        raise HTTPException(status_code=500, detail=f"Database Crash: {error_msg}")


@router.get("/admin/settings/homepage")
def get_homepage_layout(db: Session = Depends(get_db)):
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
    try:
        prod_uuid = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid product ID format")

    product = db.query(Product).filter(Product.id == prod_uuid).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    orders_count = db.query(Order).filter(Order.product_id == prod_uuid).count()
    order_items_count = db.query(OrderItem).filter(OrderItem.product_id == prod_uuid).count()

    if orders_count == 0 and order_items_count == 0:
        db.query(Inventory).filter(Inventory.product_id == prod_uuid).delete(synchronize_session=False)
        db.delete(product)
        db.commit()
        return {"status": "success", "delete_type": "hard", "message": "Product permanently deleted."}
    else:
        product.status = ProductStatusEnum.inactive
        product.is_available = False
        db.commit()
        return {"status": "success", "delete_type": "soft", "message": "Product archived to protect order history."}
    
@router.post("/admin/stock-logs")
def log_stock_receipt(
    log: StockLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    try:
        query = text("""
            INSERT INTO stock_logs (id, product_id, qty_change, purchasing_price, date_of_issuance, branch, notes, created_at)
            VALUES (:id, :pid, :qty, :price, :doi, :branch, :notes, now())
        """)
        db.execute(query, {
            "id": str(uuid.uuid4()),
            "pid": log.product_id,
            "qty": log.qty_change,
            "price": log.purchasing_price,
            "doi": log.date_of_issuance,
            "branch": log.branch,
            "notes": log.notes
        })
        db.commit()
        return {"status": "success", "message": "Stock log saved"}
    
    except Exception as e:
        db.rollback()
        print(f"⚠️ Could not save to stock_logs (Table might not exist yet): {str(e)}")
        return {"status": "warning", "message": "Stock updated, but log was skipped."}

@router.get("/{product_id}", response_model=dict)
def get_product(product_id: str, db: Session = Depends(get_db)):
    try:
        prod_uuid = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid product ID format")

    product = db.query(Product).filter(Product.id == prod_uuid, Product.is_visible == True).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return {
        "id": str(product.id),
        "name": product.name,
        "description": product.description,
        "care_guide": getattr(product, "care_guide", None),
        "price": float(product.price) if product.price else 0,
        "category": product.category.value if hasattr(product.category, "value") else product.category,
        "image_url": product.image_url,
        "is_available": effective_is_available(product),
        "status": product_status_value(product),
    }
    
@router.post("/admin/rename-category")
def rename_category(
    payload: RenameCategorySchema, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Security check: Ensure they are an admin
    if current_user.role not in [RoleEnum.admin, RoleEnum.staff]:
        raise HTTPException(status_code=403, detail="Not authorized")

    old_cat_clean = payload.old_category.strip().lower()
    new_cat_clean = payload.new_category.strip().lower()

    if not old_cat_clean or not new_cat_clean:
        raise HTTPException(status_code=400, detail="Both old and new category names are required")

    # Update all products matching the old category (case-insensitive)
    updated_count = db.query(Product).filter(
        func.lower(Product.category) == old_cat_clean
    ).update({"category": new_cat_clean}, synchronize_session=False)

    db.commit()

    return {"status": "success", "message": f"Successfully renamed category for {updated_count} products."}
 
@router.get("/{product_id}/similar")
def get_similar_products(product_id: str, limit: int = 5, db: Session = Depends(get_db)):
    # 1. Find the target product to know its category
    target_product = db.query(Product).filter(Product.id == product_id).first()
    if not target_product:
        return []

    # 2. Find other visible products in the same category
    similar_products = db.query(Product).filter(
        Product.category == target_product.category,
        Product.id != product_id,          # Don't show the exact same product
        Product.is_visible == True         # Only show items meant for the storefront
    ).limit(limit).all()

    return similar_products
@router.get("/admin/settings/lalamove", tags=["Admin"])
def get_lalamove_status(db: Session = Depends(get_db)):
    # Query your database for the setting
    query = text("SELECT setting_value FROM store_settings WHERE setting_key = 'lalamove_enabled'")
    result = db.execute(query).fetchone()

    # Default to False if nothing is found
    enabled = False 
    if result and result[0] is not None:
        raw_val = result[0]
        
        # If the database already parsed it as a boolean, just use it
        if isinstance(raw_val, bool):
            enabled = raw_val
        # If it's a string, try to parse it
        elif isinstance(raw_val, str):
            # Sometimes raw strings like 'true' or 'false' get saved without JSON formatting
            if raw_val.lower() == 'true':
                enabled = True
            elif raw_val.lower() == 'false':
                enabled = False
            else:
                try:
                    enabled = json.loads(raw_val)
                except json.JSONDecodeError:
                    enabled = bool(raw_val)
        # Fallback catch-all
        else:
            enabled = bool(raw_val)
    
    return {"enabled": enabled}
@router.post("/admin/settings/lalamove", tags=["Admin"])
def update_lalamove_status(
    payload: dict = Body(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    enabled = payload.get("enabled", False)
    
    query = text("""
        INSERT INTO store_settings (setting_key, setting_value, updated_at)
        VALUES ('lalamove_enabled', :val, now())
        ON CONFLICT (setting_key) DO UPDATE
        SET setting_value = EXCLUDED.setting_value, updated_at = now()
    """)
    db.execute(query, {"val": json.dumps(enabled)})
    db.commit()

    return {"status": "success", "enabled": enabled}
