from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from google.genai import types
import uuid
import re

from app.core.dependencies import get_db, get_current_user
from app.models import User, Arrangement
from app.models.arrangement import Flower, Vase, Wrapping, Accessory
from app.models.ai_usage_log import DAILY_AI_LIMIT
from app.schemas.customization import (
    CustomizationRequest,
    CustomizationResponse,
    CustomizationRulesResponse,
    QuantityValidation,
    UnavailableItem,
    PriceBreakdownItem,
    PriceBreakdown,
)
from app.services.pollinations_service import PollinationsGenerationError, PollinationsService
from app.services.gemini_service import PromptExtractionError, validate_and_optimize_prompt
from app.services.customization_rules import (
    QuantityAdjustment,
    RequestedMaterial,
    build_complete_image_prompt,
    build_default_recipe_suggestion,
    build_presentation_recovery,
    build_quantity_adjustment,
    extract_prompt_requested_materials,
    get_material_type_label,
    has_specific_material_request,
    is_probably_floral_request,
    normalize_arrangement_type,
    normalize_requested_materials,
    public_arrangement_rules,
    recipe_has_flowers,
    resolve_complete_recipe,
)
from app.services.customization_inventory import load_customization_inventory
from app.services.inventory_service import check_material_availability, get_alternatives
from app.services.ai_usage_service import (
    has_reached_daily_limit,
    log_ai_usage,
    get_remaining_generations,
)

router = APIRouter(prefix="/customization", tags=["Customization"])
pollinations = PollinationsService()


def _merge_explicit_materials(
    payload: CustomizationRequest,
    requested_materials: list[RequestedMaterial],
    inventory_catalog,
) -> list[RequestedMaterial]:
    inventory_by_id = {item.product_id: item for item in inventory_catalog}
    merged = {item.product_id: item for item in requested_materials if item.product_id}
    unknown_items = [item for item in requested_materials if not item.product_id]
    for material_id in (
        payload.flower_id,
        payload.vase_id,
        payload.wrapping_id,
        payload.accessory_id,
    ):
        material = inventory_by_id.get(str(material_id)) if material_id else None
        if material and material.product_id not in merged:
            merged[material.product_id] = RequestedMaterial(
                material.product_id,
                material.product_name,
                1,
            )
    return [*merged.values(), *unknown_items]


def _merge_prompt_requested_materials(
    ai_materials: list[RequestedMaterial],
    prompt_materials: list[RequestedMaterial],
) -> list[RequestedMaterial]:
    """Keep Gemini's quantities while restoring any stocked flowers named in the prompt."""
    merged: dict[str, RequestedMaterial] = {}
    for material in ai_materials:
        key = material.product_id or f"unknown:{material.product_name.casefold()}"
        merged[key] = material
    for material in prompt_materials:
        key = material.product_id or f"unknown:{material.product_name.casefold()}"
        merged.setdefault(key, material)
    return list(merged.values())


def _requested_materials_from_selection(
    payload: CustomizationRequest,
    inventory_catalog,
) -> list[RequestedMaterial]:
    """Build the exact Mix & Match recipe without interpreting prompt prose."""
    inventory_by_id = {item.product_id: item for item in inventory_catalog}
    quantities: dict[str, int] = {}
    for selected in payload.selected_items:
        product_id = str(selected.product_id)
        quantities[product_id] = quantities.get(product_id, 0) + int(selected.quantity)

    return [
        RequestedMaterial(
            product_id=product_id,
            product_name=(
                inventory_by_id[product_id].product_name
                if product_id in inventory_by_id
                else "Selected item"
            ),
            quantity=quantity,
        )
        for product_id, quantity in quantities.items()
    ]


def _needs_box_container_rule(arrangement_type: Optional[str]) -> bool:
    return str(arrangement_type or "").strip().lower() in {"box", "boxed", "boxed arrangement"}


