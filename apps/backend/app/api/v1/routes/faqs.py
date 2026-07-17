from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_staff
from app.models import FaqCategory, FaqItem, User
from app.services.faq_content import load_faq_categories


router = APIRouter(prefix="/faqs", tags=["FAQs"])


class FaqItemPayload(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    q: str = Field(min_length=1, max_length=1000)
    a: str = Field(min_length=1, max_length=10000)

    @field_validator("id", "q", "a")
    @classmethod
    def strip_item_text(cls, value: str):
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value


class FaqCategoryPayload(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    category: str = Field(min_length=1, max_length=160)
    items: list[FaqItemPayload] = Field(default_factory=list, max_length=500)

    @field_validator("id", "category")
    @classmethod
    def strip_category_text(cls, value: str):
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value


@router.get("")
def list_public_faqs(db: Session = Depends(get_db)):
    return load_faq_categories(db)


@router.put("/admin")
def replace_faqs(
    categories: list[FaqCategoryPayload],
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    if not categories:
        raise HTTPException(status_code=400, detail="At least one FAQ category is required.")

    category_ids = [category.id for category in categories]
    item_ids = [item.id for category in categories for item in category.items]
    if len(category_ids) != len(set(category_ids)):
        raise HTTPException(status_code=400, detail="FAQ category IDs must be unique.")
    if len(item_ids) != len(set(item_ids)):
        raise HTTPException(status_code=400, detail="FAQ item IDs must be unique.")

    try:
        db.query(FaqCategory).delete(synchronize_session=False)
        db.flush()
        for category_index, category in enumerate(categories):
            category_row = FaqCategory(
                id=category.id,
                name=category.category,
                sort_order=category_index,
            )
            db.add(category_row)
            for item_index, item in enumerate(category.items):
                db.add(FaqItem(
                    id=item.id,
                    category_id=category.id,
                    question=item.q,
                    answer=item.a,
                    sort_order=item_index,
                ))
        db.commit()
    except Exception:
        db.rollback()
        raise

    return load_faq_categories(db)
