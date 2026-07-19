from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class CampaignCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    campaign_key: str = Field(..., min_length=1, max_length=50)
    start_at: datetime
    end_at: Optional[datetime] = None
    is_active: bool = True
    discount_type: Optional[str] = Field(None, max_length=20)
    discount_value: Optional[float] = Field(None, ge=0)
    minimum_quantity: Optional[int] = Field(None, ge=1)
    eligible_category: Optional[str] = Field(None, min_length=1, max_length=100)
    branches: List[str] = Field(default_factory=lambda: ["all"])


class CampaignUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    campaign_key: Optional[str] = Field(None, min_length=1, max_length=50)
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    is_active: Optional[bool] = None
    discount_type: Optional[str] = Field(None, max_length=20)
    discount_value: Optional[float] = Field(None, ge=0)
    minimum_quantity: Optional[int] = Field(None, ge=1)
    eligible_category: Optional[str] = Field(None, min_length=1, max_length=100)
    branches: Optional[List[str]] = None
    
class CampaignProductsRequest(BaseModel):
    product_ids: List[UUID]
    discount_type: Optional[str] = Field(None, max_length=20)
    discount_value: Optional[float] = Field(None, ge=0)
    minimum_quantity: Optional[int] = Field(None, ge=1)
    eligible_category: Optional[str] = Field(None, min_length=1, max_length=100)
    branches: Optional[List[str]] = None


class CampaignOut(BaseModel):
    id: UUID
    name: str
    campaign_key: str
    start_at: datetime
    end_at: Optional[datetime] = None
    is_active: bool
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    minimum_quantity: Optional[int] = None
    eligible_category: Optional[str] = None
    branches: List[str] = Field(default_factory=lambda: ["all"])
    product_ids: List[UUID] = []


class CampaignsListResponse(BaseModel):
    campaigns: List[CampaignOut]


class CampaignProductsResponse(BaseModel):
    campaign: CampaignOut
    product_ids: List[UUID]

