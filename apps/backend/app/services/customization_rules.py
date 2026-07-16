from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Iterable, Optional


@dataclass(frozen=True)
class ArrangementRule:
    key: str
    label: str
    max_stems: int


@dataclass(frozen=True)
class InventoryMaterial:
    product_id: str
    product_name: str
    category: str
    product_type: str
    safe_quantity: int
    unit_price: float = 0.0
    image_url: Optional[str] = None

    @property
    def is_flower(self) -> bool:
        return self.material_type == "flower"

    @property
    def material_type(self) -> str:
        return classify_material(self.category, self.product_type, self.product_name)


@dataclass(frozen=True)
class RequestedMaterial:
    product_id: Optional[str]
    product_name: str
    quantity: int


@dataclass(frozen=True)
class QuantityAdjustment:
    code: str
    arrangement_type: str
    max_stems: int
    requested_total: int
    requested_items: list[dict]
    suggested_items: list[dict]
    suggested_prompt: str
    adjustment_reasons: list[str]


ARRANGEMENT_RULES: dict[str, ArrangementRule] = {
    "bouquet": ArrangementRule(key="bouquet", label="Bouquet", max_stems=24),
    "vase": ArrangementRule(key="vase", label="Vase", max_stems=12),
    "box": ArrangementRule(key="box", label="Flower Box", max_stems=9),
}

REQUIRED_PRESENTATION_TYPES = {
    "bouquet": "wrapping",
    "vase": "vase",
    "box": "box",
}


def public_arrangement_rules() -> dict[str, dict[str, object]]:
    return {
        key: {"label": rule.label, "max_stems": rule.max_stems}
        for key, rule in ARRANGEMENT_RULES.items()
    }


def normalize_arrangement_type(value: Optional[str], prompt_text: str = "") -> str:
    normalized = str(value or "").strip().lower()
    if normalized in ARRANGEMENT_RULES:
        return normalized

    prompt = prompt_text.lower()
    if "vase" in prompt:
        return "vase"
    if "flower box" in prompt or "gift box" in prompt or "boxed" in prompt:
        return "box"
    return "bouquet"


def safe_inventory_quantity(current_stock: object, reorder_point: object) -> int:
    return max(0, _as_non_negative_int(current_stock) - _as_non_negative_int(reorder_point))


def is_flower_material(category: str, product_type: str, product_name: str) -> bool:
    return classify_material(category, product_type, product_name) == "flower"


def classify_material(category: str, product_type: str, product_name: str) -> str:
    searchable = " ".join((category, product_type, product_name)).lower()
    if any(term in searchable for term in ("filler", "greenery", "gypsophila", "baby's breath", "statice")):
        return "filler"
    if any(term in searchable for term in ("wrapping", "wrapper", "wrap paper", "kraft paper")):
        return "wrapping"
    if "vase" in searchable:
        return "vase"
    if any(term in searchable for term in ("flower box", "gift box", "acrylic box", "category box")) or str(category).strip().lower() == "box":
        return "box"
    if any(term in searchable for term in ("accessory", "ribbon", "bow", "finishing")):
        return "accessory"
    if any(term in searchable for term in (
        "flower", "rose", "sunflower", "tulip", "carnation", "stem",
        "lily", "orchid", "peony",
    )):
        return "flower"
    return "other"


def normalize_requested_materials(
    extracted_items: Iterable[dict],
    inventory: Iterable[InventoryMaterial],
) -> list[RequestedMaterial]:
    inventory_items = list(inventory)
    by_id = {item.product_id: item for item in inventory_items}
    by_name = {item.product_name.casefold(): item for item in inventory_items}
    quantities: dict[str, int] = {}
    matched_materials: dict[str, InventoryMaterial] = {}

    for extracted in extracted_items:
        requested_quantity = _as_non_negative_int(extracted.get("quantity"))
        if requested_quantity <= 0:
            continue

        raw_id = str(extracted.get("product_id") or "").strip()
        raw_name = str(extracted.get("name") or "").strip()
        material = by_id.get(raw_id) or by_name.get(raw_name.casefold())
        key = material.product_id if material else f"unknown:{raw_name.casefold()}"
        quantities[key] = quantities.get(key, 0) + requested_quantity
        if material:
            matched_materials[key] = material

    normalized: list[RequestedMaterial] = []
    for key, quantity in quantities.items():
        material = matched_materials.get(key)
        normalized.append(
            RequestedMaterial(
                product_id=material.product_id if material else None,
                product_name=material.product_name if material else key.removeprefix("unknown:").title(),
                quantity=quantity,
            )
        )
    return normalized


