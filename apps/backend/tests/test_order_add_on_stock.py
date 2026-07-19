import uuid
import unittest
from types import SimpleNamespace

from fastapi import HTTPException

from app.api.v1.routes.orders import (
    _deduct_inventory_stock,
    _requested_add_on_quantities,
)


class OrderAddOnStockTests(unittest.TestCase):
    def test_add_on_quantity_is_per_ordered_parent_item_and_duplicates_are_aggregated(self):
        add_on_id = uuid.uuid4()
        quantities = _requested_add_on_quantities(
            {
                "add_ons": [
                    {"id": str(add_on_id), "qty": 1},
                    {"id": str(add_on_id), "qty": 2},
                ]
            },
            parent_quantity=2,
        )

        self.assertEqual(quantities, {add_on_id: 6})

    def test_add_on_quantity_rejects_an_invalid_selection(self):
        with self.assertRaises(HTTPException):
            _requested_add_on_quantities({"add_ons": [{"id": "not-a-uuid"}]}, 1)

    def test_manila_order_only_deducts_manila_branch_stock(self):
        inventory = SimpleNamespace(current_stock=20, stock_manila=8, stock_pampanga=12)

        _deduct_inventory_stock(inventory, quantity=3, branch="Manila")

        self.assertEqual(inventory.current_stock, 17)
        self.assertEqual(inventory.stock_manila, 5)
        self.assertEqual(inventory.stock_pampanga, 12)

    def test_pampanga_order_only_deducts_pampanga_branch_stock(self):
        inventory = SimpleNamespace(current_stock=20, stock_manila=8, stock_pampanga=12)

        _deduct_inventory_stock(inventory, quantity=4, branch="Pampanga")

        self.assertEqual(inventory.current_stock, 16)
        self.assertEqual(inventory.stock_manila, 8)
        self.assertEqual(inventory.stock_pampanga, 8)


if __name__ == "__main__":
    unittest.main()
