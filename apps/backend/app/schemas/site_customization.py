from pydantic import BaseModel
from typing import List, Optional


class HeroSlide(BaseModel):
    id: int
    tag: str
    headline: str
    description: str
    cta: str
    ctaSecondary: str
    ctaNav: Optional[str] = "shop"           # where the primary button links
    ctaSecondaryNav: Optional[str] = "shop"  # where the secondary button links
    showSecondary: Optional[bool] = True     # whether to show the 2nd button
    accent: str
    image: str   # filename (e.g. "HeroBG1.png") or full URL


class HeroCustomizationResponse(BaseModel):
    slides: List[HeroSlide]


class HeroCustomizationUpdate(BaseModel):
    slides: List[HeroSlide]


class NavPromo(BaseModel):
    short: Optional[str] = ""
    text: str
    highlight: Optional[str] = ""
    cta: Optional[str] = ""
    page: Optional[str] = "shop"


class NavPromosResponse(BaseModel):
    promos: List[NavPromo]


class NavPromosUpdate(BaseModel):
    promos: List[NavPromo]


class CustomizationToggleUpdate(BaseModel):
    enabled: bool

