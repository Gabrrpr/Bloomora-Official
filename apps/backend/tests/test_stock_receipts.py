import unittest
import uuid
from types import SimpleNamespace

from app.api.v1.routes.products import StockReceiptCreate, receive_stock_invoice
from app.models.product import Inventory, Product, ProductStatusEnum


class _LockedQuery:
    def __init__(self, value):
        self.value = value

    def filter(self, *args, **kwargs):
        return self

    def with_for_update(self):
        return self

    def first(self):
        return self.value


class _ReceiptSession:
    def __init__(self, product, inventory):
        self.product = product
        self.inventory = inventory
        self.executed = []
        self.committed = False
        self.rolled_back = False

    def query(self, model):
        return _LockedQuery(self.product if model is Product else self.inventory)

    def execute(self, statement, params):
        self.executed.append(params)

    def add(self, value):
        pass

    def flush(self):
        pass

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True


class StockReceiptTests(unittest.TestCase):
    def test_receipt_increments_only_selected_branch_and_recomputes_total(self):
        product_id = uuid.uuid4()
        product = SimpleNamespace(
            id=product_id, name="Customer Ribbon", status=ProductStatusEnum.active,
            is_available=False,
        )
        inventory = SimpleNamespace(
            product_id=product_id, current_stock=8, stock_manila=3, stock_pampanga=5,
        )
        session = _ReceiptSession(product, inventory)

        result = receive_stock_invoice(
            StockReceiptCreate(branch="Manila", lines=[{
                "product_id": str(product_id),
                "quantity": 4,
                "purchasing_price": 200,
                "date_of_issuance": "2026-07-20",
            }]),
            session,
            SimpleNamespace(id=uuid.uuid4()),
        )

        self.assertTrue(session.committed)
        self.assertFalse(session.rolled_back)
        self.assertEqual(inventory.stock_manila, 7)
        self.assertEqual(inventory.stock_pampanga, 5)
        self.assertEqual(inventory.current_stock, 12)
        self.assertTrue(product.is_available)
        self.assertEqual(result["items"][0]["stock"], 12)
        self.assertEqual(session.executed[0]["branch"], "Manila")
        self.assertNotIn("id", session.executed[0])


if __name__ == "__main__":
    unittest.main()
