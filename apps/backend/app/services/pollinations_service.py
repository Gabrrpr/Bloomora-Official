import httpx
import io
from PIL import Image, ImageDraw, ImageFont
from supabase import create_client, Client
from urllib.parse import quote
from typing import Optional
from sqlalchemy.orm import Session
from app.core.config import settings
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

        # 3. Call Pollinations.ai to get image URL
        encoded_prompt = quote(full_prompt)
        pollinations_url = f"{self.base_url}{encoded_prompt}?width=1024&height=1024&model={self.model}&nologo=true"

        try:
            # Download image
            async with httpx.AsyncClient() as client:
                resp = await client.get(pollinations_url, timeout=30.0)
                resp.raise_for_status()
                image_bytes = resp.content

            # Load with Pillow and apply watermark
            img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
            draw = ImageDraw.Draw(img)

            # Watermark text and positioning (bottom-right, scalable)
            watermark_text = "Bloomora.ai ©"
            font_size = max(60, img.width // 20)  # Larger for visibility
            try:
                font = ImageFont.truetype("arial.ttf", font_size)
            except:
                font = ImageFont.load_default()

            bbox = draw.textbbox((0, 0), watermark_text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            margin = 20
            x = img.width - text_width - margin
            y = img.height - text_height - margin

            # Semi-transparent white text with black outline
            draw.text((x-1, y-1), watermark_text, fill="black", font=font)
            draw.text((x+1, y-1), watermark_text, fill="black", font=font)
            draw.text((x-1, y+1), watermark_text, fill="black", font=font)
            draw.text((x+1, y+1), watermark_text, fill="black", font=font)
            draw.text((x, y), watermark_text, fill=(255, 255, 255, 128), font=font)

            # Convert back and get bytes
            img = img.convert("RGB")
            output = io.BytesIO()
            img.save(output, format="PNG", optimize=True)
            watermarked_bytes = output.getvalue()

            # Init Supabase client and upload
            supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            file_path = f"{settings.SUPABASE_BUCKET}/{arrangement_id}.png"
            upload_resp = supabase.storage.from_(settings.SUPABASE_BUCKET).upload(
                file_path, watermarked_bytes, options={"contentType": "image/png"}
            )

            # Get public URL (assume upload success or check)
            public_url = supabase.storage.from_(settings.SUPABASE_BUCKET).get_public_url(file_path)
            watermarked_url = public_url
            print(f"Uploaded watermarked image to: {watermarked_url}")

        except Exception as e:
            print(f"Watermark/upload failed: {e}")
            watermarked_url = pollinations_url  # Fallback to original

        # 4. Update model and commit
        arrangement.generated_image_url = watermarked_url
        db.commit()

        return watermarked_url
