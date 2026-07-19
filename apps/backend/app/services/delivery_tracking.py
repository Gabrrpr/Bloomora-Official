import hashlib
import json
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import ExternalShipment, ExternalShipmentEvent, Order, OrderStatusEnum


EXTERNAL_PROVIDERS = {
    "lalamove": "Lalamove",
    "grabexpress": "GrabExpress",
    "grab_express": "GrabExpress",
    "move_it": "Move It",
    "lbc": "LBC",
    "jt_express": "J&T Express",
}

EXTERNAL_STATUSES = {
    "awaiting_booking",
    "booked",
    "picked_up",
    "in_transit",
    "delivered",
    "failed",
    "cancelled",
}


def normalize_provider(value: str | None) -> str:
    return str(value or "").strip().lower().replace("-", "_").replace(" ", "_")


def provider_display_name(provider_code: str, fallback: str | None = None) -> str:
    return fallback or EXTERNAL_PROVIDERS.get(provider_code, provider_code.replace("_", " ").title())


def active_external_shipment(order: Order) -> ExternalShipment | None:
    shipments = sorted(
        getattr(order, "external_shipments", None) or [],
        key=lambda shipment: shipment.created_at or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    return next((shipment for shipment in shipments if shipment.is_active), shipments[0] if shipments else None)


def serialize_external_shipment(shipment: ExternalShipment) -> dict:
    return {
        "id": str(shipment.id),
        "orderId": str(shipment.order_id),
        "provider": shipment.provider_code,
        "providerName": provider_display_name(shipment.provider_code, shipment.provider_name),
        "externalReference": shipment.external_reference,
        "trackingUrl": shipment.tracking_url,
        "status": shipment.status,
        "providerStatus": shipment.provider_status,
        "isActive": shipment.is_active,
        "interventionRequired": shipment.intervention_required,
        "lastError": shipment.last_error,
        "events": [
            {
                "id": str(event.id),
                "status": event.status,
                "providerStatus": event.provider_status,
                "message": event.message,
                "createdAt": event.created_at.isoformat() if event.created_at else None,
            }
            for event in shipment.events or []
        ],
        "createdAt": shipment.created_at.isoformat() if shipment.created_at else None,
        "updatedAt": shipment.updated_at.isoformat() if shipment.updated_at else None,
    }


def external_event_key(payload: dict, provider_status: str | None = None) -> str:
    explicit = payload.get("eventId") or payload.get("id") or payload.get("event_id")
    if explicit:
        return str(explicit)
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(f"{provider_status or ''}:{canonical}".encode("utf-8")).hexdigest()


def apply_external_status(
    db: Session,
    shipment: ExternalShipment,
    status: str,
    *,
    provider_status: str | None = None,
    message: str | None = None,
    raw_payload: dict | None = None,
    event_key: str | None = None,
) -> bool:
    if status not in EXTERNAL_STATUSES:
        raise ValueError("Invalid external shipment status.")

    key = event_key or external_event_key(raw_payload or {"status": status, "message": message}, provider_status)
    existing = db.query(ExternalShipmentEvent).filter(
        ExternalShipmentEvent.shipment_id == shipment.id,
        ExternalShipmentEvent.event_key == key,
    ).first()
    if existing:
        return False

    now = datetime.now(timezone.utc)
    shipment.status = status
    shipment.provider_status = provider_status or shipment.provider_status
    shipment.intervention_required = status in {"failed", "cancelled"}
    if status == "booked":
        shipment.booked_at = shipment.booked_at or now
    elif status == "picked_up":
        shipment.picked_up_at = shipment.picked_up_at or now
    elif status == "in_transit":
        shipment.in_transit_at = shipment.in_transit_at or now
        shipment.order.status = OrderStatusEnum.out_for_delivery
    elif status == "delivered":
        shipment.delivered_at = shipment.delivered_at or now
        shipment.order.status = OrderStatusEnum.delivered
        shipment.order.can_review = True
    elif status in {"failed", "cancelled"}:
        shipment.failed_at = shipment.failed_at or now

    db.add(ExternalShipmentEvent(
        id=uuid.uuid4(),
        shipment_id=shipment.id,
        event_key=key,
        status=status,
        provider_status=provider_status,
        message=message,
        raw_payload=raw_payload,
    ))
    return True


def get_or_create_external_shipment(db: Session, order: Order, created_by_id=None) -> ExternalShipment:
    shipment = active_external_shipment(order)
    if shipment:
        return shipment

    provider = normalize_provider(order.delivery_provider or order.courier_selected)
    if provider not in EXTERNAL_PROVIDERS:
        raise ValueError("Select a supported external delivery provider.")
    shipment = ExternalShipment(
        id=uuid.uuid4(),
        order_id=order.id,
        provider_code=provider,
        provider_name=provider_display_name(provider, order.courier_selected),
        external_reference=order.lalamove_order_id,
        tracking_url=order.lalamove_share_link,
        status="awaiting_booking",
        provider_status=order.lalamove_status,
        created_by_id=created_by_id,
    )
    db.add(shipment)
    db.flush()
    return shipment
