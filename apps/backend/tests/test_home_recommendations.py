import unittest
from types import SimpleNamespace

from app.api.v1.routes.recommendations import _is_home_recommendation_product


class HomeRecommendationTests(unittest.TestCase):
    def test_explicit_customization_material_is_excluded(self):
        material = SimpleNamespace(
            category="Accessory",
            product_type="Ribbon",
            product_group="Raw Materials",
            name="Florist Finishing Ribbon",
            is_customization_material=True,
        )

        self.assertFalse(_is_home_recommendation_product(material))

    def test_legacy_misflagged_raw_material_is_excluded(self):
        material = SimpleNamespace(
            category="Flowers",
            product_type="Rose stem",
            product_group="Raw Materials",
            name="Red Ecuador Rose",
            is_customization_material=False,
        )

        self.assertFalse(_is_home_recommendation_product(material))

    def test_finished_bouquet_is_allowed(self):
        bouquet = SimpleNamespace(
            category="Bouquets",
            product_type="Flower arrangement",
            product_group="Floral",
            name="Scarlet Promise Bouquet",
            is_customization_material=False,
        )

        self.assertTrue(_is_home_recommendation_product(bouquet))


if __name__ == "__main__":
    unittest.main()
