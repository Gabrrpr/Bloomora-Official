from datetime import datetime, timezone
from typing import Iterable

import httpx
from cachetools import TTLCache

from app.core.config import settings


ROUTE_ATTRIBUTION = "© openrouteservice.org by HeiGIT | Map data © OpenStreetMap contributors"
MAP_ATTRIBUTION = "© OpenStreetMap contributors | OpenFreeMap"
STREET_PHOTO_ATTRIBUTION = "Street-level imagery © KartaView contributors"

_photo_cache: TTLCache = TTLCache(maxsize=500, ttl=60 * 60)


def unavailable_route(markers: list[dict], reason: str) -> dict:
    return {
        "available": False,
        "geometry": None,
        "markers": markers,
        "distanceM": None,
        "durationS": None,
        "generatedAt": None,
        "availabilityReason": reason,
        "attribution": ROUTE_ATTRIBUTION,
        "mapAttribution": MAP_ATTRIBUTION,
    }


def request_route(coordinates: Iterable[tuple[float, float]], markers: list[dict]) -> dict:
    points = [[float(lng), float(lat)] for lat, lng in coordinates]
    if len(points) < 2:
        return unavailable_route(markers, "At least two verified map pins are required.")
    if not settings.OPENROUTESERVICE_API_KEY:
        return unavailable_route(markers, "Route service is not configured. Pins remain available.")

    try:
        response = httpx.post(
            f"{settings.OPENROUTESERVICE_BASE_URL.rstrip('/')}/v2/directions/driving-car/geojson",
            headers={"Authorization": settings.OPENROUTESERVICE_API_KEY},
            json={"coordinates": points, "instructions": False},
            timeout=settings.OPENROUTESERVICE_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        feature_collection = response.json()
        feature = (feature_collection.get("features") or [None])[0]
        if not feature or not feature.get("geometry"):
            return unavailable_route(markers, "The route provider returned no route.")
        summary = (feature.get("properties") or {}).get("summary") or {}
        return {
            "available": True,
            "geometry": feature["geometry"],
            "markers": markers,
            "distanceM": round(summary.get("distance") or 0),
            "durationS": round(summary.get("duration") or 0),
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "availabilityReason": None,
            "attribution": ROUTE_ATTRIBUTION,
            "mapAttribution": MAP_ATTRIBUTION,
        }
    except (httpx.HTTPError, ValueError, TypeError, KeyError, AttributeError):
        return unavailable_route(markers, "Planned route is temporarily unavailable. Pins remain available.")


def nearby_street_photos(lat: float, lng: float, radius_m: int = 500, limit: int = 6) -> dict:
    cache_key = (round(lat, 5), round(lng, 5), radius_m, limit)
    cached = _photo_cache.get(cache_key)
    if cached is not None:
        return cached

    result = {"photos": [], "attribution": STREET_PHOTO_ATTRIBUTION, "coverageAvailable": False}
    try:
        response = httpx.get(
            f"{settings.KARTAVIEW_BASE_URL.rstrip('/')}/photo/",
            params={"lat": lat, "lng": lng, "radius": radius_m, "itemsPerPage": limit},
            timeout=8.0,
        )
        response.raise_for_status()
        payload = response.json()
        rows = payload.get("result", {}).get("data") or payload.get("data") or []
        photos = []
        for row in rows[:limit]:
            image_url = row.get("fileurlProc") or row.get("fileUrlProc") or row.get("fileurlLTh") or row.get("fileUrl")
            if not image_url:
                continue
            photos.append({
                "id": str(row.get("id") or row.get("photoId") or image_url),
                "imageUrl": image_url,
                "capturedAt": row.get("dateAdded") or row.get("dateProcessed"),
                "sequenceId": row.get("sequenceId"),
                "distanceM": row.get("distance"),
            })
        result = {"photos": photos, "attribution": STREET_PHOTO_ATTRIBUTION, "coverageAvailable": bool(photos)}
    except (httpx.HTTPError, ValueError, TypeError, AttributeError):
        pass

    _photo_cache[cache_key] = result
    return result