def extract_prompt_requested_materials(
    prompt_text: str,
    inventory: Iterable[InventoryMaterial],
) -> list[RequestedMaterial]:
    """Recovers simple flower quantities when AI extraction omits a legitimate request."""
    prompt = _normalize_search_text(prompt_text)
    candidates: list[tuple[int, int, str, InventoryMaterial]] = []

    for material in inventory:
        if not material.is_flower:
            continue
        for alias in _material_aliases(material.product_name):
            match = re.search(rf"\b{re.escape(alias)}\b", prompt)
            if match:
                candidates.append((match.start(), match.end(), alias, material))

    # Prefer the most specific product name. When a generic flower word matches
    # several variants, prefer the variant with the most safely usable stock.
    candidates.sort(
        key=lambda candidate: (
            candidate[0],
            -len(candidate[2]),
            -candidate[3].safe_quantity,
            candidate[3].product_name.casefold(),
        )
    )
    selected: list[tuple[int, int, InventoryMaterial]] = []
    occupied_spans: set[tuple[int, int]] = set()
    selected_ids: set[str] = set()
    for start, end, _, material in candidates:
        span = (start, end)
        if span in occupied_spans or material.product_id in selected_ids:
            continue
        if any(existing_start <= start < existing_end or start <= existing_start < end for existing_start, existing_end, _ in selected):
            continue
        occupied_spans.add(span)
        selected_ids.add(material.product_id)
        selected.append((start, end, material))

    recovered: list[RequestedMaterial] = []
    for start, _, material in selected:
        quantity = _quantity_before_match(prompt, start)
        if quantity <= 0:
            quantity = min(6, material.safe_quantity) if material.safe_quantity > 0 else 6
        recovered.append(
            RequestedMaterial(
                product_id=material.product_id,
                product_name=material.product_name,
                quantity=quantity,
            )
        )
    return recovered


def is_probably_floral_request(prompt_text: str) -> bool:
    searchable = _normalize_search_text(prompt_text)
    floral_terms = (
        "arrangement", "bouquet", "carnation", "centerpiece", "floral",
        "flower", "orchid", "rose", "stem", "sunflower", "tulip", "vase",
    )
    return any(re.search(rf"\b{term}s?\b", searchable) for term in floral_terms)


def has_specific_material_request(
    prompt_text: str,
    inventory: Iterable[InventoryMaterial],
) -> bool:
    """Distinguishes named-material or exact-quantity requests from style-only prompts."""
    prompt = _normalize_search_text(prompt_text)
    if re.search(r"\b\d[\d,]*\b", prompt):
        return True

    quantity_words = (
        "one", "two", "three", "four", "five", "six", "seven", "eight",
        "nine", "ten", "eleven", "twelve", "thirteen", "fourteen",
        "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
        "hundred", "thousand", "million", "billion",
    )
    if any(re.search(rf"\b{word}\b", prompt) for word in quantity_words):
        return True

    return any(
        re.search(rf"\b{re.escape(alias)}\b", prompt)
        for material in inventory
        for alias in _material_aliases(material.product_name)
    )


def recipe_has_flowers(
    recipe: Iterable[RequestedMaterial],
    inventory: Iterable[InventoryMaterial],
) -> bool:
    return _flower_total(recipe, inventory) > 0


