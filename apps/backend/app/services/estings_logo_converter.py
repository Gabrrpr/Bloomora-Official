from pathlib import Path
from PIL import Image
import io


def svg_to_png(svg_path: Path, png_path: Path) -> bool:
    """Attempt a best-effort conversion of SVG -> PNG.

    This uses only PIL, so it will likely fail unless the environment has an SVG-capable plugin.
    If it fails, return False.
    """
    try:
        # Some environments support SVG via external plugins.
        img = Image.open(str(svg_path)).convert("RGBA")
        img.save(str(png_path), format="PNG")
        return True
    except Exception:
        return False


if __name__ == "__main__":
    base = Path(__file__).resolve().parent
    apps_dir = base.parent.parent.parent
    public_dir = apps_dir / "web" / "public"

    svg_path = public_dir / "EstingsLogo.svg"
    png_path = public_dir / "EstingsLogo.png"

    if not svg_path.exists():
        raise SystemExit(f"SVG not found: {svg_path}")

    ok = svg_to_png(svg_path, png_path)
    if not ok:
        raise SystemExit("SVG -> PNG conversion not supported in this environment. Please add cairosvg/rsvg conversion.")

    print(f"Converted to: {png_path}")

