import unittest

from app.services.customization_rules import (
    ARRANGEMENT_RULES,
    InventoryMaterial,
    RequestedMaterial,
    build_complete_image_prompt,
    build_default_recipe_suggestion,
    build_presentation_recovery,
    build_quantity_adjustment,
    extract_prompt_requested_materials,
    has_specific_material_request,
    normalize_arrangement_type,
    public_arrangement_rules,
    resolve_complete_recipe,
    safe_inventory_quantity,
)


def flower(product_id: str, name: str, safe_quantity: int) -> InventoryMaterial:
    return InventoryMaterial(
        product_id=product_id,
        product_name=name,
        category="flower",
        product_type="fresh flower",
        safe_quantity=safe_quantity,
    )


def material(product_id: str, name: str, material_type: str, safe_quantity: int) -> InventoryMaterial:
    return InventoryMaterial(
        product_id=product_id,
        product_name=name,
        category=material_type,
        product_type=material_type,
        safe_quantity=safe_quantity,
        unit_price=50,
    )


class CustomizationRuleTests(unittest.TestCase):
    def test_public_rules_match_existing_arrangement_capacities(self):
        rules = public_arrangement_rules()
        self.assertEqual(rules["bouquet"]["max_stems"], 24)
        self.assertEqual(rules["vase"]["max_stems"], 12)
        self.assertEqual(rules["box"]["max_stems"], 9)

    def test_safe_stock_preserves_the_reorder_buffer(self):
        self.assertEqual(safe_inventory_quantity(50, 10), 40)
        self.assertEqual(safe_inventory_quantity(8, 10), 0)

    def test_prompt_words_determine_arrangement_type(self):
        self.assertEqual(normalize_arrangement_type(None, "flowers in a vase"), "vase")
        self.assertEqual(normalize_arrangement_type(None, "a clear flower box"), "box")
        self.assertEqual(normalize_arrangement_type(None, "something romantic"), "bouquet")

    def test_large_bouquet_is_scaled_proportionally(self):
        inventory = [
            flower("rose", "Roses", 100),
            flower("sunflower", "Sunflowers", 100),
        ]
        requested = [
            RequestedMaterial("rose", "Roses", 1000),
            RequestedMaterial("sunflower", "Sunflowers", 700),
        ]

        adjustment = build_quantity_adjustment("bouquet", requested, inventory)

        self.assertIsNotNone(adjustment)
        self.assertEqual(adjustment.code, "quantity_adjustment_required")
        self.assertEqual(adjustment.requested_total, 1700)
        self.assertEqual(
            {item["product_name"]: item["quantity"] for item in adjustment.suggested_items},
            {"Roses": 14, "Sunflowers": 10},
        )

    def test_stock_shortage_reduces_only_to_safe_available_amount(self):
        inventory = [
            flower("rose", "Roses", 2),
            flower("sunflower", "Sunflowers", 20),
        ]
        requested = [
            RequestedMaterial("rose", "Roses", 5),
            RequestedMaterial("sunflower", "Sunflowers", 5),
        ]

        adjustment = build_quantity_adjustment("bouquet", requested, inventory)

        self.assertIsNotNone(adjustment)
        self.assertEqual(adjustment.code, "stock_adjustment_required")
        self.assertEqual(
            {item["product_name"]: item["quantity"] for item in adjustment.suggested_items},
            {"Roses": 2, "Sunflowers": 5},
        )

    def test_unavailable_material_uses_a_safe_stock_alternative(self):
        requested = [RequestedMaterial("rose", "Roses", 12)]
        adjustment = build_quantity_adjustment(
            "bouquet",
            requested,
            [
                flower("rose", "Roses", 0),
                flower("sunflower", "Sunflowers", 40),
                material("wrap", "Kraft Wrapper", "wrapping", 10),
            ],
        )

        self.assertIsNotNone(adjustment)
        self.assertEqual(adjustment.code, "material_unavailable")
        self.assertEqual(
            {item["product_name"]: item["quantity"] for item in adjustment.suggested_items},
            {"Sunflowers": 12, "Kraft Wrapper": 1},
        )
        self.assertIn("Kraft Wrapper", adjustment.suggested_prompt)

    def test_million_quantity_is_recovered_from_prompt_without_ai_items(self):
        inventory = [flower("rose", "Red Rose", 100)]

        requested = extract_prompt_requested_materials(
            "I want a bouquet with 1 million roses",
            inventory,
        )
        adjustment = build_quantity_adjustment("bouquet", requested, inventory)

        self.assertEqual(requested[0].quantity, 1_000_000)
        self.assertIsNotNone(adjustment)
        self.assertEqual(adjustment.suggested_items[0]["quantity"], 24)

    def test_unspecified_flower_request_gets_available_recipe(self):
        suggestion = build_default_recipe_suggestion(
            "bouquet",
            [
                flower("rose", "Roses", 30),
                flower("sunflower", "Sunflowers", 20),
                material("filler", "Baby's Breath", "filler", 10),
                material("wrap", "Kraft Wrapper", "wrapping", 10),
                material("ribbon", "Satin Ribbon", "accessory", 10),
            ],
        )

        flower_total = sum(
            item["quantity"]
            for item in suggestion.suggested_items
            if item["material_type"] == "flower"
        )
        self.assertEqual(flower_total, 24)
        self.assertEqual(
            {item["material_type"] for item in suggestion.suggested_items},
            {"flower", "filler", "wrapping", "accessory"},
        )
        self.assertTrue(suggestion.suggested_prompt)

    def test_style_only_prompt_is_vague_but_named_or_quantity_prompt_is_specific(self):
        inventory = [flower("rose", "Red Roses", 30)]

        self.assertFalse(has_specific_material_request("A romantic pastel birthday bouquet", inventory))
        self.assertTrue(has_specific_material_request("A bouquet with red roses", inventory))
        self.assertTrue(has_specific_material_request("A bouquet with 12 flowers", inventory))

    def test_specific_bouquet_recipe_adds_wrapper_without_optional_materials(self):
        inventory = [
            flower("rose", "Roses", 40),
            flower("sunflower", "Sunflowers", 40),
            material("filler", "Baby's Breath", "filler", 10),
            material("wrap", "Kraft Wrapper", "wrapping", 10),
            material("ribbon", "Satin Ribbon", "accessory", 10),
        ]
        recipe, missing = resolve_complete_recipe(
            "bouquet",
            [RequestedMaterial("rose", "Roses", 14), RequestedMaterial("sunflower", "Sunflowers", 10)],
            inventory,
        )

        self.assertIsNone(missing)
        self.assertEqual(
            {item.product_name for item in recipe},
            {"Roses", "Sunflowers", "Kraft Wrapper"},
        )
        image_prompt = build_complete_image_prompt("bouquet", recipe, inventory, "romantic pink style")
        self.assertIn("Kraft Wrapper", image_prompt)
        self.assertIn("never shown as loose flowers", image_prompt)

    def test_unavailable_requested_wrapper_returns_a_stocked_wrapper_correction(self):
        inventory = [
            flower("rose", "Roses", 20),
            material("old-wrap", "White Wrapper", "wrapping", 0),
            material("new-wrap", "Kraft Wrapper", "wrapping", 10),
        ]
        adjustment = build_quantity_adjustment(
            "bouquet",
            [
                RequestedMaterial("rose", "Roses", 12),
                RequestedMaterial("old-wrap", "White Wrapper", 1),
            ],
            inventory,
        )

        self.assertIsNotNone(adjustment)
        self.assertEqual(adjustment.code, "material_unavailable")
        self.assertEqual(
            {item["product_name"] for item in adjustment.suggested_items},
            {"Roses", "Kraft Wrapper"},
        )
        self.assertIn("Kraft Wrapper", adjustment.suggested_prompt)

    def test_each_arrangement_requires_its_matching_presentation(self):
        inventory = [
            flower("rose", "Roses", 40),
            material("wrap", "Kraft Wrapper", "wrapping", 10),
            material("vase", "Glass Vase", "vase", 10),
            material("box", "Acrylic Flower Box", "box", 10),
        ]
        expected = {"bouquet": "Kraft Wrapper", "vase": "Glass Vase", "box": "Acrylic Flower Box"}
        for arrangement_type, presentation_name in expected.items():
            with self.subTest(arrangement_type=arrangement_type):
                recipe, missing = resolve_complete_recipe(
                    arrangement_type,
                    [RequestedMaterial("rose", "Roses", 6)],
                    inventory,
                )
                self.assertIsNone(missing)
                self.assertIn(presentation_name, {item.product_name for item in recipe})
                image_prompt = build_complete_image_prompt(arrangement_type, recipe, inventory)
                self.assertIn(presentation_name, image_prompt)

    def test_missing_wrapper_suggests_a_feasible_vase(self):
        inventory = [
            flower("rose", "Roses", 20),
            material("vase", "Glass Vase", "vase", 10),
        ]
        recipe = [RequestedMaterial("rose", "Roses", 12)]
        recovery = build_presentation_recovery("bouquet", recipe, inventory, "wrapping")

        self.assertEqual(recovery.arrangement_type, "vase")
        self.assertIn("Glass Vase", recovery.suggested_prompt)

    def test_vague_bouquet_falls_back_to_complete_vase_with_finishing_materials(self):
        recovery = build_default_recipe_suggestion(
            "bouquet",
            [
                flower("rose", "Roses", 20),
                material("vase", "Glass Vase", "vase", 10),
                material("filler", "Baby's Breath", "filler", 10),
                material("ribbon", "Satin Ribbon", "accessory", 10),
            ],
        )

        self.assertEqual(recovery.arrangement_type, "vase")
        self.assertEqual(
            {item["material_type"] for item in recovery.suggested_items},
            {"flower", "filler", "vase", "accessory"},
        )
        self.assertEqual(
            sum(item["quantity"] for item in recovery.suggested_items if item["material_type"] == "flower"),
            12,
        )
        self.assertTrue(recovery.suggested_prompt)

    def test_no_complete_presentation_never_returns_a_failing_prompt(self):
        recovery = build_default_recipe_suggestion(
            "bouquet",
            [flower("rose", "Roses", 20)],
        )

        self.assertEqual(recovery.suggested_prompt, "")
        self.assertIn("No complete arrangement", recovery.adjustment_reasons[-1])

    def test_valid_recipe_needs_no_recovery_response(self):
        inventory = [flower("rose", "Roses", 50)]
        requested = [RequestedMaterial("rose", "Roses", ARRANGEMENT_RULES["bouquet"].max_stems)]
        self.assertIsNone(build_quantity_adjustment("bouquet", requested, inventory))


if __name__ == "__main__":
    unittest.main()