def resolve_complete_recipe(
    arrangement_type: str,
    requested_items: Iterable[RequestedMaterial],
    inventory: Iterable[InventoryMaterial],
    include_finishing_suggestions: bool = False,
) -> tuple[list[RequestedMaterial], Optional[str]]:
    """Returns a stocked recipe that always includes its required presentation."""
    inventory_items = list(inventory)
    inventory_by_id = {item.product_id: item for item in inventory_items}
    required_presentation = REQUIRED_PRESENTATION_TYPES[arrangement_type]
    resolved: dict[str, RequestedMaterial] = {}
    requested_material_types: set[str] = set()

    for requested in requested_items:
        material = inventory_by_id.get(requested.product_id or "")
        if material is None:
            continue
        material_type = material.material_type
        if material_type in REQUIRED_PRESENTATION_TYPES.values() and material_type != required_presentation:
            continue
        if material_type not in {"flower", "filler", "accessory", required_presentation}:
            continue
        requested_material_types.add(material_type)
        if material.safe_quantity <= 0:
            continue
        quantity = min(requested.quantity, material.safe_quantity) if material_type == "flower" else 1
        if quantity <= 0:
            continue
        resolved[material.product_id] = RequestedMaterial(
            product_id=material.product_id,
            product_name=material.product_name,
            quantity=quantity,
        )

    resolved_flowers = [
        (item, inventory_by_id[item.product_id or ""])
        for item in resolved.values()
        if inventory_by_id[item.product_id or ""].is_flower
    ]
    if sum(item.quantity for item, _ in resolved_flowers) > ARRANGEMENT_RULES[arrangement_type].max_stems:
        allocations = _allocate_suggested_quantities(
            resolved_flowers,
            ARRANGEMENT_RULES[arrangement_type].max_stems,
        )
        for item, _ in resolved_flowers:
            quantity = allocations.get(_request_key(item), 0)
            if quantity > 0:
                resolved[item.product_id or ""] = RequestedMaterial(
                    product_id=item.product_id,
                    product_name=item.product_name,
                    quantity=quantity,
                )
            else:
                resolved.pop(item.product_id or "", None)

    presentation_items = [
        requested
        for product_id, requested in resolved.items()
        if inventory_by_id[product_id].material_type == required_presentation
    ]
    if not presentation_items:
        presentation = _select_safe_material(inventory_items, required_presentation)
        if presentation is None:
            return _sort_recipe(list(resolved.values()), inventory_by_id), required_presentation
        resolved[presentation.product_id] = RequestedMaterial(
            product_id=presentation.product_id,
            product_name=presentation.product_name,
            quantity=1,
        )

    # Explicitly requested optional material types may be substituted, but are
    # never introduced for a specific prompt that did not ask for them.
    for optional_type in ("filler", "accessory"):
        if optional_type not in requested_material_types:
            continue
        has_optional_type = any(
            inventory_by_id[product_id].material_type == optional_type
            for product_id in resolved
        )
        if has_optional_type:
            continue
        substitute = _select_safe_material(inventory_items, optional_type)
        if substitute:
            resolved[substitute.product_id] = RequestedMaterial(
                product_id=substitute.product_id,
                product_name=substitute.product_name,
                quantity=1,
            )

    if include_finishing_suggestions:
        for optional_type in ("filler", "accessory"):
            has_optional_type = any(
                inventory_by_id[product_id].material_type == optional_type
                for product_id in resolved
            )
            if has_optional_type:
                continue
            suggestion = _select_safe_material(inventory_items, optional_type)
            if suggestion:
                resolved[suggestion.product_id] = RequestedMaterial(
                    product_id=suggestion.product_id,
                    product_name=suggestion.product_name,
                    quantity=1,
                )

    return _sort_recipe(list(resolved.values()), inventory_by_id), None


def build_complete_recipe_prompt(
    arrangement_type: str,
    recipe: Iterable[RequestedMaterial],
    inventory: Iterable[InventoryMaterial],
    design_notes: str = "",
) -> str:
    inventory_by_id = {item.product_id: item for item in inventory}
    recipe_items = list(recipe)
    material_text = _join_human_readable(
        [f"{item.quantity} {item.product_name}" for item in recipe_items]
    )
    label = ARRANGEMENT_RULES[arrangement_type].label.lower()
    prompt = f"A complete {label} with {material_text}."
    clean_notes = " ".join(str(design_notes or "").split()).strip(" .")
    if clean_notes:
        prompt = f"{prompt} Design: {clean_notes}."

    required_type = REQUIRED_PRESENTATION_TYPES[arrangement_type]
    if not any(
        inventory_by_id.get(item.product_id or "")
        and inventory_by_id[item.product_id or ""].material_type == required_type
        for item in recipe_items
    ):
        return ""
    return prompt


