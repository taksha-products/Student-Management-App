"""Build Expo icon assets from the EduNex master mark."""

from collections import deque
from pathlib import Path

from PIL import Image

SRC = Path(
    r"C:\Users\nisha\.cursor\projects\d-Projects-School-Management-Parent-App\assets\edunex-icon-master.jpg"
)
OUT = Path(__file__).resolve().parents[1] / "assets"
PEACH = (255, 243, 232, 255)


def is_outer_peach(r: int, g: int, b: int) -> bool:
    """Warm near-white peach used as the master canvas — not the orange mark."""
    return r >= 240 and g >= 220 and b >= 200 and (r - b) < 55 and abs(r - g) < 35


def flood_transparent(img: Image.Image) -> Image.Image:
    """Make connected outer peach transparent; keep orange mark + white cap."""
    w, h = img.size
    px = img.load()
    out = img.copy()
    out_px = out.load()
    seen = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    for x, y in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        r, g, b, _a = px[x, y]
        if is_outer_peach(r, g, b):
            q.append((x, y))
            seen[y][x] = True

    while q:
        x, y = q.popleft()
        out_px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if nx < 0 or ny < 0 or nx >= w or ny >= h or seen[ny][nx]:
                continue
            r, g, b, _a = px[nx, ny]
            if not is_outer_peach(r, g, b):
                continue
            seen[ny][nx] = True
            q.append((nx, ny))
    return out


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    master = Image.open(SRC).convert("RGBA")
    icon = master.resize((1024, 1024), Image.Resampling.LANCZOS)
    icon.save(OUT / "icon.png", "PNG")
    icon.resize((196, 196), Image.Resampling.LANCZOS).save(OUT / "favicon.png", "PNG")

    Image.new("RGBA", (1024, 1024), PEACH).save(OUT / "android-icon-background.png", "PNG")

    cutout = flood_transparent(icon)
    bbox = cutout.getbbox()
    if not bbox:
        raise SystemExit("No foreground content detected")
    content = cutout.crop(bbox)

    safe = 680
    scale = min(safe / content.width, safe / content.height)
    new_size = (max(1, int(content.width * scale)), max(1, int(content.height * scale)))
    content_scaled = content.resize(new_size, Image.Resampling.LANCZOS)

    foreground = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    ox = (1024 - content_scaled.width) // 2
    oy = (1024 - content_scaled.height) // 2
    foreground.paste(content_scaled, (ox, oy), content_scaled)
    foreground.save(OUT / "android-icon-foreground.png", "PNG")

    # Monochrome: white silhouette of non-transparent pixels
    mono = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    fpx = foreground.load()
    mpx = mono.load()
    for y in range(1024):
        for x in range(1024):
            _r, _g, _b, a = fpx[x, y]
            if a >= 20:
                mpx[x, y] = (255, 255, 255, 255)
    mono.save(OUT / "android-icon-monochrome.png", "PNG")

    # In-app mark — tight crop of the orange badge (no outer peach)
    content.save(OUT / "company-logo.png", "PNG")

    for name in (
        "icon.png",
        "favicon.png",
        "android-icon-background.png",
        "android-icon-foreground.png",
        "android-icon-monochrome.png",
        "company-logo.png",
    ):
        im = Image.open(OUT / name)
        print(f"{name}: {im.size} mode={im.mode}")


if __name__ == "__main__":
    main()
