from datetime import datetime, timezone
import mimetypes
import uuid
from typing import Optional

from fastapi import APIRouter, Body, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_current_user, get_db, require_delivery, require_staff
from app.core.supabase import supabase
from app.models import (
    Delivery,
    DeliveryStatusEnum,
    Order,
    OrderItem,
    OrderStatusEnum,
    PaymentStatusEnum,
    BranchEnum,
    RoleEnum,
    Transaction,
    User,
    Vehicle,
    VehicleTypeEnum,
)

router = APIRouter(prefix="/deliveries", tags=["Deliveries"])

RIDER_STATUS_ORDER = [
    DeliveryStatusEnum.assigned,
    DeliveryStatusEnum.picked_up,
    DeliveryStatusEnum.in_transit,
    DeliveryStatusEnum.out_for_delivery,
    DeliveryStatusEnum.arrived,
    DeliveryStatusEnum.delivered,
]


def _role_value(user: User) -> str:
    return user.role.value if hasattr(user.role, "value") else str(user.role)


def _delivery_status_value(status) -> str:
    return status.value if hasattr(status, "value") else str(status)


def _order_status_value(status) -> str:
    return status.value if hasattr(status, "value") else str(status)


def _delivery_query(db: Session):
    return db.query(Delivery).options(
        joinedload(Delivery.order).joinedload(Order.user),
        joinedload(Delivery.order).joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(Delivery.order).joinedload(Order.items).joinedload(OrderItem.arrangement),
        joinedload(Delivery.rider),
        joinedload(Delivery.vehicle),
    )


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


def serialize_delivery(delivery: Delivery) -> dict:
    order = delivery.order
    if not order:
        raise HTTPException(status_code=500, detail="Delivery has no linked order.")

    item_summary, handling_notes = _serialize_items(order)
    recipient_name = " ".join(
        value
        for value in [order.recipient_first_name, order.recipient_last_name]
        if value
    ).strip()

    return {
        "id": str(delivery.id),
        "orderId": str(order.id),
        "orderNumber": f"ORD-{order.id.hex[:8].upper()}",
        "recipientName": recipient_name or "Recipient",
        "recipientPhone": order.recipient_phone or order.user.phone_number,
        "address": order.delivery_address or "",
        "branch": order.branch_name,
        "itemSummary": item_summary,
        "handlingNotes": handling_notes,
        "deliveryNotes": order.delivery_notes,
        "customerNotes": order.special_note,
        "status": _delivery_status_value(delivery.status),
        "orderStatus": _order_status_value(order.status),
        "assignedRider": _serialize_rider(delivery),
        "assignedVehicle": _serialize_vehicle(delivery),
        "assignedArea": delivery.assigned_area,
        "scheduledAt": order.scheduled_at.isoformat() if order.scheduled_at else None,
        "estimatedArrival": delivery.estimated_arrival.isoformat() if delivery.estimated_arrival else None,
        "pickedUpAt": delivery.picked_up_at.isoformat() if delivery.picked_up_at else None,
        "inTransitAt": delivery.in_transit_at.isoformat() if delivery.in_transit_at else None,
        "arrivedAt": delivery.arrived_at.isoformat() if delivery.arrived_at else None,
        "deliveredAt": delivery.delivered_at.isoformat() if delivery.delivered_at else None,
        "proofPhotoUrl": delivery.proof_photo_url,
        "proofNote": delivery.proof_note,
        "createdAt": delivery.created_at.isoformat() if delivery.created_at else None,
        "updatedAt": delivery.updated_at.isoformat() if delivery.updated_at else None,
    }


def _serialize_assignable_order(order: Order) -> dict:
    item_summary, handling_notes = _serialize_items(order)
    recipient_name = " ".join(
        value
        for value in [order.recipient_first_name, order.recipient_last_name]
        if value
    ).strip()

    return {
        "id": str(order.id),
        "orderNumber": f"ORD-{order.id.hex[:8].upper()}",
        "recipientName": recipient_name or "Recipient",
        "recipientPhone": order.recipient_phone or order.user.phone_number,
        "address": order.delivery_address,
        "branch": order.branch_name,
        "itemSummary": item_summary,
        "handlingNotes": handling_notes,
        "scheduledAt": order.scheduled_at.isoformat() if order.scheduled_at else None,
        "status": _order_status_value(order.status),
    }


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
        "availability": "available" if active_count == 0 else "assigned",
        "lastAssignedAt": last_delivery.updated_at.isoformat() if last_delivery and last_delivery.updated_at else None,
        "assignedVehicle": _serialize_vehicle_item(assigned_vehicle) if assigned_vehicle else None,
        "activeDeliveryDetails": [serialize_delivery(d) for d in active_deliveries],
    }


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
        raise HTTPException(status_code=403, detail="Not authorized to view this delivery.")

    return delivery


# ── Rider Endpoints ──────────────────────────────────────────────────────────

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
        Delivery.status.in_([DeliveryStatusEnum.delivered, DeliveryStatusEnum.failed]),
    ).order_by(Delivery.updated_at.desc()).limit(limit).all()
    return [serialize_delivery(delivery) for delivery in deliveries]


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


