"""앙부일구 앱의 아이콘과 스플래시를 그린다.

눈금 좌표는 앱의 계산 코드에서 뽑은 것을 그대로 쓴다.
그래서 아이콘의 눈금은 화면에 뜨는 눈금과 같은 곡선이다.

  npm run render-art
"""

import json
import math
import os
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
GEOMETRY = Path(os.environ.get("GEO_JSON", ROOT / "dial-geometry.json"))
OUT = Path(os.environ.get("ART_OUT", ROOT / "assets"))

# 밤의 잉크빛과 상아빛. 이 둘과 그 사이의 섞임만 쓴다.
NIGHT = (14, 21, 38)
NIGHT_DEEP = (7, 11, 21)
NIGHT_LIFT = (30, 42, 68)
IVORY_BRIGHT = (247, 240, 227)
IVORY = (233, 221, 202)
IVORY_DIM = (186, 171, 148)
STONE = (120, 108, 90)
ENGRAVE = (92, 82, 68)
GLOW = (255, 217, 160)
SHADOW_INK = (26, 22, 18)

SS = 4  # 4배로 그린 뒤 줄여서 가장자리를 매끄럽게 한다

# 명조체. 획이 가늘어 이 철학의 글자에 맞는다.
SERIF = "/System/Library/Fonts/Supplemental/AppleMyungjo.ttf"


