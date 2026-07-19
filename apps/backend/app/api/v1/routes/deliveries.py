from datetime import datetime, timezone
import mimetypes
import uuid
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request
from sqlalchemy import func, inspect
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.config import settings
from app.core.dependencies import get_current_user, get_db, require_delivery, require_staff
from app.core.supabase import supabase
from app.utils.lalamove import book_lalamove_delivery
from app.models import (
    Delivery,
    DeliveryOrder,
    DeliveryOrderStatusEnum,
    DeliveryStatusEnum,
    Order,
    OrderItem,
    OrderStatusEnum,
    PaymentStatusEnum,
    BranchEnum,
    Notification,
    RoleEnum,
    Transaction,
    User,
    Vehicle,
    VehicleTypeEnum,
    BranchDeliverySetting,
    ExternalShipment,
)
from app.services.delivery_maps import nearby_street_photos, request_route, unavailable_route
from app.services.delivery_tracking import (
    EXTERNAL_PROVIDERS,
    EXTERNAL_STATUSES,
    active_external_shipment,
    apply_external_status,
    get_or_create_external_shipment,
    normalize_provider,
    provider_display_name,
    serialize_external_shipment,
)

router = APIRouter(prefix="/deliveries", tags=["Deliveries"])

DELIVERY_PROOFS_BUCKET = "delivery-proofs"

RIDER_STATUS_ORDER = [
    DeliveryStatusEnum.assigned,
    DeliveryStatusEnum.picked_up,
    DeliveryStatusEnum.out_for_delivery,
    DeliveryStatusEnum.arrived,
    DeliveryStatusEnum.delivered,
]

DELIVERY_SCHEMA_COLUMNS = {
    "orders": {"delivery_pin_verified_at", "delivery_pin_verified_by_id"},
    "delivery_orders": {"idempotency_key", "route_geometry", "route_distance_m", "route_duration_s", "route_generated_at"},
    "deliveries": {"stop_sequence", "route_geometry", "route_distance_m", "route_duration_s", "route_generated_at", "status_before_issue", "issue_code", "issue_note", "issue_reported_at", "issue_resolved_at", "issue_resolution_note"},
}
DELIVERY_SCHEMA_TABLES = {"branch_delivery_settings", "external_shipments", "external_shipment_events"}


def _role_value(user: User) -> str:
    return user.role.value if hasattr(user.role, "value") else str(user.role)


def _delivery_schema_status(db: Session) -> dict:
    database = inspect(db.get_bind())
    table_names = set(database.get_table_names())
    missing = [f"table:{name}" for name in sorted(DELIVERY_SCHEMA_TABLES - table_names)]
    for table_name, required_columns in DELIVERY_SCHEMA_COLUMNS.items():
        if table_name not in table_names:
            missing.append(f"table:{table_name}")
            continue
        present_columns = {column["name"] for column in database.get_columns(table_name)}
        missing.extend(f"column:{table_name}.{name}" for name in sorted(required_columns - present_columns))
    ready = not missing
    return {
        "ready": ready,
        "requiredRevision": "f1a2b3c4d5e6",
        "missing": missing,
        "message": None if ready else (
            "The delivery database update has not been applied. Verify Alembic revision "
            "e0f1a2b3c4d5 is present, then upgrade through f1a2b3c4d5e6 before using delivery operations."
        ),
    }


def _delivery_status_value(status) -> str:
    return status.value if hasattr(status, "value") else str(status)


def _order_status_value(status) -> str:
    return status.value if hasattr(status, "value") else str(status)


def _delivery_order_status_value(status) -> str:
    return status.value if hasattr(status, "value") else str(status)


def _notification_delivery_id_filter(delivery_id):
    if hasattr(Notification, "delivery_id"):
        return Notification.delivery_id == delivery_id
    return Notification.order_id.isnot(None)


def _has_delivery_id_column(db: Session) -> bool:
    try:
        return any(column["name"] == "delivery_id" for column in inspect(db.bind).get_columns("notifications"))
    except Exception:
        db.rollback()
        return False


def _delivery_query(db: Session):
    return db.query(Delivery).options(
        joinedload(Delivery.order).joinedload(Order.user),
        joinedload(Delivery.order).joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(Delivery.order).joinedload(Order.items).joinedload(OrderItem.arrangement),
        joinedload(Delivery.rider),
        joinedload(Delivery.vehicle),
        joinedload(Delivery.delivery_order),
    )


def _is_missing_storage_bucket_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return "bucket" in message and any(term in message for term in ("not found", "does not exist", "not exist"))


def _upload_delivery_proof_photo(filename: str, file_bytes: bytes, content_type: str) -> str:
    file_options = {
        "content-type": content_type if content_type.startswith("image/") else "image/jpeg",
        "x-upsert": "true",
    }

    try:
        supabase.storage.from_(DELIVERY_PROOFS_BUCKET).upload(
            path=filename,
            file=file_bytes,
            file_options=file_options,
        )
        return supabase.storage.from_(DELIVERY_PROOFS_BUCKET).get_public_url(filename)
    except Exception as exc:
        fallback_bucket = (settings.SUPABASE_BUCKET or "").strip()
        if not fallback_bucket or fallback_bucket == DELIVERY_PROOFS_BUCKET or not _is_missing_storage_bucket_error(exc):
            print(f"Delivery proof upload error: {exc}")
            raise HTTPException(status_code=502, detail="Could not upload proof photo. Please try again.") from exc

        fallback_path = f"{DELIVERY_PROOFS_BUCKET}/{filename}"
        try:
            supabase.storage.from_(fallback_bucket).upload(
                path=fallback_path,
                file=file_bytes,
                file_options=file_options,
            )
            return supabase.storage.from_(fallback_bucket).get_public_url(fallback_path)
        except Exception as fallback_exc:
            print(f"Delivery proof fallback upload error: {fallback_exc}")
            raise HTTPException(status_code=502, detail="Could not upload proof photo. Please try again.") from fallback_exc


def _delivery_order_query(db: Session):
    return db.query(DeliveryOrder).options(
        joinedload(DeliveryOrder.rider),
        joinedload(DeliveryOrder.vehicle),
        joinedload(DeliveryOrder.deliveries).joinedload(Delivery.order).joinedload(Order.user),
        joinedload(DeliveryOrder.deliveries).joinedload(Delivery.order).joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(DeliveryOrder.deliveries).joinedload(Delivery.order).joinedload(Order.items).joinedload(OrderItem.arrangement),
    )


def _user_name(user: User | None) -> str | None:
    if not user:
        return None
    return f"{user.first_name} {user.last_name}".strip() or user.username or user.email


def _serialize_rider(delivery: Delivery) -> dict | None:
    rider = delivery.rider
    if not rider:
        return None
    return {
        "id": str(rider.id),
        "name": f"{rider.first_name} {rider.last_name}".strip() or rider.username,
        "phoneNumber": rider.phone_number,
    }


def _vehicle_type_value(vehicle_type) -> str:
    return vehicle_type.value if hasattr(vehicle_type, "value") else str(vehicle_type)


def _serialize_vehicle(delivery: Delivery) -> dict | None:
    vehicle = delivery.vehicle
    if not vehicle:
        return None
    return {
        "id": str(vehicle.id),
        "plateNumber": vehicle.plate_number,
        "vehicleType": _vehicle_type_value(vehicle.vehicle_type),
        "brand": vehicle.brand,
        "model": vehicle.model,
        "color": vehicle.color,
        "capacity": vehicle.capacity,
    }


def _serialize_items(order: Order) -> tuple[str, list[str]]:
    item_names = []
    handling_notes = []

    for item in order.items or []:
        product = item.product
        arrangement = item.arrangement
        name = (
            product.name
            if product
            else arrangement.name
            if arrangement and arrangement.name
            else "Flower order"
        )
        item_names.append(f"{item.quantity}x {name}")

        if product and getattr(product, "care_guide", None):
            handling_notes.append(product.care_guide)

    if not item_names:
        fallback = getattr(order, "product", None)
        item_names.append(getattr(fallback, "name", None) or "Flower order")

    return ", ".join(item_names), handling_notes


def _delivery_item_count(order: Order) -> int:
    if getattr(order, "items", None):
        return sum(1 for item in order.items or [] if item)
    return 1


