import httpx
import io
import os
import random
import base64
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from supabase import create_client, Client
from urllib.parse import quote
from typing import Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.arrangement import Arrangement

class PollinationsService:
    def __init__(self):
        self.base_url = "https://gen.pollinations.ai/image/"
        self.model = "flux"

    def _build_prompt(self, user_prompt: str) -> str:
        style_prefix = (
            "Professional floral studio photograph, "
            "arrangement standing perfectly upright and centered, "
            "shot straight-on at eye level from the front, "
            "completely vertical orientation, not tilted, not angled, not held, "
            "resting flat on a surface, "
            "shot on a Sony A7R V with an 85mm f/1.4 lens, "
            "soft natural window light from the left, "
            "shallow depth of field with creamy bokeh, "
            "pristine white seamless backdrop, "
        )

        style_suffix = (
            ", arrangement is perfectly straight and upright, "
            "ultra-sharp focus on the blooms, "
            "rich saturated petal colors, "
            "elegant and luxurious presentation, "
            "award-winning floral photography, "
            "no hands, no people, no text, no logos, no watermarks, "
            "no props other than the arrangement itself, "
            "safe for work, 4K resolution"
        )

        return f"{style_prefix}{user_prompt}{style_suffix}"

    async def generate_arrangement_image(
        self,
        db: Session,
        arrangement_id: str,
        optimized_prompt: str,
    ):
        arrangement = db.query(Arrangement).filter(
            Arrangement.id == arrangement_id
        ).first()
        if not arrangement:
            return None

        # ── 1. BUILD & ENCODE PROMPT ─────────────────────────────────────
        full_prompt = self._build_prompt(optimized_prompt)
        encoded_prompt = quote(full_prompt)

        # Random seed so each generation looks unique
        seed = random.randint(1, 2_147_483_647)

        clean_key = settings.POLLINATIONS_API_KEY.strip()

        # Portrait ratio (3:4) looks far better for bouquets than square
        pollinations_url = (
            f"{self.base_url}{encoded_prompt}"
            f"?width=832&height=1216"
            f"&model={self.model}"
            f"&nologo=true"
            f"&seed={seed}"
            f"&key={clean_key}"
        )

        # ── 2. FETCH IMAGE FROM POLLINATIONS ────────────────────────────
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(pollinations_url, timeout=90.0)
                resp.raise_for_status()
                image_bytes = resp.content
        except Exception as e:
            print(f"❌ POLLINATIONS ERROR: {e}")
            return None

        # ── 3. POST-PROCESS THE IMAGE ────────────────────────────────────
        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

            # A. Subtle vignette — darkens edges slightly for that studio look
            img = self._apply_vignette(img)

            # B. Watermark — text only (SVG logo can't be opened by PIL)
            img = self._apply_watermark(img)

            # C. Convert to RGB for PNG output
            img = img.convert("RGB")

            # D. Slight sharpening pass for crisper petals
            from PIL import ImageEnhance
            img = ImageEnhance.Sharpness(img).enhance(1.25)

            output = io.BytesIO()
            img.save(output, format="PNG", optimize=True, quality=95)
            final_bytes = output.getvalue()

        except Exception as e:
            print(f"❌ IMAGE PROCESSING ERROR: {e}")
            # Fall back to raw bytes if processing fails
            final_bytes = image_bytes

        # ── 4. UPLOAD TO SUPABASE ────────────────────────────────────────
        try:
            supabase: Client = create_client(
                settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY
            )
            file_path = f"{settings.SUPABASE_BUCKET}/{arrangement_id}.png"

            supabase.storage.from_(settings.SUPABASE_BUCKET).upload(
                path=file_path,
                file=final_bytes,
                file_options={"content-type": "image/png", "x-upsert": "true"},
            )
            public_url = supabase.storage.from_(settings.SUPABASE_BUCKET).get_public_url(
                file_path
            )

            arrangement.generated_image_url = public_url
            db.commit()
            return public_url

        except Exception as e:
            print(f"❌ SUPABASE ERROR: {e}")
            return None

    # ── Helpers ──────────────────────────────────────────────────────────────

    def _apply_vignette(self, img: Image.Image) -> Image.Image:
        """Adds a soft radial vignette to focus attention on the arrangement."""
        width, height = img.size

        # Create a black radial gradient mask
        vignette = Image.new("L", (width, height), 0)
        draw = ImageDraw.Draw(vignette)

        # Draw concentric ellipses from outside in, getting lighter toward center
        steps = 80
        for i in range(steps):
            ratio = i / steps
            # Outer ellipse is dark (0), inner is light (255)
            alpha = int(255 * (ratio ** 1.8))
            margin_x = int(width  * (1 - ratio) * 0.38)
            margin_y = int(height * (1 - ratio) * 0.38)
            draw.ellipse(
                [margin_x, margin_y, width - margin_x, height - margin_y],
                fill=alpha,
            )

        # Blur the mask for a smooth gradient
        vignette = vignette.filter(ImageFilter.GaussianBlur(radius=width // 8))

        # Apply: darken image by blending with black where vignette is dark
        black = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        # Invert the vignette to make edges dark
        vignette_dark = Image.eval(vignette, lambda x: 255 - x)
        # Scale down the darkening (max ~30% opacity at edges)
        vignette_scaled = Image.eval(vignette_dark, lambda x: int(x * 0.30))

        overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        overlay.putalpha(vignette_scaled)

        img = Image.alpha_composite(img, overlay)
        return img

    def _apply_watermark(self, img: Image.Image) -> Image.Image:
        """Applies a clean, professional semi-transparent text watermark."""
        draw = ImageDraw.Draw(img)
        width, height = img.size

        watermark_text = "Esting's Flowers International"

        # Scale font to image width — roughly 1/40th of width
        font_size = max(22, width // 42)
        font = None
        for font_name in ["arial.ttf", "DejaVuSans.ttf", "Helvetica.ttf"]:
            try:
                font = ImageFont.truetype(font_name, font_size)
                break
            except Exception:
                continue
        if font is None:
            font = ImageFont.load_default()

        bbox = draw.textbbox((0, 0), watermark_text, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]

        margin = max(18, width // 55)
        x = width  - text_w - margin
        y = height - text_h - margin

        # Thin dark shadow for readability on any background
        shadow_offset = max(1, font_size // 20)
        for dx, dy in [(-shadow_offset, -shadow_offset),
                       ( shadow_offset, -shadow_offset),
                       (-shadow_offset,  shadow_offset),
                       ( shadow_offset,  shadow_offset)]:
            draw.text((x + dx, y + dy), watermark_text,
                      fill=(0, 0, 0, 160), font=font)

        # Main text: soft white, slightly transparent
        draw.text((x, y), watermark_text, fill=(255, 255, 255, 210), font=font)

        return img