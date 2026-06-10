"""Currency exchange rate helper.

NOTE:
The original file contained Node.js code (axios/module.exports) inside a
`.py` file, which causes Python syntax errors like:
"Statements must be separated by newlines or semicolons".

This module provides a Python-compatible async function that can be used
from the backend.
"""

from __future__ import annotations

import os
import time
from typing import Any, Dict, Optional

import httpx


_cached_rates: Optional[Dict[str, Any]] = None
_last_fetch_time: float = 0.0

# Cache for 1 hour
CACHE_DURATION_SECONDS = 60 * 60


async def get_latest_rates() -> Dict[str, Any]:
    """Fetch latest exchange rates with PHP as base.

    Returns conversion rates mapping like {"PHP": 1, "USD": ...}
    """

    global _cached_rates, _last_fetch_time

    now = time.time()
    if _cached_rates is not None and (now - _last_fetch_time) < CACHE_DURATION_SECONDS:
        return _cached_rates

    api_key = os.getenv("EXCHANGERATE_API_KEY")
    if not api_key:
        # Fail safely; keep backend running
        return _cached_rates or {"PHP": 1}

    url = f"https://v6.exchangerate-api.com/v6/{api_key}/latest/PHP"

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

        if data.get("result") == "success":
            _cached_rates = data.get("conversion_rates") or {"PHP": 1}
            _last_fetch_time = now
            return _cached_rates

        return _cached_rates or {"PHP": 1}

    except Exception:
        # Network/API errors: return last cached or a safe default
        return _cached_rates or {"PHP": 1}

