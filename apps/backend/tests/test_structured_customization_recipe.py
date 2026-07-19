import unittest
import uuid

from app.api.v1.routes.customization import _requested_materials_from_selection
from app.schemas.customization import CustomizationRequest
from app.services.customization_rules import (
    InventoryMaterial,
    build_complete_image_prompt,
    build_quantity_adjustment,
)


class StructuredCustomizationRecipeTests(unittest.TestCase):
    def test_exact_nine_box_stems_are_not_reinterpreted_as_over_limit(self):
        rose_id = str(uuid.uuid4())
        sunflower_id = str(uuid.uuid4())
        box_id = str(uuid.uuid4())
        inventory = [
            InventoryMaterial(rose_id, "Red Roses", "flower", "rose", 20),
            InventoryMaterial(sunflower_id, "Sunflowers", "flower", "sunflower", 20),
            InventoryMaterial(box_id, "Acrylic Flower Box", "box", "box", 5),
        ]
        payload = CustomizationRequest(
            prompt_text=(
                "5 red roses, 4 sunflowers, arranged in a box with 6 to 9 bloom "
                "heads in a compact grid"
            ),
            arrangement_type="box",
            selected_items=[
                {"product_id": rose_id, "quantity": 5},
                {"product_id": sunflower_id, "quantity": 4},
                {"product_id": box_id, "quantity": 1},
            ],
        )

        recipe = _requested_materials_from_selection(payload, inventory)

        self.assertEqual(sum(item.quantity for item in recipe if item.product_id != box_id), 9)
        self.assertIsNone(build_quantity_adjustment("box", recipe, inventory))
        image_prompt = build_complete_image_prompt("box", recipe, inventory, "")
        self.assertIn("two-level construction", image_prompt)
        self.assertIn("transparent mid-height support plate", image_prompt)
        self.assertIn("deep rose-red base", image_prompt)
        self.assertIn("extra blooms", image_prompt)


if __name__ == "__main__":
    unittest.main()
