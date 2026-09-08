#!/usr/bin/env python3
"""
Regenerate every app icon from the StreakMates master logo.

    python3 scripts/make-icons.py

The master is assets/brand/logo-source.png — the artwork as supplied: a
squircle tile on midnight, a gradient "S" formed from two figures, and the
wordmark beneath. Everything the app ships is cut from that one file, so the
logo has exactly one home and a new version of it is a drop-in replacement.

WHAT EACH OUTPUT NEEDS, AND WHY THEY DIFFER
-------------------------------------------
The platforms want genuinely different things, which is why this is a script
and not a resize:

  icon.png       Full-bleed square. iOS and Android apply their OWN corner
                 mask, so shipping the artwork's rounded corners with black
                 outside them shows as dark slivers in the four corners of the
                 installed icon. The corners are filled with the tile's own
                 ground instead, and the mask lands where the artwork's
                 already-rounded edge is.

  splash-icon    Rounded, with real transparency outside the curve, so it sits
  favicon        correctly on the light sign-in screen as well as the midnight
                 splash.

  android-icon-* An adaptive icon is two layers the launcher moves relative to
                 one another, so the foreground has to be the mark ALONE on
                 transparency, and only the middle 66% of it survives the crop.

  notification   Android keeps only the alpha channel and tints the result, so
  monochrome     this must be a silhouette. A colour version renders as a
                 white blob.

The mark is lifted off its ground by luminance, not by a rectangular crop:
the ground sits around luminance 15 and the mark runs far brighter, so the
ramp below keeps the soft outer glow as partial alpha instead of cutting a
hard edge around it. The dark figures inside the S drop out too — which is
correct. On the adaptive icon they fall through to the background layer, which
is the same colour, and on the monochrome they are the negative space that
makes the mark read as two people rather than as a letter.
"""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
SOURCE = ASSETS / "brand" / "logo-source.png"

# Measured off the master rather than assumed: the tile's straight edge starts
# about 300px down a 1254px square, and its ground samples at (10, 14, 36).
CORNER = 0.239
GROUND = (10, 14, 36, 255)

# The mark's bounding box in the master, found by looking for bright pixels
# inside the glowing border and above the wordmark. Padded to a square so the
# mark keeps its proportions at every size.
MARK_BOX = (396, 182, 874, 774)

SS = 4  # supersample, then downsample — cleaner than antialiasing by hand


def master() -> Image.Image:
    if not SOURCE.exists():
        raise SystemExit(
            f"Missing {SOURCE.relative_to(ROOT)}.\n"
            "Drop the master logo in as a square PNG and run this again."
        )
    return Image.open(SOURCE).convert("RGB")


def rounded_mask(size: int, radius_fraction: float = CORNER) -> Image.Image:
    n = size * SS
    m = Image.new("L", (n, n), 0)
    ImageDraw.Draw(m).rounded_rectangle(
        [0, 0, n - 1, n - 1], radius=round(n * radius_fraction), fill=255
    )
    return m.resize((size, size), Image.LANCZOS)


def tile(size: int, bleed: bool) -> Image.Image:
    """
    The whole lockup.

    `bleed` fills the corners with the tile's own ground for the installed app
    icon, where the OS rounds it; otherwise the corners are transparent.
    """
    art = master().resize((size, size), Image.LANCZOS)
    out = Image.new("RGBA", (size, size), GROUND if bleed else (0, 0, 0, 0))
    out.paste(art, (0, 0), rounded_mask(size))
    return out


def mark(size: int, scale: float = 1.0, white: bool = False) -> Image.Image:
    """The S alone, lifted off its ground by luminance."""
    left, top, right, bottom = MARK_BOX
    side = max(right - left, bottom - top)
    cx, cy = (left + right) // 2, (top + bottom) // 2
    half = side // 2 + 12  # a little air, so the glow is not clipped
    art = master().crop((cx - half, cy - half, cx + half, cy + half))

    inner = max(1, round(size * scale))
    art = art.resize((inner, inner), Image.LANCZOS)

    # alpha = how far above the ground this pixel is. The ramp is what keeps
    # the outer glow soft instead of cutting a hard edge around the mark.
    #
    # The silhouettes need a higher, steeper ramp. Android throws the colour
    # away and paints whatever has alpha, so the mark's soft outer glow — which
    # reads as depth in colour — comes back as a grey smudge trailing off the
    # bottom-right of an otherwise crisp white shape. Cutting nearer the solid
    # body of the mark leaves the silhouette and drops the glow.
    LOW, HIGH = (64, 96) if white else (22, 78)
    alpha = Image.new("L", (inner, inner))
    src, dst = art.load(), alpha.load()
    for y in range(inner):
        for x in range(inner):
            r, g, b = src[x, y]
            lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
            dst[x, y] = max(0, min(255, round((lum - LOW) / (HIGH - LOW) * 255)))

    body = Image.new("RGB", (inner, inner), (255, 255, 255)) if white else art
    layer = Image.new("RGBA", (inner, inner), (0, 0, 0, 0))
    layer.paste(body, (0, 0), alpha)

    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    off = (size - inner) // 2
    out.paste(layer, (off, off), layer)
    return out


def write(img: Image.Image, name: str) -> None:
    img.save(ASSETS / name)
    print(f"  {name:34} {img.size[0]}x{img.size[1]}")


def main() -> None:
    print(f"Source: {SOURCE.relative_to(ROOT)}")

    write(tile(1024, bleed=True), "icon.png")
    write(tile(512, bleed=False), "splash-icon.png")
    write(tile(64, bleed=False), "favicon.png")

    write(Image.new("RGBA", (432, 432), GROUND), "android-icon-background.png")
    write(mark(432, scale=0.60), "android-icon-foreground.png")
    write(mark(432, scale=0.60, white=True), "android-icon-monochrome.png")
    write(mark(96, scale=0.92, white=True), "notification-icon.png")


if __name__ == "__main__":
    main()
