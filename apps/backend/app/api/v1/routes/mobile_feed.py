import base64
import hashlib
import json
import math
import re
import uuid
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_staff
from app.core.security import decode_token
from app.models import (
    Campaign,
    CampaignReaction,
    FeedEvent,
    FeedPlacement,
    Inventory,
    Product,
    ProductFeedControl,
    PromoCode,
    Review,
    User,
    WishlistItem,
)


router = APIRouter(prefix="/mobile-feed", tags=["Mobile Feed"])
optional_bearer = HTTPBearer(auto_error=False)
TABS = {"explore", "new", "for-you"}
BRANCHES = {"all", "manila", "pampanga"}
BOOSTS = {"none": 0.0, "low": 0.05, "medium": 0.10, "high": 0.15}
EVENT_TYPES = {"impression", "open", "cta", "share", "like", "add_to_cart", "voucher_copy"}
FEED_SCHEMA_VERSION = 2
FOR_YOU_SENSITIVE_TERMS = {
    "buffet",
    "ceramic vase",
    "condolence",
    "congratulation stand",
    "event",
    "funeral",
    "funerary",
    "inaugural",
    "memorial",
    "opening",
    "pot",
    "reception",
    "standing arrangement",
    "sympathy",
    "tabletop arrangement",
    "urn",
    "vase",
    "vertical arrangement",
    "wreath",
    "wreath arrangement",
}
FOR_YOU_GIFT_TERMS = {"accessory", "add on", "add-on", "addon", "chocolate", "gift"}


