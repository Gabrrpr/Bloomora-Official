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


class CustomizationResponse(BaseModel):
    success: bool
    message: str
    generated_image_url: Optional[str] = None
    arrangement_id: Optional[str] = None
    unavailable_items: List[UnavailableItem] = []
    remaining_generations: int = 5      # ← how many AI uses left today


class PriceBreakdownItem(BaseModel):
    material_type: str
    product_name: str
    unit_price: float
    quantity: int
    subtotal: float


class PriceBreakdown(BaseModel):
    items: List[PriceBreakdownItem]
    total_price: float

