#!/usr/bin/env python3
"""
Regenerate every app icon from the StreakMates mark.

    python3 scripts/make-icons.py

The mark is drawn here rather than stored, so a palette change is a one-line
edit and every size stays in step. It is a geometric reading of the logo: an
"S" built from two circular bowls, swept with the brand gradient, on midnight.

REPLACING IT WITH THE REAL ARTWORK
----------------------------------
Drop the master logo in as a square PNG with a transparent background:

    assets/brand/logo-source.png

and run the script again. It is used verbatim from then on — scaled, padded to
each platform's safe zone, and flattened to white for the monochrome and
notification variants — and nothing below is drawn. That is the intended end
state; the drawn mark is a stand-in so the app is never shipping the old green
icons while waiting for a file.
"""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
SOURCE = ASSETS / "brand" / "logo-source.png"

MIDNIGHT = (8, 12, 31, 255)

# The official gradient: electric blue → violet → orchid → soft pink.
STOPS = [(0x4B, 0x61, 0xF8), (0x8B, 0x67, 0xF5), (0xC5, 0x6A, 0xE9), (0xF7, 0xA4, 0xE2)]

# Everything is drawn at 4x and downsampled, which is cheaper than antialiasing
# an arc by hand and gives a cleaner edge than PIL's own.
SS = 4


def gradient_image(size, stops=STOPS):
    """A diagonal sweep, top-left to bottom-right, the way the wordmark runs."""
    img = Image.new("RGB", (size, size))
    px = img.load()
    n = len(stops) - 1
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            seg = min(int(t * n), n - 1)
            f = t * n - seg
            a, b = stops[seg], stops[seg + 1]
            px[x, y] = tuple(round(a[i] + (b[i] - a[i]) * f) for i in range(3))
    return img


def mark_mask(size):
    """
    The S, as a mask.

    Drawn as a spine rather than as two PIL arcs. Two arcs of equal radius,
    stacked and each swept past the halfway point so they overlap through the
    waist, is what makes an S; two arcs that merely touch read as a C above a
    reversed C, and two that touch at a single point leave a visible break.
    The overlap is the letter.

    The stroke is laid down as a dense run of discs along the spine, which
    gives round caps and round joins for free — a polyline with a width would
    give mitred corners at every sample.
    """
    from math import cos, sin, radians

    n = size * SS
    mask = Image.new("L", (n, n), 0)
    d = ImageDraw.Draw(mask)

    r = n * 0.205
    stroke = n * 0.115
    cx = n / 2

    def sweep(cy, a0, a1):
        steps = 720
        for i in range(steps + 1):
            th = radians(a0 + (a1 - a0) * i / steps)
            x = cx + r * cos(th)
            y = cy + r * sin(th)
            d.ellipse(
                [x - stroke / 2, y - stroke / 2, x + stroke / 2, y + stroke / 2], fill=255
            )

    # Upper bowl: open at the top right, round over the top and down the left,
    # finishing past centre. Lower bowl: picks up past centre, round the right
    # and the bottom, finishing open at the lower left.
    sweep(n / 2 - r, 300, 100)
    sweep(n / 2 + r, 280, 530)

    return mask.resize((size, size), Image.LANCZOS)


def source_mask(size):
    """The alpha channel of the supplied artwork, as a mask."""
    art = Image.open(SOURCE).convert("RGBA").resize((size, size), Image.LANCZOS)
    return art.split()[3]


def mark(size, scale=1.0, white=False):
    """
    The mark on a transparent square.

    `scale` shrinks it inside the square, for Android's safe zone. `white`
    flattens it for the monochrome and notification variants, which Android
    tints itself and which must therefore be a silhouette, not a picture.
    """
    inner = max(1, round(size * scale))
    mask = source_mask(inner) if SOURCE.exists() else mark_mask(inner)
    body = Image.new("RGB", (inner, inner), (255, 255, 255)) if white else gradient_image(inner)

    if SOURCE.exists() and not white:
        body = Image.open(SOURCE).convert("RGBA").resize((inner, inner), Image.LANCZOS).convert("RGB")

    layer = Image.new("RGBA", (inner, inner), (0, 0, 0, 0))
    layer.paste(body, (0, 0), mask)

    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    off = (size - inner) // 2
    out.paste(layer, (off, off), layer)
    return out


def on_midnight(size, scale=1.0, radius=None):
    """The mark on the brand's own ground, optionally with rounded corners."""
    plate = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ground = Image.new("RGBA", (size, size), MIDNIGHT)
    if radius:
        corner = Image.new("L", (size * SS, size * SS), 0)
        ImageDraw.Draw(corner).rounded_rectangle(
            [0, 0, size * SS - 1, size * SS - 1], radius=radius * SS, fill=255
        )
        ground.putalpha(corner.resize((size, size), Image.LANCZOS))
    plate.alpha_composite(ground)
    plate.alpha_composite(mark(size, scale))
    return plate


def write(img, name):
    path = ASSETS / name
    img.save(path)
    print(f"  {name:34} {img.size[0]}x{img.size[1]}")


def main():
    print("Source:", "assets/brand/logo-source.png" if SOURCE.exists() else "drawn from brand geometry")

    # Full-bleed square. iOS applies its own corner mask, so drawing one here
    # would show as a dark ring inside the real one.
    write(on_midnight(1024, scale=0.72), "icon.png")

    # The sign-in mark and the splash, on transparent so both themes work.
    write(mark(512, scale=0.92), "splash-icon.png")

    # Android's adaptive icon: the outer 1/6 on every side is cropped away by
    # the launcher's own shape, so the mark only gets the inner 66%.
    write(Image.new("RGBA", (432, 432), MIDNIGHT), "android-icon-background.png")
    write(mark(432, scale=0.46), "android-icon-foreground.png")
    write(mark(432, scale=0.46, white=True), "android-icon-monochrome.png")

    # Android tints the notification icon itself and keeps only the alpha, so
    # this has to be a white silhouette.
    write(mark(96, scale=0.86, white=True), "notification-icon.png")

    write(on_midnight(64, scale=0.72, radius=14), "favicon.png")


if __name__ == "__main__":
    main()
