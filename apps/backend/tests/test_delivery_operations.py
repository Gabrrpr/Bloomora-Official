import unittest
import uuid
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import patch

import httpx

from app.api.v1.routes.deliveries import (
    DELIVERY_SCHEMA_COLUMNS,
    DELIVERY_SCHEMA_TABLES,
    _delivery_schema_status,
    _serialize_assignable_order,
    _sync_delivery_order_status,
)
from app.models import Delivery, DeliveryOrder, DeliveryOrderStatusEnum, DeliveryStatusEnum, Order, OrderStatusEnum
from app.services.delivery_maps import _photo_cache, nearby_street_photos, request_route
from app.services.delivery_tracking import apply_external_status, external_event_key, normalize_provider


class FakeEventQuery:
    def filter(self, *args):
        return self

    def first(self):
        return None


class FakeSession:
    def __init__(self):
        self.added = []

    def query(self, model):
        return FakeEventQuery()

    def add(self, value):
        self.added.append(value)


class DeliveryEligibilityTests(unittest.TestCase):
    def make_order(self, provider, verified=True):
        order = Order(
            id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            total_amount=100,
            status=OrderStatusEnum.ready_for_pickup,
            fulfillment_method="delivery",
            delivery_provider=provider,
            delivery_address="Sample address",
            delivery_lat=14.6,
            delivery_lng=120.9,
            delivery_pin_verified_at=datetime.now(timezone.utc) if verified else None,
            recipient_first_name="Sample",
            recipient_last_name="Recipient",
            branch_name="Manila",
        )
        order.items = []
        return order

    def test_standard_order_with_checkout_pin_is_dispatch_eligible(self):
        serialized = _serialize_assignable_order(self.make_order("standard"))
        self.assertTrue(serialized["dispatchEligible"])
        self.assertEqual(serialized["deliveryMode"], "in_house")
        self.assertEqual(serialized["blockingReasons"], [])

    def test_external_provider_is_not_rider_dispatch_eligible(self):
        serialized = _serialize_assignable_order(self.make_order("lalamove"))
        self.assertFalse(serialized["dispatchEligible"])
        self.assertEqual(serialized["deliveryMode"], "external")
        self.assertIn("external shipment", serialized["blockingReasons"][0])

    def test_legacy_checkout_pin_does_not_require_manual_verification(self):
        serialized = _serialize_assignable_order(self.make_order("standard", verified=False))
        self.assertTrue(serialized["dispatchEligible"])
        self.assertEqual(serialized["blockingReasons"], [])

    def test_missing_checkout_pin_blocks_standard_dispatch(self):
        order = self.make_order("standard", verified=False)
        order.delivery_lat = None
        order.delivery_lng = None
        serialized = _serialize_assignable_order(order)
        self.assertFalse(serialized["dispatchEligible"])
        self.assertIn("not captured at checkout", serialized["blockingReasons"][0])

    def test_provider_normalization_is_stable(self):
        self.assertEqual(normalize_provider("Grab Express"), "grab_express")
        self.assertEqual(normalize_provider("MOVE-IT"), "move_it")


class DeliveryWorkflowTests(unittest.TestCase):
    def test_dispatch_status_is_derived_from_stops(self):
        delivery_order = DeliveryOrder(
            id=uuid.uuid4(),
            delivery_order_number="DO-TEST",
            branch="Manila",
            rider_id=uuid.uuid4(),
        )
        delivery_order.deliveries = [
            Delivery(id=uuid.uuid4(), order_id=uuid.uuid4(), status=DeliveryStatusEnum.delivered),
            Delivery(id=uuid.uuid4(), order_id=uuid.uuid4(), status=DeliveryStatusEnum.delivered),
        ]
        _sync_delivery_order_status(delivery_order)
        self.assertEqual(delivery_order.status, DeliveryOrderStatusEnum.completed)

    def test_external_status_records_event_and_completes_order(self):
        db = FakeSession()
        order = SimpleNamespace(status=OrderStatusEnum.out_for_delivery, can_review=False)
        shipment = SimpleNamespace(
            id=uuid.uuid4(),
            status="in_transit",
            provider_status=None,
            intervention_required=False,
            booked_at=None,
            picked_up_at=None,
            in_transit_at=None,
            delivered_at=None,
            failed_at=None,
            order=order,
        )
        changed = apply_external_status(db, shipment, "delivered", raw_payload={"eventId": "evt-1"})
        self.assertTrue(changed)
        self.assertEqual(shipment.status, "delivered")
        self.assertEqual(order.status, OrderStatusEnum.delivered)
        self.assertTrue(order.can_review)
        self.assertEqual(len(db.added), 1)

    def test_webhook_fallback_event_key_is_deterministic(self):
        payload = {"data": {"orderId": "123"}, "eventType": "COMPLETED"}
        self.assertEqual(external_event_key(payload), external_event_key(payload))


