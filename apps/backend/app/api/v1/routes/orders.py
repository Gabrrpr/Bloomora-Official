from fastapi import APIRouter, Depends, HTTPException, Body, Query, Request
from sqlalchemy.orm import Session, object_session, joinedload
from sqlalchemy import or_, func, String, text
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from decimal import Decimal
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from app.services.email_service import send_order_status_email
import uuid, os
import secrets


# 🚀 INJECTED SECURE DEPENDENCIES
from app.core.dependencies import get_db, get_current_user, require_staff
from app.models import User, RoleEnum, Order, OrderItem, StockReservation, OrderStatusEnum, Arrangement, Transaction, PaymentMethodEnum, PaymentStatusEnum, Product, Inventory, ProductRecipe
from app.utils.lalamove import book_lalamove_delivery

# We use your dedicated PayMongo service instead of raw requests!
from app.services.paymongo_service import PayMongoError, create_checkout_session, to_paymongo_amount
from app.api.v1.routes.commerce import get_delivery_settings, validate_voucher

router = APIRouter(prefix="/orders", tags=["Orders"])

# ZoneInfo can crash on some environments if tzdata isn't installed.
# This must NOT break importing the router.
try:
    MANILA_TZ = ZoneInfo("Asia/Manila")
except Exception:
    MANILA_TZ = timezone.utc



def _created_order_response(order: Order) -> dict:
    return {
        "status": "success",
        "message": "Order created.",
        "order_ids": [str(order.id)],
        "checkout_url": order.transaction.checkout_url if order.transaction else None,
        "order": serialize_order(order),
    }

def _parse_datetime(value):
    if not value or isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid delivery date.")

def _safe_iso(value):
    try:
        return value.isoformat() if value else None
    except Exception:
        return None

def _safe_float(value, default=0.0):
    try:
        if value is None:
            return default
        return float(value)
    except Exception:
        return default

def _minimal_order_payload(row) -> dict:
    data = dict(row._mapping) if hasattr(row, "_mapping") else dict(row)
    order_id = data.get("id")
    order_id_text = str(order_id) if order_id is not None else ""
    return {
        "id": order_id_text,
        "order_number": f"ORD-{order_id_text.replace('-', '')[:8].upper()}" if order_id_text else None,
        "user_id": str(data.get("user_id")) if data.get("user_id") is not None else None,
        "customer_name": data.get("customer_name") or data.get("customer_email") or "Unknown",
        "customer_email": data.get("customer_email"),
        "customer_phone": data.get("customer_phone"),
        "branch": data.get("branch_name") or "—",
        "special_note": data.get("special_note"),
        "product_name": data.get("product_name") or "Unknown Item",
        "image_url": data.get("image_url") or "",
        "is_custom": False,
        "quantity": int(data.get("quantity") or 1),
        "total_amount": _safe_float(data.get("total_amount"), 0.0),
        "status": data.get("status") or "pending",
        "delivery_address": data.get("delivery_address"),
        "delivery_lat": None,
        "delivery_lng": None,
        "delivery_geocode_precision": None,
        "delivery_notes": data.get("delivery_notes"),
        "recipient_first_name": data.get("recipient_first_name"),
        "recipient_last_name": data.get("recipient_last_name"),
        "recipient_phone": data.get("recipient_phone"),
        "recipient_type": data.get("recipient_type"),
        "fulfillment_method": data.get("fulfillment_method") or "delivery",
        "delivery_provider": None,
        "time_slot": data.get("time_slot"),
        "subtotal_amount": _safe_float(data.get("subtotal_amount") or data.get("total_amount"), 0.0),
        "delivery_fee": _safe_float(data.get("delivery_fee"), 0.0),
        "voucher_code": data.get("voucher_code"),
        "discount_amount": _safe_float(data.get("discount_amount"), 0.0),
        "scheduled_at": _safe_iso(data.get("scheduled_at")),
        "payment_status": data.get("payment_status") or "pending",
        "payment_method": data.get("payment_method"),
        "payment_provider": data.get("payment_provider"),
        "checkout_url": data.get("checkout_url"),
        "paid_at": _safe_iso(data.get("paid_at")),
        "transaction_id": str(data.get("transaction_id")) if data.get("transaction_id") is not None else None,
        "expires_at": _safe_iso(data.get("expires_at")),
        "payment_reference": data.get("payment_reference"),
        "can_review": bool(data.get("can_review") or False),
        "has_reviewed": bool(data.get("has_reviewed") or False),
        "created_at": _safe_iso(data.get("created_at")),
        "updated_at": _safe_iso(data.get("updated_at")),
        "items": [],
        "delivery_tracking": None,
    }

def _raw_list_orders(
    db: Session,
    *,
    status: Optional[str],
    search: Optional[str],
    branch: Optional[str],
    limit: int,
    offset: int,
) -> list[dict]:
    clauses = []
    params = {"limit": limit, "offset": offset}
    if status:
        clauses.append("LOWER(CAST(o.status AS TEXT)) = :status")
        params["status"] = status.lower()
    if branch:
        clauses.append("LOWER(COALESCE(o.branch_name, '')) = :branch")
        params["branch"] = branch.lower()
    if search:
        clauses.append(
            "("
            "LOWER(CAST(o.id AS TEXT)) LIKE :search OR "
            "LOWER(COALESCE(u.first_name, '')) LIKE :search OR "
            "LOWER(COALESCE(u.last_name, '')) LIKE :search OR "
            "LOWER(COALESCE(u.email, '')) LIKE :search"
            ")"
        )
        params["search"] = f"%{search.lower()}%"

    where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    rows = db.execute(
        text(f"""
            SELECT
                o.id,
                o.user_id,
                o.quantity,
                o.total_amount,
                CAST(o.status AS TEXT) AS status,
                o.delivery_address,
                o.delivery_notes,
                o.special_note,
                o.scheduled_at,
                o.created_at,
                o.updated_at,
                o.branch_name,
                o.recipient_first_name,
                o.recipient_last_name,
                o.recipient_phone,
                o.recipient_type,
                o.fulfillment_method,
                o.time_slot,
                o.subtotal_amount,
                o.delivery_fee,
                o.voucher_code,
                o.discount_amount,
                u.email AS customer_email,
                u.phone_number AS customer_phone,
                CASE
                    WHEN LOWER(COALESCE(o.delivery_notes, '')) LIKE '%pos transaction%'
                    THEN NULLIF(TRIM(CONCAT(COALESCE(o.recipient_first_name, ''), ' ', COALESCE(o.recipient_last_name, ''))), '')
                    ELSE NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), '')
                END AS customer_name,
                COALESCE(p.name, a.name, 'Unknown Item') AS product_name,
                COALESCE(p.image_url, a.generated_image_url, '') AS image_url,
                t.id AS transaction_id,
                CAST(t.status AS TEXT) AS payment_status,
                CAST(t.payment_method AS TEXT) AS payment_method,
                t.provider AS payment_provider,
                t.checkout_url,
                t.paid_at,
                t.expires_at,
                COALESCE(t.provider_checkout_session_id, t.reference_number) AS payment_reference
            FROM orders o
            LEFT JOIN users u ON u.id = o.user_id
            LEFT JOIN products p ON p.id = o.product_id
            LEFT JOIN arrangements a ON a.id = o.arrangement_id
            LEFT JOIN transactions t ON t.order_id = o.id
            {where_sql}
            ORDER BY o.created_at DESC
            LIMIT :limit OFFSET :offset
        """),
        params,
    ).all()
    return [_minimal_order_payload(row) for row in rows]

