import base64
import unittest
from app.services.box_preview import render_box_preview


class BoxPreviewTests(unittest.TestCase):
    def test_selected_ribbon_is_visible_without_changing_flower_positions(self):
        slot = {"hole": 4, "product_id": "rose", "name": "Rose"}
        ribbon = {"product_id": "ribbon", "name": "Pink ribbon"}
        photos = {"rose": "data:image/png;base64,AA==", "ribbon": "data:image/png;base64,AQ=="}
        with_ribbon = base64.b64decode(render_box_preview([slot], photos, ribbon).split(",", 1)[1]).decode()
        without_ribbon = base64.b64decode(render_box_preview([slot], photos).split(",", 1)[1]).decode()
        self.assertIn('id="selected-ribbon"', with_ribbon)
        self.assertIn("Pink ribbon", with_ribbon)
        self.assertNotIn('id="selected-ribbon"', without_ribbon)
        self.assertEqual(with_ribbon.count("<image "), 2)
        self.assertEqual(without_ribbon.count("<image "), 1)
        with self.assertRaises(ValueError):
            render_box_preview([slot], {"rose": photos["rose"]}, ribbon)

    def test_sparse_layout_preserves_holes_and_exact_photo_count(self):
        slots = [{"hole": hole, "product_id": "rose", "name": "Rose"} for hole in (0, 4, 8)]
        result = render_box_preview(slots, {"rose": "data:image/png;base64,AA=="})
        svg = base64.b64decode(result.split(",", 1)[1]).decode()
        self.assertEqual(svg.count("<image "), 3)
        self.assertIn('id="slot0"', svg)
        self.assertIn('id="slot4"', svg)
        self.assertIn('id="slot8"', svg)
        self.assertNotIn('id="slot1"', svg)

    def test_duplicate_holes_and_missing_photos_fail(self):
        slot = {"hole": 0, "product_id": "rose", "name": "Rose"}
        with self.assertRaises(ValueError):
            render_box_preview([slot, slot], {})
        with self.assertRaises(ValueError):
            render_box_preview([slot], {})