def _infer_arrangement_type(arrangement_type: Optional[str], prompt_text: str) -> str:
    explicit = str(arrangement_type or "").strip().lower()
    if explicit in {"box", "boxed", "boxed arrangement"}:
        return "box"
    if explicit in {"vase", "vase arrangement"}:
        return "vase"
    if explicit in {"bouquet"}:
        return "bouquet"

    prompt = str(prompt_text or "").lower()
    if "boxed" in prompt or " box " in f" {prompt} " or "flower gift box" in prompt:
        return "box"
    if "vase" in prompt:
        return "vase"
    return "bouquet"


def _arrangement_visual_rule(arrangement_type: str) -> str:
    if arrangement_type == "box":
        return (
            "Visual style lock: boxed arrangement. Render a premium transparent acrylic florist display case with a square "
            "footprint, straight upright clear walls, a shallow clear upper cover around the bloom heads, a transparent horizontal "
            "support plate at mid-height, and a flat deep rose-red base. Place exactly the recipe-listed number of bloom heads in a "
            "compact evenly spaced grid in the upper half, nearly filling that compartment but remaining below the cover. Each short "
            "green stem must pass through its own circular hole in the support plate and remain visible in the empty lower compartment. "
            "Use a slightly elevated front three-quarter product angle showing the top, front, one side, support plate, stems, and base. "
            "Keep all box edges straight, parallel, level, rectangular, and physically connected. Add only a small blank oval label low "
            "on the front. This is not a cardboard gift box, vase, basket, terrarium, jewelry box, hand-tied bouquet, tilted diamond, "
            "or solid glass block. No ribbon, wrapping paper, extra flowers, readable text, flowers outside the case, or blooms above the cover. "
        )
    if arrangement_type == "vase":
        return (
            "Visual style lock: vase arrangement. Show an upright vase arrangement from eye level with the full vase visible, "
            "balanced fresh stems standing naturally inside the vase. Do not show bouquet wrapping, a flower box, or a top-down view. "
        )
    return (
        "Visual style lock: bouquet arrangement. Match this product style: a full upright hand-tied bouquet centered on a clean "
        "white studio background, photographed from a front eye-level product view with a very slight high angle so the flower "
        "cluster is visible. Make the selected wrapping look physically realistic: layered overlapping panels around the stems, "
        "believable material thickness, natural folds and creases, slightly irregular edges, compression where it is held, and soft "
        "contact shadows between layers. Match its real material finish, such as matte fibrous kraft paper or glossy translucent "
        "cellophane. Never render the wrapping as a flat pasted texture, a rigid geometric cone, floating sheets, or a smooth CGI shell. "
        "Secure it only with finishing materials explicitly listed in the recipe. The bouquet should have a rounded/full flower head "
        "cluster at the top and the wrapped stem bundle tapering downward. Keep the whole bouquet visible "
        "from flower tips to bottom wrap. Do not show a vase, acrylic box, basket, top-down flat lay, or loose flowers outside the wrapper. "
    )


def _calculate_complete_recipe_price(recipe, inventory_catalog) -> PriceBreakdown:
    inventory_by_id = {item.product_id: item for item in inventory_catalog}
    items: list[PriceBreakdownItem] = []
    for requested in recipe:
        material = inventory_by_id.get(requested.product_id or "")
        if not material:
            continue
        subtotal = material.unit_price * requested.quantity
        items.append(PriceBreakdownItem(
            material_type=get_material_type_label(material.material_type),
            product_id=material.product_id,
            product_name=material.product_name,
            image_url=material.image_url,
            unit_price=material.unit_price,
            quantity=requested.quantity,
            subtotal=subtotal,
        ))
    return PriceBreakdown(items=items, total_price=sum(item.subtotal for item in items))


