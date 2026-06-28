from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from google.genai import types
import uuid

from app.core.dependencies import get_db, get_current_user
from app.models import User, Arrangement
from app.models.product import Product
from app.models.arrangement import Flower, Vase, Wrapping, Accessory
from app.models.ai_usage_log import DAILY_AI_LIMIT
from app.schemas.customization import (
    CustomizationRequest,
    CustomizationResponse,
    UnavailableItem,
    PriceBreakdownItem,
    PriceBreakdown,
)
from app.services.pollinations_service import PollinationsService
from app.services.gemini_service import validate_and_optimize_prompt
from app.services.inventory_service import check_material_availability, get_alternatives
from app.services.ai_usage_service import (
    has_reached_daily_limit,
    log_ai_usage,
    get_remaining_generations,
)

router = APIRouter(prefix="/customization", tags=["Customization"])
pollinations = PollinationsService()


def calculate_price_breakdown(
    flower: Optional[Flower],
    vase: Optional[Vase],
    wrapping: Optional[Wrapping],
    accessory: Optional[Accessory],
    wrapping_product: Optional[Product] = None,
    accessory_product: Optional[Product] = None,
) -> PriceBreakdown:
    """
    Builds an itemized price breakdown from the explicitly selected materials.
    Falls back to Product records when Wrapping/Accessory sub-table rows are missing.
    """
    items: List[PriceBreakdownItem] = []

    if flower:
        subtotal = float(flower.unit_price) * flower.quantity
        items.append(PriceBreakdownItem(
            material_type="Flower",
            product_id=str(flower.product_id),
            product_name=f"{flower.color} {flower.style}" if flower.color and flower.style else "Flower",
            unit_price=float(flower.unit_price),
            quantity=flower.quantity,
            subtotal=subtotal,
        ))

    if vase:
        subtotal = float(vase.unit_price) * vase.quantity
        items.append(PriceBreakdownItem(
            material_type="Vase",
            product_id=str(vase.product_id),
            product_name=f"{vase.style} {vase.material} Vase" if vase.style and vase.material else "Vase",
            unit_price=float(vase.unit_price),
            quantity=vase.quantity,
            subtotal=subtotal,
        ))

    if wrapping:
        subtotal = float(wrapping.unit_price) * wrapping.quantity
        items.append(PriceBreakdownItem(
            material_type="Wrapping",
            product_id=str(wrapping.product_id),
            product_name=f"{wrapping.color} {wrapping.style} Wrapping" if wrapping.color and wrapping.style else "Wrapping",
            unit_price=float(wrapping.unit_price),
            quantity=wrapping.quantity,
            subtotal=subtotal,
        ))
    elif wrapping_product:
        subtotal = float(wrapping_product.price)
        items.append(PriceBreakdownItem(
            material_type="Wrapping",
            product_id=str(wrapping_product.id),
            product_name=wrapping_product.name,
            unit_price=float(wrapping_product.price),
            quantity=1,
            subtotal=subtotal,
        ))

    if accessory:
        subtotal = float(accessory.unit_price) * accessory.quantity
        items.append(PriceBreakdownItem(
            material_type="Accessory",
            product_id=str(accessory.product_id),
            product_name=accessory.name if accessory.name else "Accessory",
            unit_price=float(accessory.unit_price),
            quantity=accessory.quantity,
            subtotal=subtotal,
        ))
    elif accessory_product:
        subtotal = float(accessory_product.price)
        items.append(PriceBreakdownItem(
            material_type="Accessory",
            product_id=str(accessory_product.id),
            product_name=accessory_product.name,
            unit_price=float(accessory_product.price),
            quantity=1,
            subtotal=subtotal,
        ))

    total_price = sum(item.subtotal for item in items)

    return PriceBreakdown(items=items, total_price=total_price)


