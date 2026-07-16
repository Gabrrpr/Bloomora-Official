import requests

from app.core.config import settings


def reverse_geocode(latitude: float, longitude: float) -> dict:
    response = requests.get(
        f"{settings.GEOCODING_BASE_URL.rstrip('/')}/reverse",
        params={
            "lat": latitude,
            "lon": longitude,
            "format": "jsonv2",
            "addressdetails": 1,
            "zoom": 18,
        },
        headers={
            "Accept-Language": "en-PH,en",
            "User-Agent": settings.GEOCODING_USER_AGENT,
        },
        timeout=15,
    )
    try:
        response.raise_for_status()
    except requests.HTTPError as exc:
        raise RuntimeError(f"Geocoding API {response.status_code}: {response.text}") from exc

    result = response.json()
    if not isinstance(result, dict):
        raise RuntimeError("Geocoding API returned an invalid reverse-geocode result")
    return result


def geocode_address(query: str, country_codes: str = "ph", limit: int = 5) -> list[dict]:
    normalized = " ".join(str(query or "").split())
    if len(normalized) < 5:
        return []

    response = requests.get(
        f"{settings.GEOCODING_BASE_URL.rstrip('/')}/search",
        params={
            "q": normalized,
            "format": "jsonv2",
            "addressdetails": 1,
            "limit": max(1, min(int(limit or 5), 10)),
            "countrycodes": country_codes,
        },
        headers={"User-Agent": settings.GEOCODING_USER_AGENT},
        timeout=15,
    )
    try:
        response.raise_for_status()
    except requests.HTTPError as exc:
        raise RuntimeError(f"Geocoding API {response.status_code}: {response.text}") from exc

    results = []
    for item in response.json():
        results.append(
            {
                "label": item.get("display_name"),
                "lat": item.get("lat"),
                "lng": item.get("lon"),
                "type": item.get("type"),
                "class": item.get("class"),
                "importance": item.get("importance"),
                "address": item.get("address") or {},
            }
        )
    return results
