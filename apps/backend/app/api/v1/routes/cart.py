import uuid
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_current_user
from app.core.database import get_db
from app.models import CartItem, Inventory, Product, User

router = APIRouter(prefix="/cart", tags=["Cart"])


class CartItemPayload(BaseModel):
    product_id: str
    quantity: int = Field(default=1, ge=1, le=99)


class CartSyncPayload(BaseModel):
    items: list[CartItemPayload]


class WebCartItemPayload(BaseModel):
    item: dict[str, Any]


class WebCartReplacePayload(BaseModel):
    items: list[dict[str, Any]]


class CartQuantityPayload(BaseModel):
    quantity: int = Field(ge=1, le=99)


def _product_uuid(product_id: str) -> uuid.UUID:
    try:
        return uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid product ID: {product_id}")


def _available_product(db: Session, product_id: uuid.UUID) -> Product:
    product = (
        db.query(Product)
        .options(joinedload(Product.inventory))
        .filter(Product.id == product_id)
        .first()
    )
    if not product or not product.is_available or not product.is_visible:
        raise HTTPException(status_code=404, detail="Product is unavailable.")
    return product


def _clamp_quantity(product: Product, quantity: int) -> int:
    stock = product.inventory.current_stock if product.inventory else 0
    if stock <= 0:
        raise HTTPException(status_code=400, detail=f"{product.name} is out of stock.")
    return min(max(quantity, 1), stock, 99)


def _serialize(item: CartItem) -> dict:
    product = item.product
    inventory = product.inventory if product else None
    web_item = dict(item.item_data or {})
    web_item.setdefault("id", str(item.product_id or item.id))
    web_item["qty"] = item.quantity
    web_item["cartItemId"] = str(item.id)
    if not product:
        return {
            "id": str(item.id),
            "item_key": item.item_key,
            "product_id": None,
            "quantity": item.quantity,
            "product": None,
            "web_item": web_item,
        }
    web_item.setdefault("name", product.name)
    web_item.setdefault("desc", product.description or product.category)
    web_item.setdefault("price", float(product.price or 0))
    web_item.setdefault("img", product.image_url)
    return {
        "id": str(item.id),
        "item_key": item.item_key,
        "product_id": str(item.product_id),
        "quantity": item.quantity,
        "web_item": web_item,
        "product": {
            "id": str(product.id),
            "name": product.name,
            "description": product.description,
            "price": float(product.price or 0),
            "original_price": float(product.original_price) if product.original_price else None,
            "category": product.category,
            "product_group": product.product_group,
            "product_type": product.product_type,
            "image_url": product.image_url,
            "is_available": product.is_available,
            "is_visible": product.is_visible,
            "status": product.status.value if hasattr(product.status, "value") else product.status,
            "stock": inventory.current_stock if inventory else 0,
        },
    }


def _user_cart(db: Session, user_id: uuid.UUID) -> list[CartItem]:
    return (
        db.query(CartItem)
        .options(joinedload(CartItem.product).joinedload(Product.inventory))
        .filter(CartItem.user_id == user_id)
        .order_by(CartItem.created_at.asc())
        .all()
    )


@router.get("/", response_model=dict)
def list_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return {"items": [_serialize(item) for item in _user_cart(db, current_user.id)]}


@router.post("/items", response_model=dict)
def add_cart_item(
    payload: CartItemPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product_id = _product_uuid(payload.product_id)
    product = _available_product(db, product_id)
    item = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id, CartItem.product_id == product_id)
        .first()
    )
    if item:
        item.quantity = _clamp_quantity(product, item.quantity + payload.quantity)
    else:
        item = CartItem(
            user_id=current_user.id,
            product_id=product_id,
            item_key=f"product:{product_id}",
            item_data={},
            quantity=_clamp_quantity(product, payload.quantity),
        )
        db.add(item)
    db.commit()
    return {"items": [_serialize(cart_item) for cart_item in _user_cart(db, current_user.id)]}