@router.get("/ai-usage", tags=["Customization"])
def get_ai_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
    # ── Step 1: Check daily AI usage limit ───────────────────────────────
    if has_reached_daily_limit(db, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"You have reached your daily limit of {DAILY_AI_LIMIT} AI generations. Please try again tomorrow."
        )

    # ── Step 2: Check each explicitly selected material ──────────────────
    unavailable_items: List[UnavailableItem] = []

    material_checks = [
        ("flower_id",    payload.flower_id,    "flower"),
        ("vase_id",      payload.vase_id,      "vase"),
        ("wrapping_id",  payload.wrapping_id,  "wrapping"),
        ("accessory_id", payload.accessory_id, "accessory"),
    ]

    for field_name, material_id, category in material_checks:
        if not material_id:
            continue

        result = check_material_availability(db, material_id)

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

    # ── Step 3: If explicit materials are unavailable, return early ───────
    if unavailable_items:
        remaining = get_remaining_generations(db, current_user.id)
        return CustomizationResponse(
            success=False,
            message="Some selected materials are currently unavailable. Please choose from the suggested alternatives.",
            generated_image_url=None,
            unavailable_items=unavailable_items,
            remaining_generations=remaining,
        )

    # ── Step 4: Gemini Intelligent Prompt Validation ──────────────────────
    db_products = db.query(Product.name).filter(Product.is_available == True).all()
    inventory_names = [p[0] for p in db_products]
    
    if not inventory_names:
        inventory_names = ["Red Roses", "White Tulips", "Sunflowers", "Pink Carnations"]

    ai_verdict = validate_and_optimize_prompt(payload.prompt_text, inventory_names)

    if not ai_verdict.get("is_possible"):
        remaining = get_remaining_generations(db, current_user.id)
        return CustomizationResponse(
            success=False,
            message=ai_verdict.get("feedback") or "We cannot fulfill this exact arrangement with our current stock.",
            generated_image_url=None,
            unavailable_items=[],
            remaining_generations=remaining,
        )

    # ── Step 5: Look up material records using product IDs ────────────────
    wrapping_product = None
    accessory_product = None
    wrapping = None
    accessory = None

    if payload.wrapping_id:
        wrapping = db.query(Wrapping).filter(Wrapping.product_id == payload.wrapping_id).first()
        if not wrapping:
            wrapping_product = db.query(Product).filter(Product.id == payload.wrapping_id).first()

    if payload.accessory_id:
        accessory = db.query(Accessory).filter(Accessory.product_id == payload.accessory_id).first()
        if not accessory:
            accessory_product = db.query(Product).filter(Product.id == payload.accessory_id).first()

    flower    = db.query(Flower).filter(Flower.product_id == payload.flower_id).first() if payload.flower_id else None
    vase      = db.query(Vase).filter(Vase.product_id == payload.vase_id).first() if payload.vase_id else None

    # ── Step 6: Save arrangement ──────────────────────────────────────────
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

    # ── Step 7: Generate image via Pollinations (Using Optimized Prompt) ──
    base_optimized_prompt = ai_verdict.get("optimized_prompt") or payload.prompt_text
    
    final_image_prompt = (
        f"{base_optimized_prompt}. "
        f"CRITICAL VISUAL RULE: Only depict the floral arrangement bouquet, vase, and wrapping paper. "
        f"DO NOT include any external add-on items like greeting cards, chocolates, teddy bears, balloons, jewelry, or extras in the image. "
        f"Focus solely on the clean florist presentation of the flowers."
    )
    
    generated_url = await pollinations.generate_arrangement_image(
        db=db,
        arrangement_id=str(arrangement.id),
        optimized_prompt=final_image_prompt # Pass our locked down prompt
    )

    if not generated_url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Image generation failed. Please try again."
        )

    # ── Step 8: Calculate price breakdown (Merged!) ───────────────────────
    # 8a. Calculate the base items the user selected via dropdowns
    price_breakdown = calculate_price_breakdown(
        flower, vase, wrapping, accessory,
        wrapping_product=wrapping_product,
        accessory_product=accessory_product,
    )
    
    # 8b. Add items that Gemini intelligently extracted from their text prompt
    used_item_objects = ai_verdict.get("used_items", []) # Now a list of dicts: [{'name': '...', 'quantity': int}]
    
    if used_item_objects:
        # 1. Extract the raw string names so SQLAlchemy can search for them
        extracted_names = [
            item['name'] for item in used_item_objects 
            if isinstance(item, dict) and 'name' in item
        ]
        
        # 2. Fetch the products from the DB
        ai_selected_products = db.query(Product).filter(Product.name.in_(extracted_names)).all()
        
        # 3. Create a dictionary map for easy quantity lookup
        ai_quantities_map = { 
            item['name']: int(item.get('quantity', 1)) 
            for item in used_item_objects 
            if isinstance(item, dict) and 'name' in item 
        }

        # 4. Get list of IDs already in the breakdown so we don't double charge!
        existing_ids = [item.product_id for item in price_breakdown.items]
        
        for prod in ai_selected_products:
            if str(prod.id) not in existing_ids:
                # Get the quantity from our map, fallback to 1 just in case
                ai_quantity = ai_quantities_map.get(prod.name, 1)
                
                # Assuming your Product model has a 'price' column (or 'unit_price' fallback)
                item_price = float(getattr(prod, 'price', getattr(prod, 'unit_price', 0.0)))
                subtotal_price = item_price * ai_quantity
                
                price_breakdown.items.append(PriceBreakdownItem(
                    material_type="Custom Request (AI)",
                    product_id=str(prod.id),
                    product_name=prod.name,
                    unit_price=item_price,
                    quantity=ai_quantity,
                    subtotal=subtotal_price
                ))
                price_breakdown.total_price += subtotal_price

    # Update arrangement with final estimated price
    arrangement.estimated_price = price_breakdown.total_price
    arrangement.generated_image_url = generated_url
    db.commit()

    # ── Step 9: Log the AI usage ──────────────────────────────────────────
    log_ai_usage(
        db=db,
        user_id=current_user.id,
        prompt_text=payload.prompt_text,
        image_url=generated_url,
    )

    remaining = get_remaining_generations(db, current_user.id)

    # Ensure frontend always gets a price_breakdown with items/total.
    return CustomizationResponse(
        success=True,
        message=f"Your arrangement has been generated! You have {remaining} AI generation(s) left today.",
        generated_image_url=generated_url,
        arrangement_id=str(arrangement.id),
        unavailable_items=[],
        remaining_generations=remaining,
        price_breakdown=price_breakdown if price_breakdown is not None else PriceBreakdown(items=[], total_price=0.0),
    )
class CardRequest(BaseModel):
    relationship: str
    occasion: str
    tone: str
    extra: str = ""

# 2. Create the new endpoint
@router.post("/generate-card", tags=["Customization"])
def generate_card(req: CardRequest):
    """Uses Gemini to generate a personalized greeting card message."""
    
    # Build the instruction for Gemini
    prompt = f"Write a short, heartfelt greeting card message for a floral delivery. Relationship: {req.relationship}. Occasion: {req.occasion}. Tone: {req.tone}. Extra context: {req.extra}. Keep it under 3 sentences. Do not include quotes around the message."
    
    try:
        # Import your existing Gemini client
        from app.services.gemini_service import client 
        
        response = client.models.generate_content(
            model='gemini-2.5-flash', 
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7, # Higher temperature makes it more creative
            )
        )
        # Clean up any accidental quotes Gemini might add
        clean_message = response.text.strip().strip('"')
        return {"message": clean_message}
        
    except Exception as e:
        print(f"Gemini Card Error: {e}")
        # Safe fallback so the frontend doesn't break
        return {"message": "Thinking of you on this special day. Enjoy the beautiful flowers!"}