def _serialize_delivery_image(order: Order) -> str | None:
    for item in order.items or []:
        product = item.product
        arrangement = item.arrangement

        image_url = getattr(product, "image_url", None) if product else None
        if image_url:
            return image_url

        arrangement_image_url = None
        if arrangement:
            arrangement_image_url = (
                getattr(arrangement, "image_url", None)
                or getattr(arrangement, "generated_image_url", None)
            )
        if arrangement_image_url:
            return arrangement_image_url

    return None


def _recipient_phone(order: Order) -> str:
    return order.recipient_phone or getattr(order.user, "phone_number", None) or ""


def _recipient_name(order: Order) -> str:
    explicit_name = " ".join(
        value
        for value in [order.recipient_first_name, order.recipient_last_name]
        if value
    ).strip()
    if explicit_name:
        return explicit_name

    user = getattr(order, "user", None)
    user_name = _user_name(user)
    if user_name:
        return user_name

    return "Recipient"


def serialize_delivery(delivery: Delivery) -> dict:
    order = delivery.order
    if not order:
        raise HTTPException(status_code=500, detail="Delivery has no linked order.")

    item_summary, handling_notes = _serialize_items(order)
    recipient_name = _recipient_name(order)

    return {
        "id": str(delivery.id),
        "orderId": str(order.id),
        "orderNumber": f"ORD-{order.id.hex[:8].upper()}",
        "recipientName": recipient_name,
        "recipientPhone": _recipient_phone(order),
        "address": order.delivery_address or "",
        "destinationLat": float(order.delivery_lat) if order.delivery_lat is not None else None,
        "destinationLng": float(order.delivery_lng) if order.delivery_lng is not None else None,
        "destinationPinVerified": order.delivery_lat is not None and order.delivery_lng is not None,
        "branch": order.branch_name,
        "imageUrl": _serialize_delivery_image(order),
        "itemCount": _delivery_item_count(order),
        "itemSummary": item_summary,
        "handlingNotes": handling_notes,
        "deliveryNotes": order.delivery_notes,
        "customerNotes": order.special_note,
        "status": _delivery_status_value(delivery.status),
        "orderStatus": _order_status_value(order.status),
        "deliveryOrderId": str(delivery.delivery_order_id) if delivery.delivery_order_id else None,
        "deliveryOrderNumber": delivery.delivery_order.delivery_order_number if delivery.delivery_order else None,
        "stopSequence": delivery.stop_sequence,
        "assignedRider": _serialize_rider(delivery),
        "assignedVehicle": _serialize_vehicle(delivery),
        "assignedArea": delivery.assigned_area,
        "scheduledAt": order.scheduled_at.isoformat() if order.scheduled_at else None,
        "estimatedArrival": delivery.estimated_arrival.isoformat() if delivery.estimated_arrival else None,
        "assignedAt": delivery.assigned_at.isoformat() if getattr(delivery, "assigned_at", None) else None,
        "pickedUpAt": delivery.picked_up_at.isoformat() if delivery.picked_up_at else None,
        "inTransitAt": delivery.in_transit_at.isoformat() if delivery.in_transit_at else None,
        "arrivedAt": delivery.arrived_at.isoformat() if delivery.arrived_at else None,
        "deliveredAt": delivery.delivered_at.isoformat() if delivery.delivered_at else None,
        "proofPhotoUrl": delivery.proof_photo_url,
        "proofNote": delivery.proof_note,
        "issueCode": delivery.issue_code,
        "issueNote": delivery.issue_note,
        "issueReportedAt": delivery.issue_reported_at.isoformat() if delivery.issue_reported_at else None,
        "issueResolvedAt": delivery.issue_resolved_at.isoformat() if delivery.issue_resolved_at else None,
        "issueResolutionNote": delivery.issue_resolution_note,
        "routeAvailable": bool(delivery.route_geometry),
        "createdAt": delivery.created_at.isoformat() if delivery.created_at else None,
        "updatedAt": delivery.updated_at.isoformat() if delivery.updated_at else None,
    }


def _serialize_assignable_order(order: Order) -> dict:
    item_summary, handling_notes = _serialize_items(order)
    recipient_name = _recipient_name(order)

    provider = normalize_provider(order.delivery_provider)
    has_pin = order.delivery_lat is not None and order.delivery_lng is not None
    reasons = []
    if not provider:
        reasons.append("Choose whether this is standard or third-party delivery.")
    elif provider != "standard":
        reasons.append(f"{provider_display_name(provider)} is tracked as an external shipment.")
    if provider == "standard" and not has_pin:
        reasons.append("The customer destination pin was not captured at checkout.")

    return {
        "id": str(order.id),
        "orderNumber": f"ORD-{order.id.hex[:8].upper()}",
        "recipientName": recipient_name,
        "recipientPhone": _recipient_phone(order),
        "address": order.delivery_address,
        "branch": order.branch_name,
        "itemSummary": item_summary,
        "handlingNotes": handling_notes,
        "scheduledAt": order.scheduled_at.isoformat() if order.scheduled_at else None,
        "status": _order_status_value(order.status),
        "deliveryProvider": provider or None,
        "deliveryMode": "in_house" if provider == "standard" else "external" if provider else "needs_review",
        "destinationLat": float(order.delivery_lat) if order.delivery_lat is not None else None,
        "destinationLng": float(order.delivery_lng) if order.delivery_lng is not None else None,
        "destinationPinVerified": has_pin,
        "dispatchEligible": provider == "standard" and has_pin,
        "blockingReasons": reasons,
    }


def _serialize_delivery_order(delivery_order: DeliveryOrder) -> dict:
    deliveries = sorted(
        delivery_order.deliveries or [],
        key=lambda delivery: (delivery.stop_sequence or 1, delivery.created_at or datetime.min.replace(tzinfo=timezone.utc)),
    )
    rider = delivery_order.rider
    vehicle = delivery_order.vehicle
    return {
        "id": str(delivery_order.id),
        "deliveryOrderNumber": delivery_order.delivery_order_number,
        "branch": delivery_order.branch,
        "status": _delivery_order_status_value(delivery_order.status),
        "notes": delivery_order.notes,
        "riderId": str(rider.id) if rider else None,
        "riderName": _user_name(rider),
        "vehicleId": str(vehicle.id) if vehicle else None,
        "vehiclePlateNumber": vehicle.plate_number if vehicle else None,
        "vehicleType": _vehicle_type_value(vehicle.vehicle_type) if vehicle else None,
        "stopCount": len(deliveries),
        "routeAvailable": bool(delivery_order.route_geometry),
        "routeDistanceM": delivery_order.route_distance_m,
        "routeDurationS": delivery_order.route_duration_s,
        "deliveries": [serialize_delivery(delivery) for delivery in deliveries],
        "createdAt": delivery_order.created_at.isoformat() if delivery_order.created_at else None,
        "updatedAt": delivery_order.updated_at.isoformat() if delivery_order.updated_at else None,
    }


def _generate_delivery_order_number() -> str:
    return f"DO-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


def _sync_delivery_order_status(delivery_order: DeliveryOrder | None) -> None:
    if not delivery_order:
        return
    statuses = [delivery.status for delivery in delivery_order.deliveries or []]
    if not statuses:
        return
    if all(status == DeliveryStatusEnum.delivered for status in statuses):
        delivery_order.status = DeliveryOrderStatusEnum.completed
    elif any(status in {DeliveryStatusEnum.out_for_delivery, DeliveryStatusEnum.arrived} for status in statuses):
        delivery_order.status = DeliveryOrderStatusEnum.in_progress
    elif any(status == DeliveryStatusEnum.picked_up for status in statuses):
        delivery_order.status = DeliveryOrderStatusEnum.picked_up
    elif delivery_order.status != DeliveryOrderStatusEnum.cancelled:
        delivery_order.status = DeliveryOrderStatusEnum.assigned


def _normalize_rider_step_status(delivery: Delivery) -> DeliveryStatusEnum:
    current_status = delivery.status

    if current_status == DeliveryStatusEnum.issue_reported:
        return DeliveryStatusEnum.arrived if delivery.arrived_at else DeliveryStatusEnum.out_for_delivery

    if current_status == DeliveryStatusEnum.in_transit:
        return DeliveryStatusEnum.picked_up

    if current_status == DeliveryStatusEnum.assigned:
        order_status = delivery.order.status if delivery.order else None
        if delivery.in_transit_at or order_status == OrderStatusEnum.out_for_delivery:
            return DeliveryStatusEnum.out_for_delivery
        if delivery.picked_up_at:
            return DeliveryStatusEnum.picked_up

    return current_status


