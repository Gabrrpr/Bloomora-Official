"""Deterministic acrylic-box layout preview; never invents stems or fillers."""
import base64
from html import escape
from urllib.parse import urlsplit



def render_box_preview(slots, photos, ribbon=None):
    if not 1 <= len(slots) <= 9 or len({slot["hole"] for slot in slots}) != len(slots):
        raise ValueError("Choose one to nine unique flower positions.")
    occupied = {slot["hole"]: slot for slot in slots}
    if any(hole not in range(9) for hole in occupied):
        raise ValueError("Invalid box hole.")
    parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">',
             """<defs>
             <radialGradient id="studio"><stop stop-color="#fff"/><stop offset="1" stop-color="#f4f3ef"/></radialGradient>
             <linearGradient id="base" x2=".8" y2="1"><stop stop-color="#63172c"/><stop offset=".45" stop-color="#b6425b"/><stop offset="1" stop-color="#79182e"/></linearGradient>
             <linearGradient id="glass"><stop stop-color="#b5cbd3" stop-opacity=".19"/><stop offset=".3" stop-color="#fff" stop-opacity=".02"/><stop offset=".8" stop-color="#fff" stop-opacity=".23"/><stop offset="1" stop-color="#91abb8" stop-opacity=".17"/></linearGradient>
             <linearGradient id="edge"><stop stop-color="#91a7b1"/><stop offset=".35" stop-color="#fff"/><stop offset=".7" stop-color="#b4c1c5"/><stop offset="1" stop-color="#faffff"/></linearGradient>
             <linearGradient id="stem"><stop stop-color="#254d28"/><stop offset=".45" stop-color="#78994b"/><stop offset="1" stop-color="#365d2d"/></linearGradient>
             <filter id="soft"><feGaussianBlur stdDeviation="12"/></filter>
             <filter id="bloomShadow" x="-.3" y="-.4" width="1.6" height="1.8"><feDropShadow dx="3" dy="8" stdDeviation="5" flood-color="#263c28" flood-opacity=".25"/></filter>
             </defs>""",
             '<rect width="1024" height="1024" fill="#fff"/>',
             '<text x="512" y="70" text-anchor="middle" fill="#287d36" font-family="sans-serif" font-size="32">Esting’s · Box arrangement</text>',
             '<ellipse cx="530" cy="819" rx="315" ry="28" fill="#35463d" opacity=".18" filter="url(#soft)"/>',
             '<path d="M190 570L760 570L850 805L280 805Z" fill="url(#base)"/>',
             '<path d="M280 805H850V814H280Z" fill="#64152b"/>',
             '<path d="M190 290L760 290L850 515L280 515Z" fill="#fafcfc" fill-opacity=".25" stroke="url(#edge)" stroke-width="2"/>',
             '<path d="M190 290V570L280 805V515Z M760 290V570L850 805V515Z" fill="url(#glass)" stroke="url(#edge)" stroke-width="4"/>']
    # A fixed oblique projection: back row at top, front row at bottom.
    for hole in range(9):
        row, col = divmod(hole, 3)
        x, y = 290 + col * 175 + row * 27, 335 + row * 76
        parts.append(f'<ellipse cx="{x}" cy="{y + 120}" rx="15" ry="7" fill="none" stroke="#9eafb7" stroke-width="2"/>')
        if hole in occupied:
            bend = (hole % 3 - 1) * 7
            parts.append(f'<path d="M{x} {y}Q{x + bend} {y+150} {x+3} {y+290}" fill="none" stroke="url(#stem)" stroke-width="8" stroke-linecap="round"/>')
            parts.append(f'<path d="M{x-1} {y+30}Q{x + bend-1} {y+150} {x+2} {y+280}" fill="none" stroke="#b0bc78" stroke-opacity=".35" stroke-width="1.5"/>')
    # Same projection as the flower plane, translated down by 120 pixels;
    # each hole now actually belongs to the support plate.
    parts.append('<path d="M190 410L760 410L850 635L280 635Z" fill="url(#glass)" stroke="url(#edge)" stroke-width="2"/>')
    for hole, slot in sorted(occupied.items()):
        row, col = divmod(hole, 3)
        x, y = 290 + col * 175 + row * 27, 335 + row * 76
        photo = photos.get(slot["product_id"])
        if not photo:
            raise ValueError(f'No usable product photo for {slot["name"]}.')
        parts.append(f'<defs><clipPath id="slot{hole}"><ellipse cx="{x}" cy="{y}" rx="79" ry="57"/></clipPath></defs>')
        # Normal alpha compositing is essential: multiply made the stems
        # visible THROUGH opaque petals. Catalog transparency is preserved.
        parts.append(f'<image href="{photo}" x="{x-79}" y="{y-57}" width="158" height="114" preserveAspectRatio="xMidYMid slice" clip-path="url(#slot{hole})" filter="url(#bloomShadow)"><title>{escape(slot["name"])}</title></image>')
    parts.extend([
        '<path d="M280 515H850V805H280Z" fill="url(#glass)" stroke="url(#edge)" stroke-width="4"/>',
        '<path d="M190 270L760 270L850 495L280 495Z" fill="none" stroke="url(#edge)" stroke-width="3"/>',
        '<path d="M190 270V290M760 270V290M850 495V515M280 495V515" stroke="url(#edge)" stroke-width="2"/>',
        '<path d="M195 297L756 297M286 523V797M842 525V797" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="2"/>',
        '<path d="M292 529L327 529L400 796H366Z" fill="#fff" opacity=".09"/>',
        '<ellipse cx="565" cy="747" rx="89" ry="30" fill="#fffdf1" stroke="#438446" stroke-width="2"/>',
        '<text x="565" y="755" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="25" fill="#32773e">Esting’s</text>',
        '<text x="512" y="915" text-anchor="middle" font-family="sans-serif" font-size="17" fill="#7d8780">Your selected flowers · placement preview</text>',
        ])
    if ribbon:
        photo = photos.get(ribbon["product_id"])
        if not photo:
            raise ValueError("The selected ribbon needs a usable product photo.")
        parts.append(
            f'<g id="selected-ribbon"><title>{escape(ribbon["name"])}</title>'
            f'<image href="{photo}" x="465" y="625" width="200" height="105" '
            'preserveAspectRatio="xMidYMid meet" filter="url(#bloomShadow)"/></g>'
        )
    parts.append('</svg>')
    return "data:image/svg+xml;base64," + base64.b64encode("".join(parts).encode()).decode()


