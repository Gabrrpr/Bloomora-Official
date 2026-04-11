from urllib.parse import quote
from typing import Optional
from sqlalchemy.orm import Session
from app.models.arrangement import Arrangement


class PollinationsService:
    def __init__(self):
        self.base_url = "https://image.pollinations.ai/prompt/"
        self.model = "flux"

    async def generate_arrangement_image(self, db: Session, arrangement_id: str):
        """
        Fetches the arrangement data from your DB and generates the Flux image.
        """
        # 1. Fetch the arrangement using your Arrangement model
        arrangement = db.query(Arrangement).filter(Arrangement.id == arrangement_id).first()
        if not arrangement:
            return None

        # 2. Build the prompt based on your model's relationships
        # We access arrangement.flower, arrangement.wrapping, etc.
        prompt_parts = []

        if arrangement.flower:
            prompt_parts.append(f"{arrangement.flower.quantity} {arrangement.flower.color} {arrangement.flower.style} flowers")

        if arrangement.wrapping:
            prompt_parts.append(f"wrapped in {arrangement.wrapping.color} {arrangement.wrapping.style} paper")

        if arrangement.vase:
            prompt_parts.append(f"placed in a {arrangement.vase.material} {arrangement.vase.style} vase")

        # Fallback to the natural language prompt if no specific materials are linked
        base_prompt = arrangement.prompt_text if arrangement.prompt_text else "A beautiful floral arrangement"

        full_prompt = (
            f"{base_prompt}: {', '.join(prompt_parts)}. "
            "Professional floral photography, high-fidelity, 8k, realistic studio lighting."
        )

        # 3. Call Pollinations.ai
        encoded_prompt = quote(full_prompt)
        image_url = f"{self.base_url}{encoded_prompt}?width=1024&height=1024&model={self.model}&nologo=true"

        # 4. Update your model with the generated URL
        arrangement.generated_image_url = image_url
        db.commit()
    
        return image_url