def _recipe_product_id(recipe, inventory_catalog, material_type: str) -> Optional[uuid.UUID]:
    inventory_by_id = {item.product_id: item for item in inventory_catalog}
    match = next(
        (
            item.product_id
            for item in recipe
            if item.product_id
            and inventory_by_id.get(item.product_id)
            and inventory_by_id[item.product_id].material_type == material_type
        ),
        None,
    )
    return uuid.UUID(match) if match else None


def _recipe_material_name(recipe, inventory_catalog, material_type: str) -> Optional[str]:
    inventory_by_id = {item.product_id: item for item in inventory_catalog}
    return next(
        (
            inventory_by_id[item.product_id].product_name
            for item in recipe
            if item.product_id
            and inventory_by_id.get(item.product_id)
            and inventory_by_id[item.product_id].material_type == material_type
        ),
        None,
    )


def _lookup_arrangement_material(db: Session, model, product_id: Optional[uuid.UUID], product_name: Optional[str] = None):
    if product_id and hasattr(model, "product_id"):
        match = db.query(model).filter(model.product_id == product_id).first()
        if match:
            return match
    if product_name and hasattr(model, "name"):
        return db.query(model).filter(model.name == product_name).first()
    return None


def _quantity_adjustment_response(
    adjustment: QuantityAdjustment,
    remaining: int,
) -> CustomizationResponse:
    label = "flower box" if adjustment.arrangement_type == "box" else adjustment.arrangement_type
    if not adjustment.suggested_prompt:
        message = "No complete stocked arrangement is available right now. Please continue in Mix and Match."
    elif adjustment.requested_total == 0:
        message = "Here is a complete stocked recipe for your arrangement."
    elif adjustment.code == "material_unavailable":
        message = "Some requested materials are unavailable, so we prepared a stocked alternative."
    elif adjustment.code == "quantity_adjustment_required":
        message = (
            f"This {label} is above the {adjustment.max_stems}-stem limit, "
            "so we prepared a smaller stocked recipe below."
        )
    else:
        message = f"This {label} needs stock adjustments. Review the suggested recipe below."
    return CustomizationResponse(
        success=False,
        message=message,
        generated_image_url=None,
        remaining_generations=remaining,
        validation=QuantityValidation(**adjustment.__dict__),
    )


def _suggested_items_to_recipe(adjustment: QuantityAdjustment) -> list[RequestedMaterial]:
    return [
        RequestedMaterial(
            product_id=item.get("product_id"),
            product_name=item.get("product_name") or "",
            quantity=max(1, int(item.get("quantity") or 1)),
        )
        for item in adjustment.suggested_items
        if item.get("product_id")
    ]


def _has_explicit_quantity_request(prompt_text: str) -> bool:
    prompt = str(prompt_text or "").lower()
    if re.search(r"\b\d[\d,]*\b", prompt):
        return True
    quantity_words = (
        "one", "two", "three", "four", "five", "six", "seven", "eight",
        "nine", "ten", "eleven", "twelve", "thirteen", "fourteen",
        "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
        "dozen",
    )
    return any(re.search(rf"\b{word}\b", prompt) for word in quantity_words)


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


@router.get("/rules", response_model=CustomizationRulesResponse)
def get_customization_rules():
    return CustomizationRulesResponse(arrangement_limits=public_arrangement_rules())


