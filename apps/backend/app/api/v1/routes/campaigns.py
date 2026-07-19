from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from datetime import datetime
from uuid import UUID

from app.core.dependencies import get_db, get_current_user
from app.models import RoleEnum
from app.models.campaigns import Campaign
from app.models.product import Product, ProductStatusEnum
from app.services.customization_inventory import is_customization_material_product

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


def _validate_discount(discount_type: Optional[str], discount_value: Optional[float]) -> tuple[Optional[str], Optional[float]]:
    if not discount_type or not discount_value:
        return None, None
    if discount_type not in {"percent", "fixed", "bundle_percent"}:
        raise HTTPException(status_code=400, detail="Campaign discount type must be percent, fixed, or bundle_percent.")
    if discount_type in {"percent", "bundle_percent"} and discount_value > 100:
        raise HTTPException(status_code=400, detail="Campaign percent discount cannot exceed 100.")
    return discount_type, discount_value


def serialize_campaign(campaign: Campaign) -> dict:
    return {
        "id": campaign.id,
        "name": campaign.name,
        "campaign_key": campaign.campaign_key,
        "start_at": campaign.start_at,
        "end_at": campaign.end_at,
        "is_active": campaign.is_active,
        "discount_type": campaign.discount_type,
        "discount_value": float(campaign.discount_value) if campaign.discount_value is not None else None,
        "minimum_quantity": campaign.minimum_quantity,
        "eligible_category": campaign.eligible_category,
        "product_ids": [p.id for p in campaign.products or []],
    }


@router.get("/", response_model=List[CampaignOut])
def list_campaigns(
    db: Session = Depends(get_db),
    only_active: bool = Query(False, description="If true, returns only is_active=true campaigns"),
):
    q = db.query(Campaign)
    if only_active:
        q = q.filter(Campaign.is_active == True)
    return [serialize_campaign(campaign) for campaign in q.order_by(Campaign.start_at.desc()).all()]


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

    discount_type, discount_value = _validate_discount(payload.discount_type, payload.discount_value)
    if discount_type == "bundle_percent" and (not payload.minimum_quantity or not payload.eligible_category):
        raise HTTPException(status_code=400, detail="Bundle campaigns require a minimum quantity and eligible category.")

    campaign = Campaign(
        name=payload.name,
        campaign_key=payload.campaign_key,
        start_at=payload.start_at,
        end_at=payload.end_at,
        is_active=payload.is_active,
        discount_type=discount_type,
        discount_value=discount_value,
        minimum_quantity=payload.minimum_quantity if discount_type == "bundle_percent" else None,
        eligible_category=payload.eligible_category.strip().lower() if discount_type == "bundle_percent" and payload.eligible_category else None,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return serialize_campaign(campaign)


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

    for field in ["name", "start_at", "end_at", "is_active", "minimum_quantity"]:
        val = getattr(payload, field)
        if val is not None:
            setattr(campaign, field, val)
    fields_set = getattr(payload, "model_fields_set", getattr(payload, "__fields_set__", set()))
    if "discount_type" in fields_set or "discount_value" in fields_set:
        campaign.discount_type, campaign.discount_value = _validate_discount(payload.discount_type, payload.discount_value)
        if campaign.discount_type != "bundle_percent":
            campaign.minimum_quantity = None
            campaign.eligible_category = None
    if "eligible_category" in fields_set:
        campaign.eligible_category = payload.eligible_category.strip().lower() if payload.eligible_category else None
    if campaign.discount_type == "bundle_percent" and (
        not campaign.minimum_quantity or (not campaign.eligible_category and not campaign.products)
    ):
        raise HTTPException(status_code=400, detail="Bundle campaigns require a minimum quantity and eligible category.")

    db.commit()
    db.refresh(campaign)
    return serialize_campaign(campaign)


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
    products = (
        db.query(Product)
        .filter(
            Product.id.in_(payload.product_ids),
            Product.is_visible.is_(True),
            Product.status == ProductStatusEnum.active,
            Product.is_customization_material.is_(False),
        )
        .all()
        if payload.product_ids
        else []
    )
    products = [product for product in products if not is_customization_material_product(product)]
    if len(products) != len(set(payload.product_ids)):
        raise HTTPException(
            status_code=400,
            detail="Promotions can only include active customer-visible products, not raw materials.",
        )
    campaign.products = products
    fields_set = getattr(payload, "model_fields_set", getattr(payload, "__fields_set__", set()))
    if "discount_type" in fields_set or "discount_value" in fields_set:
        campaign.discount_type, campaign.discount_value = _validate_discount(payload.discount_type, payload.discount_value)
    if "minimum_quantity" in fields_set:
        campaign.minimum_quantity = payload.minimum_quantity
    if "eligible_category" in fields_set:
        campaign.eligible_category = payload.eligible_category.strip().lower() if payload.eligible_category else None
    if campaign.discount_type == "bundle_percent" and (
        not campaign.minimum_quantity or (not campaign.eligible_category and not campaign.products)
    ):
        raise HTTPException(status_code=400, detail="Bundle campaigns require a minimum quantity and eligible category.")
    db.commit()
    db.refresh(campaign)

    return {
        "campaign": serialize_campaign(campaign),
        "product_ids": [p.id for p in campaign.products]
    }


@router.get("/active", response_model=List[CampaignOut])
def get_active_campaigns(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    q = (
        db.query(Campaign)
        .filter(Campaign.is_active == True)
        .filter(Campaign.start_at <= now)
        .filter(or_(Campaign.end_at.is_(None), Campaign.end_at >= now))
    )
    return [serialize_campaign(campaign) for campaign in q.order_by(Campaign.start_at.desc()).all()]

