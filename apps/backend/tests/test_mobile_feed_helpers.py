import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from app.api.v1.routes.mobile_feed import (
    BOOSTS,
    FEED_SCHEMA_VERSION,
    _campaign_key,
    _campaign_state,
    _decode_cursor,
    _encode_cursor,
    _for_you_product_bucket,
    _product_tie_breaker,
)


class MobileFeedHelperTests(unittest.TestCase):
    def test_cursor_round_trip(self):
        self.assertEqual(_decode_cursor(_encode_cursor(37)), 37)

    def test_invalid_cursor_is_rejected(self):
        with self.assertRaises(Exception):
            _decode_cursor("not-a-cursor")

    def test_campaign_states(self):
        now = datetime.now(timezone.utc)
        active = SimpleNamespace(
            status="published",
            is_active=True,
            start_at=now - timedelta(hours=1),
            end_at=now + timedelta(hours=1),
        )
        scheduled = SimpleNamespace(
            status="published",
            is_active=True,
            start_at=now + timedelta(hours=1),
            end_at=now + timedelta(hours=2),
        )
        expired = SimpleNamespace(
            status="published",
            is_active=True,
            start_at=now - timedelta(hours=2),
            end_at=now - timedelta(hours=1),
        )
        self.assertEqual(_campaign_state(active, now), "active")
        self.assertEqual(_campaign_state(scheduled, now), "scheduled")
        self.assertEqual(_campaign_state(expired, now), "expired")

    def test_campaign_without_expiration_stays_active(self):
        now = datetime.now(timezone.utc)
        campaign = SimpleNamespace(
            status="published",
            is_active=True,
            start_at=now - timedelta(hours=1),
            end_at=None,
        )
        self.assertEqual(_campaign_state(campaign, now), "active")

    def test_generated_campaign_keys_are_safe_and_unique(self):
        first = _campaign_key("Mother's Day Sale!")
        second = _campaign_key("Mother's Day Sale!")
        self.assertRegex(first, r"^mother-s-day-sale-[a-f0-9]{8}$")
        self.assertNotEqual(first, second)

    def test_feed_schema_version_is_explicit(self):
        self.assertEqual(FEED_SCHEMA_VERSION, 3)

    def test_tab_tie_breakers_are_deterministic_and_distinct(self):
        product_id = "11111111-1111-1111-1111-111111111111"
        created_at = datetime(2026, 6, 1, tzinfo=timezone.utc)
        explore_first = _product_tie_breaker("explore", "manila", product_id, created_at)
        explore_second = _product_tie_breaker("explore", "manila", product_id, created_at)
        for_you = _product_tie_breaker("for-you", "manila", product_id, created_at)
        new = _product_tie_breaker("new", "manila", product_id, created_at)
        self.assertEqual(explore_first, explore_second)
        self.assertNotEqual(explore_first, for_you)
        self.assertLess(new, 0)

    def test_boosts_are_bounded(self):
        self.assertEqual(BOOSTS["low"], 0.05)
        self.assertEqual(BOOSTS["medium"], 0.10)
        self.assertEqual(BOOSTS["high"], 0.15)
        self.assertLessEqual(max(BOOSTS.values()), 0.15)

    def test_for_you_allows_bouquets_and_gifts(self):
        bouquet = SimpleNamespace(
            category="bouquet",
            product_group="floral",
            product_type="rose",
            name="BQT 1001",
            description="Fresh birthday bouquet",
            tags=["rose", "bouquet"],
            occasions=["Birthday"],
        )
        gift = SimpleNamespace(
            category="add-on",
            product_group="non-floral",
            product_type=None,
            name="Ferrero Rocher 24pc",
            description="Chocolate gift box",
            tags=["chocolate"],
            occasions=[],
        )
        self.assertEqual(_for_you_product_bucket(bouquet), 0)
        self.assertEqual(_for_you_product_bucket(gift), 1)

    def test_for_you_excludes_sensitive_and_event_display_products(self):
        products = [
            SimpleNamespace(
                category="funerary arrangement",
                product_group="floral",
                product_type=None,
                name="SYM 1005 - Ivory Circle",
                description="A sympathy wreath",
                tags=["sympathy", "wreath"],
                occasions=["Sympathy"],
            ),
            SimpleNamespace(
                category="inaugural arrangement",
                product_group="floral",
                product_type=None,
                name="Opening stand",
                description="Standing arrangement for a store opening",
                tags=["inaugural", "standing arrangement"],
                occasions=["Congratulation"],
            ),
            SimpleNamespace(
                category="bouquet",
                product_group="floral",
                product_type="rose",
                name="White sympathy bouquet",
                description="A soft bouquet",
                tags=["bouquet"],
                occasions=["Sympathy"],
            ),
        ]
        self.assertTrue(all(_for_you_product_bucket(product) is None for product in products))


if __name__ == "__main__":
    unittest.main()