def build_complete_image_prompt(
    arrangement_type: str,
    recipe: Iterable[RequestedMaterial],
    inventory: Iterable[InventoryMaterial],
    design_notes: str = "",
) -> str:
    inventory_by_id = {item.product_id: item for item in inventory}
    recipe_items = list(recipe)
    grouped: dict[str, list[RequestedMaterial]] = {}
    for item in recipe_items:
        material = inventory_by_id.get(item.product_id or "")
        if material:
            grouped.setdefault(material.material_type, []).append(item)

    exact_materials = _join_human_readable(
        [f"{item.quantity} {item.product_name}" for item in recipe_items]
    )
    required_flowers = _join_human_readable(
        [
            f"{item.quantity} {item.product_name}"
            for item in grouped.get("flower", [])
        ]
    )
    flower_rule = (
        f"Mandatory visible flower varieties: {required_flowers}. Every listed flower variety must be present, prominent, and "
        "clearly recognizable by its real petal shape, bloom structure, and natural proportions. Keep approximately the listed "
        "count of each variety. Do not substitute, omit, merge, recolor beyond recognition, or invent flower varieties. "
    ) if required_flowers else ""
    presentation_names = ", ".join(
        item.product_name
        for item in grouped.get(REQUIRED_PRESENTATION_TYPES[arrangement_type], [])
    )
    if arrangement_type == "bouquet":
        presentation_rule = (
            f"Show a finished hand-tied bouquet visibly wrapped with {presentation_names}; "
            "the stems must be enclosed and secured, never shown as loose flowers. Render the selected wrapping as a real physical "
            "material with overlapping layers, believable thickness, natural folds and creases, irregular edges, compression around "
            "the stem bundle, and soft contact shadows between layers. Match the selected material's real surface properties. "
            "Do not render flat wrapping, a rigid cone, floating sheets, impossible folds, or a smooth plastic-looking CGI shell."
        )
    elif arrangement_type == "vase":
        presentation_rule = (
            f"Show a finished florist arrangement placed inside the selected vase, {presentation_names}; "
            "never show loose flowers beside an empty vase."
        )
    else:
        presentation_rule = (
            f"Show the flowers arranged inside the selected flower box, {presentation_names}, below the rim; "
            "never show a hand-tied bouquet, loose flowers, or flowers outside the box."
        )

    clean_notes = " ".join(str(design_notes or "").split()).strip(" .")
    design_rule = f"Design direction: {clean_notes}. " if clean_notes else ""
    return (
        "Ultra-realistic front-facing product photo of one complete retail florist arrangement. "
        f"Use exactly these florist materials: {exact_materials}. "
        f"{flower_rule}{presentation_rule} {design_rule}"
        "Clean studio lighting, natural textures, no top-down view. "
        "Do not add or omit products. No cards, chocolates, balloons, jewelry, people, readable text, or watermarks."
    )


def build_default_recipe_suggestion(
    arrangement_type: str,
    inventory: Iterable[InventoryMaterial],
    reason: Optional[str] = None,
) -> QuantityAdjustment:
    """Builds a safe concrete recipe when a floral request has no usable item match."""
    rule = ARRANGEMENT_RULES[arrangement_type]
    inventory_items = list(inventory)
    flower_rows = _allocate_inventory_alternatives(
        inventory=inventory_items,
        requested_total=rule.max_stems,
        excluded_product_ids=set(),
    )
    flower_recipe = [
        RequestedMaterial(item["product_id"], item["product_name"], item["quantity"])
        for item in flower_rows
    ]
    complete_recipe, missing_presentation = resolve_complete_recipe(
        arrangement_type,
        flower_recipe,
        inventory_items,
        include_finishing_suggestions=True,
    )
    if missing_presentation:
        return build_presentation_recovery(
            arrangement_type,
            flower_recipe,
            inventory_items,
            missing_presentation,
            include_finishing_suggestions=True,
        )
    suggested_rows = _recipe_validation_rows(complete_recipe, inventory_items)
    suggested_prompt = build_complete_recipe_prompt(
        arrangement_type,
        complete_recipe,
        inventory_items,
    ) if not missing_presentation else ""
    reasons = [
        reason or "We could not match a safely available flower to the original request.",
        "This suggestion uses a complete recipe built from safely available florist materials.",
    ]
    return QuantityAdjustment(
        code="material_unavailable",
        arrangement_type=arrangement_type,
        max_stems=rule.max_stems,
        requested_total=0,
        requested_items=[],
        suggested_items=suggested_rows,
        suggested_prompt=suggested_prompt,
        adjustment_reasons=reasons,
    )