async def build_box_preview(slots, storage_url, ribbon=None):
    import httpx
    # Only retrieve inventory images hosted by our configured storage origin.
    origin = urlsplit(storage_url)
    photos = {}
    async with httpx.AsyncClient(timeout=20, follow_redirects=False) as client:
        for slot in [*slots, *([ribbon] if ribbon else [])]:
            if slot["product_id"] in photos:
                continue
            url = slot.get("image_url") or ""
            parsed = urlsplit(url)
            if parsed.scheme != "https" or parsed.netloc != origin.netloc:
                raise ValueError(f'Upload a product photo to shop storage for {slot["name"]}.')
            async with client.stream("GET", url) as response:
                response.raise_for_status()
                mime = response.headers.get("content-type", "").split(";")[0]
                if mime not in {"image/png", "image/jpeg", "image/webp"}:
                    raise ValueError("Flower photos must be PNG, JPEG, or WebP.")
                data = bytearray()
                async for chunk in response.aiter_bytes():
                    data.extend(chunk)
                    if len(data) > 8_000_000:
                        raise ValueError("Flower photo exceeds 8 MB.")
            photos[slot["product_id"]] = f"data:{mime};base64," + base64.b64encode(data).decode()
    return render_box_preview(slots, photos, ribbon=ribbon)