def _material_row(product: Optional[Product], quantity, material_type: str = "Recipe item") -> dict:
    qty = float(quantity or 0)
    return {
        "product_id": str(product.id) if product else None,
        "name": product.name if product else "Unknown material",
        "quantity": qty,
        "unit": product.inventory.unit_type if product and product.inventory and product.inventory.unit_type else "piece",
        "stock": int(product.inventory.current_stock or 0) if product and product.inventory else 0,
        "material_type": material_type,
    }


def _coordinate(value):
    if value is None or value == "":
        return None
    try:
        return Decimal(str(value))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid delivery coordinates.")


def _delivery_tracking(order: Order) -> dict:
    delivery = getattr(order, "delivery", None)
    rider = delivery.rider if delivery else None
    vehicle = delivery.vehicle if delivery else None
    return {
        "delivery_id": str(delivery.id) if delivery else None,
        "provider": order.delivery_provider,
        "lalamove_order_id": order.lalamove_order_id,
        "lalamove_share_link": order.lalamove_share_link,
        "lalamove_status": order.lalamove_status,
        "status": (
            delivery.status.value
            if delivery and hasattr(delivery.status, "value")
            else (str(delivery.status) if delivery else None)
        ),
        "estimated_arrival": delivery.estimated_arrival.isoformat() if delivery and delivery.estimated_arrival else None,
        "assigned_at": delivery.assigned_at.isoformat() if delivery and getattr(delivery, "assigned_at", None) else None,
        "picked_up_at": delivery.picked_up_at.isoformat() if delivery and delivery.picked_up_at else None,
        "in_transit_at": delivery.in_transit_at.isoformat() if delivery and delivery.in_transit_at else None,
        "arrived_at": delivery.arrived_at.isoformat() if delivery and delivery.arrived_at else None,
        "delivered_at": delivery.delivered_at.isoformat() if delivery and delivery.delivered_at else None,
        "proof_photo_url": delivery.proof_photo_url if delivery else None,
        "proof_note": delivery.proof_note if delivery else None,
        "rider": {
            "id": str(rider.id),
            "name": f"{rider.first_name} {rider.last_name}".strip() or rider.username,
            "phone": rider.phone_number,
        } if rider else None,
        "vehicle": {
            "id": str(vehicle.id),
            "plate_number": vehicle.plate_number,
            "vehicle_type": vehicle.vehicle_type.value if hasattr(vehicle.vehicle_type, "value") else str(vehicle.vehicle_type),
            "brand": vehicle.brand,
            "model": vehicle.model,
            "color": vehicle.color,
        } if vehicle else None,
    }


def _product_materials(db: Optional[Session], product: Optional[Product]) -> list[dict]:
    if not db or not product:
        return []

    rows = db.query(ProductRecipe).filter(ProductRecipe.parent_product_id == product.id).all()
    if rows:
        return [_material_row(row.component_product, row.quantity_required) for row in rows]

    composition = getattr(product, "composition", None) or []
    if not isinstance(composition, list):
        return []

    materials = []
    for item in composition:
        component_id = item.get("product_id") or item.get("id")
        if not component_id:
            continue
        try:
            component_uuid = uuid.UUID(str(component_id))
        except ValueError:
            continue
        component = db.query(Product).filter(Product.id == component_uuid).first()
        materials.append(_material_row(component, item.get("quantity") or item.get("qty") or 1))
    return materials

def _custom_arrangement_materials(arrangement: Optional[Arrangement], db: Optional[Session] = None) -> list[dict]:
    if not arrangement:
        return []

    def _material_from_payload(item: dict, material_type: str = "Material") -> dict:
        product_id = item.get("product_id") or item.get("id")
        stock = item.get("stock")
        unit = item.get("unit") or item.get("unit_type") or "piece"
        if db and product_id:
            try:
                product_uuid = uuid.UUID(str(product_id))
                product = db.query(Product).filter(Product.id == product_uuid).first()
                if product:
                    unit = product.inventory.unit_type if product.inventory and product.inventory.unit_type else unit
                    stock = int(product.inventory.current_stock or 0) if product.inventory else stock
            except Exception:
                pass

        return {
            "product_id": str(product_id) if product_id else None,
            "name": item.get("product_name") or item.get("name") or item.get("label") or "Unknown material",
            "quantity": float(item.get("quantity") or item.get("qty") or 1),
            "unit": unit,
            "stock": int(stock or 0),
            "material_type": item.get("material_type") or item.get("type") or material_type,
            "unit_price": float(item.get("unit_price") or item.get("price") or 0),
            "subtotal": float(item.get("subtotal") or item.get("line_total") or 0),
        }

    # Try price_breakdown first. AI-generated arrangements may store materials
    # under items, materials, components, or grouped category arrays.
    pb = getattr(arrangement, "price_breakdown", None)
    if pb:
        try:
            import json
            if isinstance(pb, str):
                pb = json.loads(pb)
            items = []
            if isinstance(pb, dict):
                for key in ("items", "materials", "components"):
                    if isinstance(pb.get(key), list):
                        items.extend(pb[key])
                for key, material_type in (
                    ("flowers", "Flower"),
                    ("vases", "Vase"),
                    ("wrappings", "Wrapping"),
                    ("accessories", "Accessory"),
                    ("add_ons", "Add-on"),
                    ("addons", "Add-on"),
                ):
                    if isinstance(pb.get(key), list):
                        items.extend({**item, "material_type": item.get("material_type") or material_type} for item in pb[key])
            if items:
                return [_material_from_payload(item) for item in items if isinstance(item, dict)]
        except Exception:
            pass

    # ── Fallback: try linked relationship objects ──
    materials = []
    linked_parts = [
        ("Flower",    getattr(arrangement, "flower",    None)),
        ("Vase",      getattr(arrangement, "vase",      None)),
        ("Wrapping",  getattr(arrangement, "wrapping",  None)),
        ("Accessory", getattr(arrangement, "accessory", None)),
    ]
    for material_type, part in linked_parts:
        if not part:
            continue
        product = getattr(part, "product", None)
        quantity = getattr(part, "quantity", 1) or 1
        if product:
            materials.append(_material_row(product, quantity, material_type))
        else:
            materials.append({
                "product_id": None,
                "name": getattr(part, "name", None) or material_type,
                "quantity": float(quantity),
                "unit": "piece",
                "stock": int(getattr(part, "quantity", 0) or 0),
                "material_type": material_type,
            })
    return materials