def build_presentation_recovery(
    arrangement_type: str,
    recipe: Iterable[RequestedMaterial],
    inventory: Iterable[InventoryMaterial],
    missing_material_type: str,
    include_finishing_suggestions: bool = False,
) -> QuantityAdjustment:
    inventory_items = list(inventory)
    recipe_items = list(recipe)
    original_rule = ARRANGEMENT_RULES[arrangement_type]
    reasons = [
        f"No stocked {get_material_type_label(missing_material_type).lower()} is available for this {original_rule.label.lower()}.",
    ]

    for fallback_type in ("bouquet", "vase", "box"):
        if fallback_type == arrangement_type:
            continue
        fallback_recipe, fallback_missing = resolve_complete_recipe(
            fallback_type,
            recipe_items,
            inventory_items,
            include_finishing_suggestions=include_finishing_suggestions,
        )
        if fallback_missing or _flower_total(fallback_recipe, inventory_items) <= 0:
            continue
        reasons.append(
            f"A complete {ARRANGEMENT_RULES[fallback_type].label.lower()} is available instead."
        )
        return QuantityAdjustment(
            code="material_unavailable",
            arrangement_type=fallback_type,
            max_stems=ARRANGEMENT_RULES[fallback_type].max_stems,
            requested_total=_flower_total(recipe_items, inventory_items),
            requested_items=_requested_validation_rows(recipe_items, inventory_items),
            suggested_items=_recipe_validation_rows(fallback_recipe, inventory_items),
            suggested_prompt=build_complete_recipe_prompt(
                fallback_type,
                fallback_recipe,
                inventory_items,
            ),
            adjustment_reasons=reasons,
        )

    reasons.append("No complete arrangement presentation is safely available right now.")
    return QuantityAdjustment(
        code="material_unavailable",
        arrangement_type=arrangement_type,
        max_stems=original_rule.max_stems,
        requested_total=_flower_total(recipe_items, inventory_items),
        requested_items=_requested_validation_rows(recipe_items, inventory_items),
        suggested_items=[],
        suggested_prompt="",
        adjustment_reasons=reasons,
    )


