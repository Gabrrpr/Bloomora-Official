import hashlib
import math
import uuid
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models import Order, OrderItem, OrderStatusEnum, Product, Review, User, WishlistItem
from app.services.customization_inventory import is_customization_material_product
from app.services.product_pricing import product_price_payload


MOBILE_FEED_TABS = {"explore", "new", "for-you"}

PURCHASE_STATUSES = {
    OrderStatusEnum.paid,
    OrderStatusEnum.confirmed,
    OrderStatusEnum.preparing,
    OrderStatusEnum.processing,
    OrderStatusEnum.ready_for_pickup,
    OrderStatusEnum.out_for_delivery,
    OrderStatusEnum.delivered,
    OrderStatusEnum.completed,
}

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

FOR_YOU_GIFT_TERMS = {
    "accessory",
    "add on",
    "add-on",
    "addon",
    "chocolate",
    "gift",
}


@dataclass
class UserPreferences:
    wishlist_ids: set[uuid.UUID]
    wishlist_categories: Counter[str]
    purchased_ids: set[uuid.UUID]
    purchased_products: list[Product]


# Product availability

def branch_stock(product: Product, branch: str) -> int:
    inventory = product.inventory
    if not inventory:
        return 0
    if branch == "manila":
        return int(inventory.stock_manila or 0)
    if branch == "pampanga":
        return int(inventory.stock_pampanga or 0)
    return int(inventory.current_stock or 0)


def product_matches_branch(product: Product, branch: str) -> bool:
    branches = [str(value).lower() for value in (product.branches or [])]
    return not branches or branch == "all" or branch in branches or "all" in branches


def eligible_products(products: list[Product], tab: str, branch: str, now: datetime) -> list[Product]:
    result = []
    for product in products:
        if is_customization_material_product(product):
            continue
        if not product_matches_branch(product, branch):
            continue
        if branch_stock(product, branch) <= 0:
            continue
        if product.limited_start_at and product.limited_start_at > now:
            continue
        if product.limited_end_at and product.limited_end_at < now:
            continue
        if tab == "for-you" and for_you_product_bucket(product) is None:
            continue
        result.append(product)
    return result


# For You product groups

def normalized_product_terms(product: Product) -> list[str]:
    values: list[Any] = [
        product.category,
        product.product_group,
        product.product_type,
        product.name,
        product.description,
    ]
    values.extend(product.tags or [])
    values.extend(product.occasions or [])
    return [str(value).strip().lower() for value in values if str(value or "").strip()]


def for_you_product_bucket(product: Product) -> Optional[int]:
    terms = normalized_product_terms(product)
    searchable_text = " ".join(terms)

    if any(term in searchable_text for term in FOR_YOU_SENSITIVE_TERMS):
        return None
    if product.category and str(product.category).strip().lower() == "bouquet":
        return 0
    if "bouquet" in searchable_text:
        return 0
    if any(term in searchable_text for term in FOR_YOU_GIFT_TERMS):
        return 1
    return None


# Feed scores

def normalized_score(value: float, maximum: float) -> float:
    return value / maximum if maximum > 0 else 0.0


def product_score(
    tab: str,
    product: Product,
    rating: float,
    max_sold: int,
    preferred_categories: Counter[str],
    now: datetime,
    purchase_similarity: float = 0.0,
    has_purchase_history: bool = False,
) -> float:
    sold_score = normalized_score(float(product.sold_count or 0), float(max_sold))
    rating_score = rating / 5 if rating else 0.0
    age_days = max((now - product.created_at).total_seconds() / 86400, 0) if product.created_at else 365
    recency_score = math.exp(-age_days / 30)
    category = str(product.category or "").lower()
    category_affinity = 1.0 if category in preferred_categories else 0.0

    if tab == "new":
        return recency_score * 0.65 + sold_score * 0.20 + rating_score * 0.15
    if tab == "for-you" and has_purchase_history:
        return (
            purchase_similarity * 0.60
            + category_affinity * 0.15
            + sold_score * 0.10
            + rating_score * 0.10
            + recency_score * 0.05
        )
    if tab == "for-you" and preferred_categories:
        return category_affinity * 0.40 + sold_score * 0.28 + rating_score * 0.22 + recency_score * 0.10
    if tab == "for-you":
        return sold_score * 0.55 + rating_score * 0.25 + recency_score * 0.20
    return sold_score * 0.48 + rating_score * 0.32 + recency_score * 0.20


