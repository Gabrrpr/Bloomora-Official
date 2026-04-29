import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models import User, RoleEnum, SiteCustomization
from app.schemas.site_customization import HeroCustomizationResponse, HeroCustomizationUpdate, HeroSlide
from app.schemas.customization_toggle import CustomizationToggleResponse, CustomizationToggleUpdate


router = APIRouter(prefix="/site-customization", tags=["Site Customization"])

DEFAULT_HERO_SLIDES = [
    {
        "id": 1,
        "tag": "Esting's Flower International Inc.",
        "headline": "Fresh Blooms,\nSince 1959",
        "description": "Since 1959, we've been part of countless moments big and small. Every arrangement is made by hand with fresh flowers and genuine care.",
        "cta": "Shop Flowers",
        "ctaSecondary": "View Occasions",
        "accent": "#2E8B34",
        "image": "HeroBG1.png",
    },
    {
        "id": 2,
        "tag": "Made a mistake?",
        "headline": "Let flowers\ndo the talking",
        "description": "Whether it's an apology, a misunderstanding, or just a way to say \"I care,\" sending flowers is sometimes the simplest way to fix things without saying too much.",
        "cta": "Shop Flowers",
        "ctaSecondary": "Explore Collection",
        "accent": "#e11d48",
        "image": "HeroBG2.png",
    },
    {
        "id": 3,
        "tag": "Make It Personal",
        "headline": "Flowers,\nMade Your Way",
        "description": "Use our \"Make it Personal\" feature to describe your ideal bouquet, or build your own arrangement through our Mix and Match option. We'll turn your idea into something fresh and beautifully made.",
        "cta": "Try It Now",
        "ctaSecondary": "See Examples",
        "accent": "#7c3aed",
        "image": "HeroBG3.png",
    },
    {
        "id": 4,
        "tag": "Fresh Flowers, For Any Moment",
        "headline": "Simple Ways\nto Show You Care",
        "description": "From everyday surprises to life's biggest moments, we create fresh arrangements that help you express what you feel in a simple and meaningful way.",
        "cta": "Shop Flowers",
        "ctaSecondary": "View Occasions",
        "accent": "#d97706",
        "image": "HeroBG4.png",
    },
]


def _get_or_seed_hero(db: Session):
    row = db.query(SiteCustomization).filter(SiteCustomization.key == "hero_slides").first()
    if not row:
        row = SiteCustomization(
            key="hero_slides",
            value=json.dumps(DEFAULT_HERO_SLIDES),
        )
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def require_admin_or_staff(current_user: User):
    if current_user.role not in [RoleEnum.admin, RoleEnum.staff]:
        raise HTTPException(status_code=403, detail="Admin or staff access required.")


@router.get("/hero", response_model=HeroCustomizationResponse)
def get_hero_slides(db: Session = Depends(get_db)):
    """Public endpoint to retrieve current hero slides."""
    row = _get_or_seed_hero(db)
    try:
        slides = json.loads(row.value)
    except json.JSONDecodeError:
        slides = DEFAULT_HERO_SLIDES
    return {"slides": slides}


@router.put("/hero", response_model=HeroCustomizationResponse)
def update_hero_slides(
    payload: HeroCustomizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update hero slides. Admin/Staff only."""
    require_admin_or_staff(current_user)

    row = _get_or_seed_hero(db)
    row.value = json.dumps([s.model_dump() for s in payload.slides])
    db.commit()
    db.refresh(row)

    return {"slides": json.loads(row.value)}


def _get_or_seed_toggle(db: Session):
    row = db.query(SiteCustomization).filter(SiteCustomization.key == "customization_enabled").first()
    if not row:
        row = SiteCustomization(
            key="customization_enabled",
            value=json.dumps({"enabled": true}),
        )
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


@router.get("/customization/toggle", response_model=CustomizationToggleResponse)
def get_customization_toggle(db: Session = Depends(get_db)):
    """Public endpoint to check if customization is enabled."""
    row = _get_or_seed_toggle(db)
    try:
        data = json.loads(row.value)
        return CustomizationToggleResponse(enabled=data.get("enabled", true))
    except json.JSONDecodeError:
        return CustomizationToggleResponse(enabled=true)


@router.put("/customization/toggle", response_model=CustomizationToggleResponse)
def update_customization_toggle(
    payload: CustomizationToggleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update customization toggle. Admin/Staff only."""
    require_admin_or_staff(current_user)

    row = _get_or_seed_toggle(db)
    row.value = json.dumps(payload.model_dump())
    db.commit()
    db.refresh(row)

    data = json.loads(row.value)
    return CustomizationToggleResponse(enabled=data["enabled"])


