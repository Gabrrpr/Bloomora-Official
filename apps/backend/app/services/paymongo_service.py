from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from typing import Any

import httpx

from app.core.config import settings


class PayMongoError(Exception):
    pass


def to_paymongo_amount(amount: Decimal) -> int:
    centavos = (amount * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return int(centavos)


async def create_checkout_session(
    *,
    line_items: list[dict[str, Any]],
    reference_number: str,
    metadata: dict[str, Any],
    payment_method_types: list[str] | None = None,
) -> dict[str, Any]:
    if not settings.PAYMONGO_SECRET_KEY:
        raise PayMongoError("PayMongo secret key is not configured.")

    payload = {
        "data": {
            "attributes": {
                "line_items": line_items,
                "payment_method_types": payment_method_types or ["card", "gcash", "qrph"],
                "success_url": settings.PAYMONGO_SUCCESS_URL,
                "cancel_url": settings.PAYMONGO_CANCEL_URL,
                "reference_number": reference_number,
                "send_email_receipt": True,
                "metadata": metadata,
            }
        }
    }

    url = f"{settings.PAYMONGO_BASE_URL.rstrip('/')}/v2/checkout_sessions"

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            url,
            auth=(settings.PAYMONGO_SECRET_KEY, ""),
            headers={"Content-Type": "application/json"},
            json=payload,
        )

    if response.status_code >= 400:
        raise PayMongoError(f"PayMongo checkout failed with status {response.status_code}: {response.text}")

    return response.json()