def build_quantity_adjustment(
    arrangement_type: str,
    requested_items: Iterable[RequestedMaterial],
    inventory: Iterable[InventoryMaterial],
) -> Optional[QuantityAdjustment]:
    rule = ARRANGEMENT_RULES[arrangement_type]
    inventory_items = list(inventory)
    inventory_by_id = {item.product_id: item for item in inventory_items}
    requested_materials = list(requested_items)
    flower_requests: list[tuple[RequestedMaterial, Optional[InventoryMaterial]]] = []
    nonflower_requests: list[tuple[RequestedMaterial, InventoryMaterial]] = []

    for requested in requested_materials:
        material = inventory_by_id.get(requested.product_id or "")
        if material is None or material.is_flower:
            flower_requests.append((requested, material))
        else:
            nonflower_requests.append((requested, material))

    has_unavailable_nonflower = any(
        material.safe_quantity <= 0 for _, material in nonflower_requests
    )
    if not flower_requests and not has_unavailable_nonflower:
        return None
    if not flower_requests:
        recovery = build_default_recipe_suggestion(
            arrangement_type,
            inventory_items,
            "A complete arrangement needs safely available flowers and presentation materials.",
        )
        return QuantityAdjustment(
            code="material_unavailable",
            arrangement_type=recovery.arrangement_type,
            max_stems=recovery.max_stems,
            requested_total=0,
            requested_items=[
                {
                    "product_id": requested.product_id,
                    "product_name": requested.product_name,
                    "requested_quantity": requested.quantity,
                    "available_quantity": material.safe_quantity,
                    "material_type": material.material_type,
                }
                for requested, material in nonflower_requests
            ],
            suggested_items=recovery.suggested_items,
            suggested_prompt=recovery.suggested_prompt,
            adjustment_reasons=recovery.adjustment_reasons,
        )

    requested_total = sum(requested.quantity for requested, _ in flower_requests)
    exceeds_capacity = requested_total > rule.max_stems
    has_unavailable_material = any(
        material is None or material.safe_quantity <= 0
        for _, material in flower_requests
    )
    exceeds_stock = any(
        material is None or requested.quantity > material.safe_quantity
        for requested, material in flower_requests
    )
    if not exceeds_capacity and not exceeds_stock and not has_unavailable_nonflower:
        return None

    requested_rows = [
        {
            "product_id": requested.product_id,
            "product_name": requested.product_name,
            "requested_quantity": requested.quantity,
            "available_quantity": material.safe_quantity if material else 0,
            "material_type": material.material_type if material else "flower",
        }
        for requested, material in flower_requests
    ]
    requested_rows.extend(
        {
            "product_id": requested.product_id,
            "product_name": requested.product_name,
            "requested_quantity": requested.quantity,
            "available_quantity": material.safe_quantity,
            "material_type": material.material_type,
        }
        for requested, material in nonflower_requests
    )
    allocations = _allocate_suggested_quantities(flower_requests, rule.max_stems)
    suggested_rows = [
        {
            "product_id": requested.product_id,
            "product_name": requested.product_name,
            "quantity": allocations.get(_request_key(requested), 0),
            "available_quantity": material.safe_quantity if material else 0,
        }
        for requested, material in flower_requests
        if allocations.get(_request_key(requested), 0) > 0
    ]
    desired_total = min(rule.max_stems, requested_total)
    missing_stems = max(0, desired_total - sum(item["quantity"] for item in suggested_rows))
    if missing_stems > 0:
        requested_product_ids = {
            requested.product_id
            for requested, _ in flower_requests
            if requested.product_id
        }
        suggested_rows.extend(
            _allocate_inventory_alternatives(
                inventory=list(inventory_by_id.values()),
                requested_total=missing_stems,
                excluded_product_ids=requested_product_ids,
            )
        )

    seed_recipe = [
        RequestedMaterial(item["product_id"], item["product_name"], item["quantity"])
        for item in suggested_rows
    ]
    for requested in requested_materials:
        material = inventory_by_id.get(requested.product_id or "")
        if (
            material
            and material.safe_quantity > 0
            and material.material_type in {"filler", "wrapping", "vase", "box", "accessory"}
        ):
            seed_recipe.append(RequestedMaterial(material.product_id, material.product_name, 1))
    complete_recipe, missing_presentation = resolve_complete_recipe(
        arrangement_type,
        seed_recipe,
        inventory_items,
        include_finishing_suggestions=False,
    )
    suggested_rows = _recipe_validation_rows(complete_recipe, inventory_items)

    reasons: list[str] = []
    if exceeds_capacity:
        reasons.append(
            f"{rule.label} arrangements can contain up to {rule.max_stems} flower stems."
        )
    if exceeds_stock:
        reasons.append("Some requested quantities exceed today's safe available stock.")
    if has_unavailable_nonflower:
        unavailable_names = _join_human_readable([
            requested.product_name
            for requested, material in nonflower_requests
            if material.safe_quantity <= 0
        ])
        reasons.append(
            f"{unavailable_names} is not safely available, so a stocked alternative is suggested."
        )
    if missing_presentation:
        reasons.append(
            f"No stocked {get_material_type_label(missing_presentation).lower()} is available for this {rule.label.lower()}."
        )

    if has_unavailable_material or has_unavailable_nonflower:
        code = "material_unavailable"
    else:
        code = "quantity_adjustment_required" if exceeds_capacity else "stock_adjustment_required"
    suggested_prompt = (
        build_complete_recipe_prompt(arrangement_type, complete_recipe, inventory_items)
        if not missing_presentation
        else ""
    )

    return QuantityAdjustment(
        code=code,
        arrangement_type=arrangement_type,
        max_stems=rule.max_stems,
        requested_total=requested_total,
        requested_items=requested_rows,
        suggested_items=suggested_rows,
        suggested_prompt=suggested_prompt,
        adjustment_reasons=reasons,
    )