def serialize_order(o) -> dict:
    # Never let serialization crash the /orders list endpoint.
    try:
        try:
            _expire_pending_transaction(object_session(o), o)
        except Exception:
            session = object_session(o)
            if session:
                try:
                    session.rollback()
                except Exception:
                    pass

        db = object_session(o)
        user = getattr(o, "user", None)

        def safe_float(v, default=0.0):
            try:
                if v is None:
                    return default
                return float(v)
            except Exception:
                return default

        def safe_iso(v):
            try:
                return v.isoformat() if v else None
            except Exception:
                return None

        img_url = ""
        is_custom = False
        display_name = "Unknown Item"
        total_qty = getattr(o, 'quantity', 1) or 1

        serialized_items = []
        if getattr(o, "items", None):
            for item in o.items:
                product = getattr(item, "product", None)
                arrangement = getattr(item, "arrangement", None)
                unit_price = Decimal(str(getattr(item, "price_at_purchase", None) or 0))
                qty = getattr(item, "quantity", 0) or 0

                serialized_items.append({
                    "id": str(getattr(item, "id", None)),
                    "product_id": str(getattr(item, "product_id", None)) if getattr(item, "product_id", None) else None,
                    "arrangement_id": str(getattr(item, "arrangement_id", None)) if getattr(item, "arrangement_id", None) else None,
                    "product_name": getattr(product, "name", None)
                        if product
                        else (getattr(arrangement, "name", None) if arrangement else "Custom Arrangement"),
                    "image_url": (getattr(product, "image_url", None) if product else None)
                        or (getattr(arrangement, "generated_image_url", None) if arrangement else None)
                        or "",
                    "is_custom": arrangement is not None,
                    "quantity": qty,
                    "unit_price": safe_float(unit_price),
                    "line_total": safe_float(unit_price * qty),
                    "materials": _custom_arrangement_materials(arrangement, db) if arrangement else _product_materials(db, product),
                    "price_breakdown": getattr(arrangement, "price_breakdown", None) if arrangement else None,  # ← ADD
                    "arrangement_prompt": getattr(arrangement, "prompt_text", None) if arrangement else None,
                    "arrangement_description": getattr(arrangement, "description", None) if arrangement else None,
                    "card_message": getattr(item, "card_message", None),
                    "card_enabled": bool(getattr(item, "card_enabled", False)),
                })

        if serialized_items:
            first_item = serialized_items[0]
            display_name = first_item.get("product_name") or display_name
            img_url = first_item.get("image_url") or ""
            is_custom = bool(first_item.get("is_custom"))
            try:
                total_qty = sum(i.get("quantity", 0) or 0 for i in serialized_items) or total_qty
            except Exception:
                pass
            if len(serialized_items) > 1:
                display_name = f"{display_name} + {len(serialized_items) - 1} more"
        elif db and getattr(o, 'product_id', None):
            product = db.query(Product).filter(Product.id == o.product_id).first()
            if product:
                display_name = getattr(product, 'name', display_name)
                img_url = getattr(product, 'image_url', "") or getattr(product, 'image', "")
                is_custom = False
        elif db and getattr(o, 'arrangement_id', None):
            arrangement = db.query(Arrangement).filter(Arrangement.id == o.arrangement_id).first()
            if arrangement:
                display_name = getattr(arrangement, 'name', 'Custom Arrangement')
                img_url = (
                    getattr(arrangement, 'generated_image_url', "")
                    or getattr(arrangement, 'image_url', "")
                    or getattr(arrangement, 'image', "")
                )
                is_custom = True
                serialized_items.append({
                    "id": str(getattr(arrangement, "id", None)),
                    "product_id": None,
                    "arrangement_id": str(getattr(arrangement, "id", None)),
                    "product_name": display_name,
                    "image_url": img_url,
                    "is_custom": True,
                    "quantity": getattr(o, "quantity", 1) or 1,
                    "unit_price": safe_float(getattr(arrangement, "estimated_price", None) or getattr(o, "total_amount", None), 0.0),
                    "line_total": safe_float(getattr(o, "total_amount", None), 0.0),
                    "materials": _custom_arrangement_materials(arrangement, db),
                    "price_breakdown": getattr(arrangement, "price_breakdown", None),
                    "arrangement_prompt": getattr(arrangement, "prompt_text", None),
                    "arrangement_description": getattr(arrangement, "description", None),
                    "card_message": None,
                    "card_enabled": False,
                })

        # 🚀 SMART REFERENCE EXTRACTION
        transaction = getattr(o, 'transaction', None)
        payment_ref = getattr(transaction, 'provider_checkout_session_id', None) or getattr(transaction, 'reference_number', None) if transaction else None
        payment_provider = getattr(transaction, 'provider', None) if transaction else None
        checkout_url = getattr(transaction, 'checkout_url', None) if transaction else None
        paid_at = getattr(transaction, 'paid_at', None) if transaction else None

        try:
            delivery_tracking = _delivery_tracking(o)
        except Exception:
            delivery_tracking = None

        status_val = getattr(getattr(o, 'status', None), 'value', None) or getattr(o, 'status', None)

        branch_val = "—"
        try:
            if user and getattr(user, 'branch', None):
                branch_val = getattr(getattr(user, 'branch', None), 'value', None) or str(user.branch)
            else:
                branch_val = getattr(o, 'branch_name', None) or "—"
        except Exception:
            branch_val = getattr(o, 'branch_name', None) or "—"

        customer_name = 'Unknown'
        try:
            is_pos_order = "pos transaction" in str(getattr(o, "delivery_notes", "") or "").lower()
            recipient_name = " ".join(
                value for value in [
                    str(getattr(o, "recipient_first_name", "") or "").strip(),
                    str(getattr(o, "recipient_last_name", "") or "").strip(),
                ]
                if value
            ).strip()
            if is_pos_order and recipient_name:
                customer_name = recipient_name
            elif user:
                fn = getattr(user, 'first_name', '') or ''
                ln = getattr(user, 'last_name', '') or ''
                customer_name = f"{fn} {ln}".strip() or getattr(user, 'email', 'Unknown')
        except Exception:
            customer_name = 'Unknown'

        return {
            "id": str(o.id),
            "order_number": f"ORD-{o.id.hex[:8].upper()}",
            "user_id": str(o.user_id),
            "customer_name": customer_name,
            "customer_email": getattr(user, 'email', None) if user else None,
            "customer_phone": getattr(user, 'phone_number', None) if user else None,
            "branch": branch_val,
            "special_note": getattr(o, 'special_note', None),
            "product_name": display_name,
            "image_url": img_url,
            "is_custom": is_custom,
            "quantity": total_qty,
            "total_amount": safe_float(getattr(o, 'total_amount', None), 0.0),
            "status": status_val,
            "delivery_address": getattr(o, 'delivery_address', None),
            "delivery_lat": float(o.delivery_lat) if getattr(o, 'delivery_lat', None) is not None else None,
            "delivery_lng": float(o.delivery_lng) if getattr(o, 'delivery_lng', None) is not None else None,
            "delivery_geocode_precision": getattr(o, 'delivery_geocode_precision', None),
            "delivery_notes": getattr(o, 'delivery_notes', None),
            "is_walk_in_pos": "pos transaction" in str(getattr(o, "delivery_notes", "") or "").lower(),
            "recipient_first_name": getattr(o, 'recipient_first_name', None),
            "recipient_last_name": getattr(o, 'recipient_last_name', None),
            "recipient_phone": getattr(o, 'recipient_phone', None),
            "recipient_type": getattr(o, 'recipient_type', None),
            "fulfillment_method": getattr(o, 'fulfillment_method', None) or "delivery",
            "delivery_provider": getattr(o, 'delivery_provider', None),
            "time_slot": getattr(o, 'time_slot', None),
            "subtotal_amount": safe_float(getattr(o, 'subtotal_amount', None) or getattr(o, 'total_amount', None), 0.0),
            "delivery_fee": safe_float(getattr(o, 'delivery_fee', None) or 0, 0.0),
            "voucher_code": getattr(o, 'voucher_code', None),
            "discount_amount": safe_float(getattr(o, 'discount_amount', None) or 0, 0.0),
            "scheduled_at": safe_iso(getattr(o, 'scheduled_at', None)),
            "payment_status": (
                getattr(getattr(transaction, 'status', None), 'value', None)
                if transaction and getattr(transaction, 'status', None) is not None
                else (str(getattr(transaction, 'status', None)) if transaction else "pending")
            ),
            "payment_method": (
                getattr(getattr(transaction, 'payment_method', None), 'value', None)
                if transaction and getattr(transaction, 'payment_method', None) is not None
                else (str(getattr(transaction, 'payment_method', None)) if transaction else None)
            ),
            "payment_provider": payment_provider,
            "checkout_url": checkout_url,
            "paid_at": safe_iso(paid_at),
            "transaction_id": str(transaction.id) if transaction else None,
            "expires_at": safe_iso(getattr(transaction, 'expires_at', None)) if transaction else None,
            "payment_reference": payment_ref,
            "can_review": getattr(o, 'can_review', False),
            "has_reviewed": getattr(o, 'has_reviewed', False),
            "created_at": safe_iso(getattr(o, 'created_at', None)),
            "updated_at": safe_iso(getattr(o, 'updated_at', None)),
            "items": serialized_items,
            "delivery_tracking": delivery_tracking,
        }

    except Exception:
        # Last resort: minimal payload.
        return {
            "id": str(getattr(o, 'id', None)),
            "order_number": None,
            "user_id": str(getattr(o, 'user_id', None)),
            "customer_name": "Unknown",
            "customer_email": None,
            "customer_phone": None,
            "branch": getattr(o, 'branch_name', '—') if hasattr(o, 'branch_name') else '—',
            "special_note": None,
            "product_name": "Unknown Item",
            "image_url": "",
            "is_custom": False,
            "quantity": getattr(o, 'quantity', 1) or 1,
            "total_amount": 0.0,
            "status": getattr(getattr(o, 'status', None), 'value', None) or getattr(o, 'status', None),
            "delivery_address": getattr(o, 'delivery_address', None),
            "delivery_lat": None,
            "delivery_lng": None,
            "delivery_geocode_precision": None,
            "delivery_notes": getattr(o, 'delivery_notes', None),
            "is_walk_in_pos": "pos transaction" in str(getattr(o, "delivery_notes", "") or "").lower(),
            "recipient_first_name": getattr(o, 'recipient_first_name', None),
            "recipient_last_name": getattr(o, 'recipient_last_name', None),
            "recipient_phone": getattr(o, 'recipient_phone', None),
            "recipient_type": getattr(o, 'recipient_type', None),
            "fulfillment_method": getattr(o, 'fulfillment_method', None) or 'delivery',
            "delivery_provider": getattr(o, 'delivery_provider', None),
            "time_slot": getattr(o, 'time_slot', None),
            "subtotal_amount": 0.0,
            "delivery_fee": 0.0,
            "voucher_code": getattr(o, 'voucher_code', None),
            "discount_amount": 0.0,
            "scheduled_at": None,
            "payment_status": "pending",
            "payment_method": None,
            "payment_provider": None,
            "checkout_url": None,
            "paid_at": None,
            "transaction_id": None,
            "expires_at": None,
            "payment_reference": None,
            "can_review": getattr(o, 'can_review', False),
            "has_reviewed": getattr(o, 'has_reviewed', False),
            "created_at": None,
            "updated_at": None,
            "items": [],
            "delivery_tracking": None,
        }



