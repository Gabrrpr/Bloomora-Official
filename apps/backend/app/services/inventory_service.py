from sqlalchemy.orm import Session
from typing import Optional, List
import uuid

from app.models import Inventory, Product, ProductCategoryEnum
from app.schemas.customization import AlternativeItem


class AvailabilityResult:
    def __init__(self, is_available: bool, product_name: str, reason: Optional[str] = None):
        self.is_available = is_available
        self.product_name = product_name
        self.reason = reason


def check_material_availability(db: Session, material_id: uuid.UUID) -> AvailabilityResult:
    inventory = db.query(Inventory).filter(Inventory.product_id == material_id).first()
    product = db.query(Product).filter(Product.id == material_id).first()

    product_name = product.name if product else str(material_id)

    if not inventory:
        return AvailabilityResult(False, product_name, "Product not found in inventory")

    if inventory.quantity <= 0:
        return AvailabilityResult(False, product_name, "Out of stock")

    return AvailabilityResult(True, product_name)


def get_alternatives(
    db: Session,
    category: ProductCategoryEnum,
    exclude_id: Optional[uuid.UUID] = None,
) -> List[AlternativeItem]:
    query = (
        db.query(Product, Inventory)
        .join(Inventory, Inventory.product_id == Product.id)
        .filter(
            Product.category == category,
            Inventory.quantity > 0,
        )
    )

    if exclude_id:
        query = query.filter(Product.id != exclude_id)

    results = query.limit(5).all()

    return [
        AlternativeItem(
            product_id=str(product.id),
            product_name=product.name,
            price=float(product.price),
        )
        for product, inventory in results
    ]