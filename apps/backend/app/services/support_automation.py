from __future__ import annotations

from dataclasses import dataclass
import json
import re
from typing import Any, Iterable


@dataclass(frozen=True)
class AutomatedSupportReply:
    message: str
    topic: str


_INTENT_REPLIES: tuple[tuple[str, re.Pattern[str], str], ...] = (
    (
        "privacy",
        re.compile(r"\b(privacy|personal data|data privacy|data retention|collect.*information|share.*data|delete.*account|deactivat.*account)\b", re.I),
        "Esting's collects profile, delivery, and transaction details only for order fulfillment, payment verification, support, personalization, and operations. Data may be retained for up to five years unless law requires longer. You may request access, correction, or account deactivation through support.",
    ),
    (
        "quality_exchange",
        re.compile(r"\b(damaged|poor condition|wilted|quality issue|replace|replacement|exchange)\b", re.I),
        "If flowers arrive in poor condition, contact support immediately and attach clear photo or video proof. Replacements are reviewed for verified quality issues.",
    ),
    (
        "refunds",
        re.compile(r"\b(cancel|cancellation|refund|money back|all sales final)\b", re.I),
        "Because flowers are perishable, paid orders are final and cannot normally be cancelled or refunded. If the order arrived with a quality issue, send photo or video proof here so the team can review a replacement.",
    ),
    (
        "delivery",
        re.compile(r"\b(same.?day|delivery cutoff|deliver|delivery time|schedule|shipping|lalamove|pickup|address)\b", re.I),
        "Orders placed before 12:00 PM may qualify for same-day delivery; later orders are scheduled for the next available day. Exact arrival times cannot be guaranteed. Please provide a complete, accurate address because redelivery caused by incorrect details may require another fee.",
    ),
    (
        "tracking",
        re.compile(r"\b(track|tracking|order status|where.*order|status.*order)\b", re.I),
        "You can follow preparation and delivery updates from My Orders in the mobile app. For help with one order, send its order number here and a support agent can review it.",
    ),
    (
        "payments",
        re.compile(r"\b(cash on delivery|\bcod\b|payment method|paymongo|gcash|maya|credit card|debit card|pay.*order)\b", re.I),
        "Esting's follows a prepaid, pay-as-you-order policy and does not support Cash on Delivery. PayMongo supports GCash, Maya, and major credit or debit cards. Bulk orders may use a formal quotation and payment link.",
    ),
    (
        "bulk_orders",
        re.compile(r"\b(bulk|quotation|wholesale|large order|many bouquet)\b", re.I),
        "Yes, bulk orders are accepted. Use the quotation feature or send the occasion, quantity, preferred flowers, delivery date, and branch here so the team can prepare pricing.",
    ),
    (
        "international_orders",
        re.compile(r"\b(international|overseas|outside.*philippines|abroad)\b", re.I),
        "Customers may place orders from anywhere in the world, provided the delivery destination is within the Philippines.",
    ),
    (
        "branches",
        re.compile(r"\b(branch|location|located|manila|pampanga|sampaloc|san fernando)\b", re.I),
        "Esting's has branches in Sampaloc, Manila and San Fernando, Pampanga. Select the correct branch before ordering so inventory and delivery fees are calculated correctly.",
    ),
    (
        "customization",
        re.compile(r"\b(custom|customize|customise|mix and match|describe.*arrangement|ai preview|bouquet design)\b", re.I),
        "You can build an arrangement through Mix and Match or Describe Your Arrangement. AI images are visual previews; the florist follows the confirmed products, quantities, and price breakdown.",
    ),
    (
        "flower_care",
        re.compile(r"\b(care|keep.*fresh|last longer|watering|water.*flower|wilt)\b", re.I),
        "Keep the arrangement in a cool place away from direct sunlight. For cut flowers, use a clean vase, refresh the water regularly, and trim a small amount from the stems at an angle.",
    ),
    (
        "company",
        re.compile(r"\b(how long|established|founded|history.*esting)\b", re.I),
        "Esting's Flowers International Inc. was established in 1959.",
    ),
    (
        "policies",
        re.compile(r"\b(policy|policies|terms|customer policy|ordering rules)\b", re.I),
        "Key ordering policies: orders are prepaid, Cash on Delivery is unavailable, same-day delivery may be available before 12:00 PM, exact arrival times are not guaranteed, and paid floral orders are generally final because flowers are perishable.",
    ),
    (
        "help_center",
        re.compile(r"\b(faq|faqs|help center|frequently asked|other question)\b", re.I),
        "I can help with ordering, payments, delivery, tracking, customization, returns, flower care, branch information, and data privacy. Ask one question at a time, or request a support agent for account- or order-specific concerns.",
    ),
)

