# Apply AI-generated outfit layers: strip the bottom-left "AI generated" mark by
# mirroring a clean neighbouring patch over it, save as the live jpg layer and
# rebuild the locked-slot silhouette from the new art.
from pathlib import Path

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
GENERATED = ROOT / 'apps' / 'web' / 'assets' / 'pals' / 'outfits' / 'generated'
OUT = ROOT / 'apps' / 'web' / 'assets' / 'pals' / 'outfits'

NAMES = [
    'linxing-starry-gown',
    'linxing-rose-waltz',
    'linxing-dawn-silk',
    'mia-mint-stage',
    'mia-violet-rock',
    'mia-sailor-wave',
]

# Watermark box in generated 1088x1456 art (bottom-left corner).
MARK_W, MARK_H = 170, 96


def strip_mark(img: Image.Image) -> Image.Image:
    w, h = img.size
    box = (0, h - MARK_H, MARK_W, h)
    # Mirror the clean area immediately right of the mark back over it.
    patch = img.crop((MARK_W, h - MARK_H, MARK_W * 2, h)).transpose(Image.FLIP_LEFT_RIGHT)
    img.paste(patch, box)
    return img


def make_silhouette(img: Image.Image) -> Image.Image:
    gray = img.convert('L')
    gray = ImageEnhance.Brightness(gray).enhance(0.32)
    navy = Image.new('RGB', gray.size, (11, 16, 32))
    return Image.blend(navy, gray.convert('RGB'), 0.42)


def main():
    for name in NAMES:
        src = GENERATED / f'{name}.png'
        img = Image.open(src).convert('RGB')
        img = strip_mark(img)
        img.save(OUT / f'{name}.jpg', quality=88)
        make_silhouette(img).save(OUT / f'{name}-silhouette.jpg', quality=82)
        print(f'applied {name} (layer + silhouette)')


if __name__ == '__main__':
    main()
