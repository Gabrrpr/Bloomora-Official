from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class CampaignCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    campaign_key: str = Field(..., min_length=1, max_length=50)
    start_at: datetime
    end_at: datetime
    is_active: bool = True


class CampaignUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    campaign_key: Optional[str] = Field(None, min_length=1, max_length=50)
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    is_active: Optional[bool] = None
    
class CampaignProductsRequest(BaseModel):
    product_ids: List[UUID]


class CampaignOut(BaseModel):
    id: UUID
    name: str
    campaign_key: str
    start_at: datetime
    end_at: datetime
    is_active: bool


class CampaignsListResponse(BaseModel):
    campaigns: List[CampaignOut]


class CampaignProductsResponse(BaseModel):
    campaign: CampaignOut
    product_ids: List[UUID]

