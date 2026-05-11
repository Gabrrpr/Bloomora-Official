import httpx
import io
import base64
from PIL import Image, ImageDraw, ImageFont
from supabase import create_client, Client
from urllib.parse import quote
from typing import Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.arrangement import Arrangement

class PollinationsService:
    def __init__(self):
        # 2026 Unified API Endpoint
        self.base_url = "https://gen.pollinations.ai/image/"
        self.model = "flux" # Or your preferred model like 'turbo'

    async def generate_arrangement_image(self, db: Session, arrangement_id: str, optimized_prompt: str):
        arrangement = db.query(Arrangement).filter(Arrangement.id == arrangement_id).first()
        if not arrangement:
            return None

        encoded_prompt = quote(optimized_prompt)
        clean_key = settings.POLLINATIONS_API_KEY.strip()
        pollinations_url = f"{self.base_url}{encoded_prompt}?width=1024&height=1024&model={self.model}&nologo=true&seed=42&key={clean_key}"

        # ==========================================
        # 1. POLLINATIONS TRY BLOCK
        # ==========================================
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(pollinations_url, timeout=60.0)
                resp.raise_for_status()
                image_bytes = resp.content
        except Exception as e:
            print(f"❌ POLLINATIONS ERROR: {e}")
            return None

        # ==========================================
        # 2. IMAGE WATERMARKING
        # ==========================================
        img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        draw = ImageDraw.Draw(img)
        watermark_text = "Bloomora.ai ©"
        font_size = max(60, img.width // 20)
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            font = ImageFont.load_default()

        bbox = draw.textbbox((0, 0), watermark_text, font=font)
        margin = 20
        x = img.width - (bbox[2] - bbox[0]) - margin
        y = img.height - (bbox[3] - bbox[1]) - margin

        for dx, dy in [(-1,-1), (1,-1), (-1,1), (1,1)]:
            draw.text((x+dx, y+dy), watermark_text, fill="black", font=font)
        draw.text((x, y), watermark_text, fill=(255, 255, 255, 128), font=font)

        img = img.convert("RGB")
        output = io.BytesIO()
        img.save(output, format="PNG", optimize=True)
        watermarked_bytes = output.getvalue()

        # ==========================================
        # 3. SUPABASE TRY BLOCK
        # ==========================================
        try:
            supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            file_path = f"{settings.SUPABASE_BUCKET}/{arrangement_id}.png"
            
            supabase.storage.from_(settings.SUPABASE_BUCKET).upload(
                path=file_path,
                file=watermarked_bytes,
                file_options={"content-type": "image/png", "x-upsert": "true"}
            )
            public_url = supabase.storage.from_(settings.SUPABASE_BUCKET).get_public_url(file_path)
            
            arrangement.generated_image_url = public_url
            db.commit()
            return public_url

        except Exception as e:
            print(f"❌ SUPABASE ERROR: {e}")
            return None