def _allocate_suggested_quantities(
    flower_requests: list[tuple[RequestedMaterial, Optional[InventoryMaterial]]],
    max_stems: int,
) -> dict[str, int]:
    available = [
        (requested, min(requested.quantity, material.safe_quantity if material else 0))
        for requested, material in flower_requests
    ]
    available = [(requested, upper) for requested, upper in available if upper > 0]
    target_total = min(max_stems, sum(upper for _, upper in available))
    if target_total <= 0:
        return {}

    allocations = {_request_key(requested): 0 for requested, _ in available}
    if target_total >= len(available):
        for requested, _ in available:
            allocations[_request_key(requested)] = 1

    remaining = target_total - sum(allocations.values())
    requested_weight = sum(requested.quantity for requested, _ in available)
    while remaining > 0:
        candidates = [
            (requested, upper)
            for requested, upper in available
            if allocations[_request_key(requested)] < upper
        ]
        if not candidates:
            break

        requested, _ = max(
            candidates,
            key=lambda candidate: (
                (candidate[0].quantity / requested_weight) * target_total
                - allocations[_request_key(candidate[0])],
                candidate[0].quantity,
                candidate[0].product_name.casefold(),
            ),
        )
        allocations[_request_key(requested)] += 1
        remaining -= 1

    return allocations


def get_material_type_label(material_type: str) -> str:
    return {
        "flower": "Flower",
        "filler": "Filler",
        "wrapping": "Wrapper",
        "vase": "Vase",
        "box": "Flower Box",
        "accessory": "Finishing Accessory",
    }.get(material_type, "Material")


def _recipe_validation_rows(
    recipe: Iterable[RequestedMaterial],
    inventory: Iterable[InventoryMaterial],
) -> list[dict]:
    inventory_by_id = {item.product_id: item for item in inventory}
    return [
        {
            "product_id": item.product_id,
            "product_name": item.product_name,
            "quantity": item.quantity,
            "available_quantity": inventory_by_id[item.product_id or ""].safe_quantity,
            "material_type": inventory_by_id[item.product_id or ""].material_type,
            "required": inventory_by_id[item.product_id or ""].material_type in {
                "flower", "wrapping", "vase", "box",
            },
        }
        for item in recipe
        if item.product_id in inventory_by_id
    ]


def _requested_validation_rows(
    recipe: Iterable[RequestedMaterial],
    inventory: Iterable[InventoryMaterial],
) -> list[dict]:
    inventory_by_id = {item.product_id: item for item in inventory}
    return [
        {
            "product_id": item.product_id,
            "product_name": item.product_name,
            "requested_quantity": item.quantity,
            "available_quantity": inventory_by_id[item.product_id or ""].safe_quantity,
            "material_type": inventory_by_id[item.product_id or ""].material_type,
        }
        for item in recipe
        if item.product_id in inventory_by_id
    ]


def _flower_total(
    recipe: Iterable[RequestedMaterial],
    inventory: Iterable[InventoryMaterial],
) -> int:
    inventory_by_id = {item.product_id: item for item in inventory}
    return sum(
        item.quantity
        for item in recipe
        if item.product_id in inventory_by_id and inventory_by_id[item.product_id or ""].is_flower
    )


def _select_safe_material(
    inventory: Iterable[InventoryMaterial],
    material_type: str,
) -> Optional[InventoryMaterial]:
    candidates = [
        item
        for item in inventory
        if item.material_type == material_type and item.safe_quantity > 0
    ]
    return min(
        candidates,
        key=lambda item: (-item.safe_quantity, item.product_name.casefold()),
        default=None,
    )


