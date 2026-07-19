import unittest
from types import SimpleNamespace

from app.api.v1.routes.dashboard import (
    _finished_product_demand_rows,
    _three_period_simple_moving_average,
)


class DemandForecastTests(unittest.TestCase):
    def test_three_period_simple_moving_average_uses_exact_formula(self):
        self.assertEqual(_three_period_simple_moving_average([8, 10, 12]), 10)

    def test_three_period_simple_moving_average_preserves_decimal_result(self):
        self.assertAlmostEqual(_three_period_simple_moving_average([2, 3, 3]), 8 / 3)

    def test_three_period_simple_moving_average_requires_three_periods(self):
        with self.assertRaises(ValueError):
            _three_period_simple_moving_average([8, 10])

    def test_product_demand_forecast_excludes_raw_materials(self):
        raw_material = SimpleNamespace(
            name="Light Blue China Rose",
            category="Flowers",
            product_type="Rose stem",
            product_group="Raw Materials",
            is_customization_material=False,
        )
        finished_bouquet = SimpleNamespace(
            name="Scarlet Promise Bouquet",
            category="Bouquet",
            product_type="Rose",
            product_group="Floral",
            is_customization_material=False,
        )

        self.assertEqual(
            _finished_product_demand_rows([raw_material, finished_bouquet]),
            [finished_bouquet],
        )


if __name__ == "__main__":
    unittest.main()
