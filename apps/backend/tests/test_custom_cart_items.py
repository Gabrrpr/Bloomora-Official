import unittest
import uuid
from types import SimpleNamespace

from app.api.v1.routes.cart import _serialize, _upsert_web_item


class ExistingItemQuery:
    def __init__(self, item):
        self.item = item

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return self.item


class ExistingItemSession:
    def __init__(self, item):
        self.item = item
        self.added = []

    def add(self, item):
        self.added.append(item)

    def query(self, model):
        return ExistingItemQuery(self.item)


class CustomCartItemTests(unittest.TestCase):
    def test_generated_arrangement_upsert_is_idempotent_and_preserves_recipe_snapshot(self):
        item = SimpleNamespace(
            id=uuid.uuid4(),
            item_data={},
            item_key="web:Custom AI Arrangement:ai-arr-test",
            product=None,
            product_id=None,
            quantity=2,
        )
        session = ExistingItemSession(item)
        snapshot = {
            "arrangement_details": {
                "basePriceCents": 240000,
                "recipeItems": [{"productName": "Roses", "quantity": 14}],
                "source": "describe",
            },
            "group": "Custom AI Arrangement",
            "id": "ai-arr-test",
            "name": "Birthday Bouquet",
            "price": 2400,
            "qty": 1,
        }

        _upsert_web_item(session, uuid.uuid4(), snapshot)
        _upsert_web_item(session, uuid.uuid4(), snapshot)

        self.assertEqual(item.quantity, 1)
        self.assertEqual(item.item_data["arrangement_details"], snapshot["arrangement_details"])
        self.assertEqual(session.added, [])
        self.assertEqual(_serialize(item)["web_item"]["arrangement_details"], snapshot["arrangement_details"])


if __name__ == "__main__":
    unittest.main()
