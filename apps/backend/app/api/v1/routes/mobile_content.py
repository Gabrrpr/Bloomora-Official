import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_staff
from app.core.security import decode_token
from app.models import CategoryBanner, FeedPost, FeedPostReaction, Product, PromoCode, User
from app.services.mobile_content_media import create_mobile_content_signed_url, process_mobile_content_media


router = APIRouter(prefix="/mobile-content", tags=["Mobile Content"])
optional_bearer = HTTPBearer(auto_error=False)


class ActionPayload(BaseModel):
    type: Literal["none", "product", "voucher", "feature"]
    targetId: Optional[str] = None
    label: Optional[str] = None
    route: Optional[str] = None
    code: Optional[str] = None


class MediaPayload(BaseModel):
    id: str
    kind: Literal["image", "video"]
    url: str
    storagePath: Optional[str] = None
    posterUrl: Optional[str] = None
    posterStoragePath: Optional[str] = None
    width: int
    height: int
    durationSeconds: Optional[float] = None
    mimeType: str
    sizeBytes: Optional[int] = None


class FeedPostPayload(BaseModel):
    id: Optional[uuid.UUID] = None
    internalTitle: str = Field(min_length=1, max_length=160)
    title: str = Field(min_length=1, max_length=160)
    caption: Optional[str] = None
    badge: Optional[str] = Field(default=None, max_length=80)
    media: MediaPayload
    action: ActionPayload
    tab: Literal["explore", "new", "for-you"]
    branch: Literal["all", "manila", "pampanga"]
    publishMode: Literal["draft", "now", "scheduled"]
    scheduledAt: Optional[datetime] = None
    expiresAt: Optional[datetime] = None
    status: Optional[Literal["draft", "published"]] = None
    sortOrder: int = Field(default=10, ge=0)
    likeCount: int = 0

    @field_validator("id", mode="before")
    @classmethod
    def blank_id_is_none(cls, value):
        return None if value == "" else value


class BannerPayload(BaseModel):
    id: Optional[uuid.UUID] = None
    internalTitle: str = Field(min_length=1, max_length=160)
    accessibleLabel: str = Field(min_length=1, max_length=240)
    media: MediaPayload
    action: ActionPayload
    branch: Literal["all", "manila", "pampanga"]
    publishMode: Literal["draft", "now", "scheduled"]
    scheduledAt: Optional[datetime] = None
    expiresAt: Optional[datetime] = None
    status: Optional[Literal["draft", "published"]] = None
    sortOrder: int = Field(default=10, ge=0)

    @field_validator("id", mode="before")
    @classmethod
    def blank_id_is_none(cls, value):
        return None if value == "" else value


class ReorderPayload(BaseModel):
    ids: list[uuid.UUID] = Field(max_length=500)


class ReactionPayload(BaseModel):
    installation_id: Optional[str] = Field(default=None, min_length=8, max_length=120)


def _now():
    return datetime.now(timezone.utc)


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


def _validate_action(action: ActionPayload, db: Session):
    if action.type == "none":
        return {"type": "none"}
    if not action.targetId:
        raise HTTPException(status_code=400, detail="Choose an action destination.")
    if action.type == "product":
        if not db.query(Product.id).filter(Product.id == action.targetId).first():
            raise HTTPException(status_code=404, detail="Selected product was not found.")
        return action.model_dump(exclude_none=True)
    if action.type == "voucher":
        voucher = db.query(PromoCode).filter(PromoCode.id == action.targetId).first()
        if not voucher:
            raise HTTPException(status_code=404, detail="Selected voucher was not found.")
        return {**action.model_dump(exclude_none=True), "code": voucher.code}
    allowed_routes = {
        "categories": "/categories",
        "create": "/(tabs)/generate",
        "wishlist": "/wishlist",
        "orders": "/(tabs)/orders",
        "live-chat": "/live-chat",
    }
    if action.targetId not in allowed_routes:
        raise HTTPException(status_code=400, detail="Unsupported app feature.")
    return {**action.model_dump(exclude_none=True), "route": allowed_routes[action.targetId]}


def _schedule(publish_mode: str, scheduled_at: Optional[datetime]) -> tuple[str, Optional[datetime]]:
    if publish_mode == "draft":
        return "draft", scheduled_at
    if publish_mode == "scheduled":
        if not scheduled_at or scheduled_at <= _now():
            raise HTTPException(status_code=400, detail="Scheduled time must be in the future.")
        return "published", scheduled_at
    return "published", None


