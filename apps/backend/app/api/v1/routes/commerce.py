import json
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session
from supabase import create_client

from app.core.config import settings
from app.core.dependencies import get_db, get_current_user, require_staff
from app.models import Advertisement, Campaign, CommerceSetting, PromoCode, ShippingMethod, User


router = APIRouter(prefix="/commerce", tags=["Commerce"])

DELIVERY_DEFAULTS = {
    "delivery_fee": 100.0,
    "minimum_order": 0.0,
    "same_day_cutoff": "14:00",
    "timezone": "Asia/Manila",
}


class DeliverySettingsPayload(BaseModel):
    delivery_fee: float = Field(ge=0)
    minimum_order: float = Field(ge=0)
    same_day_cutoff: str = Field(pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    timezone: str = "Asia/Manila"


class ShippingMethodPayload(BaseModel):
    code: str = Field(min_length=1, max_length=50)
    courier_name: str = Field(min_length=1, max_length=120)
    delivery_type: str = Field(min_length=1, max_length=120)
    description: str | None = None
    logo_url: str | None = None
    service_area: str = Field(default="nationwide", pattern=r"^(manila|pampanga|nationwide)$")
    base_rate: float = Field(ge=0)
    sort_order: int = 0
    is_active: bool = True
    supports_live_booking: bool = False


class PromoPayload(BaseModel):
    code: str = Field(min_length=1, max_length=50)
    discount_type: str
    discount_value: float = Field(gt=0)
    min_spend: float = Field(default=0, ge=0)
    expires_at: datetime | None = None
    is_active: bool = True


class VoucherValidationPayload(BaseModel):
    code: str
    subtotal: float = Field(ge=0)


class AdvertisementPayload(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    image_url: str = Field(min_length=1)
    is_active: bool = False
    sort_order: int = 0


def get_delivery_settings(db: Session) -> dict:
    row = db.query(CommerceSetting).filter(CommerceSetting.key == "delivery").first()
    if not row:
        row = CommerceSetting(key="delivery", value=json.dumps(DELIVERY_DEFAULTS))
        db.add(row)
        db.commit()
        db.refresh(row)
    try:
        return {**DELIVERY_DEFAULTS, **json.loads(row.value)}
    except (TypeError, json.JSONDecodeError):
        return DELIVERY_DEFAULTS.copy()


def serialize_promo(promo: PromoCode) -> dict:
    return {
        "id": str(promo.id),
        "code": promo.code,
        "discount_type": promo.discount_type,
        "discount_value": float(promo.discount_value),
        "min_spend": float(promo.min_spend or 0),
        "expires_at": promo.expires_at.isoformat() if promo.expires_at else None,
        "is_active": bool(promo.is_active),
    }


def advertisement_display_url(path_or_url: str) -> str:
    if path_or_url.startswith(("http://", "https://", "data:")):
        return path_or_url
    try:
        storage = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY).storage.from_("advertisements")
        signed = storage.create_signed_url(path_or_url, 60 * 60 * 24 * 7)
        return signed.get("signedURL") or signed.get("signedUrl") or path_or_url
    except Exception:
        return path_or_url


def serialize_ad(ad: Advertisement) -> dict:
    storage_path = None if ad.image_url.startswith(("http://", "https://", "data:")) else ad.image_url
    return {
        "id": str(ad.id),
        "title": ad.title,
        "image_url": advertisement_display_url(ad.image_url),
        "storage_path": storage_path,
        "is_active": ad.is_active,
        "sort_order": ad.sort_order,
    }


def serialize_shipping_method(method: ShippingMethod, base_rate_override: float | None = None) -> dict:
    return {
        "id": str(method.id),
        "code": method.code,
        "courier_name": method.courier_name,
        "delivery_type": method.delivery_type,
        "description": method.description,
        "logo_url": method.logo_url,
        "service_area": method.service_area,
        "base_rate": float(base_rate_override if base_rate_override is not None else (method.base_rate or 0)),
        "sort_order": method.sort_order,
        "is_active": bool(method.is_active),
        "supports_live_booking": bool(method.supports_live_booking),
    }


def validate_voucher(db: Session, code: str, subtotal: Decimal) -> tuple[PromoCode, Decimal]:
    normalized = code.strip().upper()
    promo = db.query(PromoCode).filter(PromoCode.code == normalized).first()
    now = datetime.now(timezone.utc)
    if not promo:
        raise HTTPException(status_code=404, detail="This voucher code does not exist.")
    if not promo.is_active:
        raise HTTPException(status_code=400, detail="This voucher is not active.")
    if promo.expires_at and promo.expires_at <= now:
        raise HTTPException(status_code=400, detail="This voucher has expired.")
    if subtotal < Decimal(str(promo.min_spend or 0)):
        raise HTTPException(
            status_code=400,
            detail=f"Spend at least ₱{float(promo.min_spend or 0):,.2f} to use this voucher.",
        )
    if promo.discount_type == "percent":
        discount = subtotal * Decimal(str(promo.discount_value)) / Decimal("100")
    elif promo.discount_type == "fixed":
        discount = Decimal(str(promo.discount_value))
    else:
        raise HTTPException(status_code=400, detail="Voucher configuration is invalid.")
    return promo, min(subtotal, discount.quantize(Decimal("0.01")))


@router.get("/checkout-settings")
def checkout_settings(db: Session = Depends(get_db)):
    delivery = get_delivery_settings(db)
    try:
        shipping_methods = db.query(ShippingMethod).filter(
            ShippingMethod.is_active.is_(True)
        ).order_by(ShippingMethod.sort_order.asc(), ShippingMethod.courier_name.asc()).all()
    except ProgrammingError:
        db.rollback()
        shipping_methods = []
    return {
        "delivery": delivery,
        "shipping_methods": [
            serialize_shipping_method(method)
            for method in shipping_methods
        ],
    }


@router.put("/delivery-settings")
def update_delivery_settings(
    payload: DeliverySettingsPayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    row = db.query(CommerceSetting).filter(CommerceSetting.key == "delivery").first()
    if not row:
        row = CommerceSetting(key="delivery", value="{}")
        db.add(row)
    row.value = json.dumps(payload.model_dump())
    db.commit()
    return {"delivery": payload.model_dump()}


@router.get("/shipping-methods")
def list_shipping_methods(
    include_inactive: bool = Query(default=False),
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    query = db.query(ShippingMethod)
    if not include_inactive:
        query = query.filter(ShippingMethod.is_active.is_(True))
    return [
        serialize_shipping_method(method)
        for method in query.order_by(ShippingMethod.sort_order.asc(), ShippingMethod.courier_name.asc()).all()
    ]


@router.post("/shipping-methods", status_code=201)
def create_shipping_method(
    payload: ShippingMethodPayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    code = payload.code.strip().lower().replace(" ", "_")
    if db.query(ShippingMethod).filter(ShippingMethod.code == code).first():
        raise HTTPException(status_code=409, detail="Shipping method code already exists.")
    method = ShippingMethod(**{**payload.model_dump(exclude={"code"}), "code": code})
    db.add(method)
    db.commit()
    db.refresh(method)
    return serialize_shipping_method(method)


@router.put("/shipping-methods/{method_id}")
def update_shipping_method(
    method_id: str,
    payload: ShippingMethodPayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    method = db.query(ShippingMethod).filter(ShippingMethod.id == method_id).first()
    if not method:
        raise HTTPException(status_code=404, detail="Shipping method not found.")
    code = payload.code.strip().lower().replace(" ", "_")
    clash = db.query(ShippingMethod).filter(ShippingMethod.code == code, ShippingMethod.id != method.id).first()
    if clash:
        raise HTTPException(status_code=409, detail="Shipping method code already exists.")
    for key, value in payload.model_dump().items():
        setattr(method, key, code if key == "code" else value)
    db.commit()
    db.refresh(method)
    return serialize_shipping_method(method)


@router.post("/vouchers/validate")
def validate_voucher_endpoint(
    payload: VoucherValidationPayload,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    promo, discount = validate_voucher(db, payload.code, Decimal(str(payload.subtotal)))
    return {"voucher": serialize_promo(promo), "discount": float(discount)}


@router.get("/promos")
def list_promos(db: Session = Depends(get_db), _: User = Depends(require_staff)):
    return [serialize_promo(promo) for promo in db.query(PromoCode).order_by(PromoCode.created_at.desc()).all()]


@router.post("/promos", status_code=201)
def create_promo(payload: PromoPayload, db: Session = Depends(get_db), _: User = Depends(require_staff)):
    code = payload.code.strip().upper()
    if payload.discount_type not in {"percent", "fixed"}:
        raise HTTPException(status_code=400, detail="Discount type must be percent or fixed.")
    if payload.discount_type == "percent" and payload.discount_value > 100:
        raise HTTPException(status_code=400, detail="Percentage discount cannot exceed 100.")
    if db.query(PromoCode).filter(PromoCode.code == code).first():
        raise HTTPException(status_code=409, detail="Promo code already exists.")
    promo = PromoCode(id=uuid.uuid4(), code=code, **payload.model_dump(exclude={"code"}))
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return serialize_promo(promo)


@router.put("/promos/{promo_id}")
def update_promo(
    promo_id: str,
    payload: PromoPayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promo code not found.")
    code = payload.code.strip().upper()
    clash = db.query(PromoCode).filter(PromoCode.code == code, PromoCode.id != promo.id).first()
    if clash:
        raise HTTPException(status_code=409, detail="Promo code already exists.")
    for key, value in payload.model_dump().items():
        setattr(promo, key, code if key == "code" else value)
    db.commit()
    db.refresh(promo)
    return serialize_promo(promo)


@router.delete("/promos/{promo_id}")
def delete_promo(promo_id: str, db: Session = Depends(get_db), _: User = Depends(require_staff)):
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promo code not found.")
    db.delete(promo)
    db.commit()
    return {"status": "success"}


@router.get("/advertisements/active")
def active_advertisement(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    campaign = (
        db.query(Campaign)
        .filter(
            # 🚀 FIXED: Removed Campaign.status == "published"
            Campaign.is_active.is_(True),
            Campaign.start_at <= now,
            or_(Campaign.end_at.is_(None), Campaign.end_at >= now),
            Campaign.web_banner_url.isnot(None),
        )
        .order_by(Campaign.start_at.desc())
        .first()
    )
    if campaign:
        return {
            "advertisement": {
                "id": str(campaign.id),
                "title": campaign.accessible_title or campaign.name,
                "image_url": campaign.web_banner_url,
                "is_active": True,
                "sort_order": 0,
                "source": "campaign",
                "cta_destination": campaign.cta_destination,
            }
        }
    ad = (
        db.query(Advertisement)
        .filter(Advertisement.is_active.is_(True))
        .order_by(Advertisement.sort_order.asc(), Advertisement.updated_at.desc())
        .first()
    )
    return {"advertisement": serialize_ad(ad) if ad else None}


@router.get("/advertisements")
def list_advertisements(db: Session = Depends(get_db), _: User = Depends(require_staff)):
    ads = db.query(Advertisement).order_by(Advertisement.sort_order.asc(), Advertisement.created_at.desc()).all()
    return [serialize_ad(ad) for ad in ads]


@router.post("/advertisements", status_code=201)
def create_advertisement(
    payload: AdvertisementPayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    if payload.is_active:
        db.query(Advertisement).update({"is_active": False})
    ad = Advertisement(**payload.model_dump())
    db.add(ad)
    db.commit()
    db.refresh(ad)
    return serialize_ad(ad)


@router.put("/advertisements/{ad_id}")
def update_advertisement(
    ad_id: str,
    payload: AdvertisementPayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    ad = db.query(Advertisement).filter(Advertisement.id == ad_id).first()
    if not ad:
        raise HTTPException(status_code=404, detail="Advertisement not found.")
    if payload.is_active:
        db.query(Advertisement).filter(Advertisement.id != ad.id).update({"is_active": False})
    for key, value in payload.model_dump().items():
        setattr(ad, key, value)
    db.commit()
    db.refresh(ad)
    return serialize_ad(ad)


@router.delete("/advertisements/{ad_id}")
def delete_advertisement(ad_id: str, db: Session = Depends(get_db), _: User = Depends(require_staff)):
    ad = db.query(Advertisement).filter(Advertisement.id == ad_id).first()
    if not ad:
        raise HTTPException(status_code=404, detail="Advertisement not found.")
    db.delete(ad)
    db.commit()
    return {"status": "success"}