def product_tie_breaker(
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


# Feed data

def load_ratings(db: Session) -> dict[uuid.UUID, tuple[float, int]]:
    rows = (
        db.query(Review.product_id, func.avg(Review.star_rating), func.count(Review.id))
        .group_by(Review.product_id)
        .all()
    )
    return {
        product_id: (float(average or 0), int(review_count or 0))
        for product_id, average, review_count in rows
    }


def load_user_preferences(db: Session, user: Optional[User]) -> UserPreferences:
    if not user:
        return UserPreferences(set(), Counter(), set(), [])

    wishlist_rows = (
        db.query(WishlistItem.product_id, Product.category)
        .join(Product, Product.id == WishlistItem.product_id)
        .filter(WishlistItem.user_id == user.id)
        .all()
    )
    wishlist_ids = {product_id for product_id, _ in wishlist_rows}
    wishlist_categories = Counter(
        str(category).lower()
        for _, category in wishlist_rows
        if category
    )

    direct_product_rows = (
        db.query(Order.product_id)
        .filter(
            Order.user_id == user.id,
            Order.status.in_(PURCHASE_STATUSES),
            Order.product_id.isnot(None),
        )
        .all()
    )
    item_product_rows = (
        db.query(OrderItem.product_id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(
            Order.user_id == user.id,
            Order.status.in_(PURCHASE_STATUSES),
            OrderItem.product_id.isnot(None),
        )
        .distinct()
        .all()
    )
    purchased_ids = {
        product_id
        for (product_id,) in [*direct_product_rows, *item_product_rows]
        if product_id
    }
    purchased_products = (
        db.query(Product).filter(Product.id.in_(purchased_ids)).all()
        if purchased_ids
        else []
    )
    return UserPreferences(
        wishlist_ids,
        wishlist_categories,
        purchased_ids,
        purchased_products,
    )


def product_content(product: Product) -> str:
    return " ".join(normalized_product_terms(product))


def purchase_similarity_scores(
    products: list[Product],
    purchased_products: list[Product],
) -> dict[uuid.UUID, float]:
    if not products or not purchased_products:
        return {}

    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

    product_documents = [product_content(product) for product in products]
    user_profile = " ".join(product_content(product) for product in purchased_products).strip()
    if not user_profile or not any(document.strip() for document in product_documents):
        return {}

    try:
        vectorizer = TfidfVectorizer(stop_words="english")
        product_matrix = vectorizer.fit_transform(product_documents)
        user_vector = vectorizer.transform([user_profile])
    except ValueError:
        return {}

    similarities = cosine_similarity(user_vector, product_matrix)[0]
    return {
        product.id: float(similarity)
        for product, similarity in zip(products, similarities)
    }


# Feed response

def serialize_product(
    product: Product,
    score: float,
    branch: str,
    rating: float,
    review_count: int,
    wishlist_ids: set[uuid.UUID],
    now: datetime,
) -> dict:
    price_payload = product_price_payload(product, branch)
    return {
        "type": "product",
        "id": str(product.id),
        "score": round(score, 5),
        "product": {
            "id": str(product.id),
            "name": product.name,
            "description": product.description,
            "price": price_payload["price"],
            "original_price": price_payload["original_price"],
            "flash_sale_discount_percent": price_payload["flash_sale_discount_percent"],
            "category": product.category,
            "product_group": product.product_group,
            "product_type": product.product_type,
            "tags": product.tags or [],
            "image_url": product.image_url,
            "stock": branch_stock(product, branch),
            "rating": round(rating, 1),
            "review_count": review_count,
            "is_new": bool(product.created_at and (now - product.created_at).days <= 30),
            "is_wishlisted": product.id in wishlist_ids,
            "boost_level": "none",
        },
    }


def rank_mobile_feed_products(
    db: Session,
    tab: str,
    branch: str,
    user: Optional[User],
) -> list[dict]:
    if tab not in MOBILE_FEED_TABS:
        raise ValueError(f"Unsupported mobile feed tab: {tab}")

    now = datetime.now(timezone.utc)
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
    ratings = load_ratings(db)
    preferences = load_user_preferences(db, user)
    products = eligible_products(products, tab, branch, now)
    max_sold = max((int(product.sold_count or 0) for product in products), default=0)
    similarity_scores = (
        purchase_similarity_scores(products, preferences.purchased_products)
        if tab == "for-you"
        else {}
    )
    has_purchase_history = bool(preferences.purchased_products and similarity_scores)

    ranked = []
    for product in products:
        rating, review_count = ratings.get(product.id, (0.0, 0))
        score = product_score(
            tab,
            product,
            rating,
            max_sold,
            preferences.wishlist_categories,
            now,
            purchase_similarity=similarity_scores.get(product.id, 0.0),
            has_purchase_history=has_purchase_history,
        )
        bucket = for_you_product_bucket(product) if tab == "for-you" else 0
        purchase_bucket = (
            1
            if tab == "for-you" and product.id in preferences.purchased_ids
            else 0
        )
        tie_breaker = product_tie_breaker(
            tab,
            branch,
            product.id,
            product.created_at,
            user.id if user else None,
        )
        ranked.append(
            (
                purchase_bucket,
                bucket or 0,
                score,
                tie_breaker,
                str(product.id),
                product,
                rating,
                review_count,
            )
        )

    ranked.sort(key=lambda item: (item[0], item[1], -item[2], item[3], item[4]))
    return [
        serialize_product(
            product,
            score,
            branch,
            rating,
            review_count,
            preferences.wishlist_ids,
            now,
        )
        for _, _, score, _, _, product, rating, review_count in ranked
    ]
