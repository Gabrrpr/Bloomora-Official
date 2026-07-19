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
SHOP_ONLY_KEYWORDS = ("pot filler", "pot fillers")


def is_shop_only_customization_product(*values: object) -> bool:
    searchable_text = " ".join(str(value or "") for value in values).lower()
    return any(keyword in searchable_text for keyword in SHOP_ONLY_KEYWORDS)


def is_customization_material_product(product: Product) -> bool:
    """Classify raw arrangement materials, including older incorrectly flagged rows."""
    searchable_values = [
        getattr(product, "category", ""),
        getattr(product, "product_type", ""),
        getattr(product, "product_group", ""),
        getattr(product, "name", ""),
    ]
    if is_shop_only_customization_product(*searchable_values):
        return False

    searchable_text = " ".join(str(value or "") for value in searchable_values).lower()
    if any(keyword in searchable_text for keyword in ARRANGEMENT_KEYWORDS):
        return False
    if bool(getattr(product, "is_customization_material", False)):
        return True

    material_keywords = MATERIAL_KEYWORDS + (
        "rose", "tulip", "carnation", "sunflower",
    )
    return any(keyword in searchable_text for keyword in material_keywords)


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
    shop_only_match = or_(
        *[
            searchable_product_text.ilike(f"%{keyword}%")
            for keyword in SHOP_ONLY_KEYWORDS
        ],
    )
    rows = (
        db.query(Product, Inventory)
        .outerjoin(Inventory, Inventory.product_id == Product.id)
        .filter(Product.status != ProductStatusEnum.inactive)
        .filter(material_match)
        .filter(~arrangement_match)
        .filter(~shop_only_match)
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
