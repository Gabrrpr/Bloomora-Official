import unittest
import uuid
from decimal import Decimal
from types import SimpleNamespace

from app.api.v1.routes.orders import _calculate_bundle_discount


def product_item(product_id, quantity, category="bouquets"):
    return ("product", SimpleNamespace(id=product_id, category=category), quantity, Decimal("100"), False)


class BundleDiscountTests(unittest.TestCase):
    def test_bundle_applies_after_minimum_eligible_quantity(self):
        product_id = uuid.uuid4()
        campaign = SimpleNamespace(
            minimum_quantity=3,
            discount_value=10,
            products=[SimpleNamespace(id=product_id)],
        )

        selected, discount = _calculate_bundle_discount(
            [campaign],
            [product_item(product_id, 3)],
            Decimal("1000.00"),
        )

        self.assertIs(selected, campaign)
        self.assertEqual(discount, Decimal("100.00"))

    def test_unselected_products_do_not_count_toward_bundle(self):
        eligible_id = uuid.uuid4()
        other_id = uuid.uuid4()
        campaign = SimpleNamespace(
            minimum_quantity=3,
            discount_value=10,
            products=[SimpleNamespace(id=eligible_id)],
        )

        selected, discount = _calculate_bundle_discount(
            [campaign],
            [product_item(eligible_id, 2), product_item(other_id, 5)],
            Decimal("1000.00"),
        )

        self.assertIsNone(selected)
        self.assertEqual(discount, Decimal("0.00"))

    def test_only_best_qualifying_bundle_is_applied(self):
        product_id = uuid.uuid4()
        campaigns = [
            SimpleNamespace(minimum_quantity=2, discount_value=10, products=[SimpleNamespace(id=product_id)]),
            SimpleNamespace(minimum_quantity=3, discount_value=20, products=[SimpleNamespace(id=product_id)]),
        ]

        selected, discount = _calculate_bundle_discount(
            campaigns,
            [product_item(product_id, 3)],
            Decimal("1000.00"),
        )

        self.assertIs(selected, campaigns[1])
        self.assertEqual(discount, Decimal("200.00"))

    def test_category_bundle_counts_only_products_in_selected_category(self):
        campaign = SimpleNamespace(
            minimum_quantity=3,
            discount_value=15,
            eligible_category="bouquets",
            products=[],
        )

        selected, discount = _calculate_bundle_discount(
            [campaign],
            [
                product_item(uuid.uuid4(), 3, "bouquets"),
                product_item(uuid.uuid4(), 5, "gift sets"),
            ],
            Decimal("1000.00"),
        )

        self.assertIs(selected, campaign)
        self.assertEqual(discount, Decimal("150.00"))


if __name__ == "__main__":
    unittest.main()