# ── Delivery Detail & Status (catch-all must come AFTER /vehicles) ────────────

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

    current_status = delivery.status
    now = datetime.now(timezone.utc)

    if next_status == DeliveryStatusEnum.issue_reported:
        if not issue_note:
            raise HTTPException(status_code=400, detail="Issue note is required.")
        delivery.status = DeliveryStatusEnum.issue_reported
        delivery.proof_note = issue_note
        db.commit()
        db.refresh(delivery)
        return serialize_delivery(delivery)

    if next_status == DeliveryStatusEnum.failed:
        if not issue_note:
            raise HTTPException(status_code=400, detail="Failure note is required.")
        delivery.status = DeliveryStatusEnum.failed
        delivery.proof_note = issue_note
        db.commit()
        db.refresh(delivery)
        return serialize_delivery(delivery)

    if current_status == DeliveryStatusEnum.issue_reported:
        current_status = DeliveryStatusEnum.arrived if delivery.arrived_at else DeliveryStatusEnum.out_for_delivery

    if next_status not in RIDER_STATUS_ORDER:
        raise HTTPException(status_code=400, detail="Status cannot be set by a rider.")

    current_index = RIDER_STATUS_ORDER.index(current_status)
    next_index = RIDER_STATUS_ORDER.index(next_status)
    if next_index != current_index + 1:
        raise HTTPException(status_code=400, detail="Follow the delivery steps in order.")

    if next_status == DeliveryStatusEnum.picked_up:
        delivery.picked_up_at = now
        delivery.order.status = OrderStatusEnum.ready_for_pickup
    elif next_status == DeliveryStatusEnum.out_for_delivery:
        delivery.in_transit_at = now
        delivery.order.status = OrderStatusEnum.out_for_delivery
    elif next_status == DeliveryStatusEnum.arrived:
        delivery.arrived_at = now
        delivery.order.status = OrderStatusEnum.out_for_delivery
    elif next_status == DeliveryStatusEnum.delivered:
        if not delivery.proof_photo_url:
            raise HTTPException(status_code=400, detail="Proof photo is required before marking delivered.")
        delivery.delivered_at = now
        delivery.order.status = OrderStatusEnum.delivered
        delivery.order.can_review = True

    delivery.status = next_status
    db.commit()
    db.refresh(delivery)
    return serialize_delivery(delivery)


@router.post("/{delivery_id}/proof", response_model=dict)
async def submit_delivery_proof(
    delivery_id: str,
    proof_photo_url: Optional[str] = Form(None),
    proof_note: Optional[str] = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_delivery),
):
    delivery = _get_delivery_for_user(db, delivery_id, current_user)

    final_photo_url = (proof_photo_url or "").strip()
    if file:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Proof file must be an image.")

        file_bytes = await file.read()
        if len(file_bytes) > 8 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Proof photo must be 8 MB or smaller.")

        ext = mimetypes.guess_extension(file.content_type) or ".jpg"
        filename = f"{delivery.id}/{uuid.uuid4()}{ext}"
        supabase.storage.from_("delivery-proofs").upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": file.content_type, "x-upsert": "true"},
        )
        final_photo_url = supabase.storage.from_("delivery-proofs").get_public_url(filename)

    if not final_photo_url:
        raise HTTPException(status_code=400, detail="Proof photo is required.")

    delivery.proof_photo_url = final_photo_url
    delivery.proof_note = (proof_note or "").strip() or None
    db.commit()
    db.refresh(delivery)
    return serialize_delivery(delivery)


@router.post("/admin/assign", response_model=dict)
def assign_delivery(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    try:
        order_uuid = uuid.UUID(str(payload.get("order_id") or payload.get("orderId")))
        rider_uuid = uuid.UUID(str(payload.get("rider_id") or payload.get("riderId")))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order or rider ID.")

    order = db.query(Order).options(joinedload(Order.transaction)).filter(Order.id == order_uuid).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    rider = db.query(User).filter(User.id == rider_uuid).first()
    if not rider or rider.role != RoleEnum.delivery:
        raise HTTPException(status_code=400, detail="Select a valid delivery rider.")
    if not rider.is_active or not rider.is_verified or not rider.is_staff_verified:
        raise HTTPException(status_code=400, detail="Rider account must be active and verified.")

    payment_status = order.transaction.status if order.transaction else None
    if payment_status != PaymentStatusEnum.paid:
        raise HTTPException(status_code=400, detail="Only paid orders can be assigned for delivery.")
    if order.fulfillment_method and order.fulfillment_method != "delivery":
        raise HTTPException(status_code=400, detail="Only delivery orders can be assigned to riders.")

    delivery = db.query(Delivery).filter(Delivery.order_id == order.id).first()
    if not delivery:
        delivery = Delivery(id=uuid.uuid4(), order_id=order.id)
        db.add(delivery)

    delivery.rider_id = rider.id
    delivery.assigned_area = str(payload.get("assigned_area") or payload.get("assignedArea") or "").strip() or None
    delivery.status = DeliveryStatusEnum.assigned
    order.status = OrderStatusEnum.ready_for_pickup

    vehicle_id = payload.get("vehicle_id") or payload.get("vehicleId")
    if vehicle_id:
        try:
            vehicle_uuid = uuid.UUID(str(vehicle_id))
            vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_uuid, Vehicle.is_active == True).first()
            if not vehicle:
                raise HTTPException(status_code=400, detail="Selected vehicle not found or inactive.")
            delivery.vehicle_id = vehicle.id
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid vehicle ID.")

    db.commit()
    db.refresh(delivery)
    return serialize_delivery(_delivery_query(db).filter(Delivery.id == delivery.id).first())


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
        Order.status.in_([
            OrderStatusEnum.paid,
            OrderStatusEnum.confirmed,
            OrderStatusEnum.preparing,
            OrderStatusEnum.processing,
            OrderStatusEnum.ready_for_pickup,
        ]),
    )

    if branch:
        query = query.filter(func.lower(Order.branch_name) == branch.lower())

    orders = query.order_by(Order.scheduled_at.asc(), Order.created_at.asc()).limit(limit).all()
    return [_serialize_assignable_order(order) for order in orders]