class DeliverySchemaTests(unittest.TestCase):
    def make_inspector(self, missing_column=None):
        columns = {
            table_name: set(required_columns)
            for table_name, required_columns in DELIVERY_SCHEMA_COLUMNS.items()
        }
        if missing_column:
            table_name, column_name = missing_column
            columns[table_name].remove(column_name)
        table_names = set(DELIVERY_SCHEMA_TABLES) | set(columns)
        return SimpleNamespace(
            get_table_names=lambda: list(table_names),
            get_columns=lambda table_name: [{"name": name} for name in columns.get(table_name, set())],
        )

    def test_schema_status_reports_ready_database(self):
        with patch("app.api.v1.routes.deliveries.inspect", return_value=self.make_inspector()):
            status = _delivery_schema_status(SimpleNamespace(get_bind=lambda: object()))
        self.assertTrue(status["ready"])
        self.assertEqual(status["missing"], [])

    def test_schema_status_reports_missing_delivery_column(self):
        with patch(
            "app.api.v1.routes.deliveries.inspect",
            return_value=self.make_inspector(("deliveries", "stop_sequence")),
        ):
            status = _delivery_schema_status(SimpleNamespace(get_bind=lambda: object()))
        self.assertFalse(status["ready"])
        self.assertIn("column:deliveries.stop_sequence", status["missing"])
        self.assertIn("e0f1a2b3c4d5", status["message"])


class DeliveryRouteTests(unittest.TestCase):
    def setUp(self):
        _photo_cache.clear()

    def test_route_without_api_key_returns_verified_pins(self):
        markers = [
            {"type": "origin", "latitude": 14.6, "longitude": 120.9},
            {"type": "destination", "latitude": 14.7, "longitude": 121.0},
        ]
        with patch("app.services.delivery_maps.settings.OPENROUTESERVICE_API_KEY", ""):
            preview = request_route([(14.6, 120.9), (14.7, 121.0)], markers)
        self.assertFalse(preview["available"])
        self.assertEqual(preview["markers"], markers)
        self.assertIn("not configured", preview["availabilityReason"])

    def test_route_response_is_normalized_to_public_contract(self):
        response = SimpleNamespace(
            raise_for_status=lambda: None,
            json=lambda: {
                "features": [{
                    "geometry": {"type": "LineString", "coordinates": [[120.9, 14.6], [121.0, 14.7]]},
                    "properties": {"summary": {"distance": 1234.4, "duration": 456.2}},
                }],
            },
        )
        with patch("app.services.delivery_maps.settings.OPENROUTESERVICE_API_KEY", "secret"), patch("app.services.delivery_maps.httpx.post", return_value=response):
            preview = request_route([(14.6, 120.9), (14.7, 121.0)], [])
        self.assertTrue(preview["available"])
        self.assertEqual(preview["distanceM"], 1234)
        self.assertEqual(preview["durationS"], 456)

    def test_route_timeout_keeps_pin_fallback_available(self):
        with patch("app.services.delivery_maps.settings.OPENROUTESERVICE_API_KEY", "secret"), patch(
            "app.services.delivery_maps.httpx.post", side_effect=httpx.TimeoutException("route timeout")
        ):
            preview = request_route([(14.6, 120.9), (14.7, 121.0)], [])
        self.assertFalse(preview["available"])
        self.assertIn("temporarily unavailable", preview["availabilityReason"])

    def test_malformed_route_response_uses_pin_fallback(self):
        response = SimpleNamespace(raise_for_status=lambda: None, json=lambda: [])
        with patch("app.services.delivery_maps.settings.OPENROUTESERVICE_API_KEY", "secret"), patch(
            "app.services.delivery_maps.httpx.post", return_value=response
        ):
            preview = request_route([(14.6, 120.9), (14.7, 121.0)], [])
        self.assertFalse(preview["available"])

    def test_empty_street_photo_coverage_is_a_valid_response(self):
        response = SimpleNamespace(raise_for_status=lambda: None, json=lambda: {"result": {"data": []}})
        with patch("app.services.delivery_maps.httpx.get", return_value=response):
            photos = nearby_street_photos(14.6, 120.9)
        self.assertFalse(photos["coverageAvailable"])
        self.assertEqual(photos["photos"], [])

    def test_street_photo_timeout_returns_empty_coverage(self):
        with patch(
            "app.services.delivery_maps.httpx.get",
            side_effect=httpx.TimeoutException("photo timeout"),
        ):
            photos = nearby_street_photos(14.61, 120.91)
        self.assertFalse(photos["coverageAvailable"])
        self.assertEqual(photos["photos"], [])


if __name__ == "__main__":
    unittest.main()
