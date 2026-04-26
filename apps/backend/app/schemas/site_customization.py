from pydantic import BaseModel
from typing import List, Optional


class HeroSlide(BaseModel):
    id: int
    tag: str
    headline: str
    description: str
    cta: str
    ctaSecondary: str
    accent: str
    image: str   # filename (e.g. "HeroBG1.png") or full URL


class HeroCustomizationResponse(BaseModel):
    slides: List[HeroSlide]


class HeroCustomizationUpdate(BaseModel):
    slides: List[HeroSlide]

