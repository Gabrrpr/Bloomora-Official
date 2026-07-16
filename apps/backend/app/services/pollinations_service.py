import httpx
import io
import secrets
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from supabase import create_client, Client
from urllib.parse import quote
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.arrangement import Arrangement


class PollinationsService:
    def __init__(self):
        self.base_url = "https://gen.pollinations.ai/image/"
        self.fallback_base_url = "https://image.pollinations.ai/prompt/"
        self.model = "flux"

    def _build_prompt_variants(self, optimized_prompt: str, arrangement_type: str):
        style = str(arrangement_type or "bouquet").strip().lower()
        polished_prompt = (
            f"{optimized_prompt}, elegant floral arrangement, professional florist product photography, "
            "clean background, highly detailed, no people, no text, no watermarks, safe for work"
        )

        if style == "box":
            style_prompt = (
                "Real florist product photo of an Esting's-style transparent acrylic preservation cube flower box, "
                "clear square acrylic container with flat transparent lid, thick clear edges, visible front wall, "
                "visible side wall, red or rose-tinted base insert, slight high front three-quarter angle, upright "
                "level cube, clean white studio background. Six to nine bloom heads arranged in a neat compact grid "
                "inside the box just below the lid, short green stems visible downward through circular holes in an "
                "inner clear acrylic tray, small oval florist label on the front with no readable text. Not a diamond, "
                "not tilted, not rotated, not hexagonal, not a cardboard gift box, not a jewelry box, not a basket, "
                "not a vase, not a hand-tied bouquet, no ribbon, no wrapping paper, no flowers outside the box, "
                "no flowers rising above the lid, no people, no watermarks"
            )
            return [polished_prompt, f"{optimized_prompt}. {style_prompt}"]
        elif style == "vase":
            style_prompt = (
                "Elegant fresh flower vase arrangement, upright vase fully visible from eye level, balanced "
                "stems standing naturally in the vase, premium florist product photography, clean background, "
                "no bouquet wrapping, no flower box, no people, no text, no watermarks"
            )
        else:
            style_prompt = (
                "Full upright hand-tied bouquet centered on a clean white studio background, front eye-level "
                "florist product photo with slight high angle, rounded full flower cluster at the top, layered "
                "realistic folded wrapping material flaring outward around the blooms, natural creases and contact "
                "shadows, only recipe-listed finishing materials, wrapped stem bundle tapering downward, whole bouquet visible from flower tips to "
                "bottom wrap, no vase, no acrylic box, no basket, no top-down flat lay, no people, no text, no watermarks"
            )

        return [polished_prompt, f"{optimized_prompt}. {style_prompt}"]

    def _pollinations_urls(self, encoded_prompt: str, clean_key: str, seed: int):
        query = f"width=768&height=768&model={self.model}&nologo=true&seed={seed}"
        if clean_key:
            query = f"{query}&key={clean_key}"

        return [
            f"{self.base_url}{encoded_prompt}?{query}",
            f"{self.fallback_base_url}{encoded_prompt}?{query}",
        ]

    def _create_demo_preview(self, optimized_prompt: str, arrangement_type: str) -> bytes:
        style = str(arrangement_type or "bouquet").strip().lower()
        img = Image.new("RGB", (1024, 1024), "#fff8f4")
        draw = ImageDraw.Draw(img)

        colors = ["#f472b6", "#fb7185", "#facc15", "#f9a8d4", "#ffffff", "#86efac"]
        centers = [
            (420, 300), (520, 285), (610, 350), (370, 410), (510, 410),
            (650, 465), (440, 530), (565, 545), (330, 520)
        ]

        if style == "box":
            centers = [
                (390, 355), (510, 350), (630, 355),
                (405, 470), (525, 465), (645, 470),
                (420, 585), (540, 580), (660, 585),
            ]
            draw.polygon([(270, 300), (720, 300), (805, 390), (350, 390)], fill="#f8fafc", outline="#94a3b8")
            draw.polygon([(350, 390), (805, 390), (760, 765), (300, 765)], fill="#fff7ed", outline="#94a3b8")
            draw.polygon([(300, 765), (760, 765), (695, 835), (365, 835)], fill="#fecdd3", outline="#94a3b8")
            draw.line((350, 390, 300, 765), fill="#94a3b8", width=4)
            draw.line((805, 390, 760, 765), fill="#94a3b8", width=4)
            draw.line((270, 300, 350, 390), fill="#cbd5e1", width=3)
            draw.line((720, 300, 805, 390), fill="#cbd5e1", width=3)
            draw.rectangle((330, 640, 770, 700), fill="#fda4af", outline="#fb7185")
            draw.line((330, 640, 770, 640), fill="#e2e8f0", width=4)
            stem_base = (535, 680)
        elif style == "vase":
            draw.rounded_rectangle((405, 565, 620, 815), radius=42, fill="#e0f2fe", outline="#38bdf8", width=5)
            draw.ellipse((390, 535, 635, 610), fill="#f0f9ff", outline="#38bdf8", width=4)
            stem_base = (512, 665)
        else:
            draw.polygon([(315, 570), (710, 570), (590, 850), (435, 850)], fill="#ffe4e6", outline="#fb7185")
            draw.line((330, 610, 695, 610), fill="#fb7185", width=10)
            stem_base = (512, 670)

        for x, y in centers:
            draw.line((stem_base[0], stem_base[1], x, y + 55), fill="#15803d", width=5)
            if style == "box":
                draw.ellipse((x - 12, stem_base[1] - 10, x + 12, stem_base[1] + 10), outline="#f8fafc", width=3)

        for index, (x, y) in enumerate(centers):
            fill = colors[index % len(colors)]
            for dx, dy in [(0, -28), (28, 0), (0, 28), (-28, 0), (20, 20), (-20, -20)]:
                draw.ellipse((x + dx - 28, y + dy - 28, x + dx + 28, y + dy + 28), fill=fill, outline="#be123c")
            draw.ellipse((x - 22, y - 22, x + 22, y + 22), fill="#fef3c7", outline="#f59e0b")

        if style == "box":
            draw.ellipse((425, 720, 650, 785), fill="#f8fafc", outline="#16a34a", width=5)
            draw.text((475, 740), "Esting's", fill="#16a34a", font=ImageFont.load_default())

        try:
            title_font = ImageFont.truetype("arial.ttf", 44)
            body_font = ImageFont.truetype("arial.ttf", 28)
        except Exception:
            title_font = ImageFont.load_default()
            body_font = ImageFont.load_default()

        label = "Bouquet" if style == "bouquet" else "Boxed Arrangement" if style == "box" else "Vase Arrangement"
        draw.rounded_rectangle((120, 78, 904, 178), radius=28, fill="#ffffff", outline="#fecdd3", width=3)
        draw.text((160, 102), f"{label} Preview", fill="#881337", font=title_font)
        draw.text((160, 152), "Pollinations timed out, so this demo-safe preview was generated locally.", fill="#64748b", font=body_font)

        output = io.BytesIO()
        img.save(output, format="PNG", optimize=True)
        return output.getvalue()

    async def generate_arrangement_image(self, db: Session, arrangement_id: str, optimized_prompt: str, arrangement_type: str = "bouquet"):
        arrangement = db.query(Arrangement).filter(Arrangement.id == arrangement_id).first()
        if not arrangement:
            return None

        prompt_variants = self._build_prompt_variants(optimized_prompt, arrangement_type)
        clean_key = settings.POLLINATIONS_API_KEY.strip()
        image_bytes = None
        generation_seed = secrets.randbelow(2_000_000_000)

        async with httpx.AsyncClient(follow_redirects=True) as client:
            for attempt, prompt_variant in enumerate(prompt_variants, start=1):
                # Preserve the exact recipe plus arrangement-specific visual rules.
                safe_prompt = " ".join(prompt_variant.split())[:3000]
                encoded_prompt = quote(safe_prompt, safe="")

                attempt_seed = generation_seed + attempt
                for url_index, pollinations_url in enumerate(self._pollinations_urls(encoded_prompt, clean_key, attempt_seed), start=1):
                    try:
                        resp = await client.get(pollinations_url, timeout=httpx.Timeout(55.0, connect=15.0))
                        resp.raise_for_status()
                        content_type = resp.headers.get("content-type", "")
                        if "image" not in content_type.lower():
                            print(
                                "Pollinations returned non-image content "
                                f"on attempt {attempt}.{url_index}: status={resp.status_code}, "
                                f"content-type={content_type}, body={resp.text[:300]}"
                            )
                            continue
                        image_bytes = resp.content
                        break
                    except httpx.HTTPStatusError as e:
                        body = e.response.text[:300] if e.response is not None else ""
                        status_code = e.response.status_code if e.response is not None else "unknown"
                        print(f"Pollinations HTTP error on attempt {attempt}.{url_index}: status={status_code}, body={body}")
                    except httpx.RequestError as e:
                        print(f"Pollinations request error on attempt {attempt}.{url_index}: {type(e).__name__}: {repr(e)}")
                    except Exception as e:
                        print(f"Pollinations unexpected error on attempt {attempt}.{url_index}: {type(e).__name__}: {repr(e)}")

                if image_bytes:
                    break

        if not image_bytes:
            print("Pollinations timed out or failed on all attempts. No generic preview will be substituted.")
            return None

        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        except Exception as e:
            print(f"Generated image could not be opened: {e}.")
            return None

        try:
            current_dir = Path(__file__).resolve().parent
            apps_dir = current_dir.parent.parent.parent
            png_path = apps_dir / "web" / "src" / "assets" / "EstingsLogo.png"

            if not png_path.exists():
                print(f"Warning: EstingsLogo.png not found at {png_path}. Skipping logo.")
            else:
                logo_img = Image.open(str(png_path)).convert("RGBA")
                logo_img.thumbnail((150, 150))
                img.paste(logo_img, (20, 20), logo_img)
        except Exception as e:
            print(f"Error applying logo: {e}")

        draw = ImageDraw.Draw(img)
        watermark_text = "Generated by Pollinations.ai | Esting's"

        font_size = max(30, img.width // 35)
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except Exception:
            font = ImageFont.load_default()

        bbox = draw.textbbox((0, 0), watermark_text, font=font)
        margin = 20
        x = img.width - (bbox[2] - bbox[0]) - margin
        y = img.height - (bbox[3] - bbox[1]) - margin

        for dx, dy in [(-1, -1), (1, -1), (-1, 1), (1, 1)]:
            draw.text((x + dx, y + dy), watermark_text, fill="black", font=font)

        draw.text((x, y), watermark_text, fill=(255, 255, 255, 200), font=font)

        img = img.convert("RGB")
        output = io.BytesIO()
        img.save(output, format="PNG", optimize=True)
        watermarked_bytes = output.getvalue()

        try:
            supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            file_path = f"{settings.SUPABASE_BUCKET}/{arrangement_id}.png"

            supabase.storage.from_(settings.SUPABASE_BUCKET).upload(
                path=file_path,
                file=watermarked_bytes,
                file_options={"content-type": "image/png", "x-upsert": "true"},
            )
            public_url = supabase.storage.from_(settings.SUPABASE_BUCKET).get_public_url(file_path)

            arrangement.generated_image_url = public_url
            db.commit()
            return public_url

        except Exception as e:
            print(f"Supabase upload error: {e}")
            return None
