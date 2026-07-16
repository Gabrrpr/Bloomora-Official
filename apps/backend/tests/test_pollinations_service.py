import unittest
from urllib.parse import unquote

from app.services.pollinations_service import PollinationsService


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

    def test_generation_url_uses_the_supplied_seed(self):
        urls = self.service._pollinations_urls("tulips", "", 987654321)

        self.assertTrue(urls)
        for url in urls:
            self.assertIn("seed=987654321", unquote(url))


if __name__ == "__main__":
    unittest.main()
