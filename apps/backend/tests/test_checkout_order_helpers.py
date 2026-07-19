import unittest
import uuid
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import HTTPException

from app.api.v1.routes.orders import (
    _paymongo_payment_method_types,
    _resolve_checkout_branch,
    _selected_shipping_method,
    serialize_order,
)


class CheckoutOrderHelperTests(unittest.TestCase):
    def test_customer_ewallet_checkout_enables_all_default_paymongo_methods(self):
        self.assertIsNone(_paymongo_payment_method_types("ewallet"))

    def test_explicit_payment_method_is_restricted_to_that_paymongo_method(self):
        self.assertEqual(_paymongo_payment_method_types("gcash"), ["gcash"])
        self.assertEqual(_paymongo_payment_method_types("card"), ["card"])
        self.assertEqual(_paymongo_payment_method_types("qrph"), ["qrph"])

    def test_selected_branch_is_kept_for_standard_delivery(self):
        branch = _resolve_checkout_branch(
            {"branch_name": "manila"},
            "delivery",
            "San Fernando, Pampanga",
        )

        self.assertEqual(branch, "Manila")

    def test_standard_delivery_is_not_rewritten_to_an_external_courier(self):
        method = _selected_shipping_method(
            None,
            {"delivery_provider": "standard"},
        )

        self.assertIsNone(method)

    def test_selected_branch_is_kept_for_lalamove(self):
        branch = _resolve_checkout_branch(
            {"branch_name": "pampanga"},
            "lalamove",
            "Makati, Metro Manila",
        )

        self.assertEqual(branch, "Pampanga")

    def test_legacy_client_without_branch_falls_back_to_delivery_address(self):
        self.assertEqual(
            _resolve_checkout_branch({}, "delivery", "Makati, Metro Manila"),
            "Manila",
        )
        self.assertEqual(
            _resolve_checkout_branch({}, "delivery", "San Fernando, Pampanga"),
            "Pampanga",
        )

    def test_pickup_without_branch_uses_manila_fallback(self):
        self.assertEqual(_resolve_checkout_branch({}, "pickup", ""), "Manila")

    def test_unknown_selected_branch_is_rejected(self):
        with self.assertRaises(HTTPException) as context:
            _resolve_checkout_branch(
                {"branch_name": "cebu"},
                "delivery",
                "Makati, Metro Manila",
            )

        self.assertEqual(context.exception.status_code, 400)

    def test_receipt_serialization_uses_the_branch_saved_on_the_order(self):
        order = SimpleNamespace(
            arrangement=None,
            arrangement_id=None,
            branch_name="Manila",
            id=uuid.uuid4(),
            items=[],
            product=None,
            product_id=None,
            quantity=1,
            status="paid",
            total_amount=0,
            transaction=None,
            user=SimpleNamespace(
                branch=SimpleNamespace(value="Pampanga"),
                email="customer@example.com",
                first_name="Test",
                last_name="Customer",
            ),
            user_id=uuid.uuid4(),
        )

        with patch("app.api.v1.routes.orders.object_session", return_value=None):
            payload = serialize_order(order)

        self.assertEqual(payload["branch"], "Manila")


if __name__ == "__main__":
    unittest.main()