def _sort_recipe(
    recipe: list[RequestedMaterial],
    inventory_by_id: dict[str, InventoryMaterial],
) -> list[RequestedMaterial]:
    order = {"flower": 0, "filler": 1, "wrapping": 2, "vase": 2, "box": 2, "accessory": 3}
    return sorted(
        recipe,
        key=lambda item: (
            order.get(inventory_by_id[item.product_id or ""].material_type, 9),
            item.product_name.casefold(),
        ),
    )


def _allocate_inventory_alternatives(
    inventory: list[InventoryMaterial],
    requested_total: int,
    excluded_product_ids: set[str],
) -> list[dict]:
    candidates = sorted(
        (
            material
            for material in inventory
            if material.is_flower
            and material.safe_quantity > 0
            and material.product_id not in excluded_product_ids
        ),
        key=lambda material: (-material.safe_quantity, material.product_name.casefold()),
    )[:2]
    target_total = min(requested_total, sum(material.safe_quantity for material in candidates))
    allocations = {material.product_id: 0 for material in candidates}

    while sum(allocations.values()) < target_total:
        available = [
            material
            for material in candidates
            if allocations[material.product_id] < material.safe_quantity
        ]
        if not available:
            break
        selected = min(
            available,
            key=lambda material: (
                allocations[material.product_id],
                -material.safe_quantity,
                material.product_name.casefold(),
            ),
        )
        allocations[selected.product_id] += 1

    return [
        {
            "product_id": material.product_id,
            "product_name": material.product_name,
            "quantity": allocations[material.product_id],
            "available_quantity": material.safe_quantity,
        }
        for material in candidates
        if allocations[material.product_id] > 0
    ]


def _join_human_readable(values: list[str]) -> str:
    if len(values) <= 1:
        return values[0] if values else ""
    if len(values) == 2:
        return f"{values[0]} and {values[1]}"
    return f"{', '.join(values[:-1])}, and {values[-1]}"


def _request_key(requested: RequestedMaterial) -> str:
    return requested.product_id or f"unknown:{requested.product_name.casefold()}"


def _as_non_negative_int(value: object) -> int:
    try:
        return max(0, int(value or 0))
    except (TypeError, ValueError):
        return 0


def _material_aliases(product_name: str) -> list[str]:
    normalized = _normalize_search_text(product_name)
    singular_name = _singularize(normalized)
    aliases = {normalized, singular_name, _pluralize(singular_name)}
    words = normalized.split()
    if words:
        final_word = words[-1]
        if final_word not in {"flower", "flowers", "stem", "stems"}:
            singular_word = _singularize(final_word)
            aliases.add(final_word)
            aliases.add(singular_word)
            aliases.add(_pluralize(singular_word))
    return sorted((alias for alias in aliases if len(alias) >= 3), key=len, reverse=True)


def _quantity_before_match(prompt: str, match_start: int) -> int:
    prefix = prompt[max(0, match_start - 40):match_start]
    number_words = {
        "a": 1, "an": 1, "one": 1, "two": 2, "three": 3, "four": 4,
        "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9,
        "ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13,
        "fourteen": 14, "fifteen": 15, "sixteen": 16, "seventeen": 17,
        "eighteen": 18, "nineteen": 19, "twenty": 20,
    }
    match = re.search(
        r"(?P<number>\d[\d,]*|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s*"
        r"(?P<scale>hundred|thousand|million|billion)?\s*$",
        prefix,
    )
    if not match:
        return 0
    raw_number = match.group("number")
    base = int(raw_number.replace(",", "")) if raw_number[0].isdigit() else number_words[raw_number]
    scale = {
        None: 1,
        "hundred": 100,
        "thousand": 1_000,
        "million": 1_000_000,
        "billion": 1_000_000_000,
    }[match.group("scale")]
    return base * scale


def _normalize_search_text(value: str) -> str:
    return re.sub(r"[^a-z0-9,]+", " ", str(value or "").casefold()).strip()


def _singularize(value: str) -> str:
    if value.endswith("ies"):
        return f"{value[:-3]}y"
    if value.endswith("s") and not value.endswith("ss"):
        return value[:-1]
    return value


def _pluralize(value: str) -> str:
    if value.endswith("y") and len(value) > 1:
        return f"{value[:-1]}ies"
    if value.endswith("s"):
        return value
    return f"{value}s"
