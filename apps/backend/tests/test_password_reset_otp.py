import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import Mock, patch

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from app.api.v1.routes import auth


class PasswordResetOtpTests(unittest.TestCase):
    def setUp(self):
        self.user = SimpleNamespace(
            is_verified=True,
            otp_code="123456",
            otp_expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
            password_hash="original-hash",
        )
        self.db = Mock()
        self.db.query.return_value.filter.return_value.first.return_value = self.user
        app = FastAPI()
        app.include_router(auth.router)
        app.dependency_overrides[auth.get_db] = lambda: self.db
        self.client = TestClient(app)
        auth.limiter.reset()

    def verify(self, otp="123456"):
        return self.client.post("/auth/forgot-password/verify-otp", json={
            "email": "customer@example.com", "otp": otp,
        })

    def reset(self):
        return auth.forgot_password_reset(auth.ResetPasswordRequest(
            email="customer@example.com", otp="123456", new_password="NewPassword!",
        ), self.db)

    def test_verification_does_not_change_password_or_consume_code(self):
        self.assertEqual(self.verify().status_code, 200)
        self.assertEqual(self.user.password_hash, "original-hash")
        self.assertEqual(self.user.otp_code, "123456")
        self.db.commit.assert_not_called()

    def test_verification_rejects_invalid_codes_and_accounts(self):
        for case in ("wrong", "malformed", "expired", "missing_expiry", "unknown", "unverified"):
            with self.subTest(case=case):
                self.setUp()
                otp = "654321" if case == "wrong" else "12345" if case == "malformed" else "123456"
                if case == "expired":
                    self.user.otp_expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
                elif case == "missing_expiry":
                    self.user.otp_expires_at = None
                elif case == "unknown":
                    self.db.query.return_value.filter.return_value.first.return_value = None
                elif case == "unverified":
                    self.user.is_verified = False
                response = self.verify(otp)
                self.assertEqual(response.status_code, 400)
                self.assertEqual(response.json()["detail"], "Invalid or expired reset code.")
                self.db.commit.assert_not_called()

    def test_reset_consumes_code_and_prevents_reuse(self):
        self.assertEqual(self.verify().status_code, 200)
        with patch.object(auth, "hash_password", return_value="new-hash"):
            self.reset()
        self.assertEqual(self.user.password_hash, "new-hash")
        self.assertIsNone(self.user.otp_code)
        self.assertIsNone(self.user.otp_expires_at)
        self.db.commit.assert_called_once()
        self.assertEqual(self.verify().status_code, 400)
        with self.assertRaises(HTTPException):
            self.reset()

    def test_reset_rechecks_expiry_after_verification(self):
        self.assertEqual(self.verify().status_code, 200)
        self.user.otp_expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
        with self.assertRaises(HTTPException):
            self.reset()
        self.assertEqual(self.user.password_hash, "original-hash")
        self.db.commit.assert_not_called()

    def test_resending_code_invalidates_previous_code(self):
        self.assertEqual(self.verify().status_code, 200)
        self.user.otp_code = "654321"
        self.assertEqual(self.verify().status_code, 400)
        self.assertEqual(self.verify("654321").status_code, 200)

    def test_verification_limits_code_guesses(self):
        for _ in range(5):
            self.assertEqual(self.verify("654321").status_code, 400)
        self.assertEqual(self.verify("654321").status_code, 429)


if __name__ == "__main__":
    unittest.main()
