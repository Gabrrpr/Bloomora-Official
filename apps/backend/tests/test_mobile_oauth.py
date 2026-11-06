import base64
import hashlib
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from urllib.parse import parse_qs, urlencode, urlsplit

from fastapi import HTTPException
from starlette.requests import Request

from app.api.v1.routes import auth


VERIFIER = "a" * 64
CHALLENGE = base64.urlsafe_b64encode(hashlib.sha256(VERIFIER.encode()).digest()).rstrip(b"=").decode()
APP_STATE = "b" * 64


def request(params, session):
    return Request({"type": "http", "method": "GET", "path": "/", "headers": [],
                    "query_string": urlencode(params).encode(), "session": session})


def begin(provider, session, mobile=True):
    params = {"client": "mobile", "code_challenge": CHALLENGE, "app_state": APP_STATE} if mobile else {
        "frontend_url": "http://localhost:5179"
    }
    return auth.prepare_oauth_return(request(params, session), provider)


class MobileOAuthCallbacks(unittest.IsolatedAsyncioTestCase):
    async def test_mobile_success_and_errors_return_to_app_for_both_providers(self):
        for provider in ("google", "facebook"):
            for result in ("success", "denied", "exception", "no_email"):
                with self.subTest(provider=provider, result=result):
                    session = {}
                    state = begin(provider, session)
                    params = {"state": state}
                    if result == "denied":
                        params["error"] = "access_denied"
                    client = getattr(auth.oauth, provider)
                    user_info = {"email": "customer@example.com", "name": "Test Customer", "given_name": "Test"}
                    if result == "no_email":
                        user_info.pop("email")
                    access = AsyncMock(return_value={"access_token": "provider-token"})
                    if result == "exception":
                        access.side_effect = ValueError("provider failure")
                    with patch.object(client, "authorize_access_token", access), patch.object(
                        client, "get", AsyncMock(return_value=SimpleNamespace(json=lambda: user_info))
                    ), patch.object(auth, "find_or_create_oauth_user", return_value=SimpleNamespace(id="user", role="customer")), patch.object(
                        auth, "create_access_token", return_value="access"
                    ), patch.object(auth, "create_refresh_token", return_value="refresh"):
                        response = await getattr(auth, f"{provider}_callback")(request(params, session), None)
                    target = urlsplit(response.headers["location"])
                    self.assertEqual((target.scheme, target.netloc, target.path), ("bloomoramobile", "oauth", "/callback"))
                    query = parse_qs(target.query)
                    self.assertEqual(query["state"], [APP_STATE])
                    self.assertNotIn("access_token", query)
                    self.assertEqual(response.headers["cache-control"], "no-store")
                    if result == "success":
                        code = query["code"][0]
                        signed_data = auth.oauth_exchange_serializer.loads(code)
                        self.assertNotIn("access_token", signed_data)
                        self.assertNotIn("refresh_token", signed_data)
                        self.assertIn("mobile_tokens", signed_data)
                        with self.assertRaises(HTTPException):
                            auth.exchange_oauth_code(code)
                        with self.assertRaises(HTTPException):
                            auth.exchange_mobile_oauth_code(auth.MobileOAuthExchangeRequest(code=code, code_verifier="wrong" * 16))
                        tokens = auth.exchange_mobile_oauth_code(auth.MobileOAuthExchangeRequest(code=code, code_verifier=VERIFIER))
                        self.assertEqual(tokens["access_token"], "access")
                    else:
                        self.assertIn("error", query)
                        self.assertNotIn("code", query)

    async def test_web_callbacks_still_return_to_the_selected_website(self):
        for provider in ("google", "facebook"):
            for denied in (False, True):
                session = {}
                state = begin(provider, session, mobile=False)
                params = {"state": state, **({"error": "access_denied"} if denied else {})}
                client = getattr(auth.oauth, provider)
                with patch.object(client, "authorize_access_token", AsyncMock(return_value={})), patch.object(
                    client, "get", AsyncMock(return_value=SimpleNamespace(json=lambda: {"email": "customer@example.com", "name": "Test"}))
                ), patch.object(auth, "find_or_create_oauth_user", return_value=SimpleNamespace(id="user", role="customer")), patch.object(
                    auth, "create_access_token", return_value="access"
                ), patch.object(auth, "create_refresh_token", return_value="refresh"):
                    response = await getattr(auth, f"{provider}_callback")(request(params, session), None)
                target = urlsplit(response.headers["location"])
                self.assertEqual(target.netloc, "localhost:5179")
                self.assertEqual(target.path, "/login" if denied else "/oauth/callback")
                if not denied:
                    code = parse_qs(target.query)["code"][0]
                    self.assertEqual(auth.exchange_oauth_code(code)["access_token"], "access")

    async def test_provider_start_keeps_registered_https_provider_callback(self):
        for provider in ("google", "facebook"):
            session = {}
            client = getattr(auth.oauth, provider)
            redirect = AsyncMock(return_value="redirect")
            with patch.object(client, "authorize_redirect", redirect):
                await getattr(auth, f"{provider}_login")(request({"client": "mobile", "code_challenge": CHALLENGE, "app_state": APP_STATE}, session))
            self.assertEqual(redirect.call_args.args[1], getattr(auth, f"{provider.upper()}_REDIRECT_URI"))
            self.assertIn(f"oauth_return:{provider}:{redirect.call_args.kwargs['state']}", session)


class MobileOAuthValidation(unittest.TestCase):
    def test_mobile_start_requires_valid_proof_and_state(self):
        for params in ({"client": "mobile"}, {"client": "mobile", "code_challenge": CHALLENGE, "app_state": "short"}):
            with self.assertRaises(HTTPException):
                auth.prepare_oauth_return(request(params, {}), "google")

    def test_return_context_is_bound_to_provider_and_state(self):
        session = {}
        state = begin("google", session)
        self.assertNotIn("mobile", auth.consume_oauth_return(request({"state": state}, session), "facebook"))
        self.assertNotIn("mobile", auth.consume_oauth_return(request({"state": "wrong"}, session), "google"))
        context = auth.consume_oauth_return(request({"state": state}, session), "google")
        self.assertTrue(context["mobile"])
        self.assertNotIn("mobile", auth.consume_oauth_return(request({"state": state}, session), "google"))

    def test_mobile_cannot_supply_an_arbitrary_redirect(self):
        session = {}
        state = auth.prepare_oauth_return(request({"client": "mobile", "code_challenge": CHALLENGE,
            "app_state": APP_STATE, "redirect_uri": "attacker://callback", "frontend_url": "https://attacker.test"}, session), "google")
        context = auth.consume_oauth_return(request({"state": state}, session), "google")
        response = auth.oauth_result_redirect(context, code="signed")
        self.assertTrue(response.headers["location"].startswith(auth.MOBILE_OAUTH_CALLBACK + "?"))

    def test_signed_exchange_rejects_tampering(self):
        with self.assertRaises(HTTPException):
            auth.exchange_oauth_code("not-a-valid-code")
