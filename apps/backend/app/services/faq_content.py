from sqlalchemy.orm import Session, selectinload

from app.models import FaqCategory


def load_faq_categories(db: Session) -> list[dict]:
    rows = (
        db.query(FaqCategory)
        .options(selectinload(FaqCategory.items))
        .order_by(FaqCategory.sort_order, FaqCategory.created_at)
        .all()
    )
    return [
        {
            "id": row.id,
            "category": row.name,
            "items": [
                {"id": item.id, "q": item.question, "a": item.answer}
                for item in sorted(row.items, key=lambda value: value.sort_order)
                if item.question.strip() and item.answer.strip()
            ],
        }
        for row in rows
    ]