def _serialize_vehicle_item(vehicle: Vehicle) -> dict:
    rider = vehicle.assigned_rider
    return {
        "id": str(vehicle.id),
        "plateNumber": vehicle.plate_number,
        "vehicleType": _vehicle_type_value(vehicle.vehicle_type),
        "brand": vehicle.brand,
        "model": vehicle.model,
        "color": vehicle.color,
        "capacity": vehicle.capacity,
        "documentUrl": vehicle.document_url,
        "assignedRiderId": str(rider.id) if rider else None,
        "assignedRiderName": f"{rider.first_name} {rider.last_name}".strip() if rider else None,
        "branch": vehicle.branch,
        "isActive": vehicle.is_active,
        "createdAt": vehicle.created_at.isoformat() if vehicle.created_at else None,
        "updatedAt": vehicle.updated_at.isoformat() if vehicle.updated_at else None,
    }


def _serialize_admin_rider(db: Session, rider: User) -> dict:
    active_statuses = [
        DeliveryStatusEnum.assigned,
        DeliveryStatusEnum.picked_up,
        DeliveryStatusEnum.out_for_delivery,
        DeliveryStatusEnum.arrived,
    ]
    active_count = db.query(Delivery).filter(
        Delivery.rider_id == rider.id,
        Delivery.status.in_(active_statuses),
    ).count()
    last_delivery = db.query(Delivery).filter(
        Delivery.rider_id == rider.id,
    ).order_by(Delivery.updated_at.desc()).first()

    active_deliveries = _delivery_query(db).filter(
        Delivery.rider_id == rider.id,
        Delivery.status.in_(active_statuses),
    ).order_by(Delivery.created_at.asc()).all()

    assigned_vehicle = db.query(Vehicle).filter(
        Vehicle.assigned_rider_id == rider.id,
        Vehicle.is_active == True,
    ).first()

    return {
        "id": str(rider.id),
        "name": f"{rider.first_name} {rider.last_name}".strip() or rider.username,
        "email": rider.email,
        "phoneNumber": rider.phone_number,
        "profilePictureUrl": rider.profile_picture_url,
        "branch": rider.branch.value if hasattr(rider.branch, "value") else rider.branch,
        "isActive": rider.is_active,
        "isVerified": rider.is_verified and rider.is_staff_verified,
        "activeDeliveries": active_count,
        "availability": "offline" if not getattr(rider, "rider_is_available", True) else "available" if active_count == 0 else "assigned",
        "riderIsAvailable": bool(getattr(rider, "rider_is_available", True)),
        "lastAssignedAt": last_delivery.updated_at.isoformat() if last_delivery and last_delivery.updated_at else None,
        "assignedVehicle": _serialize_vehicle_item(assigned_vehicle) if assigned_vehicle else None,
        "activeDeliveryDetails": [serialize_delivery(d) for d in active_deliveries],
    }


def _ensure_rider_can_receive_dispatch(rider: User) -> None:
    if not rider or rider.role != RoleEnum.delivery:
        raise HTTPException(status_code=400, detail="Select a valid delivery rider.")
    if not rider.is_active or not rider.is_verified or not rider.is_staff_verified:
        raise HTTPException(status_code=400, detail="Rider account must be active and verified.")
    if not getattr(rider, "rider_is_available", True):
        raise HTTPException(status_code=400, detail="Rider is offline and cannot receive dispatch orders.")


def _create_rider_assignment_notification(db: Session, delivery: Delivery) -> None:
    if not delivery.rider_id or not delivery.order_id:
        return

    has_delivery_id_column = _has_delivery_id_column(db)
    order_number = f"ORD-{delivery.order_id.hex[:8].upper()}"
    existing_query = db.query(Notification).filter(
        Notification.user_id == delivery.rider_id,
        Notification.type == "delivery",
        Notification.order_id == delivery.order_id,
    )
    if has_delivery_id_column and hasattr(Notification, "delivery_id"):
        existing_query = existing_query.filter(Notification.delivery_id == delivery.id)
    existing = existing_query.first()
    if existing:
        return

    notification = Notification(
        id=uuid.uuid4(),
        user_id=delivery.rider_id,
        type="delivery",
        title="New delivery assigned",
        message=f"{order_number} has been assigned to you. Check the delivery details before pickup.",
        order_id=delivery.order_id,
        is_global=False,
    )
    if has_delivery_id_column and hasattr(notification, "delivery_id"):
        notification.delivery_id = delivery.id
    db.add(notification)


def _create_rider_assignment_notifications(db: Session, deliveries: list[Delivery]) -> None:
    # Sessions disable autoflush, so persist the delivery rows before notifications
    # reference their IDs through notifications.delivery_id.
    db.flush()
    for delivery in deliveries:
        _create_rider_assignment_notification(db, delivery)


def _create_customer_delivery_notification_once(db: Session, delivery: Delivery, status: DeliveryStatusEnum) -> None:
    if not delivery.order or status not in {DeliveryStatusEnum.out_for_delivery, DeliveryStatusEnum.delivered}:
        return

    order = delivery.order
    order_number = f"ORD-{order.id.hex[:8].upper()}"
    title, message = {
        DeliveryStatusEnum.out_for_delivery: (
            "On Its Way!",
            f"Your order {order_number} is out for delivery.",
        ),
        DeliveryStatusEnum.delivered: (
            "Order Delivered",
            f"Your order {order_number} has been delivered.",
        ),
    }[status]

    existing = db.query(Notification).filter(
        Notification.user_id == order.user_id,
        Notification.type == "order",
        Notification.order_id == order.id,
        Notification.title == title,
    ).first()
    if existing:
        return

    has_delivery_id_column = _has_delivery_id_column(db)
    notification = Notification(
        id=uuid.uuid4(),
        user_id=order.user_id,
        type="order",
        title=title,
        message=message,
        order_id=order.id,
        is_global=False,
    )
    if has_delivery_id_column and hasattr(notification, "delivery_id"):
        notification.delivery_id = delivery.id
    db.add(notification)


