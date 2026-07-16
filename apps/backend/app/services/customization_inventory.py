from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.product import Inventory, Product, ProductStatusEnum
from app.services.customization_rules import InventoryMaterial, safe_inventory_quantity


MATERIAL_KEYWORDS = (
    "flower", "flowers", "vase", "wrapping", "wrapper", "ribbon",
    "accessory", "accessories", "add-on", "addon", "filler", "stem",
    "box", "container", "foam", "material", "raw",
)
ARRANGEMENT_KEYWORDS = ("arrangement", "bouquet", "floral design", "gift set")


def load_customization_inventory(db: Session) -> list[InventoryMaterial]:
    searchable_product_text = func.lower(func.concat(
        func.coalesce(Product.category, ""), " ",
        func.coalesce(Product.product_type, ""), " ",
        func.coalesce(Product.product_group, ""), " ",
        func.coalesce(Product.name, ""),
    ))
    material_match = or_(
        Product.is_customization_material == True,
        *[
            searchable_product_text.ilike(f"%{keyword}%")
            for keyword in MATERIAL_KEYWORDS
        ],
    )
    arrangement_match = or_(
        *[
            searchable_product_text.ilike(f"%{keyword}%")
            for keyword in ARRANGEMENT_KEYWORDS
        ],
    )
    rows = (
        db.query(Product, Inventory)
        .outerjoin(Inventory, Inventory.product_id == Product.id)
        .filter(Product.status != ProductStatusEnum.inactive)
        .filter(material_match)
        .filter(~arrangement_match)
        .all()
    )
    return [
        InventoryMaterial(
            product_id=str(product.id),
            product_name=product.name,
            category=str(product.category or ""),
            product_type=str(product.product_type or ""),
            safe_quantity=safe_inventory_quantity(
                inventory.current_stock if inventory else 0,
                inventory.reorder_point if inventory else 0,
            ),
            unit_price=float(product.price or 0),
            image_url=product.image_url,
        )
        for product, inventory in rows
    ]
