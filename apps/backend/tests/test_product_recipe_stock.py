import unittest
from decimal import Decimal
from types import SimpleNamespace

from app.api.v1.routes.products import _calculate_buildable_recipe_stock


class ProductRecipeStockTests(unittest.TestCase):
    def test_buildable_stock_uses_recipe_quantity_for_each_branch(self):
        inventory = SimpleNamespace(
            current_stock=100,
            stock_manila=40,
            stock_pampanga=60,
        )

        stock = _calculate_buildable_recipe_stock(
            [("roses", Decimal("10"))],
            {"roses": inventory},
        )

        self.assertEqual(stock, {
            "stock": 10,
            "stock_manila": 4,
            "stock_pampanga": 6,
        })

    def test_lowest_recipe_material_controls_arrangement_availability(self):
        inventories = {
            "roses": SimpleNamespace(current_stock=100, stock_manila=40, stock_pampanga=60),
            "wrappers": SimpleNamespace(current_stock=7, stock_manila=2, stock_pampanga=5),
        }

        stock = _calculate_buildable_recipe_stock(
            [("roses", Decimal("10")), ("wrappers", Decimal("1"))],
            inventories,
        )

        self.assertEqual(stock, {
            "stock": 7,
            "stock_manila": 2,
            "stock_pampanga": 5,
        })

    def test_missing_recipe_material_makes_arrangement_unavailable(self):
        stock = _calculate_buildable_recipe_stock(
            [("missing", Decimal("1"))],
            {},
        )

        self.assertEqual(stock, {
            "stock": 0,
            "stock_manila": 0,
            "stock_pampanga": 0,
        })

    def test_combined_stock_does_not_mix_incompatible_branch_materials(self):
        inventories = {
            "roses": SimpleNamespace(current_stock=10, stock_manila=10, stock_pampanga=0),
            "wrappers": SimpleNamespace(current_stock=10, stock_manila=0, stock_pampanga=10),
        }

        stock = _calculate_buildable_recipe_stock(
            [("roses", Decimal("1")), ("wrappers", Decimal("1"))],
            inventories,
        )

        self.assertEqual(stock, {
            "stock": 0,
            "stock_manila": 0,
            "stock_pampanga": 0,
        })


if __name__ == "__main__":
    unittest.main()