def _get_delivery_for_user(db: Session, delivery_id: str, user: User) -> Delivery:
    try:
        delivery_uuid = uuid.UUID(delivery_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid delivery ID.")

    delivery = _delivery_query(db).filter(Delivery.id == delivery_uuid).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found.")

    role = _role_value(user)
    if role == "delivery" and delivery.rider_id != user.id:
        raise HTTPException(status_code=403, detail="This delivery is assigned to another rider.")
    if role not in {"admin", "staff", "delivery"}:
        if not delivery.order or delivery.order.user_id != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this delivery.")

    return delivery


def _serialize_branch_setting(setting: BranchDeliverySetting) -> dict:
    return {
        "id": str(setting.id),
        "branch": setting.branch,
        "pickupAddress": setting.pickup_address,
        "pickupLat": float(setting.pickup_lat),
        "pickupLng": float(setting.pickup_lng),
        "isVerified": setting.is_verified,
        "verifiedAt": setting.verified_at.isoformat() if setting.verified_at else None,
        "updatedAt": setting.updated_at.isoformat() if setting.updated_at else None,
    }


def _route_markers(setting: BranchDeliverySetting, deliveries: list[Delivery]) -> list[dict]:
    markers = [{
        "type": "origin",
        "label": f"{setting.branch} branch",
        "address": setting.pickup_address,
        "latitude": float(setting.pickup_lat),
        "longitude": float(setting.pickup_lng),
    }]
    for delivery in deliveries:
        order = delivery.order
        if not order or order.delivery_lat is None or order.delivery_lng is None:
            continue
        markers.append({
            "type": "destination",
            "label": f"Stop {delivery.stop_sequence}: {_recipient_name(order)}",
            "address": order.delivery_address,
            "latitude": float(order.delivery_lat),
            "longitude": float(order.delivery_lng),
            "deliveryId": str(delivery.id),
            "orderId": str(order.id),
            "stopSequence": delivery.stop_sequence,
        })
    return markers


def _stored_route(entity, markers: list[dict]) -> dict | None:
    if not entity.route_geometry:
        return None
    return {
        "available": True,
        "geometry": entity.route_geometry,
        "markers": markers,
        "distanceM": entity.route_distance_m,
        "durationS": entity.route_duration_s,
        "generatedAt": entity.route_generated_at.isoformat() if entity.route_generated_at else None,
        "availabilityReason": None,
        "attribution": "© openrouteservice.org by HeiGIT | Map data © OpenStreetMap contributors",
        "mapAttribution": "© OpenStreetMap contributors | OpenFreeMap",
    }


def _generate_and_store_route(db: Session, entity, setting: BranchDeliverySetting, deliveries: list[Delivery]) -> dict:
    markers = _route_markers(setting, deliveries)
    coordinates = [(marker["latitude"], marker["longitude"]) for marker in markers]
    preview = request_route(coordinates, markers)
    if preview["available"]:
        entity.route_geometry = preview["geometry"]
        entity.route_distance_m = preview["distanceM"]
        entity.route_duration_s = preview["durationS"]
        entity.route_generated_at = datetime.fromisoformat(preview["generatedAt"])
        db.flush()
    return preview


def _route_for_delivery(db: Session, delivery: Delivery, regenerate: bool = False) -> dict:
    branch = delivery.order.branch_name if delivery.order else None
    setting = db.query(BranchDeliverySetting).filter(
        func.lower(BranchDeliverySetting.branch) == str(branch or "").lower(),
        BranchDeliverySetting.is_verified.is_(True),
    ).first()
    if not setting:
        return unavailable_route([], "The branch pickup pin has not been verified.")
    markers = _route_markers(setting, [delivery])
    if not regenerate:
        cached = _stored_route(delivery, markers)
        if cached:
            return cached
    return _generate_and_store_route(db, delivery, setting, [delivery])


def _route_for_delivery_order(db: Session, delivery_order: DeliveryOrder, regenerate: bool = False) -> dict:
    setting = db.query(BranchDeliverySetting).filter(
        func.lower(BranchDeliverySetting.branch) == delivery_order.branch.lower(),
        BranchDeliverySetting.is_verified.is_(True),
    ).first()
    if not setting:
        return unavailable_route([], "The branch pickup pin has not been verified.")
    deliveries = sorted(delivery_order.deliveries or [], key=lambda item: item.stop_sequence or 1)
    markers = _route_markers(setting, deliveries)
    if not regenerate:
        cached = _stored_route(delivery_order, markers)
        if cached:
            return cached
    return _generate_and_store_route(db, delivery_order, setting, deliveries)


# ── Rider Endpoints ──────────────────────────────────────────────────────────

@router.get("/rider/profile", response_model=dict)
def get_rider_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_delivery),
):
    active_statuses = [
        DeliveryStatusEnum.assigned,
        DeliveryStatusEnum.picked_up,
        DeliveryStatusEnum.out_for_delivery,
        DeliveryStatusEnum.arrived,
        DeliveryStatusEnum.issue_reported,
    ]
    active_count = db.query(Delivery).filter(
        Delivery.rider_id == current_user.id,
        Delivery.status.in_(active_statuses),
    ).count()
    completed_count = db.query(Delivery).filter(
        Delivery.rider_id == current_user.id,
        Delivery.status == DeliveryStatusEnum.delivered,
    ).count()

    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "firstName": current_user.first_name,
        "lastName": current_user.last_name,
        "username": current_user.username,
        "phoneNumber": current_user.phone_number,
        "branch": current_user.branch.value if hasattr(current_user.branch, "value") else current_user.branch,
        "profilePictureUrl": current_user.profile_picture_url,
        "riderIsAvailable": bool(getattr(current_user, "rider_is_available", True)),
        "activeDeliveries": active_count,
        "completedDeliveries": completed_count,
    }


@router.patch("/rider/profile", response_model=dict)
def update_rider_profile(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_delivery),
):
    if "rider_is_available" in payload:
        current_user.rider_is_available = bool(payload.get("rider_is_available"))
    elif "riderIsAvailable" in payload:
        current_user.rider_is_available = bool(payload.get("riderIsAvailable"))
    else:
        raise HTTPException(status_code=400, detail="riderIsAvailable is required.")

    db.commit()
    db.refresh(current_user)
    return get_rider_profile(db=db, current_user=current_user)


@router.get("/rider/me", response_model=list[dict])
def get_my_deliveries(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_delivery),
):
    active_statuses = [
        DeliveryStatusEnum.assigned,
        DeliveryStatusEnum.picked_up,
        DeliveryStatusEnum.out_for_delivery,
        DeliveryStatusEnum.arrived,
        DeliveryStatusEnum.issue_reported,
    ]
    deliveries = _delivery_query(db).filter(
        Delivery.rider_id == current_user.id,
        Delivery.delivery_order_id.isnot(None),
        Delivery.status.in_(active_statuses),
    ).order_by(Delivery.created_at.asc()).all()
    return [serialize_delivery(delivery) for delivery in deliveries]


@router.get("/rider/history", response_model=list[dict])
def get_my_delivery_history(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_delivery),
):
    deliveries = _delivery_query(db).filter(
        Delivery.rider_id == current_user.id,
        Delivery.delivery_order_id.isnot(None),
        Delivery.status.in_([DeliveryStatusEnum.delivered, DeliveryStatusEnum.failed]),
    ).order_by(Delivery.updated_at.desc()).limit(limit).all()
    return [serialize_delivery(delivery) for delivery in deliveries]


@router.get("/rider/delivery-orders/me", response_model=list[dict])
def get_my_delivery_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_delivery),
):
    delivery_orders = _delivery_order_query(db).filter(
        DeliveryOrder.rider_id == current_user.id,
        DeliveryOrder.status.in_([
            DeliveryOrderStatusEnum.assigned,
            DeliveryOrderStatusEnum.picked_up,
            DeliveryOrderStatusEnum.in_progress,
        ]),
    ).order_by(DeliveryOrder.created_at.asc()).all()
    return [_serialize_delivery_order(delivery_order) for delivery_order in delivery_orders]


# ── Vehicle Management (MUST come BEFORE /{delivery_id} to avoid shadowing) ──

