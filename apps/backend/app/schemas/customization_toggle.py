from pydantic import BaseModel
from typing import Optional

class CustomizationToggleResponse(BaseModel):
    enabled: bool

class CustomizationToggleUpdate(BaseModel):
    enabled: bool