def _validate_dates(scheduled_at: Optional[datetime], expires_at: Optional[datetime]):
    if expires_at and expires_at <= (scheduled_at or _now()):
        raise HTTPException(status_code=400, detail="End date must be after the publish date.")


def _media(row) -> dict:
    media_path = row.media_url
    poster_path = getattr(row, "poster_url", None)
    return {
        "id": f"media-{row.id}",
        "kind": getattr(row, "media_kind", "image"),
        "url": create_mobile_content_signed_url(media_path),
        "storagePath": media_path if media_path and not media_path.startswith(("http://", "https://")) else None,
        "posterUrl": create_mobile_content_signed_url(poster_path),
        "posterStoragePath": poster_path if poster_path and not poster_path.startswith(("http://", "https://")) else None,
        "width": row.media_width,
        "height": row.media_height,
        "durationSeconds": getattr(row, "media_duration_seconds", None),
        "mimeType": row.media_mime_type,
        "sizeBytes": row.media_size_bytes,
    }


def serialize_feed_post(row: FeedPost, db: Session, user: Optional[User] = None) -> dict:
    like_count = db.query(func.count(FeedPostReaction.id)).filter(FeedPostReaction.feed_post_id == row.id).scalar() or 0
    actor_key = f"user:{user.id}" if user else None
    is_liked = bool(actor_key and db.query(FeedPostReaction.id).filter(
        FeedPostReaction.feed_post_id == row.id,
        FeedPostReaction.actor_key == actor_key,
    ).first())
    publish_mode = "draft" if row.status == "draft" else "scheduled" if row.scheduled_at and row.scheduled_at > _now() else "now"
    return {
        "id": str(row.id),
        "internalTitle": row.internal_title,
        "title": row.title,
        "caption": row.caption,
        "badge": row.badge,
        "media": _media(row),
        "action": row.action or {"type": "none"},
        "tab": row.tab,
        "branch": row.branch,
        "publishMode": publish_mode,
        "scheduledAt": row.scheduled_at.isoformat() if row.scheduled_at else None,
        "expiresAt": row.expires_at.isoformat() if row.expires_at else None,
        "status": row.status,
        "sortOrder": row.sort_order,
        "likeCount": like_count,
        "isLiked": is_liked,
    }


def serialize_banner(row: CategoryBanner) -> dict:
    publish_mode = "draft" if row.status == "draft" else "scheduled" if row.scheduled_at and row.scheduled_at > _now() else "now"
    return {
        "id": str(row.id),
        "internalTitle": row.internal_title,
        "accessibleLabel": row.accessible_label,
        "media": _media(row),
        "action": row.action or {"type": "none"},
        "branch": row.branch,
        "publishMode": publish_mode,
        "scheduledAt": row.scheduled_at.isoformat() if row.scheduled_at else None,
        "expiresAt": row.expires_at.isoformat() if row.expires_at else None,
        "status": row.status,
        "sortOrder": row.sort_order,
    }


def _active_query(query, model, branch: str):
    now = _now()
    return query.filter(
        model.status == "published",
        model.branch.in_(["all", branch]),
        or_(model.scheduled_at.is_(None), model.scheduled_at <= now),
        or_(model.expires_at.is_(None), model.expires_at >= now),
    )


@router.post("/media", status_code=201)
async def upload_media(
    content_type: str = Form(...),
    file: UploadFile = File(...),
    _: User = Depends(require_staff),
):
    return await process_mobile_content_media(file, content_type)


@router.get("/admin/feed-posts")
def list_feed_posts(db: Session = Depends(get_db), _: User = Depends(require_staff)):
    rows = db.query(FeedPost).order_by(FeedPost.sort_order, FeedPost.created_at.desc()).all()
    return [serialize_feed_post(row, db) for row in rows]