@router.get("/vehicles", response_model=list[dict])
def list_vehicles(
    branch: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    query = db.query(Vehicle)
    if branch:
        branch_lower = str(branch).lower()
        query = query.filter(func.lower(Vehicle.branch) == branch_lower)
    if is_active is not None:
        query = query.filter(Vehicle.is_active == is_active)
    vehicles = query.order_by(Vehicle.plate_number.asc()).all()
    return [_serialize_vehicle_item(v) for v in vehicles]


@router.post("/vehicles", response_model=dict)
def create_vehicle(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    plate_number = str(payload.get("plate_number") or "").strip().upper()
    if not plate_number:
        raise HTTPException(status_code=400, detail="Plate number is required.")

    existing = db.query(Vehicle).filter(Vehicle.plate_number == plate_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="A vehicle with this plate number already exists.")

    vehicle_type_raw = str(payload.get("vehicle_type") or "").strip().lower()
    try:
        vehicle_type = VehicleTypeEnum(vehicle_type_raw)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid vehicle type.")

    branch_raw = str(payload.get("branch") or "pampanga").strip().lower()

    vehicle = Vehicle(
        plate_number=plate_number,
        vehicle_type=vehicle_type,
        brand=str(payload.get("brand") or "").strip() or None,
        model=str(payload.get("model") or "").strip() or None,
        color=str(payload.get("color") or "").strip() or None,
        capacity=str(payload.get("capacity") or "").strip() or None,
        document_url=str(payload.get("document_url") or "").strip() or None,
        branch=branch_raw,
        is_active=payload.get("is_active", True),
    )

    assigned_rider_id = payload.get("assigned_rider_id") or payload.get("assignedRiderId")
    if assigned_rider_id:
        try:
            rider_uuid = uuid.UUID(str(assigned_rider_id))
            rider = db.query(User).filter(User.id == rider_uuid, User.role == RoleEnum.delivery).first()
            if not rider:
                raise HTTPException(status_code=400, detail="Invalid rider ID.")
            vehicle.assigned_rider_id = rider.id
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid rider ID.")

    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return _serialize_vehicle_item(vehicle)


@router.put("/vehicles/{vehicle_id}", response_model=dict)
def update_vehicle(
    vehicle_id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    try:
        vehicle_uuid = uuid.UUID(vehicle_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid vehicle ID.")

    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_uuid).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    if "plate_number" in payload:
        plate_number = str(payload.get("plate_number") or "").strip().upper()
        if not plate_number:
            raise HTTPException(status_code=400, detail="Plate number is required.")
        duplicate = db.query(Vehicle).filter(Vehicle.plate_number == plate_number, Vehicle.id != vehicle.id).first()
        if duplicate:
            raise HTTPException(status_code=400, detail="A vehicle with this plate number already exists.")
        vehicle.plate_number = plate_number

    if "vehicle_type" in payload:
        vehicle_type_raw = str(payload.get("vehicle_type") or "").strip().lower()
        try:
            vehicle.vehicle_type = VehicleTypeEnum(vehicle_type_raw)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid vehicle type.")

    for field in ["brand", "model", "color", "capacity", "document_url"]:
        if field in payload:
            setattr(vehicle, field, str(payload.get(field) or "").strip() or None)

    if "branch" in payload:
        branch_raw = str(payload.get("branch") or "pampanga").strip().lower()
        vehicle.branch = branch_raw

    if "is_active" in payload:
        vehicle.is_active = bool(payload.get("is_active"))

    if "assigned_rider_id" in payload or "assignedRiderId" in payload:
        rider_id = payload.get("assigned_rider_id") or payload.get("assignedRiderId")
        if rider_id:
            try:
                rider_uuid = uuid.UUID(str(rider_id))
                rider = db.query(User).filter(User.id == rider_uuid, User.role == RoleEnum.delivery).first()
                if not rider:
                    raise HTTPException(status_code=400, detail="Invalid rider ID.")
                vehicle.assigned_rider_id = rider.id
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid rider ID.")
        else:
            vehicle.assigned_rider_id = None

    db.commit()
    db.refresh(vehicle)
    return _serialize_vehicle_item(vehicle)


@router.delete("/vehicles/{vehicle_id}")
def delete_vehicle(
    vehicle_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    try:
        vehicle_uuid = uuid.UUID(vehicle_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid vehicle ID.")

    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_uuid).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    active_delivery = db.query(Delivery).filter(
        Delivery.vehicle_id == vehicle.id,
        Delivery.status.in_([
            DeliveryStatusEnum.assigned,
            DeliveryStatusEnum.picked_up,
            DeliveryStatusEnum.in_transit,
            DeliveryStatusEnum.out_for_delivery,
            DeliveryStatusEnum.arrived,
            DeliveryStatusEnum.issue_reported,
        ]),
    ).first()
    if active_delivery:
        raise HTTPException(status_code=400, detail="Cannot delete vehicle that is currently assigned to an active delivery.")

    db.delete(vehicle)
    db.commit()
    return {"message": "Vehicle deleted successfully."}


@router.patch("/vehicles/{vehicle_id}/assign-rider", response_model=dict)
def assign_vehicle_rider(
    vehicle_id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    try:
        vehicle_uuid = uuid.UUID(vehicle_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid vehicle ID.")

    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_uuid).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    rider_id = payload.get("rider_id") or payload.get("riderId")
    if rider_id:
        try:
            rider_uuid = uuid.UUID(str(rider_id))
            rider = db.query(User).filter(User.id == rider_uuid, User.role == RoleEnum.delivery).first()
            if not rider:
                raise HTTPException(status_code=400, detail="Invalid rider ID.")
            vehicle.assigned_rider_id = rider.id
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid rider ID.")
    else:
        vehicle.assigned_rider_id = None

    db.commit()
    db.refresh(vehicle)
    return _serialize_vehicle_item(vehicle)


@router.get("/admin/schema-status", response_model=dict)
def get_delivery_schema_status(
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    return _delivery_schema_status(db)


@router.get("/admin/delivery-orders", response_model=list[dict])
def list_delivery_orders(
    branch: Optional[str] = Query("Pampanga"),
    include_completed: bool = Query(False),
    limit: int = Query(100, ge=1, le=300),
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    query = _delivery_order_query(db)
    if branch:
        query = query.filter(func.lower(DeliveryOrder.branch) == branch.lower())
    if not include_completed:
        query = query.filter(DeliveryOrder.status.notin_([
            DeliveryOrderStatusEnum.completed,
            DeliveryOrderStatusEnum.cancelled,
        ]))
    delivery_orders = query.order_by(DeliveryOrder.created_at.desc()).limit(limit).all()
    return [_serialize_delivery_order(delivery_order) for delivery_order in delivery_orders]


@router.post("/admin/delivery-orders", response_model=dict)
def create_delivery_order(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    order_ids = payload.get("order_ids") or payload.get("orderIds") or []
    if not isinstance(order_ids, list) or not order_ids:
        raise HTTPException(status_code=400, detail="Select at least one order to dispatch.")

    idempotency_key = str(payload.get("idempotency_key") or payload.get("idempotencyKey") or "").strip() or None
    if not idempotency_key:
        raise HTTPException(status_code=400, detail="An idempotency key is required to create a dispatch.")
    existing_request = _delivery_order_query(db).filter(DeliveryOrder.idempotency_key == idempotency_key).first()
    if existing_request:
        return _serialize_delivery_order(existing_request)

    try:
        rider_uuid = uuid.UUID(str(payload.get("rider_id") or payload.get("riderId")))
        order_uuids = [uuid.UUID(str(order_id)) for order_id in dict.fromkeys(order_ids)]
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid rider or order ID.")

    rider = db.query(User).filter(User.id == rider_uuid).with_for_update().first()
    _ensure_rider_can_receive_dispatch(rider)
    active_dispatch = db.query(DeliveryOrder).filter(
        DeliveryOrder.rider_id == rider.id,
        DeliveryOrder.status.in_([
            DeliveryOrderStatusEnum.assigned,
            DeliveryOrderStatusEnum.picked_up,
            DeliveryOrderStatusEnum.in_progress,
        ]),
    ).first()
    if active_dispatch:
        raise HTTPException(status_code=400, detail=f"This rider already has active dispatch {active_dispatch.delivery_order_number}.")

    branch = str(payload.get("branch") or getattr(rider.branch, "value", rider.branch) or "").strip().title()
    if branch not in {"Manila", "Pampanga"}:
        raise HTTPException(status_code=400, detail="Select either the Manila or Pampanga branch.")
    rider_branch = str(getattr(rider.branch, "value", rider.branch) or "").strip()
    if rider_branch.lower() != branch.lower():
        raise HTTPException(status_code=400, detail="The rider must belong to the selected branch.")

    branch_setting = db.query(BranchDeliverySetting).filter(
        func.lower(BranchDeliverySetting.branch) == branch.lower(),
        BranchDeliverySetting.is_verified.is_(True),
    ).first()
    if not branch_setting:
        raise HTTPException(status_code=400, detail=f"Verify the {branch} branch pickup pin in Delivery Settings first.")

    vehicle = None
    vehicle_id = payload.get("vehicle_id") or payload.get("vehicleId")
    if not vehicle_id:
        raise HTTPException(status_code=400, detail="Select an active vehicle for this dispatch.")
    try:
        vehicle_uuid = uuid.UUID(str(vehicle_id))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid vehicle ID.")
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_uuid, Vehicle.is_active == True).with_for_update().first()
    if not vehicle:
        raise HTTPException(status_code=400, detail="Selected vehicle not found or inactive.")
    if str(vehicle.branch or "").lower() != branch.lower():
        raise HTTPException(status_code=400, detail="The vehicle must belong to the selected branch.")
    if vehicle.assigned_rider_id and vehicle.assigned_rider_id != rider.id:
        raise HTTPException(status_code=400, detail="The selected vehicle is assigned to another rider.")
    vehicle_dispatch = db.query(DeliveryOrder).filter(
        DeliveryOrder.vehicle_id == vehicle.id,
        DeliveryOrder.status.in_([
            DeliveryOrderStatusEnum.assigned,
            DeliveryOrderStatusEnum.picked_up,
            DeliveryOrderStatusEnum.in_progress,
        ]),
    ).first()
    if vehicle_dispatch:
        raise HTTPException(status_code=400, detail=f"This vehicle is already used by {vehicle_dispatch.delivery_order_number}.")
    vehicle.assigned_rider_id = rider.id

    notes = str(payload.get("notes") or "").strip() or None

    orders = db.query(Order).filter(Order.id.in_(order_uuids)).with_for_update().all()
    if len(orders) != len(order_uuids):
        raise HTTPException(status_code=400, detail="One or more selected orders could not be found.")
    order_by_id = {order.id: order for order in orders}
    orders = [order_by_id[order_id] for order_id in order_uuids]

    existing_delivery = db.query(Delivery).filter(Delivery.order_id.in_(order_uuids)).first()
    if existing_delivery:
        raise HTTPException(status_code=400, detail="One or more selected orders are already assigned for delivery.")

    for order in orders:
        payment_status = order.transaction.status if order.transaction else None
        order_number = f"ORD-{order.id.hex[:8].upper()}"
        if payment_status != PaymentStatusEnum.paid:
            raise HTTPException(status_code=400, detail=f"{order_number} is not paid.")
        if order.fulfillment_method != "delivery":
            raise HTTPException(status_code=400, detail=f"{order_number} is not a delivery order.")
        if normalize_provider(order.delivery_provider) != "standard":
            raise HTTPException(status_code=400, detail=f"{order_number} is not an in-house standard delivery.")
        if order.status != OrderStatusEnum.ready_for_pickup:
            raise HTTPException(status_code=400, detail=f"{order_number} is not ready for pickup.")
        if str(order.branch_name or "").lower() != branch.lower():
            raise HTTPException(status_code=400, detail=f"{order_number} belongs to a different branch.")
        if order.delivery_lat is None or order.delivery_lng is None:
            raise HTTPException(
                status_code=400,
                detail=f"The destination pin for {order_number} was not captured at checkout.",
            )

    delivery_order = DeliveryOrder(
        id=uuid.uuid4(),
        delivery_order_number=_generate_delivery_order_number(),
        branch=branch,
        rider_id=rider.id,
        vehicle_id=vehicle.id if vehicle else None,
        status=DeliveryOrderStatusEnum.assigned,
        notes=notes,
        created_by_id=current_user.id,
        idempotency_key=idempotency_key,
    )
    db.add(delivery_order)

    now = datetime.now(timezone.utc)
    deliveries_to_notify = []
    for stop_sequence, order in enumerate(orders, start=1):
        delivery = Delivery(
            id=uuid.uuid4(),
            order_id=order.id,
            delivery_order_id=delivery_order.id,
            rider_id=rider.id,
            vehicle_id=vehicle.id if vehicle else None,
            assigned_area=order.branch_name or branch,
            status=DeliveryStatusEnum.assigned,
            assigned_at=now,
            stop_sequence=stop_sequence,
        )
        db.add(delivery)
        deliveries_to_notify.append(delivery)
        order.status = OrderStatusEnum.ready_for_pickup

    _create_rider_assignment_notifications(db, deliveries_to_notify)
    db.flush()
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if idempotency_key:
            existing_request = _delivery_order_query(db).filter(DeliveryOrder.idempotency_key == idempotency_key).first()
            if existing_request:
                return _serialize_delivery_order(existing_request)
        raise HTTPException(status_code=409, detail="The dispatch could not be created because its data changed. Refresh and try again.") from exc
    hydrated = _delivery_order_query(db).filter(DeliveryOrder.id == delivery_order.id).first()
    _generate_and_store_route(db, hydrated, branch_setting, list(hydrated.deliveries or []))
    db.commit()
    return _serialize_delivery_order(_delivery_order_query(db).filter(DeliveryOrder.id == delivery_order.id).first())


# ── Admin Delivery Assignment ────────────────────────────────────────────────

@router.post("/admin/assign", response_model=dict)
def assign_delivery(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    order_id = payload.get("order_id") or payload.get("orderId")
    rider_id = payload.get("rider_id") or payload.get("riderId")
    dispatch_payload = {
        "order_ids": [order_id],
        "rider_id": rider_id,
        "vehicle_id": payload.get("vehicle_id") or payload.get("vehicleId"),
        "branch": payload.get("branch"),
        "notes": payload.get("notes") or "Created through the legacy single-order assignment flow.",
        "idempotency_key": payload.get("idempotency_key") or payload.get("idempotencyKey") or f"legacy-assign:{order_id}",
    }
    return create_delivery_order(dispatch_payload, db, current_user)


@router.get("/admin/riders", response_model=list[dict])
def list_delivery_riders(
    branch: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    query = db.query(User).filter(User.role == RoleEnum.delivery)
    if branch:
        try:
            query = query.filter(User.branch == BranchEnum(branch.lower()))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid branch.")
    riders = query.order_by(User.first_name.asc(), User.last_name.asc()).all()
    return [_serialize_admin_rider(db, rider) for rider in riders]


@router.get("/admin/assignable-orders", response_model=list[dict])
def list_assignable_orders(
    branch: Optional[str] = Query("Pampanga"),
    limit: int = Query(100, ge=1, le=300),
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    query = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.transaction),
        joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(Order.items).joinedload(OrderItem.arrangement),
    ).outerjoin(Delivery, Delivery.order_id == Order.id).join(Transaction).filter(
        Delivery.id.is_(None),
        Transaction.status == PaymentStatusEnum.paid,
        Order.fulfillment_method == "delivery",
        Order.status == OrderStatusEnum.ready_for_pickup,
    )

    if branch:
        query = query.filter(func.lower(Order.branch_name) == branch.lower())

    orders = query.order_by(Order.scheduled_at.asc(), Order.created_at.asc()).limit(limit).all()
    return [_serialize_assignable_order(order) for order in orders]


@router.get("/admin/branch-settings", response_model=list[dict])
def list_branch_delivery_settings(
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    settings_rows = db.query(BranchDeliverySetting).order_by(BranchDeliverySetting.branch.asc()).all()
    return [_serialize_branch_setting(setting) for setting in settings_rows]


@router.put("/admin/branch-settings/{branch}", response_model=dict)
def save_branch_delivery_setting(
    branch: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    normalized_branch = branch.strip().title()
    if normalized_branch not in {"Manila", "Pampanga"}:
        raise HTTPException(status_code=400, detail="Select either the Manila or Pampanga branch.")
    address = str(payload.get("pickup_address") or payload.get("pickupAddress") or "").strip()
    try:
        lat = float(payload.get("pickup_lat") or payload.get("pickupLat"))
        lng = float(payload.get("pickup_lng") or payload.get("pickupLng"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Choose a valid branch pickup pin.")
    if not address or not (-90 <= lat <= 90 and -180 <= lng <= 180):
        raise HTTPException(status_code=400, detail="Enter the pickup address and a valid map pin.")

    setting = db.query(BranchDeliverySetting).filter(
        func.lower(BranchDeliverySetting.branch) == normalized_branch.lower()
    ).first()
    if not setting:
        setting = BranchDeliverySetting(id=uuid.uuid4(), branch=normalized_branch)
        db.add(setting)
    setting.pickup_address = address
    setting.pickup_lat = lat
    setting.pickup_lng = lng
    setting.is_verified = True
    setting.verified_by_id = current_user.id
    setting.verified_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(setting)
    return _serialize_branch_setting(setting)


@router.patch("/admin/orders/{order_id}/destination-pin", response_model=dict)
def verify_order_destination_pin(
    order_id: uuid.UUID,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    try:
        lat = float(payload.get("latitude") or payload.get("lat"))
        lng = float(payload.get("longitude") or payload.get("lng"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Choose a valid destination pin.")
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        raise HTTPException(status_code=400, detail="Destination coordinates are outside the valid range.")
    address = str(payload.get("address") or order.delivery_address or "").strip()
    if not address:
        raise HTTPException(status_code=400, detail="Delivery address is required.")
    order.delivery_address = address
    order.delivery_lat = lat
    order.delivery_lng = lng
    order.delivery_geocode_precision = "admin_verified_pin"
    order.delivery_pin_verified_at = datetime.now(timezone.utc)
    order.delivery_pin_verified_by_id = current_user.id
    db.commit()
    return _serialize_assignable_order(order)


@router.patch("/admin/orders/{order_id}/delivery-method", response_model=dict)
def review_order_delivery_method(
    order_id: uuid.UUID,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    provider = normalize_provider(payload.get("provider") or payload.get("delivery_provider"))
    if provider != "standard" and provider not in EXTERNAL_PROVIDERS:
        raise HTTPException(status_code=400, detail="Select standard delivery or a supported external courier.")
    order.delivery_provider = provider
    if provider in EXTERNAL_PROVIDERS:
        get_or_create_external_shipment(db, order, current_user.id)
    db.commit()
    return _serialize_assignable_order(order)


@router.get("/admin/external-shipments", response_model=list[dict])
def list_external_shipments(
    branch: Optional[str] = Query(None),
    include_inactive: bool = Query(False),
    limit: int = Query(100, ge=1, le=300),
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    query = db.query(ExternalShipment).options(
        joinedload(ExternalShipment.order).joinedload(Order.user),
        selectinload(ExternalShipment.events),
    )
    if branch:
        query = query.join(Order).filter(func.lower(Order.branch_name) == branch.lower())
    if not include_inactive:
        query = query.filter(ExternalShipment.is_active.is_(True))
    shipments = query.order_by(ExternalShipment.updated_at.desc()).limit(limit).all()
    return [serialize_external_shipment(shipment) for shipment in shipments]


@router.post("/admin/external-shipments", response_model=dict)
def create_external_shipment(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    try:
        order_id = uuid.UUID(str(payload.get("order_id") or payload.get("orderId")))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid order ID.")
    order = db.query(Order).filter(Order.id == order_id).with_for_update().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    provider = normalize_provider(payload.get("provider") or order.delivery_provider)
    if provider not in EXTERNAL_PROVIDERS:
        raise HTTPException(status_code=400, detail="Select a supported external courier.")
    for existing in order.external_shipments or []:
        existing.is_active = False
    order.delivery_provider = provider
    shipment = ExternalShipment(
        id=uuid.uuid4(),
        order_id=order.id,
        provider_code=provider,
        provider_name=provider_display_name(provider, payload.get("provider_name")),
        external_reference=str(payload.get("external_reference") or "").strip() or None,
        tracking_url=str(payload.get("tracking_url") or "").strip() or None,
        status="awaiting_booking",
        is_active=True,
        created_by_id=current_user.id,
    )
    db.add(shipment)
    db.flush()
    apply_external_status(db, shipment, str(payload.get("status") or "awaiting_booking"), message="Shipment created by staff.")
    db.commit()
    return serialize_external_shipment(shipment)


@router.patch("/admin/external-shipments/{shipment_id}", response_model=dict)
def update_external_shipment(
    shipment_id: uuid.UUID,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    shipment = db.query(ExternalShipment).options(selectinload(ExternalShipment.events)).filter(
        ExternalShipment.id == shipment_id
    ).with_for_update().first()
    if not shipment:
        raise HTTPException(status_code=404, detail="External shipment not found.")
    if normalize_provider(shipment.provider_code) == "lalamove":
        raise HTTPException(
            status_code=409,
            detail="Lalamove tracking is updated automatically from booking and webhook events.",
        )
    status = str(payload.get("status") or shipment.status).strip().lower()
    if status not in EXTERNAL_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid external shipment status.")
    if "external_reference" in payload:
        shipment.external_reference = str(payload.get("external_reference") or "").strip() or None
    if "tracking_url" in payload:
        shipment.tracking_url = str(payload.get("tracking_url") or "").strip() or None
    shipment.last_error = str(payload.get("last_error") or "").strip() or None
    apply_external_status(
        db,
        shipment,
        status,
        provider_status=str(payload.get("provider_status") or "").strip() or None,
        message=str(payload.get("message") or "Status updated by staff.").strip(),
        raw_payload={"source": "admin", **payload},
    )
    db.commit()
    return serialize_external_shipment(shipment)


@router.post("/rider/delivery-orders/{delivery_order_id}/pickup", response_model=dict)
def confirm_dispatch_pickup(
    delivery_order_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_delivery),
):
    delivery_order = db.query(DeliveryOrder).filter(
        DeliveryOrder.id == delivery_order_id,
        DeliveryOrder.rider_id == current_user.id,
    ).with_for_update().first()
    if not delivery_order:
        raise HTTPException(status_code=404, detail="Dispatch not found or assigned to another rider.")
    if delivery_order.status not in {DeliveryOrderStatusEnum.assigned, DeliveryOrderStatusEnum.picked_up}:
        raise HTTPException(status_code=400, detail="This dispatch cannot be picked up in its current state.")
    now = datetime.now(timezone.utc)
    for delivery in delivery_order.deliveries or []:
        if delivery.status == DeliveryStatusEnum.assigned:
            delivery.status = DeliveryStatusEnum.picked_up
            delivery.picked_up_at = now
    delivery_order.status = DeliveryOrderStatusEnum.picked_up
    db.commit()
    hydrated = _delivery_order_query(db).filter(DeliveryOrder.id == delivery_order.id).first()
    return _serialize_delivery_order(hydrated)


@router.get("/rider/delivery-orders/{delivery_order_id}/route", response_model=dict)
def get_rider_dispatch_route(
    delivery_order_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_delivery),
):
    delivery_order = _delivery_order_query(db).filter(
        DeliveryOrder.id == delivery_order_id,
        DeliveryOrder.rider_id == current_user.id,
    ).first()
    if not delivery_order:
        raise HTTPException(status_code=404, detail="Dispatch not found or assigned to another rider.")
    preview = _route_for_delivery_order(db, delivery_order)
    db.commit()
    return preview


@router.get("/admin/delivery-orders/{delivery_order_id}/route", response_model=dict)
def get_admin_dispatch_route(
    delivery_order_id: uuid.UUID,
    regenerate: bool = Query(False),
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    delivery_order = _delivery_order_query(db).filter(DeliveryOrder.id == delivery_order_id).first()
    if not delivery_order:
        raise HTTPException(status_code=404, detail="Dispatch not found.")
    preview = _route_for_delivery_order(db, delivery_order, regenerate=regenerate)
    db.commit()
    return preview


@router.post("/admin/routes/preview", response_model=dict)
def preview_admin_dispatch_route(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    branch = str(payload.get("branch") or "").strip().title()
    order_ids = payload.get("order_ids") or payload.get("orderIds") or []
    try:
        order_uuids = [uuid.UUID(str(order_id)) for order_id in dict.fromkeys(order_ids)]
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="One or more order IDs are invalid.")
    setting = db.query(BranchDeliverySetting).filter(
        func.lower(BranchDeliverySetting.branch) == branch.lower(),
        BranchDeliverySetting.is_verified.is_(True),
    ).first()
    if not setting:
        return unavailable_route([], f"Verify the {branch or 'selected'} branch pickup pin first.")
    orders = db.query(Order).filter(Order.id.in_(order_uuids)).all()
    order_by_id = {order.id: order for order in orders}
    ordered = [order_by_id[order_id] for order_id in order_uuids if order_id in order_by_id]
    markers = [{
        "type": "origin",
        "label": f"{setting.branch} branch",
        "address": setting.pickup_address,
        "latitude": float(setting.pickup_lat),
        "longitude": float(setting.pickup_lng),
    }]
    for sequence, order in enumerate(ordered, start=1):
        if order.delivery_lat is None or order.delivery_lng is None:
            continue
        markers.append({
            "type": "destination",
            "label": f"Stop {sequence}: {_recipient_name(order)}",
            "address": order.delivery_address,
            "latitude": float(order.delivery_lat),
            "longitude": float(order.delivery_lng),
            "orderId": str(order.id),
            "stopSequence": sequence,
        })
    coordinates = [(marker["latitude"], marker["longitude"]) for marker in markers]
    return request_route(coordinates, markers)


@router.patch("/admin/deliveries/{delivery_id}/resolve-issue", response_model=dict)
def resolve_delivery_issue(
    delivery_id: uuid.UUID,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).with_for_update().first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found.")
    if delivery.status != DeliveryStatusEnum.issue_reported:
        raise HTTPException(status_code=400, detail="This delivery does not have an open issue.")
    note = str(payload.get("resolution_note") or payload.get("resolutionNote") or "").strip()
    if not note:
        raise HTTPException(status_code=400, detail="Resolution note is required.")
    try:
        restored_status = DeliveryStatusEnum(delivery.status_before_issue or "out_for_delivery")
    except ValueError:
        restored_status = DeliveryStatusEnum.out_for_delivery
    delivery.status = restored_status
    delivery.issue_resolved_at = datetime.now(timezone.utc)
    delivery.issue_resolution_note = note
    _sync_delivery_order_status(delivery.delivery_order)
    db.commit()
    hydrated = _delivery_query(db).filter(Delivery.id == delivery.id).first()
    return serialize_delivery(hydrated)


@router.get("/{delivery_id}/route", response_model=dict)
def get_delivery_route(
    delivery_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delivery = _get_delivery_for_user(db, delivery_id, current_user)
    preview = _route_for_delivery(db, delivery)
    db.commit()
    return preview


@router.get("/{delivery_id}/street-photos", response_model=dict)
def get_delivery_street_photos(
    delivery_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delivery = _get_delivery_for_user(db, delivery_id, current_user)
    order = delivery.order
    if not order or order.delivery_lat is None or order.delivery_lng is None:
        return {"photos": [], "coverageAvailable": False, "attribution": "Street-level imagery © KartaView contributors"}
    return nearby_street_photos(float(order.delivery_lat), float(order.delivery_lng))

@router.post("/{delivery_id}/assign-lalamove")
def assign_lalamove_rider(
    delivery_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    delivery = _delivery_query(db).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found.")

    order = delivery.order
    if not order:
        raise HTTPException(status_code=404, detail="Order details not found.")
    if not order.delivery_lat or not order.delivery_lng:
        raise HTTPException(status_code=400, detail="This order does not have a confirmed delivery pin.")

    try:
        lalamove_data = book_lalamove_delivery(
            customer_name=_user_name(order.user) or "Bloomora customer",
            customer_phone=_recipient_phone(order) or "09000000000",
            dropoff_address=order.delivery_address,
            dropoff_lat=str(order.delivery_lat),
            dropoff_lng=str(order.delivery_lng),
        )

        delivery.lalamove_order_id = lalamove_data["lalamove_order_id"]
        delivery.status = DeliveryStatusEnum.assigned
        order.delivery_provider = "lalamove"
        order.lalamove_order_id = lalamove_data["lalamove_order_id"]
        order.lalamove_share_link = lalamove_data["share_link"]
        order.lalamove_status = lalamove_data["status"]
        db.commit()

        return {
            "status": "success",
            "message": "Lalamove rider assigned!",
            "tracking_link": lalamove_data["share_link"],
        }

    except Exception as e:
        print(f"Lalamove Booking Error: {e}")
        order.delivery_provider = "lalamove"
        order.lalamove_status = "booking_failed"
        db.commit()
        raise HTTPException(status_code=500, detail="Failed to book rider with Lalamove")

# ── Delivery Detail & Status (catch-all must stay last) ──────────────────────

@router.get("/{delivery_id}", response_model=dict)
def get_delivery(
    delivery_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return serialize_delivery(_get_delivery_for_user(db, delivery_id, current_user))


@router.patch("/{delivery_id}/status", response_model=dict)
def update_delivery_status(
    delivery_id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_delivery),
):
    delivery = _get_delivery_for_user(db, delivery_id, current_user)
    requested_status = str(payload.get("status") or "").strip().lower()
    issue_note = str(payload.get("issue_note") or "").strip()

    try:
        next_status = DeliveryStatusEnum(requested_status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid delivery status.")

    current_status = _normalize_rider_step_status(delivery)
    now = datetime.now(timezone.utc)

    if next_status == DeliveryStatusEnum.issue_reported:
        if not issue_note:
            raise HTTPException(status_code=400, detail="Issue note is required.")
        delivery.status_before_issue = _delivery_status_value(current_status)
        delivery.status = DeliveryStatusEnum.issue_reported
        delivery.issue_code = str(payload.get("issue_code") or "other").strip() or "other"
        delivery.issue_note = issue_note
        delivery.issue_reported_at = now
        delivery.issue_resolved_at = None
        delivery.issue_resolution_note = None
        _sync_delivery_order_status(delivery.delivery_order)
        db.commit()
        db.refresh(delivery)
        return serialize_delivery(delivery)

    if next_status == DeliveryStatusEnum.failed:
        if not issue_note:
            raise HTTPException(status_code=400, detail="Failure note is required.")
        delivery.status = DeliveryStatusEnum.failed
        delivery.issue_code = str(payload.get("issue_code") or "delivery_failed").strip() or "delivery_failed"
        delivery.issue_note = issue_note
        delivery.issue_reported_at = now
        _sync_delivery_order_status(delivery.delivery_order)
        db.commit()
        db.refresh(delivery)
        return serialize_delivery(delivery)

    if next_status not in RIDER_STATUS_ORDER:
        raise HTTPException(status_code=400, detail="Status cannot be set by a rider.")

    current_index = RIDER_STATUS_ORDER.index(current_status)
    next_index = RIDER_STATUS_ORDER.index(next_status)
    if next_index != current_index + 1:
        raise HTTPException(
            status_code=400,
            detail=f"Follow the delivery steps in order. Current status is {_delivery_status_value(current_status)}.",
        )

    if next_status == DeliveryStatusEnum.picked_up:
        delivery.picked_up_at = now
        delivery.order.status = OrderStatusEnum.ready_for_pickup
    elif next_status == DeliveryStatusEnum.out_for_delivery:
        if not delivery.picked_up_at:
            delivery.picked_up_at = now
        delivery.in_transit_at = now
        delivery.order.status = OrderStatusEnum.out_for_delivery
        _create_customer_delivery_notification_once(db, delivery, next_status)
    elif next_status == DeliveryStatusEnum.arrived:
        delivery.arrived_at = now
        delivery.order.status = OrderStatusEnum.out_for_delivery
    elif next_status == DeliveryStatusEnum.delivered:
        if not delivery.proof_photo_url:
            raise HTTPException(status_code=400, detail="Proof photo is required before marking delivered.")
        delivery.delivered_at = now
        delivery.order.status = OrderStatusEnum.delivered
        delivery.order.can_review = True
        _create_customer_delivery_notification_once(db, delivery, next_status)

    delivery.status = next_status
    _sync_delivery_order_status(delivery.delivery_order)
    db.commit()
    db.refresh(delivery)
    return serialize_delivery(delivery)


@router.post("/{delivery_id}/proof", response_model=dict)
async def submit_delivery_proof(
    delivery_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_delivery),
):
    delivery = _get_delivery_for_user(db, delivery_id, current_user)

    proof_note = None
    final_photo_url = ""
    upload = None

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        payload = await request.json()
        final_photo_url = str(payload.get("proof_photo_url") or payload.get("proofPhotoUrl") or "").strip()
        proof_note = payload.get("proof_note") or payload.get("proofNote")
    else:
        try:
            form = await request.form()
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid proof upload form data.") from exc

        final_photo_url = str(form.get("proof_photo_url") or form.get("proofPhotoUrl") or "").strip()
        proof_note = form.get("proof_note") or form.get("proofNote")
        upload = form.get("file") or form.get("photo") or form.get("proof_photo") or form.get("proofPhoto")

    if upload:
        if not hasattr(upload, "read") or not hasattr(upload, "content_type"):
            raise HTTPException(status_code=400, detail="Proof upload must be sent as a file.")

        upload_filename = str(getattr(upload, "filename", "") or "").lower()
        upload_content_type = str(getattr(upload, "content_type", "") or "")
        image_extensions = (".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif")
        looks_like_image = upload_content_type.startswith("image/") or upload_filename.endswith(image_extensions)

        if not looks_like_image:
            raise HTTPException(status_code=400, detail="Proof file must be an image.")

        file_bytes = await upload.read()
        if len(file_bytes) > 8 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Proof photo must be 8 MB or smaller.")

        ext = mimetypes.guess_extension(upload_content_type) or ".jpg"
        filename = f"{delivery.id}/{uuid.uuid4()}{ext}"
        final_photo_url = _upload_delivery_proof_photo(filename, file_bytes, upload_content_type)

    if not final_photo_url:
        raise HTTPException(status_code=400, detail="Proof photo is required.")

    delivery.proof_photo_url = final_photo_url
    delivery.proof_note = (proof_note or "").strip() or None
    db.commit()
    db.refresh(delivery)
    return serialize_delivery(delivery)
