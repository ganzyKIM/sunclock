#!/usr/bin/env python3
"""
12지 그림을 앱에 넣을 크기로 자른다.

원본은 `art/zodiac/<이름>.png`다. 제미나이(나노 바나나)로 그린 2048 정사각형이고,
가운데에 빛나는 원반이 있고 바깥은 평평한 크림색(#F3EBDD)이다. 앱은 이 그림을
동그랗게 오려 쓰므로, 원반 둘레의 평평한 자리까지만 남기고 잘라 낸다. 그러면
오린 가장자리가 언제나 평평한 크림색에 떨어져 어디서 잘랐는지 보이지 않는다.

    python3 scripts/crop_zodiac.py            assets/zodiac/*.jpg 를 다시 쓴다
    python3 scripts/crop_zodiac.py --measure  원반이 어디 있는지 재기만 한다

`assets/zodiac`의 jpg를 손으로 고치지 말고 이 스크립트를 고친 뒤 다시 뽑는다.
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "art" / "zodiac"
OUT = ROOT / "assets" / "zodiac"

NAMES = [
    "rat", "ox", "tiger", "rabbit", "dragon", "snake",
    "horse", "sheep", "monkey", "rooster", "dog", "pig",
]

BACKGROUND = (0xF3, 0xEB, 0xDD)
# 원반은 그림 한가운데에 있고 반지름이 너비의 0.35쯤이다. 조금 넉넉히 잡아
# 둘레의 부드러운 빛과 평평한 크림색까지 함께 담는다.
CENTER = (0.5, 0.495)
HALF = 0.41
SIZE = 720
QUALITY = 86


def measure(image: Image.Image) -> tuple[float, float, float]:
    """배경과 다른 자리의 범위를 재어 원반의 중심과 반지름을 어림한다."""
    small = image.convert("RGB").resize((256, 256))
    flat = Image.new("RGB", small.size, BACKGROUND)
    diff = ImageChops.difference(small, flat).convert("L").point(lambda v: 255 if v > 18 else 0)
    box = diff.getbbox()
    if box is None:
        return 0.5, 0.5, 0.0
    x0, y0, x1, y1 = box
    return ((x0 + x1) / 2 / 256, (y0 + y1) / 2 / 256, max(x1 - x0, y1 - y0) / 2 / 256)


def crop(image: Image.Image) -> Image.Image:
    """원반 둘레를 정사각형으로 자르고, 앱이 오릴 원 바깥은 평평한 크림색으로 덮는다.

    제미나이가 오른쪽 아래 구석에 찍는 반짝임 표시가 그 바깥에 있다. 앱은 어차피
    원으로 오리지만, 어디에 쓰든 구석이 깨끗하도록 여기서 미리 지운다.
    """
    width, height = image.size
    cx, cy = CENTER[0] * width, CENTER[1] * height
    half = HALF * width
    box = (round(cx - half), round(cy - half), round(cx + half), round(cy + half))
    square = image.convert("RGB").crop(box).resize((SIZE, SIZE), Image.LANCZOS)

    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, SIZE - 1, SIZE - 1), fill=255)
    flat = Image.new("RGB", (SIZE, SIZE), BACKGROUND)
    return Image.composite(square, flat, mask)


def main() -> None:
    only_measure = "--measure" in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    for name in NAMES:
        source = SRC / f"{name}.png"
        if not source.exists():
            print(f"{name}: 원본이 없다 ({source})")
            continue
        image = Image.open(source)
        cx, cy, r = measure(image)
        print(f"{name:8s} 중심 ({cx:.3f}, {cy:.3f}) 반지름 {r:.3f}")
        if only_measure:
            continue
        target = OUT / f"{name}.jpg"
        crop(image).save(target, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        print(f"         -> {target.relative_to(ROOT)} {target.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
