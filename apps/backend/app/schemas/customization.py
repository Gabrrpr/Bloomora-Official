from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from uuid import UUID


class SelectedCustomizationItem(BaseModel):
    product_id: UUID
    quantity: int = Field(default=1, ge=1, le=999)


class CustomizationRequest(BaseModel):
    prompt_text: str
    flower_id: Optional[UUID] = None
    vase_id: Optional[UUID] = None
    wrapping_id: Optional[UUID] = None
    accessory_id: Optional[UUID] = None
    arrangement_type: Optional[str] = None
    review_only: bool = False
    selected_items: List[SelectedCustomizationItem] = Field(default_factory=list)


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


class ArrangementLimit(BaseModel):
    label: str
    max_stems: int


class CustomizationRulesResponse(BaseModel):
    arrangement_limits: Dict[str, ArrangementLimit]


class ValidationRequestedItem(BaseModel):
    product_id: Optional[str] = None
    product_name: str
    requested_quantity: int
    available_quantity: int
    material_type: Optional[str] = None


class ValidationSuggestedItem(BaseModel):
    product_id: Optional[str] = None
    product_name: str
    quantity: int
    available_quantity: Optional[int] = None
    material_type: str = "flower"
    required: bool = False


class QuantityValidation(BaseModel):
    code: str
    arrangement_type: str
    max_stems: int
    requested_total: int
    requested_items: List[ValidationRequestedItem]
    suggested_items: List[ValidationSuggestedItem]
    suggested_prompt: str
    adjustment_reasons: List[str]


class PriceBreakdownItem(BaseModel):
    material_type: str
    product_id: Optional[str] = None
    product_name: str
    image_url: Optional[str] = None
    unit_price: float
    quantity: int
    subtotal: float


class PriceBreakdown(BaseModel):
    items: List[PriceBreakdownItem]
    total_price: float


class CustomizationResponse(BaseModel):
    success: bool
    message: str
    generated_image_url: Optional[str] = None
    arrangement_id: Optional[str] = None
    arrangement_type: Optional[str] = None
    price_breakdown: Optional[PriceBreakdown] = None
    remaining_generations: int = 5
    unavailable_items: List[UnavailableItem] = Field(default_factory=list)
    validation: Optional[QuantityValidation] = None