_STOP_WORDS = {
    "a", "an", "and", "are", "can", "do", "does", "for", "how", "i", "in", "is", "it",
    "my", "of", "on", "the", "to", "what", "when", "where", "which", "with", "you", "your",
}


def get_automated_support_reply(
    customer_message: str | None,
    help_settings: Any = None,
) -> AutomatedSupportReply | None:
    message = (customer_message or "").strip()
    if not message or _requests_human_support(message):
        return None

    dynamic_match = _match_help_center_content(message, help_settings)
    if dynamic_match:
        return dynamic_match

    for topic, pattern, reply in _INTENT_REPLIES:
        if pattern.search(message):
            return AutomatedSupportReply(message=reply, topic=topic)
    return None


def _requests_human_support(message: str) -> bool:
    return bool(re.search(r"\b(human|agent|staff member|representative|complaint|report this chat)\b", message, re.I))


def _match_help_center_content(message: str, help_settings: Any) -> AutomatedSupportReply | None:
    settings = _as_mapping(help_settings)
    if not settings:
        return None

    articles = list(_iter_help_articles(settings))
    normalized_message = " ".join(message.split())

    # Quick-question buttons send the CMS question verbatim. Match that first so
    # even short questions such as "Delivery?" receive their configured answer.
    for topic, question, answer in articles:
        if normalized_message == " ".join(question.split()):
            return AutomatedSupportReply(message=answer, topic=topic)
    for topic, question, answer in articles:
        if normalized_message.casefold() == " ".join(question.split()).casefold():
            return AutomatedSupportReply(message=answer, topic=topic)

    query_tokens = _meaningful_tokens(message)
    if len(query_tokens) < 2:
        return None

    best: tuple[int, str, str] | None = None
    for topic, question, answer in articles:
        article_tokens = _meaningful_tokens(question)
        overlap = len(query_tokens & article_tokens)
        if overlap < 2:
            continue
        score = overlap * 10 - abs(len(query_tokens) - len(article_tokens))
        if best is None or score > best[0]:
            best = (score, topic, answer)

    if not best:
        return None
    return AutomatedSupportReply(message=best[2], topic=best[1])


def _as_mapping(value: Any) -> dict[str, Any]:
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except (TypeError, ValueError):
            return {}
    return value if isinstance(value, dict) else {}


def _iter_help_articles(settings: dict[str, Any]) -> Iterable[tuple[str, str, str]]:
    faq_categories = settings.get("__faq__")
    if isinstance(faq_categories, list):
        for category in faq_categories:
            if not isinstance(category, dict):
                continue
            topic = str(category.get("category") or "faq").strip().lower().replace(" ", "_")
            for item in category.get("items") or []:
                if isinstance(item, dict) and item.get("q") and item.get("a"):
                    yield topic, str(item["q"]), str(item["a"])

    for key, topic in (("__ordering__", "ordering"), ("__privacy__", "privacy"), ("__terms__", "terms")):
        document = settings.get(key)
        if not isinstance(document, dict):
            continue
        for section in document.get("sections") or []:
            if isinstance(section, dict) and section.get("title") and section.get("content"):
                yield topic, str(section["title"]), str(section["content"])


def _meaningful_tokens(value: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z0-9]+", value.lower())
        if len(token) >= 3 and token not in _STOP_WORDS
    }
