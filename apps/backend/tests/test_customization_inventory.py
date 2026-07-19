import unittest
from types import SimpleNamespace

from app.api.v1.routes.products import _is_customization_material_product
from app.services.customization_inventory import is_shop_only_customization_product


class CustomizationInventoryTests(unittest.TestCase):
    def test_pot_fillers_are_shop_only(self):
        product = SimpleNamespace(
            category="Pot Fillers",
            product_type="Decorative filler",
            product_group="Non-floral",
            name="Natural Pot Filler",
            is_customization_material=True,
        )

        self.assertTrue(
            is_shop_only_customization_product(
                product.category,
                product.product_type,
                product.product_group,
                product.name,
            )
        )
        self.assertFalse(_is_customization_material_product(product))

    def test_floral_fillers_remain_customization_materials(self):
        product = SimpleNamespace(
            category="Filler",
            product_type="Fresh flower",
            product_group="Floral",
            name="Baby's Breath",
            is_customization_material=True,
        )

        self.assertFalse(
            is_shop_only_customization_product(
                product.category,
                product.product_type,
                product.product_group,
                product.name,
            )
        )
        self.assertTrue(_is_customization_material_product(product))

    def test_misflagged_raw_flower_is_still_classified_as_material(self):
        product = SimpleNamespace(
            category="Flowers",
            product_type="Rose stem",
            product_group="Raw Materials",
            name="Red Ecuador Rose",
            is_customization_material=False,
        )

        self.assertTrue(_is_customization_material_product(product))

    def test_finished_bouquet_is_not_classified_as_raw_material(self):
        product = SimpleNamespace(
            category="Bouquets",
            product_type="Flower arrangement",
            product_group="Floral",
            name="Scarlet Promise Bouquet",
            is_customization_material=False,
        )

        self.assertFalse(_is_customization_material_product(product))

    def test_customer_ribbon_accessory_is_not_inferred_as_raw_material(self):
        product = SimpleNamespace(
            category="Accessory",
            product_type="Ribbon",
            product_group="Non-floral",
            name="Satin Gift Ribbon",
            is_customization_material=False,
        )

        self.assertFalse(_is_customization_material_product(product))

    def test_explicit_customization_ribbon_can_still_be_a_material(self):
        product = SimpleNamespace(
            category="Accessory",
            product_type="Ribbon",
            product_group="Raw Materials",
            name="Florist Finishing Ribbon",
            is_customization_material=True,
        )

        self.assertTrue(_is_customization_material_product(product))


if __name__ == "__main__":
    unittest.main()