@router.post("/admin/feed-posts", status_code=201)
def create_feed_post(payload: FeedPostPayload, db: Session = Depends(get_db), _: User = Depends(require_staff)):
    status, scheduled = _schedule(payload.publishMode, payload.scheduledAt)
    _validate_dates(scheduled, payload.expiresAt)
    row = FeedPost(
        internal_title=payload.internalTitle,
        title=payload.title,
        caption=payload.caption,
        badge=payload.badge,
        media_kind=payload.media.kind,
        media_url=payload.media.storagePath or payload.media.url,
        poster_url=payload.media.posterStoragePath or payload.media.posterUrl,
        media_width=payload.media.width,
        media_height=payload.media.height,
        media_duration_seconds=round(payload.media.durationSeconds) if payload.media.durationSeconds else None,
        media_mime_type=payload.media.mimeType,
        media_size_bytes=payload.media.sizeBytes,
        action=_validate_action(payload.action, db),
        tab=payload.tab,
        branch=payload.branch,
        status=status,
        scheduled_at=scheduled,
        expires_at=payload.expiresAt,
        sort_order=payload.sortOrder,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return serialize_feed_post(row, db)


@router.put("/admin/feed-posts/{post_id:uuid}")
def update_feed_post(post_id: uuid.UUID, payload: FeedPostPayload, db: Session = Depends(get_db), _: User = Depends(require_staff)):
    row = db.query(FeedPost).filter(FeedPost.id == post_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Feed post not found.")
    status, scheduled = _schedule(payload.publishMode, payload.scheduledAt)
    _validate_dates(scheduled, payload.expiresAt)
    values = {
        "internal_title": payload.internalTitle, "title": payload.title, "caption": payload.caption,
        "badge": payload.badge, "media_kind": payload.media.kind, "media_url": payload.media.storagePath or payload.media.url,
        "poster_url": payload.media.posterStoragePath or payload.media.posterUrl, "media_width": payload.media.width,
        "media_height": payload.media.height,
        "media_duration_seconds": round(payload.media.durationSeconds) if payload.media.durationSeconds else None,
        "media_mime_type": payload.media.mimeType, "media_size_bytes": payload.media.sizeBytes,
        "action": _validate_action(payload.action, db), "tab": payload.tab, "branch": payload.branch,
        "status": status, "scheduled_at": scheduled, "expires_at": payload.expiresAt,
        "sort_order": payload.sortOrder,
    }
    for key, value in values.items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return serialize_feed_post(row, db)


@router.delete("/admin/feed-posts/{post_id:uuid}")
def delete_feed_post(post_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(require_staff)):
    row = db.query(FeedPost).filter(FeedPost.id == post_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Feed post not found.")
    db.delete(row)
    db.commit()
    return {"status": "success"}


@router.put("/admin/feed-posts/reorder")
def reorder_feed_posts(payload: ReorderPayload, db: Session = Depends(get_db), _: User = Depends(require_staff)):
    rows = db.query(FeedPost).filter(FeedPost.id.in_(payload.ids)).all()
    by_id = {row.id: row for row in rows}
    for index, row_id in enumerate(payload.ids):
        if row_id in by_id:
            by_id[row_id].sort_order = (index + 1) * 10
    db.commit()
    return {"status": "success"}


@router.get("/admin/banners")
def list_banners(db: Session = Depends(get_db), _: User = Depends(require_staff)):
    return [serialize_banner(row) for row in db.query(CategoryBanner).order_by(CategoryBanner.sort_order).all()]


@router.post("/admin/banners", status_code=201)
def create_banner(payload: BannerPayload, db: Session = Depends(get_db), _: User = Depends(require_staff)):
    status, scheduled = _schedule(payload.publishMode, payload.scheduledAt)
    _validate_dates(scheduled, payload.expiresAt)
    row = CategoryBanner(
        internal_title=payload.internalTitle, accessible_label=payload.accessibleLabel,
        media_url=payload.media.storagePath or payload.media.url, media_width=payload.media.width, media_height=payload.media.height,
        media_mime_type=payload.media.mimeType, media_size_bytes=payload.media.sizeBytes,
        action=_validate_action(payload.action, db), branch=payload.branch, status=status,
        scheduled_at=scheduled, expires_at=payload.expiresAt, sort_order=payload.sortOrder,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return serialize_banner(row)


@router.put("/admin/banners/{banner_id:uuid}")
def update_banner(banner_id: uuid.UUID, payload: BannerPayload, db: Session = Depends(get_db), _: User = Depends(require_staff)):
    row = db.query(CategoryBanner).filter(CategoryBanner.id == banner_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Banner not found.")
    status, scheduled = _schedule(payload.publishMode, payload.scheduledAt)
    _validate_dates(scheduled, payload.expiresAt)
    values = {
        "internal_title": payload.internalTitle, "accessible_label": payload.accessibleLabel,
        "media_url": payload.media.storagePath or payload.media.url, "media_width": payload.media.width,
        "media_height": payload.media.height, "media_mime_type": payload.media.mimeType,
        "media_size_bytes": payload.media.sizeBytes, "action": _validate_action(payload.action, db),
        "branch": payload.branch, "status": status, "scheduled_at": scheduled,
        "expires_at": payload.expiresAt, "sort_order": payload.sortOrder,
    }
    for key, value in values.items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return serialize_banner(row)


@router.delete("/admin/banners/{banner_id:uuid}")
def delete_banner(banner_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(require_staff)):
    row = db.query(CategoryBanner).filter(CategoryBanner.id == banner_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Banner not found.")
    db.delete(row)
    db.commit()
    return {"status": "success"}


@router.put("/admin/banners/reorder")
def reorder_banners(payload: ReorderPayload, db: Session = Depends(get_db), _: User = Depends(require_staff)):
    rows = db.query(CategoryBanner).filter(CategoryBanner.id.in_(payload.ids)).all()
    by_id = {row.id: row for row in rows}
    for index, row_id in enumerate(payload.ids):
        if row_id in by_id:
            by_id[row_id].sort_order = (index + 1) * 10
    db.commit()
    return {"status": "success"}


@router.get("/feed-posts/active")
def active_feed_posts(tab: str, branch: str, db: Session = Depends(get_db), user: Optional[User] = Depends(_optional_user)):
    if tab not in {"explore", "new", "for-you"} or branch not in {"all", "manila", "pampanga"}:
        raise HTTPException(status_code=400, detail="Invalid feed tab or branch.")
    rows = _active_query(db.query(FeedPost), FeedPost, branch).filter(FeedPost.tab == tab).order_by(FeedPost.sort_order).all()
    return [serialize_feed_post(row, db, user) for row in rows]


@router.get("/banners/active")
def active_banners(branch: str, db: Session = Depends(get_db)):
    if branch not in {"all", "manila", "pampanga"}:
        raise HTTPException(status_code=400, detail="Invalid branch.")
    rows = _active_query(db.query(CategoryBanner), CategoryBanner, branch).order_by(CategoryBanner.sort_order).all()
    return [serialize_banner(row) for row in rows]


def _actor(user: Optional[User], installation_id: Optional[str]):
    if user:
        return f"user:{user.id}"
    if installation_id:
        return f"install:{installation_id}"
    raise HTTPException(status_code=400, detail="Installation ID is required.")


@router.put("/feed-posts/{post_id:uuid}/like")
def like_feed_post(post_id: uuid.UUID, payload: ReactionPayload, db: Session = Depends(get_db), user: Optional[User] = Depends(_optional_user)):
    if not db.query(FeedPost.id).filter(FeedPost.id == post_id).first():
        raise HTTPException(status_code=404, detail="Feed post not found.")
    actor_key = _actor(user, payload.installation_id)
    exists = db.query(FeedPostReaction.id).filter(FeedPostReaction.feed_post_id == post_id, FeedPostReaction.actor_key == actor_key).first()
    if not exists:
        db.add(FeedPostReaction(feed_post_id=post_id, user_id=user.id if user else None, installation_id=None if user else payload.installation_id, actor_key=actor_key))
        db.commit()
    count = db.query(func.count(FeedPostReaction.id)).filter(FeedPostReaction.feed_post_id == post_id).scalar() or 0
    return {"is_liked": True, "like_count": count}


@router.delete("/feed-posts/{post_id:uuid}/like")
def unlike_feed_post(post_id: uuid.UUID, installation_id: Optional[str] = None, db: Session = Depends(get_db), user: Optional[User] = Depends(_optional_user)):
    actor_key = _actor(user, installation_id)
    db.query(FeedPostReaction).filter(FeedPostReaction.feed_post_id == post_id, FeedPostReaction.actor_key == actor_key).delete(synchronize_session=False)
    db.commit()
    count = db.query(func.count(FeedPostReaction.id)).filter(FeedPostReaction.feed_post_id == post_id).scalar() or 0
    return {"is_liked": False, "like_count": count}
