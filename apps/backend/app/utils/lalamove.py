import hashlib
import hmac
import json
import time
import uuid

import requests

from app.core.config import settings


def _lalamove_base_url() -> str:
    configured = (settings.LALAMOVE_BASE_URL or "https://rest.sandbox.lalamove.com").rstrip("/")
    if str(settings.LALAMOVE_API_KEY or "").startswith("pk_test_") and "sandbox" not in configured:
        return "https://rest.sandbox.lalamove.com"
    return configured


def _require_lalamove_credentials() -> None:
    if not settings.LALAMOVE_API_KEY or not settings.LALAMOVE_SECRET:
        raise RuntimeError("Lalamove API key and secret are not configured.")


def _normalize_phone(phone: str) -> str:
    raw = "".join(ch for ch in str(phone or "") if ch.isdigit() or ch == "+")
    if raw.startswith("+"):
        return raw

    digits = "".join(ch for ch in raw if ch.isdigit())
    if digits.startswith("09") and len(digits) == 11:
        return "+63" + digits[1:]
    if digits.startswith("9") and len(digits) == 10:
        return "+63" + digits
    if digits.startswith("63"):
        return "+" + digits
    return str(phone or "")


def generate_signature(timestamp: str, method: str, path: str, body: str = "") -> str:
    raw_signature = f"{timestamp}\r\n{method.upper()}\r\n{path}\r\n\r\n{body}"
    return hmac.new(
        settings.LALAMOVE_SECRET.encode("utf-8"),
        raw_signature.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def make_lalamove_request(method: str, path: str, payload: dict | None = None) -> dict:
    _require_lalamove_credentials()

    method = method.upper()
    timestamp = str(int(time.time() * 1000))
    body = json.dumps(payload, separators=(",", ":"), ensure_ascii=False) if payload else ""
    signature = generate_signature(timestamp, method, path, body)

    headers = {
        "Authorization": f"hmac {settings.LALAMOVE_API_KEY}:{timestamp}:{signature}",
        "Content-Type": "application/json",
        "Market": "PH",
        "Request-ID": str(uuid.uuid4()),
    }

    response = requests.request(
        method,
        f"{_lalamove_base_url()}{path}",
        headers=headers,
        data=body.encode("utf-8"),
        timeout=30,
    )
    try:
        response.raise_for_status()
    except requests.HTTPError as exc:
        raise RuntimeError(f"Lalamove API {response.status_code}: {response.text}") from exc
    return response.json()


def create_lalamove_quotation(dropoff_address: str, dropoff_lat: str, dropoff_lng: str) -> dict:
    payload = {
        "data": {
            "serviceType": settings.LALAMOVE_SERVICE_TYPE or "MOTORCYCLE",
            "language": "en_PH",
            "stops": [
                {
                    "coordinates": {
                        "lat": str(settings.LALAMOVE_PICKUP_LAT),
                        "lng": str(settings.LALAMOVE_PICKUP_LNG),
                    },
                    "address": settings.LALAMOVE_PICKUP_ADDRESS,
                },
                {
                    "coordinates": {
                        "lat": str(dropoff_lat),
                        "lng": str(dropoff_lng),
                    },
                    "address": dropoff_address,
                },
            ],
            "item": {
                "quantity": "1",
                "weight": "LESS_THAN_3_KG",
                "categories": ["FRAGILE"],
            },
        }
    }
    return make_lalamove_request("POST", "/v3/quotations", payload)


def book_lalamove_delivery(
    customer_name: str,
    customer_phone: str,
    dropoff_address: str,
    dropoff_lat: str,
    dropoff_lng: str,
) -> dict:
    quote = create_lalamove_quotation(dropoff_address, dropoff_lat, dropoff_lng)
    data = quote.get("data") or {}
    quotation_id = data["quotationId"]
    stops = data.get("stops") or []

    sender = {
        "name": settings.LALAMOVE_SENDER_NAME or "Esting's Flowers",
        "phone": _normalize_phone(settings.LALAMOVE_SENDER_PHONE),
    }
    recipient = {
        "name": customer_name,
        "phone": _normalize_phone(customer_phone),
        "remarks": "Fragile: Fresh flowers",
    }

    if len(stops) > 0 and isinstance(stops[0], dict) and stops[0].get("stopId"):
        sender["stopId"] = stops[0]["stopId"]
    if len(stops) > 1 and isinstance(stops[1], dict) and stops[1].get("stopId"):
        recipient["stopId"] = stops[1]["stopId"]

    order = make_lalamove_request(
        "POST",
        "/v3/orders",
        {
            "data": {
                "quotationId": quotation_id,
                "sender": sender,
                "recipients": [recipient],
            }
        },
    )

    order_data = order.get("data") or {}
    return {
        "lalamove_order_id": order_data.get("orderId"),
        "share_link": order_data.get("shareLink"),
        "status": order_data.get("status"),
    }
