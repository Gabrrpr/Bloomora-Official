from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from uuid import UUID

from app.core.dependencies import get_db, get_current_user
from app.models import RoleEnum
from app.models.campaigns import Campaign
from app.models.product import Product

from app.schemas.campaigns import (
    CampaignCreateRequest,
    CampaignUpdateRequest,
    CampaignOut,
    CampaignProductsResponse,
    CampaignProductsRequest,
)

router = APIRouter(prefix="/campaigns", tags=["campaigns"])

# NOTE: This module intentionally exposes only simple CRUD endpoints and an /active filter.
# Auth is admin/staff only.



def require_admin_or_staff(current_user):
    if current_user.role not in [RoleEnum.admin, RoleEnum.staff]:
        raise HTTPException(status_code=403, detail="Admin or staff access required.")


@router.get("/", response_model=List[CampaignOut])
def list_campaigns(
    db: Session = Depends(get_db),
    only_active: bool = Query(False, description="If true, returns only is_active=true campaigns"),
):
    q = db.query(Campaign)
    if only_active:
        q = q.filter(Campaign.is_active == True)
    return q.order_by(Campaign.start_at.desc()).all()


@router.post("/", response_model=CampaignOut, status_code=201)
def create_campaign(
    payload: CampaignCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    require_admin_or_staff(current_user)

    exists = db.query(Campaign).filter(Campaign.campaign_key == payload.campaign_key).first()
    if exists:
        raise HTTPException(status_code=409, detail="campaign_key already exists")

    campaign = Campaign(
        name=payload.name,
        campaign_key=payload.campaign_key,
        start_at=payload.start_at,
        end_at=payload.end_at,
        is_active=payload.is_active,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.put("/{campaign_id}", response_model=CampaignOut)
def update_campaign(
    campaign_id: UUID,
    payload: CampaignUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    require_admin_or_staff(current_user)

    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if payload.campaign_key is not None:
        conflict = db.query(Campaign).filter(Campaign.campaign_key == payload.campaign_key, Campaign.id != campaign_id).first()
        if conflict:
            raise HTTPException(status_code=409, detail="campaign_key already exists")
        campaign.campaign_key = payload.campaign_key

    for field in ["name", "start_at", "end_at", "is_active"]:
        val = getattr(payload, field)
        if val is not None:
            setattr(campaign, field, val)

    db.commit()
    db.refresh(campaign)
    return campaign


@router.delete("/{campaign_id}", status_code=204)
def delete_campaign(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    require_admin_or_staff(current_user)

    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    db.delete(campaign)
    db.commit()
    return


@router.post("/{campaign_id}/products", response_model=CampaignProductsResponse)
def set_campaign_products(
    campaign_id: UUID,
    payload: CampaignProductsRequest, # 👈 Changed from List[UUID] to the Schema
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    require_admin_or_staff(current_user)

    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # 👈 Access product_ids through payload
    products = db.query(Product).filter(Product.id.in_(payload.product_ids)).all()
    campaign.products = products
    db.commit()
    db.refresh(campaign)

    return {
        "campaign": {
            "id": campaign.id,
            "name": campaign.name,
            "campaign_key": campaign.campaign_key,
            "start_at": campaign.start_at,
            "end_at": campaign.end_at,
            "is_active": campaign.is_active
        },
        "product_ids": [p.id for p in campaign.products]
    }


@router.get("/active", response_model=List[CampaignOut])
def get_active_campaigns(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    q = (
        db.query(Campaign)
        .filter(Campaign.is_active == True)
        .filter(Campaign.start_at <= now)
        .filter(Campaign.end_at >= now)
    )
    return q.order_by(Campaign.start_at.desc()).all()