def _derive_delivery_branch(address: str) -> str:
    normalized = (address or "").lower()
    if any(value in normalized for value in ("pampanga", "angeles", "mabalacat", "san fernando")):
        return "Pampanga"
    if any(value in normalized for value in (
        "metro manila",
        "national capital region",
        " ncr",
        "manila",
        "quezon",
        "makati",
        "pasig",
        "taguig",
        "caloocan",
        "paranaque",
        "valenzuela",
        "muntinlupa",
        "mandaluyong",
        "marikina",
        "pasay",
    )):
        return "Manila"
    raise HTTPException(
        status_code=400,
        detail="Delivery is currently available only within Metro Manila and Pampanga.",
    )


def _validate_delivery_date(value, fulfillment_method: str, cutoff: str = "14:00") -> datetime:
    scheduled = _parse_datetime(value)
    if not scheduled:
        raise HTTPException(status_code=400, detail="Select a delivery date.")
    if scheduled.tzinfo is None:
        scheduled = scheduled.replace(tzinfo=MANILA_TZ)
    local_date = scheduled.astimezone(MANILA_TZ).date()
    now = datetime.now(MANILA_TZ)
    today = now.date()
    if local_date < today or local_date > today + timedelta(days=30):
        raise HTTPException(status_code=400, detail="Delivery date must be within the next 30 days.")
    cutoff_hour, cutoff_minute = (int(part) for part in cutoff.split(":", 1))
    if fulfillment_method in {"delivery", "lalamove"} and local_date == today and (now.hour, now.minute) >= (cutoff_hour, cutoff_minute):
        display_hour = cutoff_hour % 12 or 12
        suffix = "AM" if cutoff_hour < 12 else "PM"
        raise HTTPException(status_code=400, detail=f"Same-day delivery is unavailable after {display_hour}:{cutoff_minute:02d} {suffix}.")
    return scheduled


def _product_supports_branch(product: Product, branch: str) -> bool:
    branches = getattr(product, "branches", None) or []
    if not branches:
        return True
    normalized = {str(value).strip().lower() for value in branches}
    return branch.lower() in normalized or "all" in normalized

def _branch_stock_attr(branch: str) -> str | None:
    normalized = str(branch or "").strip().lower()
    if normalized == "manila":
        return "stock_manila"
    if normalized == "pampanga":
        return "stock_pampanga"
    return None

def _inventory_stock_for_branch(inventory: Inventory, branch: str) -> int:
    attr = _branch_stock_attr(branch)
    if attr and hasattr(inventory, attr):
        return int(getattr(inventory, attr) or 0)
    return int(inventory.current_stock or 0)

