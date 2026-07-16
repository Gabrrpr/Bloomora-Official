import asyncio
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from app.api.v1.routes.customization import _calculate_complete_recipe_price, check_and_generate
from app.schemas.customization import CustomizationRequest
from app.services.customization_rules import InventoryMaterial, RequestedMaterial, build_complete_image_prompt


class WriteTrackingSession:
    def __init__(self):
        self.added = []
        self.commits = 0

    def add(self, value):
        self.added.append(value)

    def commit(self):
        self.commits += 1


class CustomizationQuantityRouteTests(unittest.TestCase):
    def test_price_breakdown_and_image_prompt_share_the_complete_recipe(self):
        inventory = [
            InventoryMaterial("rose", "Roses", "flower", "fresh flower", 30, 100, "https://example.com/rose.jpg"),
            InventoryMaterial("wrap", "Kraft Wrapper", "wrapping", "wrapping", 10, 50, "https://example.com/wrap.jpg"),
        ]
        recipe = [
            RequestedMaterial("rose", "Roses", 14),
            RequestedMaterial("wrap", "Kraft Wrapper", 1),
        ]

        price = _calculate_complete_recipe_price(recipe, inventory)
        image_prompt = build_complete_image_prompt("bouquet", recipe, inventory)

        self.assertEqual({item.product_id for item in price.items}, {"rose", "wrap"})
        self.assertEqual(price.total_price, 1450)
        self.assertEqual(
            {item.product_id: item.image_url for item in price.items},
            {"rose": "https://example.com/rose.jpg", "wrap": "https://example.com/wrap.jpg"},
        )
        for item in price.items:
            self.assertIn(item.product_name, image_prompt)

    def test_review_only_uses_gemini_recipe_without_image_credit_or_database_writes(self):
        inventory = [
            InventoryMaterial("rose", "Roses", "flower", "fresh flower", 30, 100),
            InventoryMaterial("sunflower", "Sunflowers", "flower", "fresh flower", 30, 80),
            InventoryMaterial("wrap", "Kraft Wrapper", "wrapping", "wrapping", 20, 50),
        ]
        verdict = {
            "is_possible": True,
            "feedback": "A complete bouquet is available.",
            "arrangement_type": "bouquet",
            "design_notes": "bright balanced style",
            "used_items": [
                {"product_id": "rose", "name": "Roses", "quantity": 14},
                {"product_id": "sunflower", "name": "Sunflowers", "quantity": 10},
            ],
        }
        session = WriteTrackingSession()
        image_generation = AsyncMock()

        with (
            patch("app.api.v1.routes.customization.has_reached_daily_limit") as daily_limit,
            patch("app.api.v1.routes.customization.load_customization_inventory", return_value=inventory),
            patch("app.api.v1.routes.customization.validate_and_optimize_prompt", return_value=verdict) as gemini_review,
            patch("app.api.v1.routes.customization.get_remaining_generations", return_value=0),
            patch("app.api.v1.routes.customization.log_ai_usage") as usage_log,
            patch("app.api.v1.routes.customization.pollinations.generate_arrangement_image", image_generation),
        ):
            response = asyncio.run(
                check_and_generate(
                    CustomizationRequest(
                        prompt_text="A bouquet with 14 roses and 10 sunflowers",
                        review_only=True,
                    ),
                    session,
                    SimpleNamespace(id="customer"),
                )
            )

        self.assertTrue(response.success)
        self.assertEqual(response.arrangement_type, "bouquet")
        self.assertEqual(
            {item.product_id: item.quantity for item in response.price_breakdown.items},
            {"rose": 14, "sunflower": 10, "wrap": 1},
        )
        self.assertEqual(response.price_breakdown.total_price, 2250)
        self.assertEqual(response.remaining_generations, 0)
        self.assertEqual(session.added, [])
        self.assertEqual(session.commits, 0)
        daily_limit.assert_not_called()
        gemini_review.assert_called_once()
        usage_log.assert_not_called()
        image_generation.assert_not_awaited()

    def test_quantity_correction_returns_before_writes_or_generation(self):
        inventory = [
            InventoryMaterial("rose", "Roses", "flower", "fresh flower", 100),
            InventoryMaterial("sunflower", "Sunflowers", "flower", "fresh flower", 100),
            InventoryMaterial("wrap", "Kraft Wrapper", "wrapping", "wrapping", 20),
        ]
        verdict = {
            "is_possible": False,
            "feedback": "The requested quantities exceed a standard arrangement.",
            "arrangement_type": "bouquet",
            "optimized_prompt": "A rose and sunflower bouquet.",
            "used_items": [
                {"product_id": "rose", "name": "Roses", "quantity": 1000},
                {"product_id": "sunflower", "name": "Sunflowers", "quantity": 700},
            ],
        }
        session = WriteTrackingSession()
        image_generation = AsyncMock()

        with (
            patch("app.api.v1.routes.customization.has_reached_daily_limit", return_value=False),
            patch("app.api.v1.routes.customization.load_customization_inventory", return_value=inventory),
            patch("app.api.v1.routes.customization.validate_and_optimize_prompt", return_value=verdict),
            patch("app.api.v1.routes.customization.get_remaining_generations", return_value=5),
            patch("app.api.v1.routes.customization.log_ai_usage") as usage_log,
            patch(
                "app.api.v1.routes.customization.pollinations.generate_arrangement_image",
                image_generation,
            ),
        ):
            response = asyncio.run(
                check_and_generate(
                    CustomizationRequest(prompt_text="A bouquet with 1000 roses and 700 sunflowers"),
                    session,
                    SimpleNamespace(id="customer"),
                )
            )

        self.assertFalse(response.success)
        self.assertEqual(response.validation.code, "quantity_adjustment_required")
        self.assertEqual(session.added, [])
        self.assertEqual(session.commits, 0)
        usage_log.assert_not_called()
        image_generation.assert_not_awaited()

    def test_million_roses_gets_suggestion_when_ai_omits_items(self):
        inventory = [
            InventoryMaterial("rose", "Roses", "flower", "fresh flower", 100),
            InventoryMaterial("sunflower", "Sunflowers", "flower", "fresh flower", 100),
            InventoryMaterial("wrap", "Kraft Wrapper", "wrapping", "wrapping", 20),
        ]
        verdict = {
            "is_possible": False,
            "feedback": "The request is too large.",
            "arrangement_type": "bouquet",
            "optimized_prompt": None,
            "used_items": [],
        }
        session = WriteTrackingSession()
        image_generation = AsyncMock()

        with (
            patch("app.api.v1.routes.customization.has_reached_daily_limit", return_value=False),
            patch("app.api.v1.routes.customization.load_customization_inventory", return_value=inventory),
            patch("app.api.v1.routes.customization.validate_and_optimize_prompt", return_value=verdict),
            patch("app.api.v1.routes.customization.get_remaining_generations", return_value=5),
            patch("app.api.v1.routes.customization.log_ai_usage") as usage_log,
            patch(
                "app.api.v1.routes.customization.pollinations.generate_arrangement_image",
                image_generation,
            ),
        ):
            response = asyncio.run(
                check_and_generate(
                    CustomizationRequest(prompt_text="I want a bouquet with 1 million roses"),
                    session,
                    SimpleNamespace(id="customer"),
                )
            )

        self.assertFalse(response.success)
        self.assertEqual(response.validation.code, "quantity_adjustment_required")
        self.assertEqual(response.validation.requested_total, 1_000_000)
        self.assertEqual(response.validation.suggested_items[0].quantity, 24)
        self.assertIn("Kraft Wrapper", {item.product_name for item in response.validation.suggested_items})
        self.assertTrue(response.validation.suggested_prompt)
        self.assertEqual(session.commits, 0)
        usage_log.assert_not_called()
        image_generation.assert_not_awaited()

    def test_floral_request_without_matching_product_gets_available_recipe(self):
        inventory = [
            InventoryMaterial("rose", "Roses", "flower", "fresh flower", 30),
            InventoryMaterial("sunflower", "Sunflowers", "flower", "fresh flower", 30),
            InventoryMaterial("wrap", "Kraft Wrapper", "wrapping", "wrapping", 20),
            InventoryMaterial("filler", "Baby's Breath", "filler", "filler", 20),
            InventoryMaterial("ribbon", "Satin Ribbon", "accessory", "accessory", 20),
        ]
        verdict = {
            "is_possible": False,
            "feedback": "Blue orchids are not in inventory.",
            "arrangement_type": "bouquet",
            "optimized_prompt": None,
            "used_items": [],
        }
        session = WriteTrackingSession()

        with (
            patch("app.api.v1.routes.customization.has_reached_daily_limit", return_value=False),
            patch("app.api.v1.routes.customization.load_customization_inventory", return_value=inventory),
            patch("app.api.v1.routes.customization.validate_and_optimize_prompt", return_value=verdict),
            patch("app.api.v1.routes.customization.get_remaining_generations", return_value=5),
            patch("app.api.v1.routes.customization.log_ai_usage") as usage_log,
            patch("app.api.v1.routes.customization.pollinations.generate_arrangement_image", AsyncMock()) as image_generation,
        ):
            response = asyncio.run(
                check_and_generate(
                    CustomizationRequest(prompt_text="A bouquet with blue orchids"),
                    session,
                    SimpleNamespace(id="customer"),
                )
            )

        self.assertFalse(response.success)
        self.assertEqual(response.validation.code, "material_unavailable")
        self.assertEqual(
            sum(
                item.quantity
                for item in response.validation.suggested_items
                if item.material_type == "flower"
            ),
            24,
        )
        self.assertTrue(response.validation.suggested_prompt)
        self.assertEqual(session.commits, 0)
        usage_log.assert_not_called()
        image_generation.assert_not_awaited()

    def test_vague_prompt_uses_full_stocked_recipe_even_when_ai_selects_a_flower(self):
        inventory = [
            InventoryMaterial("rose", "Roses", "flower", "fresh flower", 30),
            InventoryMaterial("wrap", "Kraft Wrapper", "wrapping", "wrapping", 20),
            InventoryMaterial("filler", "Baby's Breath", "filler", "filler", 20),
            InventoryMaterial("ribbon", "Satin Ribbon", "accessory", "accessory", 20),
        ]
        verdict = {
            "is_possible": True,
            "feedback": "A romantic birthday design is possible.",
            "arrangement_type": "bouquet",
            "design_notes": "romantic pastel birthday style",
            "used_items": [{"product_id": "rose", "name": "Roses", "quantity": 12}],
        }
        session = WriteTrackingSession()

        with (
            patch("app.api.v1.routes.customization.has_reached_daily_limit", return_value=False),
            patch("app.api.v1.routes.customization.load_customization_inventory", return_value=inventory),
            patch("app.api.v1.routes.customization.validate_and_optimize_prompt", return_value=verdict),
            patch("app.api.v1.routes.customization.get_remaining_generations", return_value=5),
            patch("app.api.v1.routes.customization.log_ai_usage") as usage_log,
            patch("app.api.v1.routes.customization.pollinations.generate_arrangement_image", AsyncMock()) as image_generation,
        ):
            response = asyncio.run(
                check_and_generate(
                    CustomizationRequest(prompt_text="A romantic pastel birthday bouquet"),
                    session,
                    SimpleNamespace(id="customer"),
                )
            )

        self.assertFalse(response.success)
        self.assertEqual(
            {item.material_type for item in response.validation.suggested_items},
            {"flower", "filler", "wrapping", "accessory"},
        )
        self.assertTrue(response.validation.suggested_prompt)
        self.assertEqual(session.commits, 0)
        usage_log.assert_not_called()
        image_generation.assert_not_awaited()

    def test_no_complete_recipe_returns_manual_fallback_without_generation(self):
        inventory = [
            InventoryMaterial("rose", "Roses", "flower", "fresh flower", 30),
        ]
        verdict = {
            "is_possible": True,
            "feedback": "A romantic design is possible.",
            "arrangement_type": "bouquet",
            "used_items": [],
        }
        session = WriteTrackingSession()
        image_generation = AsyncMock()

        with (
            patch("app.api.v1.routes.customization.has_reached_daily_limit", return_value=False),
            patch("app.api.v1.routes.customization.load_customization_inventory", return_value=inventory),
            patch("app.api.v1.routes.customization.validate_and_optimize_prompt", return_value=verdict),
            patch("app.api.v1.routes.customization.get_remaining_generations", return_value=5),
            patch("app.api.v1.routes.customization.log_ai_usage") as usage_log,
            patch("app.api.v1.routes.customization.pollinations.generate_arrangement_image", image_generation),
        ):
            response = asyncio.run(
                check_and_generate(
                    CustomizationRequest(prompt_text="A romantic birthday bouquet"),
                    session,
                    SimpleNamespace(id="customer"),
                )
            )

        self.assertFalse(response.success)
        self.assertEqual(response.validation.suggested_prompt, "")
        self.assertIn("No complete arrangement", response.validation.adjustment_reasons[-1])
        self.assertEqual(session.commits, 0)
        usage_log.assert_not_called()
        image_generation.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()