def lerp(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def radial_mask(size, inner, outer, center=None):
    """가운데가 밝고 바깥이 어두운 마스크. 오목함과 비네트에 쓴다.

    중심을 옮길 때는 두 배 크기로 만든 뒤 잘라 쓴다. 옮기면서 생기는
    빈 자리를 채우면 그 경계가 이음매로 드러나기 때문이다.
    """
    if center is None:
        base = Image.radial_gradient("L").resize((size, size), Image.LANCZOS)
    else:
        big = Image.radial_gradient("L").resize((size * 2, size * 2), Image.LANCZOS)
        cx, cy = center
        left = round(size - cx)
        top = round(size - cy)
        base = big.crop((left, top, left + size, top + size))
    return base.point(lambda v: round(inner + (outer - inner) * (v / 255)))


def grain(size, strength, seed):
    """종이와 돌의 결. 완전히 평평한 면을 남기지 않는다."""
    rng = random.Random(seed)
    small = Image.new("L", (size // 3, size // 3))
    small.putdata([rng.randint(0, 255) for _ in range(small.width * small.height)])
    noise = small.resize((size, size), Image.BICUBIC).filter(ImageFilter.GaussianBlur(0.6))
    return noise.point(lambda v: round(128 + (v - 128) * strength))


def night_ground(size, seed=7):
    """밤 바탕. 위가 조금 밝고 아래로 가라앉는다."""
    sky = Image.new("RGB", (1, size))
    for y in range(size):
        t = y / (size - 1)
        sky.putpixel((0, y), lerp(NIGHT_LIFT, NIGHT_DEEP, t ** 0.75))
    ground = sky.resize((size, size), Image.BICUBIC)

    lift = Image.new("RGB", (size, size), NIGHT)
    ground = Image.composite(lift, ground, radial_mask(size, 90, 0))

    texture = grain(size, 0.10, seed).convert("RGB")
    return Image.blend(ground, Image.blend(ground, texture, 0.5), 0.16)


def draw_polyline(draw, points, scale, offset, color, width, closed=False):
    pts = [(offset[0] + p["x"] * scale, offset[1] + p["y"] * scale) for p in points]
    if len(pts) < 2:
        return
    draw.line(pts + ([pts[0]] if closed else []), fill=color, width=max(1, round(width)),
              joint="curve")


def bowl_layer(size, geo, radius_ratio, *, grid=True, seed=3):
    """오목한 그릇 하나. 반복되는 눈금 사이에 빛나는 점 하나를 둔다."""
    s = size * SS
    r = s * radius_ratio / 2
    cx = cy = s / 2
    layer = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    box = (cx - r, cy - r, cx + r, cy + r)
    draw.ellipse(box, fill=IVORY + (255,))

    # 안쪽이 아래로 깊어지는 명암. 빛은 왼쪽 위에서 온다.
    shade_size = round(2 * r)
    column = Image.new("RGB", (1, shade_size))
    for y in range(shade_size):
        t = y / (shade_size - 1)
        column.putpixel((0, y), lerp(IVORY_BRIGHT, lerp(IVORY, IVORY_DIM, 0.55), t ** 1.15))
    shade = column.resize((shade_size, shade_size), Image.BICUBIC)

    warm = Image.new("RGB", (shade_size, shade_size), (255, 250, 240))
    shade = Image.composite(
        warm, shade,
        radial_mask(shade_size, 120, 0, center=(shade_size * 0.34, shade_size * 0.28)),
    )
    circle = Image.new("L", (shade_size, shade_size), 0)
    ImageDraw.Draw(circle).ellipse((0, 0, shade_size - 1, shade_size - 1), fill=255)
    circle = circle.filter(ImageFilter.GaussianBlur(shade_size * 0.004))
    layer.paste(shade, (round(cx - r), round(cy - r)), circle)

    # 그릇 벽이 만드는 안쪽 그림자
    ring = Image.new("L", (s, s), 0)
    ImageDraw.Draw(ring).ellipse(box, outline=255, width=round(r * 0.14))
    ring = ring.filter(ImageFilter.GaussianBlur(r * 0.07))
    dark = Image.new("RGBA", (s, s), lerp(STONE, SHADOW_INK, 0.35) + (105,))
    layer = Image.alpha_composite(layer, Image.composite(
        dark, Image.new("RGBA", (s, s), (0, 0, 0, 0)), ring))
    draw = ImageDraw.Draw(layer)

    scale, offset = r, (cx, cy)

    if grid:
        for line in geo["solarTermLines"]:
            for run in line["outside"]:
                draw_polyline(draw, run, scale, offset, ENGRAVE + (85,), r * 0.006)
            for run in line["inside"]:
                draw_polyline(draw, run, scale, offset, ENGRAVE + (165,), r * 0.009)
        for line in geo["hourLines"]:
            major = line["isMajor"]
            draw_polyline(draw, line["points"], scale, offset,
                          ENGRAVE + (235 if major else 145,),
                          r * (0.017 if major else 0.007))

    # 테. 닳아 둥글어진 가장자리.
    draw.ellipse(box, outline=lerp(IVORY, (255, 252, 246), 0.7) + (235,), width=round(r * 0.05))
    draw.ellipse(box, outline=lerp(STONE, SHADOW_INK, 0.2) + (90,), width=round(r * 0.012))

    # 그림자. 영침 뿌리에서 그 시각의 시각선을 따라 뻗는다.
    shadow = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    draw_polyline(sdraw, geo["shadow"]["rod"], scale, offset, SHADOW_INK + (165,), r * 0.034)
    shadow = shadow.filter(ImageFilter.GaussianBlur(r * 0.012))
    layer = Image.alpha_composite(layer, shadow)
    draw = ImageDraw.Draw(layer)

    # 영침
    root = geo["gnomonRoot"]
    draw.line(
        [(cx + root["x"] * scale, cy + root["y"] * scale), (cx, cy)],
        fill=lerp(STONE, SHADOW_INK, 0.55) + (255,), width=round(r * 0.026),
    )
    draw.ellipse((cx - r * 0.026, cy - r * 0.026, cx + r * 0.026, cy + r * 0.026),
                 fill=lerp(STONE, SHADOW_INK, 0.55) + (255,))

    # 하나뿐인 예외. 시선이 머무는 자리.
    tip = geo["shadow"]["tip"]
    tx, ty = cx + tip["x"] * scale, cy + tip["y"] * scale
    halo = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(halo)
    for k, alpha in ((0.30, 46), (0.19, 78), (0.10, 128)):
        hdraw.ellipse((tx - r * k, ty - r * k, tx + r * k, ty + r * k), fill=GLOW + (alpha,))
    halo = halo.filter(ImageFilter.GaussianBlur(r * 0.035))
    layer = Image.alpha_composite(layer, halo)
    draw = ImageDraw.Draw(layer)
    draw.ellipse((tx - r * 0.030, ty - r * 0.030, tx + r * 0.030, ty + r * 0.030),
                 fill=SHADOW_INK + (255,))
    draw.ellipse((tx - r * 0.013, ty - r * 0.013, tx + r * 0.013, ty + r * 0.013),
                 fill=lerp(GLOW, (255, 255, 255), 0.5) + (255,))

    return layer.resize((size, size), Image.LANCZOS)


def motes(size, count, seed, spread=1.0, scale=1.0):
    """떠 있는 빛알. 반복 속에서 공기를 만든다."""
    rng = random.Random(seed)
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    for _ in range(count):
        a = rng.uniform(0, math.tau)
        d = (rng.random() ** 0.55) * size * 0.52 * spread
        x, y = size / 2 + math.cos(a) * d, size / 2 + math.sin(a) * d * 1.05
        rad = size * rng.uniform(0.0012, 0.0036) * scale
        alpha = round(rng.uniform(30, 150))
        draw.ellipse((x - rad, y - rad, x + rad, y + rad), fill=IVORY + (alpha,))
    return layer.filter(ImageFilter.GaussianBlur(size * 0.0016))


def vignette(image, strength=120):
    size = image.width
    dark = Image.new("RGB", (size, size), NIGHT_DEEP)
    return Image.composite(image, dark, radial_mask(size, 255, 255 - strength))


def render_icon(geo, size=1024):
    base = night_ground(size)
    base = Image.alpha_composite(base.convert("RGBA"), motes(size, 26, 11, spread=1.05))
    bowl = bowl_layer(size, geo, 0.74)
    base = Image.alpha_composite(base, bowl)
    return vignette(base.convert("RGB"), 96)


def render_adaptive_foreground(geo, size=1024):
    """적응형 아이콘의 앞면.

    안드로이드는 108 중 66만 보여 준다. 런처가 앞면을 흔들어 보이기도 하므로
    그보다 더 여유를 두어야 어느 런처에서도 잘리지 않는다.
    """
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    layer = Image.alpha_composite(layer, bowl_layer(size, geo, 0.52))
    return layer


def render_adaptive_background(size=1024):
    base = night_ground(size, seed=21)
    base = Image.alpha_composite(base.convert("RGBA"), motes(size, 20, 5, spread=1.25))
    return vignette(base.convert("RGB"), 70)


def render_monochrome(geo, size=1024):
    """테마 아이콘. 실루엣만 남긴다."""
    s = size * SS
    layer = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    r = s * 0.30
    cx = cy = s / 2
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(255, 255, 255, 255),
                 width=round(r * 0.10))
    root = geo["gnomonRoot"]
    draw.line([(cx + root["x"] * r, cy + root["y"] * r), (cx, cy)],
              fill=(255, 255, 255, 255), width=round(r * 0.09))
    tip = geo["shadow"]["tip"]
    tx, ty = cx + tip["x"] * r, cy + tip["y"] * r
    draw.ellipse((tx - r * 0.10, ty - r * 0.10, tx + r * 0.10, ty + r * 0.10),
                 fill=(255, 255, 255, 255))
    return layer.resize((size, size), Image.LANCZOS)


def render_splash_logo(geo, size=1152):
    """시스템이 띄우는 첫 화면의 가운데 그림.

    안드로이드는 이 그림을 동그랗게 잘라 보여 주므로 안쪽에만 담는다.
    """
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    return Image.alpha_composite(layer, bowl_layer(size, geo, 0.56))


def render_splash(geo, width=1440, height=3120):
    """세로로 긴 화면을 기준으로 삼되, 어느 비율에서 잘려도 중심이 남게 둔다."""
    sky = Image.new("RGB", (1, height))
    for y in range(height):
        t = y / (height - 1)
        # 위와 아래로 갈수록 가라앉는 하나의 곡선. 꺾이는 곳이 없어야 띠가 생기지 않는다.
        depth = (math.sin(math.pi * t) ** 1.6)
        sky.putpixel((0, y), lerp(NIGHT_DEEP, NIGHT, depth))
    canvas = sky.resize((width, height), Image.BICUBIC)

    # 중심을 데우는 숨
    breath_size = max(width, height)
    breath = Image.new("RGB", (breath_size, breath_size), lerp(NIGHT, NIGHT_LIFT, 0.55))
    mask = radial_mask(breath_size, 120, 0)
    breath_box = ((breath_size - width) // 2, (breath_size - height) // 2)
    canvas.paste(
        breath.crop((breath_box[0], breath_box[1], breath_box[0] + width, breath_box[1] + height)),
        (0, 0),
        mask.crop((breath_box[0], breath_box[1], breath_box[0] + width, breath_box[1] + height)),
    )

    texture = grain(max(width, height), 0.09, 31).convert("RGB").crop((0, 0, width, height))
    canvas = Image.blend(canvas, Image.blend(canvas, texture, 0.5), 0.15)
    canvas = canvas.convert("RGBA")

    # 빛알을 화면 전체에 흩는다
    field = motes(max(width, height), 150, 17, spread=1.4, scale=1.0)
    canvas = Image.alpha_composite(
        canvas, field.crop((breath_box[0], breath_box[1],
                            breath_box[0] + width, breath_box[1] + height)))

    # 그릇은 가운데보다 조금 위에 둔다
    bowl_size = round(width * 0.68)
    bowl = bowl_layer(bowl_size, geo, 0.98)
    bx = (width - bowl_size) // 2
    by = round(height * 0.415) - bowl_size // 2
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gsize = round(bowl_size * 1.9)
    gmask = radial_mask(gsize, 70, 0)
    gcolor = Image.new("RGB", (gsize, gsize), lerp(NIGHT_LIFT, GLOW, 0.20))
    glow.paste(gcolor, (bx - (gsize - bowl_size) // 2, by - (gsize - bowl_size) // 2), gmask)
    canvas = Image.alpha_composite(canvas, glow)
    canvas.alpha_composite(bowl, (bx, by))

    # 이름. 드물게 쓰는 글자 하나.
    title = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    tdraw = ImageDraw.Draw(title)
    name_size = round(width * 0.072)
    name_font = ImageFont.truetype(SERIF, name_size)
    name_y = by + bowl_size + round(height * 0.052)
    tdraw.text((width / 2, name_y), "앙부일구", font=name_font,
               fill=IVORY + (205,), anchor="mt")

    hanja_size = round(width * 0.030)
    hanja_font = ImageFont.truetype(SERIF, hanja_size)
    tdraw.text((width / 2, name_y + round(name_size * 1.55)), "仰 釜 日 晷",
               font=hanja_font, fill=IVORY + (92,), anchor="mt")

    # 글자 아래 아주 짧은 선. 이름을 바닥에 앉힌다.
    rule_y = name_y + round(name_size * 2.5)
    tdraw.line([(width / 2 - width * 0.055, rule_y), (width / 2 + width * 0.055, rule_y)],
               fill=IVORY + (58,), width=2)
    canvas = Image.alpha_composite(canvas, title)

    # 가장자리를 바탕색으로 눌러, 어떤 비율에서 잘려도 이음매가 보이지 않게 한다
    edge = Image.new("RGB", (width, height), NIGHT_DEEP)
    fade = Image.new("L", (width, height), 0)
    fdraw = ImageDraw.Draw(fade)
    band = round(min(width, height) * 0.10)
    for i in range(band):
        v = round(210 * (1 - i / band) ** 1.6)
        fdraw.rectangle((i, i, width - 1 - i, height - 1 - i), outline=v)
    return Image.composite(edge, canvas.convert("RGB"), fade)


def main():
    geo = json.loads(GEOMETRY.read_text())
    OUT.mkdir(parents=True, exist_ok=True)

    icon = render_icon(geo)
    icon.save(OUT / "icon.png")
    icon.resize((196, 196), Image.LANCZOS).save(OUT / "favicon.png")
    render_adaptive_foreground(geo).save(OUT / "android-icon-foreground.png")
    render_adaptive_background().save(OUT / "android-icon-background.png")
    render_monochrome(geo).save(OUT / "android-icon-monochrome.png")
    render_splash_logo(geo).save(OUT / "splash-logo.png")
    render_splash(geo).save(OUT / "splash.png")
    print("그림 완성:", ", ".join(sorted(p.name for p in OUT.glob("*.png"))))


if __name__ == "__main__":
    main()