class CampaignPayload(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    campaign_key: str = Field(min_length=1, max_length=50)
    start_at: datetime
    end_at: Optional[datetime] = None
    status: Literal["draft", "published"] = "draft"
    is_active: bool = True
    branches: list[Literal["all", "manila", "pampanga"]] = ["all"]
    accessible_title: Optional[str] = Field(default=None, max_length=160)
    description: Optional[str] = None
    badge: Optional[str] = Field(default=None, max_length=80)
    cta_label: Optional[str] = Field(default=None, max_length=80)
    cta_destination: Optional[str] = Field(default=None, max_length=500)
    web_banner_url: Optional[str] = None
    mobile_banner_url: Optional[str] = None
    feed_media_type: Literal["image", "video"] = "image"
    feed_media_url: Optional[str] = None
    feed_poster_url: Optional[str] = None
    voucher_id: Optional[uuid.UUID] = None
    linked_product_id: Optional[uuid.UUID] = None


class CampaignPostPayload(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    description: Optional[str] = None
    badge: Optional[str] = Field(default=None, max_length=80)
    cta_label: Optional[str] = Field(default=None, max_length=80)
    media_type: Literal["image", "video"] = "image"
    media_url: str = Field(min_length=1, max_length=2000)
    poster_url: Optional[str] = None
    publish_mode: Literal["draft", "now", "scheduled"] = "draft"
    scheduled_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    action_type: Literal["none", "shop", "product", "voucher"] = "none"
    target_id: Optional[uuid.UUID] = None
    branch: Literal["all", "manila", "pampanga"] = "all"
    tab: Literal["explore", "new", "for-you"] = "new"
    priority: Literal["standard", "featured"] = "standard"
    web_banner_url: Optional[str] = None
    mobile_banner_url: Optional[str] = None


class PlacementPayload(BaseModel):
    tab: Literal["explore", "new", "for-you"]
    branch: Literal["all", "manila", "pampanga"] = "all"
    slot: int = Field(ge=1, le=100)


class FeedControlPayload(BaseModel):
    branch: Literal["all", "manila", "pampanga"] = "all"
    is_hidden: bool = False
    boost_level: Literal["none", "low", "medium", "high"] = "none"
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None


class ReactionPayload(BaseModel):
    installation_id: Optional[str] = Field(default=None, min_length=8, max_length=120)


class WishlistMergePayload(BaseModel):
    product_ids: list[uuid.UUID] = Field(default_factory=list, max_length=500)


class AnalyticsEventPayload(BaseModel):
    event_type: str
    item_type: Literal["product", "promotion"]
    item_id: str = Field(min_length=1, max_length=120)
    tab: Literal["explore", "new", "for-you"]
    branch: Literal["all", "manila", "pampanga"]
    installation_id: Optional[str] = Field(default=None, max_length=120)
    session_id: Optional[str] = Field(default=None, max_length=120)
    metadata: dict[str, Any] = Field(default_factory=dict)


class AnalyticsBatchPayload(BaseModel):
    events: list[AnalyticsEventPayload] = Field(min_length=1, max_length=100)


def _optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_bearer),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload:
        return None
    return db.query(User).filter(User.id == payload.get("sub"), User.is_active.is_(True)).first()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _encode_cursor(offset: int) -> str:
    return base64.urlsafe_b64encode(json.dumps({"offset": offset}).encode()).decode().rstrip("=")


def _decode_cursor(cursor: Optional[str]) -> int:
    if not cursor:
        return 0
    try:
        padding = "=" * (-len(cursor) % 4)
        payload = json.loads(base64.urlsafe_b64decode(cursor + padding))
        return max(int(payload.get("offset", 0)), 0)
    except (ValueError, TypeError, json.JSONDecodeError):
        raise HTTPException(status_code=400, detail="Invalid feed cursor.")


def _campaign_state(campaign: Campaign, now: Optional[datetime] = None) -> str:
    now = now or _now()
    if campaign.status == "draft" or not campaign.is_active:
        return "draft"
    if campaign.start_at > now:
        return "scheduled"
    if campaign.end_at and campaign.end_at < now:
        return "expired"
    return "active"


def _serialize_campaign(campaign: Campaign, db: Session) -> dict:
    placements = (
        db.query(FeedPlacement)
        .filter(FeedPlacement.campaign_id == campaign.id)
        .order_by(FeedPlacement.tab, FeedPlacement.branch, FeedPlacement.slot)
        .all()
    )
    voucher = db.query(PromoCode).filter(PromoCode.id == campaign.voucher_id).first() if campaign.voucher_id else None
    like_count = db.query(func.count(CampaignReaction.id)).filter(CampaignReaction.campaign_id == campaign.id).scalar() or 0
    return {
        "id": str(campaign.id),
        "name": campaign.name,
        "campaign_key": campaign.campaign_key,
        "start_at": campaign.start_at.isoformat(),
        "end_at": campaign.end_at.isoformat() if campaign.end_at else None,
        "status": campaign.status,
        "state": _campaign_state(campaign),
        "is_active": campaign.is_active,
        "branches": campaign.branches or ["all"],
        "accessible_title": campaign.accessible_title,
        "description": campaign.description,
        "badge": campaign.badge,
        "cta_label": campaign.cta_label,
        "cta_destination": campaign.cta_destination,
        "web_banner_url": campaign.web_banner_url,
        "mobile_banner_url": campaign.mobile_banner_url,
        "feed_media_type": campaign.feed_media_type or "image",
        "feed_media_url": campaign.feed_media_url,
        "feed_poster_url": campaign.feed_poster_url,
        "voucher_id": str(campaign.voucher_id) if campaign.voucher_id else None,
        "voucher": {
            "id": str(voucher.id),
            "code": voucher.code,
            "is_active": voucher.is_active,
            "expires_at": voucher.expires_at.isoformat() if voucher.expires_at else None,
        } if voucher else None,
        "linked_product_id": str(campaign.linked_product_id) if campaign.linked_product_id else None,
        "like_count": like_count,
        "placements": [
            {"id": str(p.id), "tab": p.tab, "branch": p.branch, "slot": p.slot}
            for p in placements
        ],
    }


def _campaign_key(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:34] or "feed-post"
    return f"{slug}-{uuid.uuid4().hex[:8]}"


def _post_action(
    db: Session,
    payload: CampaignPostPayload,
) -> tuple[Optional[str], Optional[uuid.UUID], Optional[uuid.UUID]]:
    if payload.action_type == "none":
        return None, None, None
    if payload.action_type == "shop":
        return "/categories", None, None
    if not payload.target_id:
        raise HTTPException(status_code=400, detail="Select a product or voucher for this action.")
    if payload.action_type == "product":
        product = db.query(Product).filter(Product.id == payload.target_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Selected product was not found.")
        return f"/product-details?id={product.id}", product.id, None
    voucher = db.query(PromoCode).filter(PromoCode.id == payload.target_id).first()
    if not voucher:
        raise HTTPException(status_code=404, detail="Selected voucher was not found.")
    return "/promotions", None, voucher.id


def _post_schedule(payload: CampaignPostPayload) -> tuple[datetime, Optional[datetime], str, bool]:
    now = _now()
    if payload.publish_mode == "scheduled":
        if not payload.scheduled_at:
            raise HTTPException(status_code=400, detail="Choose when this post should be published.")
        if payload.scheduled_at <= now:
            raise HTTPException(status_code=400, detail="Scheduled time must be in the future.")
        start_at = payload.scheduled_at
        status = "published"
    else:
        start_at = now
        status = "published" if payload.publish_mode == "now" else "draft"
    if payload.end_at and payload.end_at <= start_at:
        raise HTTPException(status_code=400, detail="Expiration must be after the publish time.")
    return start_at, payload.end_at, status, True


def _next_feed_slot(
    db: Session,
    *,
    campaign_id: Optional[uuid.UUID],
    tab: str,
    branch: str,
    start_at: datetime,
    end_at: Optional[datetime],
    priority: str,
) -> int:
    filters = [
        FeedPlacement.tab == tab,
        FeedPlacement.branch == branch,
        Campaign.status == "published",
        Campaign.is_active.is_(True),
        or_(Campaign.end_at.is_(None), Campaign.end_at > start_at),
    ]
    if campaign_id:
        filters.append(FeedPlacement.campaign_id != campaign_id)
    if end_at:
        filters.append(Campaign.start_at < end_at)
    occupied = {
        row[0]
        for row in (
            db.query(FeedPlacement.slot)
            .join(Campaign, Campaign.id == FeedPlacement.campaign_id)
            .filter(*filters)
            .all()
        )
    }
    slot = 1 if priority == "featured" else max(occupied, default=0) + 1
    while slot in occupied:
        slot += 1
    return slot


def _apply_post(
    db: Session,
    payload: CampaignPostPayload,
    campaign: Optional[Campaign] = None,
) -> Campaign:
    start_at, end_at, status, is_active = _post_schedule(payload)
    cta_destination, linked_product_id, voucher_id = _post_action(db, payload)
    if payload.media_type == "video" and not payload.poster_url:
        raise HTTPException(status_code=400, detail="Video posts require a poster image.")

    values = {
        "name": payload.title,
        "accessible_title": payload.title,
        "description": payload.description,
        "badge": payload.badge,
        "cta_label": payload.cta_label,
        "cta_destination": cta_destination,
        "start_at": start_at,
        "end_at": end_at,
        "status": status,
        "is_active": is_active,
        "branches": [payload.branch],
        "web_banner_url": payload.web_banner_url,
        "mobile_banner_url": payload.mobile_banner_url,
        "feed_media_type": payload.media_type,
        "feed_media_url": payload.media_url,
        "feed_poster_url": payload.poster_url,
        "voucher_id": voucher_id,
        "linked_product_id": linked_product_id,
    }
    if campaign is None:
        campaign = Campaign(campaign_key=_campaign_key(payload.title), **values)
        db.add(campaign)
        db.flush()
    else:
        for key, value in values.items():
            setattr(campaign, key, value)

    slot = _next_feed_slot(
        db,
        campaign_id=campaign.id,
        tab=payload.tab,
        branch=payload.branch,
        start_at=start_at,
        end_at=end_at,
        priority=payload.priority,
    )
    placement = (
        db.query(FeedPlacement)
        .filter(FeedPlacement.campaign_id == campaign.id)
        .order_by(FeedPlacement.created_at)
        .first()
    )
    if placement:
        placement.tab = payload.tab
        placement.branch = payload.branch
        placement.slot = slot
        db.query(FeedPlacement).filter(
            FeedPlacement.campaign_id == campaign.id,
            FeedPlacement.id != placement.id,
        ).delete(synchronize_session=False)
    else:
        db.add(FeedPlacement(campaign_id=campaign.id, tab=payload.tab, branch=payload.branch, slot=slot))
    return campaign


def _branch_stock(product: Product, branch: str) -> int:
    inventory = product.inventory
    if not inventory:
        return 0
    if branch == "manila":
        return int(inventory.stock_manila or 0)
    if branch == "pampanga":
        return int(inventory.stock_pampanga or 0)
    return int(inventory.current_stock or 0)


def _product_matches_branch(product: Product, branch: str) -> bool:
    branches = [str(value).lower() for value in (product.branches or [])]
    return not branches or branch == "all" or branch in branches or "all" in branches


def _active_control(controls: list[ProductFeedControl], branch: str, now: datetime) -> Optional[ProductFeedControl]:
    candidates = [c for c in controls if c.branch in {"all", branch}]
    candidates.sort(key=lambda c: c.branch == branch, reverse=True)
    for control in candidates:
        if control.start_at and control.start_at > now:
            continue
        if control.end_at and control.end_at < now:
            continue
        return control
    return None


def _normalize(value: float, maximum: float) -> float:
    return value / maximum if maximum > 0 else 0.0


def _normalized_product_terms(product: Product) -> list[str]:
    raw_values: list[Any] = [
        product.category,
        product.product_group,
        product.product_type,
        product.name,
        product.description,
    ]
    raw_values.extend(product.tags or [])
    raw_values.extend(product.occasions or [])
    return [str(value).strip().lower() for value in raw_values if str(value or "").strip()]


def _for_you_product_bucket(product: Product) -> Optional[int]:
    terms = _normalized_product_terms(product)
    haystack = " ".join(terms)
    if any(term in haystack for term in FOR_YOU_SENSITIVE_TERMS):
        return None
    if product.category and str(product.category).strip().lower() == "bouquet":
        return 0
    if "bouquet" in terms or "bouquet" in haystack:
        return 0
    if any(term in haystack for term in FOR_YOU_GIFT_TERMS):
        return 1
    return None


def _product_tie_breaker(
    tab: str,
    branch: str,
    product_id: uuid.UUID,
    created_at: Optional[datetime],
    user_id: Optional[uuid.UUID] = None,
) -> int | float:
    if tab == "new":
        return -(created_at.timestamp() if created_at else 0)
    actor_seed = str(user_id) if user_id and tab == "for-you" else branch
    digest = hashlib.sha256(f"{tab}:{actor_seed}:{product_id}".encode()).hexdigest()
    return int(digest[:12], 16)


def _rank_products(
    db: Session,
    tab: str,
    branch: str,
    user: Optional[User],
) -> list[dict]:
    now = _now()
    products = (
        db.query(Product)
        .options(joinedload(Product.inventory))
        .filter(
            Product.is_available.is_(True),
            Product.is_visible.is_(True),
            Product.status != "inactive",
        )
        .all()
    )
    rating_rows = (
        db.query(Review.product_id, func.avg(Review.star_rating), func.count(Review.id))
        .group_by(Review.product_id)
        .all()
    )
    ratings = {product_id: (float(avg or 0), int(count or 0)) for product_id, avg, count in rating_rows}
    wishlist_ids: set[uuid.UUID] = set()
    preferred_categories: Counter[str] = Counter()
    if user:
        wishlist_rows = (
            db.query(WishlistItem.product_id, Product.category)
            .join(Product, Product.id == WishlistItem.product_id)
            .filter(WishlistItem.user_id == user.id)
            .all()
        )
        wishlist_ids = {row[0] for row in wishlist_rows}
        preferred_categories.update(str(row[1]).lower() for row in wishlist_rows if row[1])

    eligible: list[Product] = []
    for product in products:
        if not _product_matches_branch(product, branch) or _branch_stock(product, branch) <= 0:
            continue
        if product.limited_start_at and product.limited_start_at > now:
            continue
        if product.limited_end_at and product.limited_end_at < now:
            continue
        if tab == "for-you" and _for_you_product_bucket(product) is None:
            continue
        eligible.append(product)

    max_sold = max((int(product.sold_count or 0) for product in eligible), default=0)
    scored: list[tuple[int, float, int | float, str, Product]] = []
    for product in eligible:
        rating, review_count = ratings.get(product.id, (0.0, 0))
        sold_score = _normalize(float(product.sold_count or 0), float(max_sold))
        rating_score = rating / 5 if rating else 0
        age_days = max((now - product.created_at).total_seconds() / 86400, 0) if product.created_at else 365
        recency = math.exp(-age_days / 30)
        category_affinity = 1.0 if str(product.category).lower() in preferred_categories else 0.0
        wished = 1.0 if product.id in wishlist_ids else 0.0
        if tab == "new":
            base_score = recency * 0.65 + sold_score * 0.20 + rating_score * 0.15
        elif tab == "for-you":
            base_score = category_affinity * 0.40 + sold_score * 0.28 + rating_score * 0.22 + recency * 0.10
            if not user or not preferred_categories:
                base_score = sold_score * 0.55 + rating_score * 0.25 + recency * 0.20
        else:
            base_score = sold_score * 0.48 + rating_score * 0.32 + recency * 0.20
        score = base_score
        feed_bucket = _for_you_product_bucket(product) if tab == "for-you" else 0
        tie_breaker = _product_tie_breaker(
            tab,
            branch,
            product.id,
            product.created_at,
            user.id if user else None,
        )
        scored.append((feed_bucket or 0, score, tie_breaker, str(product.id), product))

    scored.sort(key=lambda item: (item[0], -item[1], item[2], item[3]))
    result = []
    for _, score, _, _, product in scored:
        rating, review_count = ratings.get(product.id, (0.0, 0))
        stock = _branch_stock(product, branch)
        result.append({
            "type": "product",
            "id": str(product.id),
            "score": round(score, 5),
            "product": {
                "id": str(product.id),
                "name": product.name,
                "description": product.description,
                "price": float(product.price or 0),
                "original_price": float(product.original_price) if product.original_price else None,
                "category": product.category,
                "product_group": product.product_group,
                "product_type": product.product_type,
                "tags": product.tags or [],
                "image_url": product.image_url,
                "stock": stock,
                "rating": round(rating, 1),
                "review_count": review_count,
                "is_new": bool(product.created_at and (now - product.created_at).days <= 30),
                "is_wishlisted": product.id in wishlist_ids,
                "boost_level": "none",
            },
        })
    return result


def _promotion_items(db: Session, tab: str, branch: str, user: Optional[User]) -> list[tuple[int, dict]]:
    now = _now()
    placements = (
        db.query(FeedPlacement)
        .join(Campaign, Campaign.id == FeedPlacement.campaign_id)
        .filter(
            FeedPlacement.tab == tab,
            FeedPlacement.branch.in_(["all", branch]),
            Campaign.status == "published",
            Campaign.is_active.is_(True),
            Campaign.start_at <= now,
            or_(Campaign.end_at.is_(None), Campaign.end_at >= now),
            Campaign.feed_media_url.isnot(None),
        )
        .order_by(FeedPlacement.slot, FeedPlacement.branch.desc(), Campaign.start_at.desc())
        .all()
    )
    selected_slots: set[int] = set()
    result: list[tuple[int, dict]] = []
    for placement in placements:
        if placement.slot in selected_slots:
            continue
        campaign = db.query(Campaign).filter(Campaign.id == placement.campaign_id).first()
        branches = [str(value).lower() for value in (campaign.branches or ["all"])]
        if "all" not in branches and branch not in branches:
            continue
        selected_slots.add(placement.slot)
        like_count = db.query(func.count(CampaignReaction.id)).filter(CampaignReaction.campaign_id == campaign.id).scalar() or 0
        actor_key = f"user:{user.id}" if user else None
        is_liked = bool(
            actor_key
            and db.query(CampaignReaction.id)
            .filter(CampaignReaction.campaign_id == campaign.id, CampaignReaction.actor_key == actor_key)
            .first()
        )
        voucher = db.query(PromoCode).filter(PromoCode.id == campaign.voucher_id).first() if campaign.voucher_id else None
        linked_product = (
            db.query(Product).options(joinedload(Product.inventory)).filter(Product.id == campaign.linked_product_id).first()
            if campaign.linked_product_id else None
        )
        result.append((placement.slot, {
            "type": "promotion",
            "id": str(campaign.id),
            "promotion": {
                "id": str(campaign.id),
                "title": campaign.accessible_title or campaign.name,
                "description": campaign.description,
                "badge": campaign.badge,
                "cta_label": campaign.cta_label,
                "cta_destination": campaign.cta_destination,
                "media_type": campaign.feed_media_type or "image",
                "media_url": campaign.feed_media_url,
                "poster_url": campaign.feed_poster_url,
                "like_count": like_count,
                "is_liked": is_liked,
                "voucher_code": voucher.code if voucher and voucher.is_active else None,
                "linked_product_id": str(linked_product.id) if linked_product else None,
                "can_add_to_cart": bool(
                    linked_product
                    and linked_product.is_available
                    and linked_product.is_visible
                    and _branch_stock(linked_product, branch) > 0
                ),
            },
        }))
    return result


def _assemble_feed(db: Session, tab: str, branch: str, user: Optional[User]) -> list[dict]:
    return _rank_products(db, tab, branch, user)


@router.get("")
def get_mobile_feed(
    tab: str = Query("explore"),
    branch: str = Query("manila"),
    cursor: Optional[str] = None,
    limit: int = Query(10, ge=1, le=30),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(_optional_user),
):
    if tab not in TABS or branch not in BRANCHES:
        raise HTTPException(status_code=400, detail="Invalid feed tab or branch.")
    offset = _decode_cursor(cursor)
    all_items = _assemble_feed(db, tab, branch, user)
    items = all_items[offset:offset + limit]
    next_offset = offset + len(items)
    return {
        "schema_version": FEED_SCHEMA_VERSION,
        "items": items,
        "next_cursor": _encode_cursor(next_offset) if next_offset < len(all_items) else None,
        "tab": tab,
        "branch": branch,
    }


@router.get("/banner")
def get_mobile_banner(
    branch: str = Query("manila"),
    db: Session = Depends(get_db),
):
    if branch not in BRANCHES:
        raise HTTPException(status_code=400, detail="Invalid branch.")
    now = _now()
    campaigns = (
        db.query(Campaign)
        .filter(
            Campaign.status == "published",
            Campaign.is_active.is_(True),
            Campaign.start_at <= now,
            or_(Campaign.end_at.is_(None), Campaign.end_at >= now),
            Campaign.mobile_banner_url.isnot(None),
        )
        .order_by(Campaign.start_at.desc())
        .all()
    )
    campaign = next(
        (
            item for item in campaigns
            if "all" in [str(value).lower() for value in (item.branches or ["all"])]
            or branch in [str(value).lower() for value in (item.branches or [])]
        ),
        None,
    )
    return {
        "banner": {
            "campaign_id": str(campaign.id),
            "title": campaign.accessible_title or campaign.name,
            "image_url": campaign.mobile_banner_url,
            "cta_label": campaign.cta_label,
            "cta_destination": campaign.cta_destination,
        } if campaign else None,
    }


@router.get("/admin/preview")
def preview_mobile_feed(
    tab: str = Query("explore"),
    branch: str = Query("manila"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    if tab not in TABS or branch not in BRANCHES:
        raise HTTPException(status_code=400, detail="Invalid feed tab or branch.")
    return {"items": _assemble_feed(db, tab, branch, None)[:limit], "tab": tab, "branch": branch}


@router.get("/admin/campaigns")
def list_feed_campaigns(db: Session = Depends(get_db), _: User = Depends(require_staff)):
    campaigns = db.query(Campaign).order_by(Campaign.start_at.desc()).all()
    return [_serialize_campaign(campaign, db) for campaign in campaigns]


@router.post("/admin/posts", status_code=201)
def create_feed_post(
    payload: CampaignPostPayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    campaign = _apply_post(db, payload)
    db.commit()
    db.refresh(campaign)
    return _serialize_campaign(campaign, db)


@router.put("/admin/posts/{campaign_id}")
def update_feed_post(
    campaign_id: uuid.UUID,
    payload: CampaignPostPayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    campaign = _apply_post(db, payload, campaign)
    db.commit()
    db.refresh(campaign)
    return _serialize_campaign(campaign, db)


@router.post("/admin/campaigns", status_code=201)
def create_feed_campaign(
    payload: CampaignPayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    if payload.end_at and payload.end_at <= payload.start_at:
        raise HTTPException(status_code=400, detail="Campaign end must be after its start.")
    if db.query(Campaign).filter(Campaign.campaign_key == payload.campaign_key).first():
        raise HTTPException(status_code=409, detail="Campaign key already exists.")
    campaign = Campaign(**payload.model_dump())
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return _serialize_campaign(campaign, db)


@router.put("/admin/campaigns/{campaign_id}")
def update_feed_campaign(
    campaign_id: uuid.UUID,
    payload: CampaignPayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    clash = db.query(Campaign).filter(
        Campaign.campaign_key == payload.campaign_key,
        Campaign.id != campaign_id,
    ).first()
    if clash:
        raise HTTPException(status_code=409, detail="Campaign key already exists.")
    if payload.end_at and payload.end_at <= payload.start_at:
        raise HTTPException(status_code=400, detail="Campaign end must be after its start.")
    for key, value in payload.model_dump().items():
        setattr(campaign, key, value)
    db.commit()
    db.refresh(campaign)
    return _serialize_campaign(campaign, db)


@router.delete("/admin/campaigns/{campaign_id}")
def delete_feed_campaign(
    campaign_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    db.delete(campaign)
    db.commit()
    return {"status": "success"}


@router.put("/admin/campaigns/{campaign_id}/placement")
def set_feed_placement(
    campaign_id: uuid.UUID,
    payload: PlacementPayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    overlap_filters = [
        FeedPlacement.campaign_id != campaign_id,
        FeedPlacement.tab == payload.tab,
        FeedPlacement.branch == payload.branch,
        FeedPlacement.slot == payload.slot,
        Campaign.status == "published",
        Campaign.is_active.is_(True),
        or_(Campaign.end_at.is_(None), Campaign.end_at > campaign.start_at),
    ]
    if campaign.end_at:
        overlap_filters.append(Campaign.start_at < campaign.end_at)
    overlap = (
        db.query(FeedPlacement)
        .join(Campaign, Campaign.id == FeedPlacement.campaign_id)
        .filter(*overlap_filters)
        .first()
    )
    if overlap:
        raise HTTPException(status_code=409, detail="Another active campaign already owns that feed slot.")
    placement = db.query(FeedPlacement).filter(
        FeedPlacement.campaign_id == campaign_id,
        FeedPlacement.tab == payload.tab,
        FeedPlacement.branch == payload.branch,
    ).first()
    if placement:
        placement.slot = payload.slot
    else:
        placement = FeedPlacement(campaign_id=campaign_id, **payload.model_dump())
        db.add(placement)
    db.commit()
    return _serialize_campaign(campaign, db)


@router.delete("/admin/placements/{placement_id}")
def delete_feed_placement(
    placement_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    placement = db.query(FeedPlacement).filter(FeedPlacement.id == placement_id).first()
    if not placement:
        raise HTTPException(status_code=404, detail="Placement not found.")
    db.delete(placement)
    db.commit()
    return {"status": "success"}


@router.get("/admin/product-controls")
def list_product_controls(
    branch: str = Query("all"),
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    products = db.query(Product).options(joinedload(Product.inventory)).order_by(Product.name).all()
    controls = db.query(ProductFeedControl).filter(ProductFeedControl.branch.in_(["all", branch])).all()
    by_product = {(control.product_id, control.branch): control for control in controls}
    return [{
        "product_id": str(product.id),
        "name": product.name,
        "category": product.category,
        "image_url": product.image_url,
        "branches": product.branches or [],
        "control": {
            "branch": (by_product.get((product.id, branch)) or by_product.get((product.id, "all"))).branch,
            "is_hidden": (by_product.get((product.id, branch)) or by_product.get((product.id, "all"))).is_hidden,
            "boost_level": (by_product.get((product.id, branch)) or by_product.get((product.id, "all"))).boost_level,
        } if (by_product.get((product.id, branch)) or by_product.get((product.id, "all"))) else None,
    } for product in products]


@router.put("/admin/products/{product_id}/control")
def set_product_control(
    product_id: uuid.UUID,
    payload: FeedControlPayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    if payload.start_at and payload.end_at and payload.end_at <= payload.start_at:
        raise HTTPException(status_code=400, detail="Control end must be after its start.")
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    control = db.query(ProductFeedControl).filter(
        ProductFeedControl.product_id == product_id,
        ProductFeedControl.branch == payload.branch,
    ).first()
    if not control:
        control = ProductFeedControl(product_id=product_id, **payload.model_dump())
        db.add(control)
    else:
        for key, value in payload.model_dump().items():
            setattr(control, key, value)
    db.commit()
    return {"status": "success", "product_id": str(product_id), **payload.model_dump()}


def _reaction_actor(user: Optional[User], installation_id: Optional[str]) -> str:
    if user:
        return f"user:{user.id}"
    if installation_id:
        return f"install:{installation_id}"
    raise HTTPException(status_code=400, detail="An installation ID is required for guest reactions.")


@router.put("/campaigns/{campaign_id}/like")
def like_campaign(
    campaign_id: uuid.UUID,
    payload: ReactionPayload,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(_optional_user),
):
    if not db.query(Campaign.id).filter(Campaign.id == campaign_id).first():
        raise HTTPException(status_code=404, detail="Campaign not found.")
    actor_key = _reaction_actor(user, payload.installation_id)
    reaction = db.query(CampaignReaction).filter(
        CampaignReaction.campaign_id == campaign_id,
        CampaignReaction.actor_key == actor_key,
    ).first()
    if not reaction:
        db.add(CampaignReaction(
            campaign_id=campaign_id,
            user_id=user.id if user else None,
            installation_id=None if user else payload.installation_id,
            actor_key=actor_key,
        ))
        db.commit()
    count = db.query(func.count(CampaignReaction.id)).filter(CampaignReaction.campaign_id == campaign_id).scalar() or 0
    return {"is_liked": True, "like_count": count}


@router.delete("/campaigns/{campaign_id}/like")
def unlike_campaign(
    campaign_id: uuid.UUID,
    installation_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(_optional_user),
):
    actor_key = _reaction_actor(user, installation_id)
    db.query(CampaignReaction).filter(
        CampaignReaction.campaign_id == campaign_id,
        CampaignReaction.actor_key == actor_key,
    ).delete(synchronize_session=False)
    db.commit()
    count = db.query(func.count(CampaignReaction.id)).filter(CampaignReaction.campaign_id == campaign_id).scalar() or 0
    return {"is_liked": False, "like_count": count}


@router.get("/wishlist")
def list_wishlist(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ids = db.query(WishlistItem.product_id).filter(WishlistItem.user_id == user.id).all()
    return {"product_ids": [str(row[0]) for row in ids]}


@router.put("/wishlist/{product_id}")
def add_wishlist_item(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not db.query(Product.id).filter(Product.id == product_id).first():
        raise HTTPException(status_code=404, detail="Product not found.")
    exists = db.query(WishlistItem.id).filter(
        WishlistItem.user_id == user.id,
        WishlistItem.product_id == product_id,
    ).first()
    if not exists:
        db.add(WishlistItem(user_id=user.id, product_id=product_id))
        db.commit()
    return {"is_wishlisted": True}


@router.delete("/wishlist/{product_id}")
def remove_wishlist_item(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db.query(WishlistItem).filter(
        WishlistItem.user_id == user.id,
        WishlistItem.product_id == product_id,
    ).delete(synchronize_session=False)
    db.commit()
    return {"is_wishlisted": False}


@router.post("/wishlist/merge")
def merge_wishlist(
    payload: WishlistMergePayload,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    existing = {
        row[0]
        for row in db.query(WishlistItem.product_id).filter(WishlistItem.user_id == user.id).all()
    }
    valid_ids = {
        row[0]
        for row in db.query(Product.id).filter(Product.id.in_(payload.product_ids)).all()
    }
    for product_id in valid_ids - existing:
        db.add(WishlistItem(user_id=user.id, product_id=product_id))
    db.commit()
    return {"product_ids": [str(value) for value in sorted(existing | valid_ids, key=str)]}


@router.post("/analytics", status_code=202)
def record_feed_events(
    payload: AnalyticsBatchPayload,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(_optional_user),
):
    for event in payload.events:
        if event.event_type not in EVENT_TYPES:
            raise HTTPException(status_code=400, detail=f"Unsupported event type: {event.event_type}")
        db.add(FeedEvent(
            event_type=event.event_type,
            item_type=event.item_type,
            item_id=event.item_id,
            tab=event.tab,
            branch=event.branch,
            user_id=user.id if user else None,
            installation_id=event.installation_id,
            session_id=event.session_id,
            event_metadata=event.metadata,
        ))
    db.commit()
    return {"accepted": len(payload.events)}


@router.get("/admin/analytics")
def feed_analytics(
    branch: Optional[str] = None,
    tab: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    query = db.query(FeedEvent.event_type, func.count(FeedEvent.id)).group_by(FeedEvent.event_type)
    if branch and branch in BRANCHES:
        query = query.filter(FeedEvent.branch == branch)
    if tab and tab in TABS:
        query = query.filter(FeedEvent.tab == tab)
    totals = {event_type: count for event_type, count in query.all()}
    top_campaigns = (
        db.query(FeedEvent.item_id, func.count(FeedEvent.id).label("events"))
        .filter(FeedEvent.item_type == "promotion")
        .group_by(FeedEvent.item_id)
        .order_by(func.count(FeedEvent.id).desc())
        .limit(10)
        .all()
    )
    return {
        "totals": totals,
        "top_promotions": [{"campaign_id": item_id, "events": events} for item_id, events in top_campaigns],
    }
