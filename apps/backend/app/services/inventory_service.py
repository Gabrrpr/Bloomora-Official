from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from uuid import UUID
from dataclasses import dataclass

from app.models.product import Product, Inventory, ProductStatusEnum
from app.schemas.customization import AlternativeItem


@dataclass
class AvailabilityResult:
    is_available: bool
    product_name: str
    reason: str = ""


def check_material_availability(db: Session, product_id) -> AvailabilityResult:
    try:
        pid = UUID(str(product_id))
    except (ValueError, AttributeError):
        return AvailabilityResult(
            is_available=False,
            product_name="Unknown",
            reason="Invalid product ID."
        )

    product = db.query(Product).filter(Product.id == pid).first()

    if not product:
        return AvailabilityResult(
            is_available=False,
            product_name="Unknown",
            reason="Product not found."
        )

    if product.status.value == "inactive":
        return AvailabilityResult(
            is_available=False,
            product_name=product.name,
            reason="This item is currently not offered."
        )

    if product.status.value == "out_of_stock":
        return AvailabilityResult(
            is_available=False,
            product_name=product.name,
            reason="Out of stock."
        )

    inventory = db.query(Inventory).filter(Inventory.product_id == pid).first()

    if not inventory or inventory.current_stock <= 0:
        return AvailabilityResult(
            is_available=False,
            product_name=product.name,
            reason="Out of stock."
        )

    if inventory.current_stock <= inventory.reorder_point:
        return AvailabilityResult(
            is_available=False,
            product_name=product.name,
            reason="Low stock — not enough to fulfill this order."
        )

    return AvailabilityResult(
        is_available=True,
        product_name=product.name,
    )


def get_alternatives(
    db: Session,
    category: str,  # 👈 Change 1: Updated type hint to string
    exclude_id=None,
    limit: int = 3,
) -> List[AlternativeItem]:
    query = (
        db.query(Product, Inventory)
        .join(Inventory, Inventory.product_id == Product.id)
        .filter(
            and_(
                Product.category == category,
                Product.is_available == True,
                Inventory.current_stock > Inventory.reorder_point,
            )
        )
    )

    if exclude_id:
        try:
            query = query.filter(Product.id != UUID(str(exclude_id)))
        except (ValueError, AttributeError):
            pass

    results = query.limit(limit).all()

    return [
        AlternativeItem(
            product_id=str(p.id),
            product_name=p.name,
            # 👇 Change 2: Removed .value (Strings don't have a .value property!)
            category=p.category, 
            price=float(p.price),
            image_url=p.image_url,
            current_stock=i.current_stock,
        )
        for p, i in results
    ]