def _active_reserved_quantity(db: Session, product_id, branch: str | None = None) -> int:
    query = (
        db.query(func.coalesce(func.sum(StockReservation.quantity), 0))
        .join(OrderItem, OrderItem.id == StockReservation.order_item_id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(
            StockReservation.product_id == product_id,
            StockReservation.status == "active",
            StockReservation.reserved_until > datetime.now(timezone.utc),
        )
    )
    if branch:
        query = query.filter(func.lower(func.coalesce(Order.branch_name, "")) == branch.strip().lower())
    return int(query.scalar() or 0)

def _deduct_inventory_stock(inventory: Inventory, quantity: int, branch: str) -> None:
    inventory.current_stock = max(0, int(inventory.current_stock or 0) - quantity)
    attr = _branch_stock_attr(branch)
    if attr and hasattr(inventory, attr):
        setattr(inventory, attr, max(0, int(getattr(inventory, attr) or 0) - quantity))

@router.get("/my", response_model=List[dict])
def get_my_orders(
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Order).filter(Order.user_id == current_user.id)
    if status:
        try: query = query.filter(Order.status == OrderStatusEnum(status.lower()))
        except ValueError: raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    orders = query.order_by(Order.created_at.desc()).all()
    return [serialize_order(o) for o in orders]

@router.get("/", response_model=List[dict])
def list_orders(
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by order number or customer name/email"),
    branch: Optional[str] = Query(None, description="Filter by branch"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    # Do not eager-load transactions here. Legacy rows can contain old payment
    # enum strings; lazy access lets serialize_order isolate a bad row instead
    # of letting one transaction crash the whole dashboard list.
    query = db.query(Order)
    
    if status:
        try: query = query.filter(Order.status == OrderStatusEnum(status.lower()))
        except ValueError: raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    # 🚀 THE SILVER BULLET: Filter by the Order's delivery branch, NOT the User's profile!
    if branch:
        query = query.filter(func.lower(Order.branch_name) == branch.lower())

    if search:
        search_term = f"%{search}%"
        # We still join User here so we can search by customer name/email
        query = query.join(User).filter(
            or_(
                func.cast(Order.id, String).ilike(search_term),
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term),
                User.email.ilike(search_term),
            )
        )

    try:
        orders = query.order_by(Order.created_at.desc()).offset(offset).limit(limit).all()
        return [serialize_order(o) for o in orders]
    except Exception as exc:
        # If DB schema is out of sync (e.g., missing delivery_lat/lng columns),
        # we still want the endpoint to work for the admin dashboard.
        db.rollback()
        try:
            import logging
            logging.getLogger(__name__).exception(
                "Falling back to raw order list after ORM load failed: %s",
                exc,
            )
        except Exception:
            pass
        return _raw_list_orders(
            db,
            status=status,
            search=search,
            branch=branch,
            limit=limit,
            offset=offset,
        )


@router.get("/{order_id}", response_model=dict)
def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try: order_uuid = uuid.UUID(order_id)
    except ValueError: raise HTTPException(status_code=400, detail="Invalid order ID")

    order = db.query(Order).filter(Order.id == order_uuid).first()
    if not order: raise HTTPException(status_code=404, detail="Order not found")

    role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if order.user_id != current_user.id and role_val not in ["admin", "staff"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this order")

    return serialize_order(order)

@router.get("/{customer_id}/recent", response_model=List[dict])
def get_customer_recent_orders(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    orders = db.query(Order).filter(Order.user_id == customer_id).order_by(Order.created_at.desc()).limit(5).all()
    return [serialize_order(o) for o in orders]

@router.post("/", response_model=dict, status_code=201)
async def create_order(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart_items = payload.get("items", [])
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty.")

    attempt_id = str(payload.get("attemptId") or payload.get("checkout_attempt_id") or "").strip() or None
    if attempt_id:
        try:
            attempt_id = str(uuid.UUID(attempt_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid checkout attempt ID. Please restart checkout and try again.")
        existing_order = db.query(Order).filter(
            Order.user_id == current_user.id,
            Order.checkout_attempt_id == attempt_id,
        ).first()
        if existing_order:
            return _created_order_response(existing_order)

    delivery_notes = payload.get("delivery_notes", "")
    fulfillment_method = payload.get("fulfillmentMethod") or payload.get("fulfillment_method") or "delivery"
    delivery_address = payload.get("delivery_address", "")
    raw_branch = (
        _derive_delivery_branch(delivery_address)
        if fulfillment_method in {"delivery", "lalamove"}
        else str(payload.get("branch_name") or payload.get("branch") or "Manila").strip().title()
    )
    if raw_branch not in {"Manila", "Pampanga"}:
        raise HTTPException(status_code=400, detail="Select either the Manila or Pampanga branch.")
    if fulfillment_method == "delivery" and raw_branch == "Manila":
        raise HTTPException(status_code=400, detail="Standard delivery is not available for Manila. Please select Lalamove or Pickup.")
    if fulfillment_method == "lalamove" and raw_branch != "Manila":
        raise HTTPException(status_code=400, detail="Lalamove delivery is available only for Manila addresses.")
    delivery_lat = _coordinate(payload.get("delivery_lat"))
    delivery_lng = _coordinate(payload.get("delivery_lng"))
    delivery_geocode_precision = str(payload.get("delivery_geocode_precision") or "").strip() or None
    if fulfillment_method == "lalamove" and (delivery_lat is None or delivery_lng is None):
        raise HTTPException(status_code=400, detail="Please confirm the exact delivery pin before selecting Lalamove.")
    delivery_settings = get_delivery_settings(db)
    scheduled_at = _validate_delivery_date(
        payload.get("scheduled_at") or payload.get("delivery_date"),
        fulfillment_method,
        delivery_settings["same_day_cutoff"],
    )
    payment_method = payload.get("payment_method", "ewallet").lower()
    checkout_url = None

    try:
        prepared_items = []
        total_amount = Decimal("0.00")
        for incoming in cart_items:
            item_id = incoming.get("id", "")
            quantity = int(incoming.get("qty", 1))
            if quantity < 1:
                raise HTTPException(status_code=400, detail="Item quantity must be at least 1.")
            try:
                item_uuid = uuid.UUID(str(item_id).replace("arr-", ""))
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid ID format: {item_id}")

            arrangement = db.query(Arrangement).filter(
                Arrangement.id == item_uuid
            ).with_for_update().first()
            if arrangement:
                if getattr(arrangement, "items", None):
                    for component in arrangement.items:
                        required = component.quantity * quantity
                        inventory = db.query(Inventory).filter(
                            Inventory.product_id == component.product_id
                        ).with_for_update().first()
                        if not inventory or _inventory_stock_for_branch(inventory, raw_branch) < required:
                            raise HTTPException(status_code=400, detail="Insufficient raw materials for custom order.")
                        _deduct_inventory_stock(inventory, required, raw_branch)
                unit_price = Decimal(str(arrangement.estimated_price or 0))
                prepared_items.append(("arrangement", arrangement, quantity, unit_price))
            else:
                product = db.query(Product).filter(Product.id == item_uuid).first()
                inventory = db.query(Inventory).filter(
                    Inventory.product_id == item_uuid
                ).with_for_update().first()
                if not product or not product.is_available or not inventory:
                    raise HTTPException(status_code=404, detail=f"Product unavailable: {item_id}")
                if not _product_supports_branch(product, raw_branch):
                    raise HTTPException(
                        status_code=400,
                        detail=f"{product.name} is not available in the {raw_branch} branch.",
                    )
                active_reserved = _active_reserved_quantity(db, item_uuid, raw_branch)
                available = _inventory_stock_for_branch(inventory, raw_branch) - active_reserved
                if available < quantity:
                    raise HTTPException(status_code=400, detail=f"Insufficient stock. Only {available} available.")
                unit_price = Decimal(str(product.price or 0))
                prepared_items.append(("product", product, quantity, unit_price))

            if unit_price <= 0:
                raise HTTPException(status_code=400, detail=f"Invalid price for item: {item_id}")
            total_amount += unit_price * quantity

        delivery_fee = (
            Decimal(str(delivery_settings["delivery_fee"]))
            if fulfillment_method in {"delivery", "lalamove"}
            else Decimal("0.00")
        )
        minimum_order = Decimal(str(delivery_settings["minimum_order"]))
        if total_amount < minimum_order:
            raise HTTPException(
                status_code=400,
                detail=f"Minimum order is ₱{float(minimum_order):,.2f}.",
            )
        voucher_code = str(payload.get("voucher_code") or payload.get("voucherCode") or "").strip()
        discount_amount = Decimal("0.00")
        normalized_voucher = None
        if voucher_code:
            promo, discount_amount = validate_voucher(db, voucher_code, total_amount)
            normalized_voucher = promo.code

        order = Order(
            id=uuid.uuid4(),
            user_id=current_user.id,
            product_id=None,
            arrangement_id=None,
            quantity=sum(item[2] for item in prepared_items),
            total_amount=total_amount,
            status=OrderStatusEnum.pending_payment,
            delivery_address=delivery_address,
            delivery_lat=delivery_lat,
            delivery_lng=delivery_lng,
            delivery_geocode_precision=delivery_geocode_precision,
            delivery_notes=delivery_notes,
            special_note=payload.get("special_note"),
            scheduled_at=scheduled_at,
            branch_name=raw_branch,
            checkout_attempt_id=attempt_id,
            recipient_first_name=payload.get("customer_name") or (payload.get("recipient") or {}).get("firstName") or payload.get("recipient_first_name"),
            recipient_last_name=(payload.get("recipient") or {}).get("lastName") or payload.get("recipient_last_name"),
            recipient_phone=payload.get("customer_phone") or (payload.get("recipient") or {}).get("phoneNumber") or payload.get("recipient_phone_number"),
            recipient_type=payload.get("recipientType") or payload.get("recipient_type"),
            is_anonymous=bool(payload.get("isAnonymous") or payload.get("is_anonymous")),
            fulfillment_method=fulfillment_method,
            delivery_provider=payload.get("deliveryProvider") or payload.get("delivery_provider"),
            time_slot=payload.get("timeSlot") or payload.get("time_slot") or "anytime",
            subtotal_amount=total_amount,
            delivery_fee=delivery_fee,
            voucher_code=normalized_voucher,
            discount_amount=discount_amount,
        )
        order.total_amount = max(Decimal("0.00"), order.subtotal_amount + order.delivery_fee - order.discount_amount)
        db.add(order)
        db.flush()

        reserved_until = datetime.now(timezone.utc) + timedelta(hours=1)
        incoming_by_id = {
            str(item.get("id")).replace("arr-", ""): item
            for item in cart_items
        }
        for item_type, entity, quantity, unit_price in prepared_items:
            incoming = incoming_by_id.get(str(entity.id), {})
            card_message = str(incoming.get("card_message") or incoming.get("cardMessage") or "").strip() or None
            order_item = OrderItem(
                order_id=order.id,
                product_id=entity.id if item_type == "product" else None,
                arrangement_id=entity.id if item_type == "arrangement" else None,
                quantity=quantity,
                price_at_purchase=unit_price,
                card_message=card_message,
                card_enabled=bool(card_message),
            )
            db.add(order_item)
            db.flush()
            if item_type == "product":
                db.add(StockReservation(
                    order_item_id=order_item.id,
                    product_id=entity.id,
                    quantity=quantity,
                    status="active",
                    reserved_until=reserved_until,
                ))

        try:
            method_enum = PaymentMethodEnum(payment_method)
        except ValueError:
            method_enum = PaymentMethodEnum.ewallet
        is_online = payment_method in {"gcash", "paymaya", "card", "qrph", "paymongo", "ewallet"}
        transaction = Transaction(
            id=uuid.uuid4(),
            order_id=order.id,
            payment_method=method_enum.value,
            total_amount=order.total_amount,
            status=PaymentStatusEnum.pending.value,
            expires_at=reserved_until,
            reference_number=payload.get("payment_reference") or None,
            provider="paymongo" if is_online else "manual",
        )
        db.add(transaction)
        db.flush()

        if payment_method == "gcash":
            reference_number = f"PMO-{secrets.token_hex(6).upper()}"
            checkout = await create_checkout_session(
                cancel_url=payload.get("paymongo_cancel_url") or payload.get("cancel_url"),
                line_items=[{
                    "name": f"Bloomora POS Order ORD-{order.id.hex[:8].upper()}",
                    "amount": to_paymongo_amount(Decimal(order.total_amount)),
                    "currency": "PHP",
                    "quantity": 1,
                }],
                reference_number=reference_number,
                metadata={
                    "order_ids": str(order.id),
                    "user_id": str(current_user.id),
                    "source": "admin_walk_in_pos",
                    "branch": raw_branch,
                    "payment_method": "gcash",
                },
                payment_method_types=["gcash"],
                success_url=payload.get("paymongo_success_url") or payload.get("success_url"),
            )
            checkout_data = checkout.get("data", {})
            checkout_id = checkout_data.get("id")
            checkout_url = checkout_data.get("attributes", {}).get("checkout_url")

            if not checkout_id or not checkout_url:
                raise HTTPException(status_code=502, detail="PayMongo did not return a checkout URL.")

            transaction.provider = "paymongo"
            transaction.provider_checkout_session_id = checkout_id
            transaction.checkout_url = checkout_url
            transaction.reference_number = reference_number

        db.commit()

        if fulfillment_method == "lalamove" or payload.get("delivery_method") == "lalamove":
            try:
                print("Dispatching Lalamove rider...")
                lalamove_res = book_lalamove_delivery(
                    customer_name=f"{current_user.first_name} {current_user.last_name}",

                    customer_phone=current_user.phone_number or "09000000000",
                    dropoff_address=payload.get("delivery_address", ""),
                    dropoff_lat=str(delivery_lat),
                    dropoff_lng=str(delivery_lng),
                )

                # Save the Lalamove IDs back to the order
                order.delivery_provider = "lalamove"
                order.lalamove_order_id = lalamove_res["lalamove_order_id"]
                order.lalamove_share_link = lalamove_res["share_link"]
                order.lalamove_status = lalamove_res["status"]
                order.status = OrderStatusEnum.preparing
                db.commit()
                print(f"Lalamove Order Created: {order.lalamove_order_id}")

            except Exception as e:
                print(f"❌ Lalamove Booking Failed: {str(e)}")
                order.delivery_provider = "lalamove"
                order.lalamove_status = "booking_failed"
                db.commit()
                # Even if Lalamove fails, the order is already placed.
                # You might want to email the staff to book manually.

        return _created_order_response(order)

    except HTTPException:
        db.rollback()
        raise
    except PayMongoError as error:
        db.rollback()
        raise HTTPException(status_code=502, detail=str(error))
    except IntegrityError:
        db.rollback()
        if attempt_id:
            existing_order = db.query(Order).filter(
                Order.user_id == current_user.id,
                Order.checkout_attempt_id == attempt_id,
            ).first()
            if existing_order:
                return _created_order_response(existing_order)
        raise
    except Exception:
        db.rollback()
        raise


def _release_reserved_stock(db: Session, order: Order):
    transaction = order.transaction
    if not transaction or transaction.stock_released_at:
        return
    for item in order.items or []:
        reservation = db.query(StockReservation).filter(
            StockReservation.order_item_id == item.id,
            StockReservation.status == "active",
        ).first()
        if reservation:
            reservation.status = "released"
            reservation.released_at = datetime.now(timezone.utc)
    transaction.stock_released_at = datetime.now(timezone.utc)


def _expire_pending_transaction(db: Session, order: Order):
    transaction = order.transaction
    if not db or not transaction or transaction.status != PaymentStatusEnum.pending:
        return
    if transaction.expires_at and datetime.now(timezone.utc) >= transaction.expires_at:
        transaction.status = PaymentStatusEnum.expired
        order.status = OrderStatusEnum.payment_failed
        _release_reserved_stock(db, order)
        db.commit()


async def create_orders(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart_items = payload.get("items", [])
    delivery_notes = payload.get("delivery_notes", "")
    scheduled_at = payload.get("scheduled_at")
    payment_method = payload.get("payment_method", "qrph").lower()
    special_note = payload.get("special_note", None)
    payment_reference = payload.get("payment_reference", "").strip()
    
    # 🚀 NEW: Walk-in Customer Capture & Fulfillment Method
    fulfillment_method = str(payload.get("fulfillment_method") or payload.get("fulfillmentMethod") or "delivery").lower()
    walk_in_customer_name = payload.get("customer_name", "").strip()
    walk_in_customer_phone = payload.get("customer_phone", "").strip()
    delivery_address = payload.get("delivery_address", "") if fulfillment_method == "delivery" else "PICKUP"
    
    # 🚀 THE TROJAN HORSE EXTRACTION
    raw_branch = payload.get("branch_name") or payload.get("branch")
    if not raw_branch:
        if "[BRANCH:Pampanga]" in delivery_notes:
            raw_branch = "Pampanga"
        elif "[BRANCH:Manila]" in delivery_notes:
            raw_branch = "Manila"
        else:
            raw_branch = "Manila"

    final_branch_name = raw_branch.strip().title()

    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty.")
    
    if payment_method == "qrph" and not payment_reference:
        raise HTTPException(status_code=400, detail="Transaction Reference Number (TRN) is required to verify your payment.")

    created_orders = []
    total_checkout_amount = Decimal("0.00")

    # 🚀 NEW: Dynamic Delivery Fee
    delivery_settings = get_delivery_settings(db)
    delivery_fee = (
        Decimal(str(delivery_settings.get("delivery_fee", 0)))
        if fulfillment_method == "delivery"
        else Decimal("0.00") # Force 0 for pickup/walk-in
    )

    for item in cart_items:
        arrangement_id = None
        product_id = None
        item_id = item.get("id", "")
        qty = int(item.get("qty", 1))

        try:
            clean_id = str(item_id).replace("arr-", "")
            item_uuid = uuid.UUID(clean_id)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid ID format: {item_id}")

        db_price = Decimal("0.00")
        arrangement = db.query(Arrangement).filter(Arrangement.id == item_uuid).with_for_update().first()

        if arrangement:
            if hasattr(arrangement, 'items') and arrangement.items:
                for component in arrangement.items:
                    inv = db.query(Inventory).filter(Inventory.product_id == component.product_id).with_for_update().first()
                    required = component.quantity * qty
                    if not inv or _inventory_stock_for_branch(inv, final_branch_name) < required:
                        raise HTTPException(status_code=400, detail="Insufficient raw materials for custom order.")
                    _deduct_inventory_stock(inv, required, final_branch_name)
                    if inv.current_stock <= 0:
                        prod = db.query(Product).filter(Product.id == component.product_id).first()
                        if prod: prod.is_available = False

            raw_price = getattr(arrangement, 'estimated_price', 0) or 0
            db_price = Decimal(str(raw_price))
            arrangement_id = arrangement.id
            
        else:
            product = db.query(Product).filter(Product.id == item_uuid).first()
            inventory = db.query(Inventory).filter(Inventory.product_id == item_uuid).with_for_update().first()
            
            if not product or not product.is_available or not inventory:
                raise HTTPException(status_code=404, detail=f"Product unavailable: {item_id}")
            branch_stock = _inventory_stock_for_branch(inventory, final_branch_name)
            if branch_stock < qty:
                raise HTTPException(status_code=400, detail=f"Insufficient stock. Only {branch_stock} left.")
            
            _deduct_inventory_stock(inventory, qty, final_branch_name)
            if inventory.current_stock <= 0:
                product.is_available = False
            
            raw_price = getattr(product, 'price', 0) or 0
            db_price = Decimal(str(raw_price))
            product_id = product.id

        if db_price <= 0:
            db_price = Decimal("500.00")

        item_total = db_price * qty
        total_checkout_amount += item_total

        # 🚀 SAVING WALK-IN DETAILS TO THE ORDER
        # For walk-in POS, we overwrite the recipient fields with the captured customer info.
        order = Order(
            id=uuid.uuid4(),
            user_id=current_user.id,
            product_id=product_id,
            arrangement_id=arrangement_id,
            quantity=qty,
            total_amount=item_total, # We will update this with delivery fee later if applicable
            subtotal_amount=item_total,
            status=OrderStatusEnum.pending,
            delivery_address=delivery_address,
            delivery_notes=delivery_notes,
            special_note=special_note,
            scheduled_at=scheduled_at,
            branch_name=final_branch_name, 
            fulfillment_method=fulfillment_method,
            delivery_fee=delivery_fee,
            # If walk_in_customer_name exists, force it into recipient_first_name
            recipient_first_name=walk_in_customer_name if walk_in_customer_name else ((payload.get("recipient") or {}).get("firstName") or payload.get("recipient_first_name")),
            recipient_last_name=(payload.get("recipient") or {}).get("lastName") or payload.get("recipient_last_name"),
            recipient_phone=walk_in_customer_phone if walk_in_customer_phone else ((payload.get("recipient") or {}).get("phoneNumber") or payload.get("recipient_phone_number")),
        )
        
        # Calculate final amount for this specific order record (Total + Fee)
        order.total_amount = max(Decimal("0.00"), order.subtotal_amount + order.delivery_fee - order.discount_amount)

        db.add(order)
        db.commit()
        db.refresh(order)

        try: pm = PaymentMethodEnum(payment_method)
        except ValueError: pm = PaymentMethodEnum.qrph

        is_online_payment = payment_method in ["gcash", "paymaya", "card", "qrph", "paymongo"]

        transaction = Transaction(
            id=uuid.uuid4(),
            order_id=order.id,
            payment_method=pm.value,
            total_amount=order.total_amount,
            status='pending',
            reference_number=payment_reference,
            provider='paymongo' if is_online_payment else 'manual',
        )
        db.add(transaction)
        db.commit()
        created_orders.append(str(order.id))

    # Add the delivery fee to the global PayMongo checkout total ONLY ONCE
    final_paymongo_amount = total_checkout_amount + delivery_fee
    checkout_url = None
    
    if payment_method in ["gcash", "paymaya", "card", "qrph", "paymongo"]:
        try:
            checkout = await create_checkout_session(
                line_items=[{
                    "name": f"Bloomora POS Order ({len(created_orders)} items)",
                    "amount": to_paymongo_amount(final_paymongo_amount), # 🚀 Uses the total + dynamic delivery fee
                    "currency": "PHP",
                    "quantity": 1
                }],
                reference_number=f"PMO-{secrets.token_hex(6).upper()}",
                metadata={
                    "order_ids": ",".join(created_orders),
                    "user_id": str(current_user.id)
                },
                payment_method_types=["gcash", "paymaya", "card", "qrph"]
            )
            
            checkout_data = checkout.get("data", {})
            checkout_id = checkout_data.get("id")
            checkout_url = checkout_data.get("attributes", {}).get("checkout_url")

            db.query(Transaction).filter(
                Transaction.order_id.in_(created_orders)
            ).update(
                {
                    "provider_checkout_session_id": checkout_id,
                    "checkout_url": checkout_url
                }, 
                synchronize_session=False
            )
            db.commit()

        except PayMongoError as error:
            print("❌ PayMongo Generation Error:", str(error))

    return {
        "status": "success",
        "message": f"{len(created_orders)} order(s) created.",
        "order_ids": created_orders,
        "checkout_url": checkout_url 
    }

def _notify_order(db: Session, order: Order, status: str):
    status_messages = {
        "confirmed":        ("Order Confirmed 🌸",        "Your order {num} has been confirmed and is being processed."),
        "preparing":        ("We're Preparing Your Order 🌿", "Your order {num} is now being prepared by our florists."),
        "out_for_delivery": ("On Its Way! 🚚",             "Your order {num} is out for delivery. Expect it soon!"),
        "delivered":        ("Order Delivered 🎉",         "Your order {num} has been delivered. Enjoy your blooms!"),
        "cancelled":        ("Order Cancelled",            "Your order {num} has been cancelled. Contact us if this was a mistake."),
    }

    cfg = status_messages.get(status)
    if not cfg: return

    order_number = f"ORD-{order.id.hex[:8].upper()}"
    title   = cfg[0]
    message = cfg[1].format(num=order_number)

    db.execute(
        text("""
            INSERT INTO notifications (user_id, type, title, message, order_id)
            VALUES (:uid, 'order', :title, :message, :oid)
        """),
        {
            "uid":     str(order.user_id),
            "title":   title,
            "message": message,
            "oid":     str(order.id),
        }
    )
    db.commit()

    pref = db.execute(
        text("SELECT order_updates FROM user_notification_preferences WHERE user_id = :uid"),
        {"uid": str(order.user_id)}
    ).fetchone()

    if pref is None or pref.order_updates:
        send_order_status_email(
            to_email=order.user.email,
            first_name=order.user.first_name or "there",
            order_number=order_number,
            status=status,
            message=message,
        )

@router.post("/{order_id}/pay", response_model=dict)
def confirm_payment(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try: order_uuid = uuid.UUID(order_id)
    except ValueError: raise HTTPException(status_code=400, detail="Invalid order ID")

    order = db.query(Order).filter(Order.id == order_uuid).first()
    if not order: raise HTTPException(status_code=404, detail="Order not found")

    if order.user_id != current_user.id: raise HTTPException(status_code=403, detail="Not authorized")
    if not order.transaction: raise HTTPException(status_code=400, detail="No transaction found for this order")
    if order.transaction.status == PaymentStatusEnum.paid: raise HTTPException(status_code=400, detail="Payment already confirmed")

    order.transaction.status = PaymentStatusEnum.paid
    order.status = OrderStatusEnum.confirmed
    db.commit()
    db.refresh(order)
    db.refresh(order.transaction)

    _notify_order(db, order, "confirmed")

    return {
        "status": "success",
        "message": "Payment confirmed successfully",
        "order_id": str(order.id),
        "order_number": f"ORD-{order.id.hex[:8].upper()}",
        "payment_status": order.transaction.status.value if hasattr(order.transaction.status, "value") else order.transaction.status,
        "order_status": order.status.value if hasattr(order.status, "value") else order.status,
    }

@router.get("/transactions", response_model=List[dict])
def list_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    transactions = db.query(Transaction, Order, User).join(Order).join(User, Order.user_id == User.id).all()

    def transaction_customer_name(order: Order, user: User) -> str:
        is_pos_order = "pos transaction" in str(getattr(order, "delivery_notes", "") or "").lower()
        recipient_name = " ".join(
            value for value in [
                str(getattr(order, "recipient_first_name", "") or "").strip(),
                str(getattr(order, "recipient_last_name", "") or "").strip(),
            ]
            if value
        ).strip()
        if is_pos_order and recipient_name:
            return recipient_name
        return f"{user.first_name} {user.last_name}".strip() or user.email or "Guest"
    
    return [
        {
            "id": str(t.Transaction.id),
            "order_number": f"ORD-{t.Order.id.hex[:8].upper()}",
            "customer_name": transaction_customer_name(t.Order, t.User),
            "is_walk_in_pos": "pos transaction" in str(getattr(t.Order, "delivery_notes", "") or "").lower(),
            "type": "Sale", 
            "method": t.Transaction.payment_method.value if hasattr(t.Transaction.payment_method, 'value') else t.Transaction.payment_method,
            "payment_provider": t.Transaction.provider,
            "status": t.Transaction.status.value if hasattr(t.Transaction.status, 'value') else t.Transaction.status,
            
            # 🚀 UPDATED: Prioritizes PayMongo ID, falls back to manual reference
            "trn": getattr(t.Transaction, 'provider_checkout_session_id', None) or t.Transaction.reference_number, 
            
            "created_at": t.Transaction.created_at.isoformat()
        }
        for t in transactions
    ]
    
@router.get("/admin/settings/lalamove")
def get_lalamove_setting(db: Session = Depends(get_db)):
    query = text("SELECT setting_value FROM store_settings WHERE setting_key = 'lalamove_enabled'")
    result = db.execute(query).fetchone()
    # Default to False if not set
    if result and result[0] == "true":
        return {"enabled": True}
    return {"enabled": False}

@router.post("/admin/settings/lalamove")
def save_lalamove_setting(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    enabled = str(payload.get("enabled", False)).lower()
    query = text("""
        INSERT INTO store_settings (setting_key, setting_value, updated_at)
        VALUES ('lalamove_enabled', :val, now())
        ON CONFLICT (setting_key) DO UPDATE
        SET setting_value = EXCLUDED.setting_value, updated_at = now()
    """)
    db.execute(query, {"val": enabled})
    db.commit()
    return {"status": "success", "enabled": enabled == "true"}

# In app/api/v1/routes/orders.py
@router.patch("/{order_id}/force-status")
def force_order_status(
    order_id: str,
    payload: dict = Body(...), # Receive a simple dict
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    status = payload.get("status")
    order = db.query(Order).filter(Order.id == uuid.UUID(order_id)).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    allowed_manual_statuses = {
        "confirmed": OrderStatusEnum.confirmed,
        "preparing": OrderStatusEnum.preparing,
        "ready_for_pickup": OrderStatusEnum.ready_for_pickup,
        "cancelled": OrderStatusEnum.cancelled,
    }

    if status == "paid":
        order.status = OrderStatusEnum.paid
        if order.transaction:
            order.transaction.status = PaymentStatusEnum.paid.value
        _convert_reservations(db, order) 
        _increment_sold_count(db, order)
    elif status in allowed_manual_statuses:
        if status == "ready_for_pickup":
            payment_status = order.transaction.status if order.transaction else None
            if payment_status != PaymentStatusEnum.paid:
                raise HTTPException(status_code=400, detail="Only paid orders can be marked ready for pickup.")
        order.status = allowed_manual_statuses[status]
    else:
        raise HTTPException(
            status_code=400,
            detail="Select confirmed, preparing, ready_for_pickup, or cancelled from Orders. Delivery statuses are managed in the delivery module.",
        )
        
    db.commit()
    return {"status": "success", "new_status": order.status}
