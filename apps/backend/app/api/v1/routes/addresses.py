from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.core.dependencies import get_db, get_current_user
from app.models import User, Address
from pydantic import BaseModel
from app.services.geocoding_service import geocode_address

router = APIRouter(prefix="/addresses", tags=["Addresses"])


class AddressPayload(BaseModel):
    label: str
    recipient_name: str
    phone: str
    street: str
    barangay: Optional[str] = None
    city: str
    province: str
    zip_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    geocode_precision: Optional[str] = None
    is_default: bool = False


def parse_address_id(address_id: str) -> uuid.UUID:
    try:
        return uuid.UUID(address_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid address ID.")


def serialize_address(a: Address) -> dict:
    return {
        "id": str(a.id),
        "label": a.label,
        "recipient_name": a.recipient_name,
        "phone": a.phone,
        "street": a.street,
        "barangay": a.barangay,
        "city": a.city,
        "province": a.province,
        "zip_code": a.zip_code,
        "latitude": float(a.latitude) if a.latitude is not None else None,
        "longitude": float(a.longitude) if a.longitude is not None else None,
        "geocode_precision": a.geocode_precision,
        "is_default": a.is_default,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


@router.get("/", response_model=dict)
def list_addresses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all addresses for the current user."""
    addresses = db.query(Address).filter(Address.user_id == current_user.id).order_by(Address.is_default.desc(), Address.created_at.desc()).all()
    return {"addresses": [serialize_address(a) for a in addresses]}


@router.post("/", response_model=dict, status_code=201)
def create_address(
    payload: AddressPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new address. If it's the first address or marked default, clear other defaults."""
    if payload.is_default:
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})

    new_address = Address(
        id=uuid.uuid4(),
        user_id=current_user.id,
        label=payload.label,
        recipient_name=payload.recipient_name,
        phone=payload.phone,
        street=payload.street,
        barangay=payload.barangay,
        city=payload.city,
        province=payload.province,
        zip_code=payload.zip_code,
        latitude=payload.latitude,
        longitude=payload.longitude,
        geocode_precision=payload.geocode_precision,
        is_default=payload.is_default,
    )
    db.add(new_address)
    db.commit()
    db.refresh(new_address)

    # If this is the first address for the user, mark it as default
    count = db.query(Address).filter(Address.user_id == current_user.id).count()
    if count == 1:
        new_address.is_default = True
        db.commit()
        db.refresh(new_address)

    return {"status": "success", "address": serialize_address(new_address)}


@router.patch("/{address_id}", response_model=dict)
def update_address(
    address_id: str,
    payload: AddressPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing address."""
    parsed_address_id = parse_address_id(address_id)
    address = db.query(Address).filter(Address.id == parsed_address_id, Address.user_id == current_user.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found.")

    if payload.is_default:
        db.query(Address).filter(Address.user_id == current_user.id, Address.id != parsed_address_id).update({"is_default": False})

    address.label = payload.label
    address.recipient_name = payload.recipient_name
    address.phone = payload.phone
    address.street = payload.street
    address.barangay = payload.barangay
    address.city = payload.city
    address.province = payload.province
    address.zip_code = payload.zip_code
    address.latitude = payload.latitude
    address.longitude = payload.longitude
    address.geocode_precision = payload.geocode_precision
    address.is_default = payload.is_default

    db.commit()
    db.refresh(address)
    return {"status": "success", "address": serialize_address(address)}


@router.get("/geocode", response_model=dict)
def geocode(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    del db, current_user
    results = geocode_address(q)
    return {"results": results}


@router.delete("/{address_id}", response_model=dict)
def delete_address(
    address_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an address."""
    parsed_address_id = parse_address_id(address_id)
    address = db.query(Address).filter(Address.id == parsed_address_id, Address.user_id == current_user.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found.")

    was_default = bool(address.is_default)
    db.delete(address)
    db.commit()

    # If the deleted address was the default, set another address as default
    if was_default:
        remaining = db.query(Address).filter(Address.user_id == current_user.id).order_by(Address.created_at.desc()).first()
        if remaining:
            remaining.is_default = True
            db.commit()

    return {"status": "success", "message": "Address deleted."}


@router.patch("/{address_id}/set-default", response_model=dict)
def set_default_address(
    address_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set an address as the default."""
    parsed_address_id = parse_address_id(address_id)
    address = db.query(Address).filter(Address.id == parsed_address_id, Address.user_id == current_user.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found.")

    db.query(Address).filter(Address.user_id == current_user.id, Address.id != parsed_address_id).update({"is_default": False})
    address.is_default = True
    db.commit()
    db.refresh(address)

    return {"status": "success", "address": serialize_address(address)}