@router.patch("/items/{product_id}", response_model=dict)
def update_cart_item(
    product_id: str,
    payload: CartItemPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    parsed_id = _product_uuid(product_id)
    product = _available_product(db, parsed_id)
    item = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id, CartItem.product_id == parsed_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found.")
    item.quantity = _clamp_quantity(product, payload.quantity)
    db.commit()
    return {"items": [_serialize(cart_item) for cart_item in _user_cart(db, current_user.id)]}


@router.delete("/items/{product_id}", response_model=dict)
def remove_cart_item(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    parsed_id = _product_uuid(product_id)
    db.query(CartItem).filter(
        CartItem.user_id == current_user.id,
        CartItem.product_id == parsed_id,
    ).delete(synchronize_session=False)
    db.commit()
    return {"items": [_serialize(item) for item in _user_cart(db, current_user.id)]}


@router.post("/sync", response_model=dict)
def sync_cart(
    payload: CartSyncPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for incoming in payload.items:
        product_id = _product_uuid(incoming.product_id)
        product = _available_product(db, product_id)
        item = (
            db.query(CartItem)
            .filter(CartItem.user_id == current_user.id, CartItem.product_id == product_id)
            .first()
        )
        if item:
            item.quantity = _clamp_quantity(product, max(item.quantity, incoming.quantity))
        else:
            db.add(
                CartItem(
                    user_id=current_user.id,
                    product_id=product_id,
                    item_key=f"product:{product_id}",
                    item_data={},
                    quantity=_clamp_quantity(product, incoming.quantity),
                )
            )
    db.commit()
    return {"items": [_serialize(item) for item in _user_cart(db, current_user.id)]}


def _web_item_key(item: dict[str, Any]) -> str:
    raw_id = str(item.get("id") or "").strip()
    if not raw_id:
        raise HTTPException(status_code=400, detail="Cart item ID is required.")
    try:
        return f"product:{uuid.UUID(raw_id)}"
    except ValueError:
        pass
    group = str(item.get("group") or "").strip()
    return f"web:{group}:{raw_id}"[:300]


def _optional_product(db: Session, item: dict[str, Any]) -> tuple[Optional[uuid.UUID], Optional[Product]]:
    try:
        product_id = uuid.UUID(str(item.get("id") or ""))
    except ValueError:
        return None, None
    return product_id, _available_product(db, product_id)


def _upsert_web_item(db: Session, user_id: uuid.UUID, incoming: dict[str, Any]) -> CartItem:
    item_key = _web_item_key(incoming)
    product_id, product = _optional_product(db, incoming)
    requested_quantity = int(incoming.get("qty") or 1)
    quantity = _clamp_quantity(product, requested_quantity) if product else min(max(requested_quantity, 1), 99)
    item = db.query(CartItem).filter(
        CartItem.user_id == user_id,
        CartItem.item_key == item_key,
    ).first()
    item_data = dict(incoming)
    item_data.pop("cartItemId", None)
    item_data["qty"] = quantity
    if item:
        item.product_id = product_id
        item.quantity = quantity
        item.item_data = item_data
    else:
        item = CartItem(
            user_id=user_id,
            product_id=product_id,
            item_key=item_key,
            item_data=item_data,
            quantity=quantity,
        )
        db.add(item)
    return item


@router.post("/web/items", response_model=dict)
def add_web_cart_item(
    payload: WebCartItemPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incoming = dict(payload.item)
    item_key = _web_item_key(incoming)
    existing = db.query(CartItem).filter(
        CartItem.user_id == current_user.id,
        CartItem.item_key == item_key,
    ).first()
    if existing:
        incoming["qty"] = existing.quantity + int(incoming.get("qty") or 1)
    _upsert_web_item(db, current_user.id, incoming)
    db.commit()
    return {"items": [_serialize(item) for item in _user_cart(db, current_user.id)]}


@router.put("/web", response_model=dict)
def replace_web_cart(
    payload: WebCartReplacePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete(synchronize_session=False)
    for incoming in payload.items:
        _upsert_web_item(db, current_user.id, incoming)
    db.commit()
    return {"items": [_serialize(item) for item in _user_cart(db, current_user.id)]}


@router.patch("/entries/{cart_item_id}", response_model=dict)
def update_cart_entry(
    cart_item_id: str,
    payload: CartQuantityPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry_id = _product_uuid(cart_item_id)
    item = db.query(CartItem).filter(
        CartItem.id == entry_id,
        CartItem.user_id == current_user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found.")
    item.quantity = _clamp_quantity(item.product, payload.quantity) if item.product else payload.quantity
    item.item_data = {**(item.item_data or {}), "qty": item.quantity}
    db.commit()
    return {"items": [_serialize(entry) for entry in _user_cart(db, current_user.id)]}


@router.delete("/entries/{cart_item_id}", response_model=dict)
def remove_cart_entry(
    cart_item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry_id = _product_uuid(cart_item_id)
    db.query(CartItem).filter(
        CartItem.id == entry_id,
        CartItem.user_id == current_user.id,
    ).delete(synchronize_session=False)
    db.commit()
    return {"items": [_serialize(entry) for entry in _user_cart(db, current_user.id)]}