@router.post("/check-and-generate", response_model=CustomizationResponse)
async def check_and_generate(
    payload: CustomizationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ── Step 1: Check daily AI usage limit ───────────────────────────────
    # Reviewing uses Gemini extraction but does not consume an image-generation credit.
    if not payload.review_only and has_reached_daily_limit(db, current_user.id):
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
    inventory_catalog = load_customization_inventory(db)
    inventory_for_extraction = [
        {
            "product_id": item.product_id,
            "name": item.product_name,
            "category": item.category,
            "available_quantity": item.safe_quantity,
        }
        for item in inventory_catalog
    ]
    try:
        ai_verdict = validate_and_optimize_prompt(payload.prompt_text, inventory_for_extraction)
    except PromptExtractionError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    arrangement_type = normalize_arrangement_type(
        payload.arrangement_type or ai_verdict.get("arrangement_type"),
        payload.prompt_text,
    )
    if payload.selected_items:
        # Mix & Match already knows every selected product and quantity. Never
        # let Gemini or visual prompt wording alter that exact recipe.
        requested_materials = _requested_materials_from_selection(payload, inventory_catalog)
    else:
        requested_materials = normalize_requested_materials(
            ai_verdict.get("used_items", []),
            inventory_catalog,
        )
        prompt_requested_materials = extract_prompt_requested_materials(
            payload.prompt_text,
            inventory_catalog,
        )
        requested_materials = _merge_prompt_requested_materials(
            requested_materials,
            prompt_requested_materials,
        )
        requested_materials = _merge_explicit_materials(
            payload,
            requested_materials,
            inventory_catalog,
        )
    has_explicit_selection = bool(payload.selected_items) or any((
        payload.flower_id,
        payload.vase_id,
        payload.wrapping_id,
        payload.accessory_id,
    ))
    is_specific_request = has_explicit_selection or has_specific_material_request(
        payload.prompt_text,
        inventory_catalog,
    )

    if not is_specific_request and (
        ai_verdict.get("is_possible") or is_probably_floral_request(payload.prompt_text)
    ):
        recovery = build_default_recipe_suggestion(
            arrangement_type,
            inventory_catalog,
            ai_verdict.get("feedback"),
        )
        recipe_from_suggestion = _suggested_items_to_recipe(recovery)
        if recipe_from_suggestion:
            arrangement_type = recovery.arrangement_type
            requested_materials = recipe_from_suggestion
        else:
            remaining = get_remaining_generations(db, current_user.id)
            return _quantity_adjustment_response(recovery, remaining)

    if requested_materials:
        quantity_adjustment = build_quantity_adjustment(
            arrangement_type,
            requested_materials,
            inventory_catalog,
        )
        if quantity_adjustment:
            can_auto_apply_suggestion = (
                not has_explicit_selection
                and not _has_explicit_quantity_request(payload.prompt_text)
                and bool(quantity_adjustment.suggested_items)
            )
            if can_auto_apply_suggestion:
                recipe_from_suggestion = _suggested_items_to_recipe(quantity_adjustment)
                if recipe_from_suggestion:
                    arrangement_type = quantity_adjustment.arrangement_type
                    requested_materials = recipe_from_suggestion
                else:
                    remaining = get_remaining_generations(db, current_user.id)
                    return _quantity_adjustment_response(quantity_adjustment, remaining)
            else:
                remaining = get_remaining_generations(db, current_user.id)
                return _quantity_adjustment_response(quantity_adjustment, remaining)

    if not requested_materials and (
        ai_verdict.get("is_possible") or is_probably_floral_request(payload.prompt_text)
    ):
        recovery = build_default_recipe_suggestion(
            arrangement_type,
            inventory_catalog,
            ai_verdict.get("feedback"),
        )
        recipe_from_suggestion = _suggested_items_to_recipe(recovery)
        if recipe_from_suggestion:
            arrangement_type = recovery.arrangement_type
            requested_materials = recipe_from_suggestion
        else:
            remaining = get_remaining_generations(db, current_user.id)
            return _quantity_adjustment_response(recovery, remaining)

    if not ai_verdict.get("is_possible"):
        remaining = get_remaining_generations(db, current_user.id)
        return CustomizationResponse(
            success=False,
            message=ai_verdict.get("feedback") or "We cannot fulfill this arrangement with our current stock.",
            generated_image_url=None,
            remaining_generations=remaining,
        )

    # ── Step 5: Look up material records using product IDs ────────────────
    # Re-read stock immediately before resolving the complete recipe.
    refreshed_inventory = load_customization_inventory(db)
    refreshed_adjustment = build_quantity_adjustment(
        arrangement_type,
        requested_materials,
        refreshed_inventory,
    )
    if refreshed_adjustment:
        remaining = get_remaining_generations(db, current_user.id)
        return _quantity_adjustment_response(refreshed_adjustment, remaining)

    complete_recipe, missing_presentation = resolve_complete_recipe(
        arrangement_type,
        requested_materials,
        refreshed_inventory,
        include_finishing_suggestions=True,
    )
    if not recipe_has_flowers(complete_recipe, refreshed_inventory):
        recovery = build_default_recipe_suggestion(
            arrangement_type,
            refreshed_inventory,
            "A complete arrangement needs at least one safely available flower.",
        )
        remaining = get_remaining_generations(db, current_user.id)
        return _quantity_adjustment_response(recovery, remaining)
    if missing_presentation:
        recovery = build_presentation_recovery(
            arrangement_type,
            complete_recipe,
            refreshed_inventory,
            missing_presentation,
            include_finishing_suggestions=True,
        )
        remaining = get_remaining_generations(db, current_user.id)
        return _quantity_adjustment_response(recovery, remaining)

    price_breakdown = _calculate_complete_recipe_price(complete_recipe, refreshed_inventory)
    final_image_prompt = build_complete_image_prompt(
        arrangement_type,
        complete_recipe,
        refreshed_inventory,
        ai_verdict.get("design_notes") or "",
    )

    if payload.review_only:
        remaining = get_remaining_generations(db, current_user.id)
        return CustomizationResponse(
            success=True,
            message="Review this complete recipe and price before generating an image.",
            arrangement_type=arrangement_type,
            generated_image_url=None,
            remaining_generations=remaining,
            price_breakdown=price_breakdown,
        )

    flower_product_id = _recipe_product_id(complete_recipe, refreshed_inventory, "flower")
    vase_product_id = _recipe_product_id(complete_recipe, refreshed_inventory, "vase")
    wrapping_product_id = _recipe_product_id(complete_recipe, refreshed_inventory, "wrapping")
    accessory_product_id = _recipe_product_id(complete_recipe, refreshed_inventory, "accessory")
    vase_product_name = _recipe_material_name(complete_recipe, refreshed_inventory, "vase")
    flower = _lookup_arrangement_material(db, Flower, flower_product_id)
    vase = _lookup_arrangement_material(db, Vase, vase_product_id, vase_product_name)
    wrapping = _lookup_arrangement_material(db, Wrapping, wrapping_product_id)
    accessory = _lookup_arrangement_material(db, Accessory, accessory_product_id)

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
    style_visual_rule = _arrangement_visual_rule(arrangement_type)
    # Keep the exact stocked recipe first so downstream length limits cannot
    # truncate the customer's requested materials.
    final_image_prompt = f"{final_image_prompt} {style_visual_rule}"
    
    try:
        generated_url = await pollinations.generate_arrangement_image(
            db=db,
            arrangement_id=str(arrangement.id),
            optimized_prompt=final_image_prompt,
            arrangement_type=arrangement_type,
        )
    except PollinationsGenerationError as exc:
        db.delete(arrangement)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    if not generated_url:
        db.delete(arrangement)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Image generation failed. Please try again."
        )

    # ── Step 8: Calculate price breakdown (Merged!) ───────────────────────
    # Update arrangement with final estimated price
    arrangement.estimated_price = price_breakdown.total_price
    arrangement.generated_image_url = generated_url
    arrangement.price_breakdown = {
        "items": [
            {
                "material_type": item.material_type,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "image_url": item.image_url,
                "unit_price": item.unit_price,
                "quantity": item.quantity,
                "subtotal": item.subtotal,
            }
            for item in price_breakdown.items
        ],
        "total_price": price_breakdown.total_price,
    }
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
        arrangement_type=arrangement_type,
        generated_image_url=generated_url,
        arrangement_id=str(arrangement.id),
        unavailable_items=[],
        remaining_generations=remaining,
        price_breakdown=price_breakdown,
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

