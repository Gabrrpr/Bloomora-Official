import os
import unittest
from unittest.mock import patch

from app.api.v1.routes.auth import log_dev_otp


class DevelopmentOtpLoggingTests(unittest.TestCase):
    def test_development_otp_is_flushed_to_terminal(self):
        with patch.dict(os.environ, {"APP_ENV": "development"}, clear=False), patch("builtins.print") as output:
            log_dev_otp("registration", "customer@example.com", "123456")

        output.assert_called_once()
        self.assertIn("[DEV OTP] REGISTRATION", output.call_args.args[0])
        self.assertIn("code=123456", output.call_args.args[0])
        self.assertTrue(output.call_args.kwargs["flush"])

    def test_production_never_prints_otp(self):
        with patch.dict(os.environ, {"APP_ENV": "production"}, clear=False), patch("builtins.print") as output:
            log_dev_otp("registration", "customer@example.com", "123456")

        output.assert_not_called()


if __name__ == "__main__":
    unittest.main()
