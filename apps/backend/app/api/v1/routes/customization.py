from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.core.dependencies import get_db, get_current_user
from app.models import (
    User, Arrangement,
    ProductCategoryEnum,
)
from app.models.ai_usage_log import DAILY_AI_LIMIT
from app.schemas.customization import (
    CustomizationRequest,
    CustomizationResponse,
    UnavailableItem,
)
from app.services.pollinations_service import PollinationsService
from app.services.inventory_service import check_material_availability, get_alternatives
from app.services.ai_usage_service import (
    has_reached_daily_limit,
    log_ai_usage,
    get_remaining_generations,
)

router = APIRouter(prefix="/customization", tags=["Customization"])
pollinations = PollinationsService()


@router.get("/ai-usage", tags=["Customization"])
def get_ai_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns how many AI generations the current user has left today."""
    remaining = get_remaining_generations(db, current_user.id)
    return {
        "used": DAILY_AI_LIMIT - remaining,
        "remaining": remaining,
        "limit": DAILY_AI_LIMIT,
        "message": f"You have {remaining} AI generation(s) left for today."
    }


@router.post("/check-and-generate", response_model=CustomizationResponse)
async def check_and_generate(
    payload: CustomizationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Two-Way Customization endpoint.

    Flow:
    1. Check if user has remaining AI generations today (limit: 5/day)
    2. Check inventory availability for all selected materials
    3a. All available → generate image via Pollinations.ai → log usage
    3b. Some unavailable → return unavailable items + suggested alternatives
    """

    # ── Step 1: Check daily AI usage limit ───────────────────────────────
    if has_reached_daily_limit(db, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"You have reached your daily limit of {DAILY_AI_LIMIT} AI generations. Please try again tomorrow."
        )

    # ── Step 2: Check each selected material ─────────────────────────────
    unavailable_items: List[UnavailableItem] = []

    material_checks = [
        ("flower_id",    payload.flower_id,    ProductCategoryEnum.flower),
        ("vase_id",      payload.vase_id,      ProductCategoryEnum.vase),
        ("wrapping_id",  payload.wrapping_id,  ProductCategoryEnum.wrapping),
        ("accessory_id", payload.accessory_id, ProductCategoryEnum.accessory),
    ]

    for field_name, material_id, category in material_checks:
        if not material_id:
            continue

        print(f"DEBUG: checking {field_name} = {material_id}")
        result = check_material_availability(db, material_id)
        print(f"DEBUG: result = {result}")

        if not result.is_available:
            alternatives = get_alternatives(db, category, exclude_id=material_id)
            unavailable_items.append(
                UnavailableItem(
                    field=field_name,
                    product_id=str(material_id),
                    product_name=result.product_name,
                    reason=result.reason,
                    alternatives=alternatives,
                )
            )

    # ── Step 3a: Some unavailable → return notification + alternatives ────
    if unavailable_items:
        remaining = get_remaining_generations(db, current_user.id)
        return CustomizationResponse(
            success=False,
            message="Some selected materials are currently unavailable. Please choose from the suggested alternatives.",
            generated_image_url=None,
            unavailable_items=unavailable_items,
            remaining_generations=remaining,
        )

    # ── Step 3b: All available → save arrangement + generate image ────────
    from app.models.arrangement import Flower, Vase, Wrapping, Accessory
    
    flower   = db.query(Flower).filter(Flower.product_id == payload.flower_id).first() if payload.flower_id else None
    vase     = db.query(Vase).filter(Vase.product_id == payload.vase_id).first() if payload.vase_id else None
    wrapping = db.query(Wrapping).filter(Wrapping.product_id == payload.wrapping_id).first() if payload.wrapping_id else None
    accessory = db.query(Accessory).filter(Accessory.product_id == payload.accessory_id).first() if payload.accessory_id else None
    
    arrangement = Arrangement(
        id=uuid.uuid4(),
        prompt_text=payload.prompt_text,
        flower_id=flower.id if flower else None,
        vase_id=vase.id if vase else None,
        wrapping_id=wrapping.id if wrapping else None,
        accessory_id=accessory.id if accessory else None,
    )
    db.add(arrangement)
    db.commit()
    db.refresh(arrangement)
    
    # Generate image via Pollinations
    generated_url = await pollinations.generate_arrangement_image(
        db=db,
        arrangement_id=str(arrangement.id),
    )

    if not generated_url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Image generation failed. Please try again."
        )

    # ── Step 4: Log the AI usage ──────────────────────────────────────────
    log_ai_usage(
        db=db,
        user_id=current_user.id,
        prompt_text=payload.prompt_text,
        image_url=generated_url,
    )

    remaining = get_remaining_generations(db, current_user.id)

    return CustomizationResponse(
        success=True,
        message=f"Your arrangement has been generated! You have {remaining} AI generation(s) left today.",
        generated_image_url=generated_url,
        arrangement_id=str(arrangement.id),
        unavailable_items=[],
        remaining_generations=remaining,
    )