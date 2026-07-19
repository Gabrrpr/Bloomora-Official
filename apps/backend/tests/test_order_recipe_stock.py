import unittest
import uuid
from types import SimpleNamespace

from fastapi import HTTPException

from app.api.v1.routes.orders import (
    _deduct_custom_arrangement_materials,
    _deduct_product_recipe_materials,
)
from app.models import Inventory, Product, ProductRecipe


class FakeQuery:
    def __init__(self, session, model):
        self.session = session
        self.model = model

    def filter(self, *_args, **_kwargs):
        return self

    def with_for_update(self):
        return self

    def all(self):
        if self.model is ProductRecipe:
            return self.session.recipe_rows
        return []

    def first(self):
        if self.model is Product:
            return self.session.products[0] if self.session.products else None
        if self.model is Inventory:
            return self.session.inventories[0] if self.session.inventories else None
        return None


class FakeSession:
    def __init__(self, inventories, products=None, recipe_rows=None):
        self.inventories = inventories
        self.products = products or []
        self.recipe_rows = recipe_rows or []

    def query(self, model):
        return FakeQuery(self, model)


class OrderRecipeStockTests(unittest.TestCase):
    def test_catalog_arrangement_composition_deducts_each_material_for_order_quantity(self):
        component_id = uuid.uuid4()
        component_product = SimpleNamespace(is_available=True)
        inventory = SimpleNamespace(
            product_id=component_id,
            current_stock=10,
            stock_manila=10,
            stock_pampanga=8,
            product=component_product,
        )
        arrangement_product = SimpleNamespace(
            id=uuid.uuid4(),
            composition=[{
                "product_id": str(component_id),
                "name": "Red Roses",
                "quantity": 3,
            }],
        )

        deducted = _deduct_product_recipe_materials(
            FakeSession([inventory]),
            arrangement_product,
            order_quantity=2,
            branch="Manila",
        )

        self.assertTrue(deducted)
        self.assertEqual(inventory.current_stock, 4)
        self.assertEqual(inventory.stock_manila, 4)
        self.assertEqual(inventory.stock_pampanga, 8)

    def test_custom_arrangement_price_breakdown_deducts_materials(self):
        component_id = uuid.uuid4()
        component_product = SimpleNamespace(
            id=component_id,
            inventory=SimpleNamespace(unit_type="stems", current_stock=12, stock_manila=12),
        )
        inventory = SimpleNamespace(
            product_id=component_id,
            current_stock=12,
            stock_manila=12,
            stock_pampanga=12,
            product=SimpleNamespace(is_available=True),
        )
        arrangement = SimpleNamespace(price_breakdown={
            "items": [{
                "product_id": str(component_id),
                "product_name": "Pink Tulips",
                "quantity": 3,
            }],
        })

        deducted = _deduct_custom_arrangement_materials(
            FakeSession([inventory], [component_product]),
            arrangement,
            order_quantity=2,
            branch="Manila",
        )

        self.assertTrue(deducted)
        self.assertEqual(inventory.current_stock, 6)
        self.assertEqual(inventory.stock_manila, 6)

    def test_duplicate_recipe_lines_are_checked_as_one_total_requirement(self):
        component_id = uuid.uuid4()
        inventory = SimpleNamespace(
            product_id=component_id,
            current_stock=5,
            stock_manila=5,
            stock_pampanga=5,
            product=SimpleNamespace(is_available=True),
        )
        arrangement_product = SimpleNamespace(
            id=uuid.uuid4(),
            composition=[
                {"product_id": str(component_id), "name": "Roses", "quantity": 3},
                {"product_id": str(component_id), "name": "Roses", "quantity": 3},
            ],
        )

        with self.assertRaises(HTTPException):
            _deduct_product_recipe_materials(
                FakeSession([inventory]),
                arrangement_product,
                order_quantity=1,
                branch="Manila",
            )

        self.assertEqual(inventory.current_stock, 5)
        self.assertEqual(inventory.stock_manila, 5)


if __name__ == "__main__":
    unittest.main()
