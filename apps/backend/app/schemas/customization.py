from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID


class CustomizationRequest(BaseModel):
    prompt_text: str
    flower_id: Optional[UUID] = None
    vase_id: Optional[UUID] = None
    wrapping_id: Optional[UUID] = None
    accessory_id: Optional[UUID] = None


class AlternativeItem(BaseModel):
    product_id: str
    product_name: str
    category: str
    price: float
    image_url: Optional[str] = None
    current_stock: int


class UnavailableItem(BaseModel):
    field: str
    product_id: str
    product_name: str
    reason: str
    alternatives: List[AlternativeItem]


class PriceBreakdownItem(BaseModel):
    """Single line item in the price breakdown."""
    material_type: str          # e.g. "Flower", "Vase", "Wrapping", "Accessory"
    product_name: str           # e.g. "Red Rose"
    unit_price: float
    quantity: int
    subtotal: float


class PriceBreakdown(BaseModel):
    """Full price breakdown of the arrangement."""
    items: List[PriceBreakdownItem]
    total_price: float


class CustomizationResponse(BaseModel):
    success: bool
    message: str
    generated_image_url: Optional[str] = None
    arrangement_id: Optional[str] = None
    unavailable_items: List[UnavailableItem] = []
    remaining_generations: int = 5
    price_breakdown: Optional[PriceBreakdown] = None  # ← populated on success