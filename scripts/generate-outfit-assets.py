# Generate layered outfit assets for photo cards and dress-up performance.
# For each pal x outfit: recolored outfit variant (jpg), transparent effect layer (png),
# and a dark silhouette (jpg) used for locked gallery slots.
import numpy as np
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PALS = ROOT / 'apps' / 'web' / 'assets' / 'pals'
OUT = PALS / 'outfits'
OUT.mkdir(parents=True, exist_ok=True)
SIZE = (600, 800)

OUTFITS = {
    'linxing': {
        'source': PALS / 'linxing-v1.png',
        'hue_window': (120, 200),
        'entries': [
            ('starry-gown', 0, 1.06, 1.04, '#f5d78c', 'stars'),
            ('rose-waltz', 100, 1.02, 1.10, '#ff9ec7', 'petals'),
            ('dawn-silk', 134, 1.10, 0.98, '#ffd9a0', 'rays'),
        ],
    },
    'mia': {
        'source': PALS / 'mia-v1.png',
        'hue_window': (85, 165),
        'entries': [
            ('mint-stage', 0, 1.05, 1.05, '#9ff0d2', 'ribbons'),
            ('violet-rock', 130, 1.04, 1.08, '#c9a7ff', 'bolts'),
            ('sailor-wave', 45, 1.03, 1.06, '#8fd4ff', 'waves'),
        ],
    },
}


def hue_shift(img: Image.Image, degrees: float, window=(0, 255)) -> Image.Image:
    """Shift hue only for saturated pixels inside the clothing/background hue window.

    Skin, lips, gold trim and low-saturation whites keep their original colour.
    """
    if not degrees:
        return img.convert('RGB')
    hsv = np.asarray(img.convert('HSV'), dtype=np.int16)
    hue, sat = hsv[..., 0], hsv[..., 1]
    low, high = window
    in_window = (hue >= low) & (hue <= high) if low <= high else (hue >= low) | (hue <= high)
    mask = in_window & (sat > 40)
    delta = round(degrees / 360 * 255)
    shifted = hsv.copy()
    shifted[..., 0] = np.where(mask, (hue + delta) % 256, hue)
    return Image.fromarray(shifted.astype(np.uint8), 'HSV').convert('RGB')


def star(draw, cx, cy, r, color):
    points = []
    for i in range(8):
        angle = i * 3.14159 / 4
        radius = r if i % 2 == 0 else r * 0.38
        points.append((cx + radius * np.cos(angle), cy + radius * np.sin(angle)))
    draw.polygon(points, fill=color)


def decorate(layer: Image.Image, kind: str, color: str, seed: int):
    rng = np.random.default_rng(seed)
    draw = ImageDraw.Draw(layer)
    w, h = layer.size
    if kind == 'stars':
        for _ in range(46):
            x, y = rng.integers(0, w), rng.integers(0, int(h * 0.72))
            star(draw, x, y, rng.integers(3, 9), color)
    elif kind == 'petals':
        for _ in range(30):
            x, y = rng.integers(0, w), rng.integers(0, h)
            rx, ry = rng.integers(6, 14), rng.integers(3, 7)
            angle = rng.uniform(0, 3.14159)
            bbox = [x - rx, y - ry, x + rx, y + ry]
            draw.ellipse(bbox, outline=color, width=3)
            draw.line([x, y, x + rx * np.cos(angle), y + ry * np.sin(angle)], fill=color, width=2)
    elif kind == 'rays':
        cx, cy = w * 0.5, h * 0.18
        for i in range(14):
            angle = i * 3.14159 / 7 + 0.12
            draw.line([cx, cy, cx + w * np.cos(angle), cy + h * np.sin(angle)], fill=color, width=4)
    elif kind == 'ribbons':
        for offset in (-0.18, 0.16):
            points = [(x, h * (0.30 + offset) + 26 * np.sin(x / 46)) for x in range(0, w + 8, 8)]
            draw.line(points, fill=color, width=6)
    elif kind == 'bolts':
        for _ in range(9):
            x, y = rng.integers(int(w * 0.1), int(w * 0.9)), rng.integers(int(h * 0.1), int(h * 0.7))
            pts = [(x, y), (x + 14, y + 26), (x + 2, y + 26), (x + 16, y + 54), (x - 8, y + 22), (x + 4, y + 22)]
            draw.polygon(pts, outline=color, width=3)
    elif kind == 'waves':
        for row in range(3):
            y0 = h * (0.62 + row * 0.12)
            points = [(x, y0 + 14 * np.sin(x / 38 + row)) for x in range(0, w + 8, 8)]
            draw.line(points, fill=color, width=5)
    return layer


def spotlight(img: Image.Image, color: str) -> Image.Image:
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    w, h = img.size
    rgb = tuple(int(color[i:i + 2], 16) for i in (1, 3, 5))
    draw.ellipse([w * 0.08, -h * 0.28, w * 0.92, h * 0.42], fill=rgb + (46,))
    overlay = overlay.filter(ImageFilter.GaussianBlur(40))
    return Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')


def make_silhouette(img: Image.Image) -> Image.Image:
    gray = img.convert('L')
    gray = ImageEnhance.Brightness(gray).enhance(0.32)
    navy = Image.new('RGB', gray.size, (11, 16, 32))
    return Image.blend(navy, gray.convert('RGB'), 0.42)


def main():
    for pal, config in OUTFITS.items():
        base = Image.open(config['source']).convert('RGB').resize(SIZE, Image.LANCZOS)
        for index, (outfit_id, degrees, sat, bright, color, kind) in enumerate(config['entries']):
            variant = hue_shift(base, degrees, config['hue_window'])
            variant = ImageEnhance.Color(variant).enhance(sat)
            variant = ImageEnhance.Brightness(variant).enhance(bright)
            variant = spotlight(variant, color)
            variant.save(OUT / f'{pal}-{outfit_id}.jpg', quality=88)

            fx = Image.new('RGBA', SIZE, (0, 0, 0, 0))
            fx = decorate(fx, kind, color, seed=index * 97 + len(pal))
            fx.save(OUT / f'{pal}-{outfit_id}-fx.png')

            make_silhouette(variant).save(OUT / f'{pal}-{outfit_id}-silhouette.jpg', quality=82)
            print(f'generated {pal}-{outfit_id} (variant + fx + silhouette)')


if __name__ == '__main__':
    main()
