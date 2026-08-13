import asyncio
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


class PollinationsGenerationError(RuntimeError):
    """A provider failure that is safe and useful to display to customers."""


class PollinationsService:
    # Pollinations' public/shared-IP tier accepts only one queued generation at
    # a time. Keep this process from creating its own queue-full collisions.
    _generation_lock = asyncio.Lock()

    def __init__(self):
        self.base_url = "https://gen.pollinations.ai/image/"
        self.model = "flux"
        self.fallback_model = "zimage"

    def _build_prompt_variants(self, optimized_prompt: str, arrangement_type: str):
        style = str(arrangement_type or "bouquet").strip().lower()
        polished_prompt = (
            f"{optimized_prompt}, elegant floral arrangement, professional florist product photography, "
            "clean background, highly detailed, no people, no text, no watermarks, safe for work"
        )

        if style == "box":
            style_prompt = (
                "Real premium florist product photo of a transparent acrylic flower display case with a square footprint, "
                "straight upright clear walls, shallow clear upper cover enclosing the bloom heads, transparent horizontal "
                "support plate at mid-height, and flat deep rose-red base. Exactly the recipe-listed bloom count forms a compact "
                "even grid in the upper half. Every short green stem passes through a separate round hole in the support plate and "
                "is visible in the empty lower half. Slightly elevated front three-quarter camera view shows the top, front, one "
                "side, support tray, stems, and base at once; entire case centered on a clean white studio background. Straight "
                "parallel rectangular edges, physically connected acrylic panels, subtle realistic reflections, small blank oval "
                "label low on front. Not cardboard, not a vase, not a basket, not a terrarium, not a jewelry box, not a hand-tied "
                "bouquet, not tilted, not diamond-shaped, not solid glass. No ribbon, wrapping, extra flowers, readable text, people, or watermarks"
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
        # Use only the current unified endpoint. Authentication is sent in the
        # Authorization header so the secret key never appears in URLs/logs.
        return [
            f"{self.base_url}{encoded_prompt}?width=768&height=768&model={model}&nologo=true&seed={seed}"
            for model in (self.model, self.fallback_model)
        ]

    @staticmethod
    def _compact_prompt(prompt: str, max_words: int = 280, max_chars: int = 1600) -> str:
        """Keep the recipe-first prompt inside conservative image-model limits."""
        normalized = " ".join(str(prompt or "").split())
        words = normalized.split(" ")
        compact = " ".join(words[:max_words])
        if len(compact) > max_chars:
            compact = compact[:max_chars].rsplit(" ", 1)[0]
        return compact.strip(" ,.;")

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

    @staticmethod
    def _apply_estings_brand(img: Image.Image) -> Image.Image:
        """Apply the real mark when available and a reliable branded fallback in production."""
        branded = img.convert("RGBA")
        current_dir = Path(__file__).resolve().parent
        candidates = (
            current_dir.parent / "assets" / "EstingsLogo.png",
            current_dir.parent.parent.parent / "web" / "src" / "assets" / "EstingsLogo.png",
        )
        logo_path = next((path for path in candidates if path.exists()), None)

        if logo_path:
            logo = Image.open(str(logo_path)).convert("RGBA")
            logo.thumbnail((132, 132), Image.Resampling.LANCZOS)
            branded.alpha_composite(logo, (22, 22))
            return branded

        # Production deploys the backend independently from the web project.
        # Draw a compact Esting's badge so generated previews are never unbranded.
        draw = ImageDraw.Draw(branded, "RGBA")
        scale = max(branded.width / 768, 0.7)
        left, top = int(20 * scale), int(20 * scale)
        width, height = int(206 * scale), int(66 * scale)
        radius = int(18 * scale)
        draw.rounded_rectangle(
            (left, top, left + width, top + height),
            radius=radius,
            fill=(255, 255, 255, 232),
            outline=(46, 139, 52, 110),
            width=max(1, int(2 * scale)),
        )
        cx, cy, rose_radius = left + int(35 * scale), top + height // 2, int(21 * scale)
        draw.ellipse(
            (cx - rose_radius, cy - rose_radius, cx + rose_radius, cy + rose_radius),
            fill=(46, 139, 52, 255),
        )
        petal = max(4, int(7 * scale))
        for dx, dy in ((0, -8), (8, 0), (0, 8), (-8, 0)):
            px, py = cx + int(dx * scale), cy + int(dy * scale)
            draw.ellipse((px - petal, py - petal, px + petal, py + petal), fill=(255, 255, 255, 235))
        draw.ellipse((cx - petal // 2, cy - petal // 2, cx + petal // 2, cy + petal // 2), fill=(46, 139, 52, 255))

        try:
            brand_font = ImageFont.truetype("arialbd.ttf", max(18, int(27 * scale)))
            since_font = ImageFont.truetype("arial.ttf", max(9, int(11 * scale)))
        except Exception:
            brand_font = ImageFont.load_default()
            since_font = ImageFont.load_default()
        text_x = left + int(68 * scale)
        draw.text((text_x, top + int(10 * scale)), "Esting's", fill=(12, 87, 62, 255), font=brand_font)
        draw.text((text_x, top + int(43 * scale)), "FLOWERS · SINCE 1959", fill=(46, 139, 52, 220), font=since_font)
        return branded

    async def generate_arrangement_image(self, db: Session, arrangement_id: str, optimized_prompt: str, arrangement_type: str = "bouquet"):
        arrangement = db.query(Arrangement).filter(Arrangement.id == arrangement_id).first()
        if not arrangement:
            return None

        prompt_variants = self._build_prompt_variants(optimized_prompt, arrangement_type)
        clean_key = settings.POLLINATIONS_API_KEY.strip()
        if not clean_key:
            raise PollinationsGenerationError(
                "AI image generation is not configured. Please contact support."
            )
        auth_headers = {"Authorization": f"Bearer {clean_key}"}
        image_bytes = None
        budget_exhausted = False
        provider_overloaded = False
        provider_timed_out = False
        stop_retrying = False
        generation_seed = secrets.randbelow(2_000_000_000)

        try:
            await asyncio.wait_for(self._generation_lock.acquire(), timeout=5.0)
        except asyncio.TimeoutError as exc:
            raise PollinationsGenerationError(
                "The AI image generator is currently processing another design. "
                "Please wait a moment, then select Regenerate image."
            ) from exc

        try:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                for attempt, prompt_variant in enumerate(prompt_variants, start=1):
                    # Preserve the exact recipe plus arrangement-specific visual rules.
                    # The exact material recipe is intentionally at the start.
                    # FLUX/Fireworks can fail internally when long style rules
                    # push the prompt beyond its workflow token capacity.
                    safe_prompt = self._compact_prompt(prompt_variant)
                    encoded_prompt = quote(safe_prompt, safe="")

                    attempt_seed = generation_seed + attempt
                    for url_index, pollinations_url in enumerate(self._pollinations_urls(encoded_prompt, clean_key, attempt_seed), start=1):
                        try:
                            # Image generation commonly exceeds one minute. A short
                            # read timeout abandons a valid authenticated job while
                            # it is still rendering and causes subsequent queue errors.
                            resp = await client.get(
                                pollinations_url,
                                headers=auth_headers,
                                timeout=httpx.Timeout(180.0, connect=15.0),
                            )
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
                            normalized_body = body.lower()
                            if "budget too low" in normalized_body or "payment_required" in normalized_body:
                                budget_exhausted = True
                                stop_retrying = True
                            if status_code == 429 or "queue full" in normalized_body or "too many requests" in normalized_body:
                                provider_overloaded = True
                                stop_retrying = True
                            print(f"Pollinations HTTP error on attempt {attempt}.{url_index}: status={status_code}, body={body}")
                        except httpx.TimeoutException as e:
                            # The timed-out request can remain in Pollinations' queue.
                            # Trying another endpoint immediately only produces 429s.
                            provider_timed_out = True
                            stop_retrying = True
                            print(f"Pollinations request timed out on attempt {attempt}.{url_index}: {type(e).__name__}: {repr(e)}")
                        except httpx.RequestError as e:
                            print(f"Pollinations request error on attempt {attempt}.{url_index}: {type(e).__name__}: {repr(e)}")
                        except Exception as e:
                            print(f"Pollinations unexpected error on attempt {attempt}.{url_index}: {type(e).__name__}: {repr(e)}")

                        if stop_retrying:
                            break

                    if image_bytes or stop_retrying:
                        break
        finally:
            self._generation_lock.release()

        if not image_bytes:
            print("Pollinations timed out or failed on all attempts. No generic preview will be substituted.")
            if budget_exhausted:
                raise PollinationsGenerationError(
                    "The AI image service has temporarily run out of generation credit. "
                    "Your selected items are still saved on this page; please try again later."
                )
            if provider_overloaded:
                raise PollinationsGenerationError(
                    "The AI image generator is temporarily busy. Your design details are still on this page; "
                    "please wait about a minute, then select Regenerate image."
                )
            if provider_timed_out:
                raise PollinationsGenerationError(
                    "The AI image generator is taking longer than expected. Your design details are still on this page; "
                    "please wait about a minute, then select Regenerate image."
                )
            raise PollinationsGenerationError(
                "The AI image generator is temporarily unavailable. Your design details are still on this page; "
                "please try Regenerate image shortly."
            )

        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        except Exception as e:
            print(f"Generated image could not be opened: {e}.")
            return None
        try:
            img = self._apply_estings_brand(img)
        except Exception as e:
            print(f"Error applying Esting's branding: {e}")

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
        # A moderate compression level is visibly lossless but avoids making the
        # customer wait for an expensive maximum-compression pass.
        img.save(output, format="PNG", compress_level=3)
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
            cache_separator = "&" if "?" in public_url else "?"
            public_url = f"{public_url}{cache_separator}v={generation_seed}"

            arrangement.generated_image_url = public_url
            db.commit()
            return public_url

        except Exception as e:
            print(f"Supabase upload error: {e}")
            return None
