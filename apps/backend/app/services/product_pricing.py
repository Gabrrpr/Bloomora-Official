from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from app.models.product import Product


SUPPORTED_BRANCHES = {"manila", "pampanga"}


def normalize_branch(branch: Optional[str]) -> str:
    value = str(branch or "").strip().lower()
    return value if value in SUPPORTED_BRANCHES else ""


def flash_sale_discount(product: Product, branch: Optional[str]) -> Decimal:
    normalized = normalize_branch(branch)
    discounts = getattr(product, "flash_sale_discounts", None) or {}
    if not normalized or not isinstance(discounts, dict):
        return Decimal("0")

    try:
        discount = Decimal(str(discounts.get(normalized, 0)))
    except (TypeError, ValueError):
        return Decimal("0")
    return discount if Decimal("0") < discount <= Decimal("100") else Decimal("0")


def product_price_for_branch(product: Product, branch: Optional[str]) -> Decimal:
    base_price = Decimal(str(product.price or 0))
    discount = flash_sale_discount(product, branch)
    if discount <= 0:
        return base_price
    return (base_price * (Decimal("100") - discount) / Decimal("100")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )


def product_price_payload(product: Product, branch: Optional[str]) -> dict:
    base_price = Decimal(str(product.price or 0))
    discount = flash_sale_discount(product, branch)
    current_price = product_price_for_branch(product, branch)
    return {
        "price": float(current_price),
        "original_price": float(base_price) if discount > 0 else None,
        "flash_sale_discount_percent": float(discount) if discount > 0 else None,
        "flash_sale_discounts": getattr(product, "flash_sale_discounts", None) or {},
    }
