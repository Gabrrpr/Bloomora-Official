import asyncio
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from urllib.parse import unquote

import httpx
from PIL import Image

from app.services.pollinations_service import PollinationsGenerationError, PollinationsService


class PollinationsServiceTests(unittest.TestCase):
    def setUp(self):
        self.service = PollinationsService()

    def test_every_retry_keeps_the_exact_customer_recipe_first(self):
        exact_recipe = (
            "Mandatory visible flower varieties: 6 Tulips and 6 Sunflowers. "
            "Use exactly these florist materials."
        )

        for arrangement_type in ("bouquet", "vase", "box"):
            variants = self.service._build_prompt_variants(exact_recipe, arrangement_type)
            self.assertGreaterEqual(len(variants), 2)
            for variant in variants:
                self.assertIn("6 Tulips", variant)
                self.assertIn("6 Sunflowers", variant)
                self.assertTrue(variant.startswith(exact_recipe))

    def test_generation_url_uses_the_unified_api_and_supplied_seed(self):
        secret_key = "sk_do-not-place-this-in-a-url"
        urls = self.service._pollinations_urls("tulips", secret_key, 987654321)

        self.assertEqual(len(urls), 2)
        self.assertTrue(any("model=flux" in url for url in urls))
        self.assertTrue(any("model=zimage" in url for url in urls))
        for url in urls:
            self.assertTrue(url.startswith("https://gen.pollinations.ai/image/"))
            self.assertIn("seed=987654321", unquote(url))
            self.assertNotIn(secret_key, url)

    def test_long_prompt_is_compacted_without_losing_recipe_prefix(self):
        recipe = "Mandatory recipe: 6 Tulips and 6 Sunflowers."
        compact = self.service._compact_prompt(f"{recipe} " + ("professional floral detail " * 500))

        self.assertTrue(compact.startswith(recipe))
        self.assertLessEqual(len(compact), 1600)
        self.assertLessEqual(len(compact.split()), 280)

    def test_brand_fallback_changes_the_logo_area_without_web_assets(self):
        source = Image.new("RGB", (768, 768), "white")

        with patch("app.services.pollinations_service.Path.exists", return_value=False):
            branded = self.service._apply_estings_brand(source)

        self.assertEqual(branded.mode, "RGBA")
        self.assertNotEqual(branded.getpixel((50, 50)), (255, 255, 255, 255))


class PollinationsFailureTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.service = PollinationsService()
        self.service._generation_lock = asyncio.Lock()
        self.db = MagicMock()
        self.db.query.return_value.filter.return_value.first.return_value = SimpleNamespace(id="arrangement-id")

    async def test_timeout_stops_endpoint_retries_and_returns_retry_guidance(self):
        client = MagicMock()
        client.__aenter__ = AsyncMock(return_value=client)
        client.__aexit__ = AsyncMock(return_value=None)
        client.get = AsyncMock(side_effect=httpx.ReadTimeout("slow provider"))

        with patch("app.services.pollinations_service.httpx.AsyncClient", return_value=client):
            with self.assertRaisesRegex(PollinationsGenerationError, "taking longer than expected"):
                await self.service.generate_arrangement_image(
                    self.db, "arrangement-id", "Six pink roses", "bouquet"
                )

        client.get.assert_awaited_once()

    async def test_queue_full_stops_endpoint_retries_and_returns_busy_guidance(self):
        request = httpx.Request("GET", "https://example.test/image")
        response = httpx.Response(
            429,
            request=request,
            json={"error": "Too Many Requests", "message": "Queue full for IP"},
        )
        client = MagicMock()
        client.__aenter__ = AsyncMock(return_value=client)
        client.__aexit__ = AsyncMock(return_value=None)
        client.get = AsyncMock(return_value=response)

        with patch("app.services.pollinations_service.httpx.AsyncClient", return_value=client):
            with self.assertRaisesRegex(PollinationsGenerationError, "temporarily busy"):
                await self.service.generate_arrangement_image(
                    self.db, "arrangement-id", "Six pink roses", "bouquet"
                )

        client.get.assert_awaited_once()


if __name__ == "__main__":
    unittest.main()
