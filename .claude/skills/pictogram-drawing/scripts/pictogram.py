"""코드로 그림을 그릴 때 쓰는 기본 도형과 확인용 시트.

경로 문자열을 만드는 함수들과, 만든 그림을 한 장에 모아 보는 도구다.
작은 크기로 함께 뽑아 주는 것이 핵심이다. 대부분의 실패는 300픽셀에서는
안 보이고 32픽셀에서 드러난다.

  from pictogram import ellipse, ribbon, contact_sheet
"""

import math
from pathlib import Path

__all__ = [
    "ellipse", "circle", "poly", "ribbon", "blob", "arc_stroke",
    "contact_sheet", "BOX",
]

BOX = 100.0


def _f(v: float) -> str:
    return f"{v:.2f}".rstrip("0").rstrip(".")


def ellipse(cx, cy, rx, ry, rot=0.0):
    """기울일 수 있는 타원. 몸통과 머리에 쓴다."""
    a = math.radians(rot)
    dx, dy = 2 * rx * math.cos(a), 2 * rx * math.sin(a)
    sx, sy = cx - rx * math.cos(a), cy - rx * math.sin(a)
    return (
        f"M{_f(sx)},{_f(sy)}"
        f"a{_f(rx)},{_f(ry)} {_f(rot)} 1,0 {_f(dx)},{_f(dy)}"
        f"a{_f(rx)},{_f(ry)} {_f(rot)} 1,0 {_f(-dx)},{_f(-dy)}Z"
    )


def circle(cx, cy, r):
    return ellipse(cx, cy, r, r)


def poly(points):
    """곧은 변으로 닫힌 도형. 부리, 귀, 뿔에 쓴다."""
    head = f"M{_f(points[0][0])},{_f(points[0][1])}"
    return head + "".join(f"L{_f(x)},{_f(y)}" for x, y in points[1:]) + "Z"


def _unit(vx, vy):
    n = math.hypot(vx, vy) or 1.0
    return vx / n, vy / n


def ribbon(p0, ctrl, p1, w0, w1):
    """굵기가 변하는 곡선 띠. 꼬리, 뿔, 갈기, 수염에 쓴다."""
    n0 = _unit(ctrl[0] - p0[0], ctrl[1] - p0[1])
    n1 = _unit(p1[0] - ctrl[0], p1[1] - ctrl[1])
    nm = _unit(p1[0] - p0[0], p1[1] - p0[1])

    def side(p, n, w, sign):
        return p[0] + sign * -n[1] * w / 2, p[1] + sign * n[0] * w / 2

    a, b = side(p0, n0, w0, 1), side(p1, n1, w1, 1)
    c, d = side(p1, n1, w1, -1), side(p0, n0, w0, -1)
    wm = (w0 + w1) / 2
    co, ci = side(ctrl, nm, wm, 1), side(ctrl, nm, wm, -1)
    return (
        f"M{_f(a[0])},{_f(a[1])}Q{_f(co[0])},{_f(co[1])} {_f(b[0])},{_f(b[1])}"
        f"L{_f(c[0])},{_f(c[1])}Q{_f(ci[0])},{_f(ci[1])} {_f(d[0])},{_f(d[1])}Z"
    )


def blob(points):
    """점들을 부드럽게 이은 덩어리. 정해진 틀이 없는 몸에 쓴다."""
    pts = list(points) + [points[0]]
    out = f"M{_f(pts[0][0])},{_f(pts[0][1])}"
    for i in range(1, len(pts)):
        px, py = pts[i - 1]
        cx, cy = pts[i]
        out += f"Q{_f(px)},{_f(py)} {_f((px + cx) / 2)},{_f((py + cy) / 2)}"
    return out + "Z"


def arc_stroke(cx, cy, r, start_deg, end_deg, width):
    """원호를 따라가는 굵기 일정한 띠. 코일, 테, 볏에 쓴다."""
    outer, inner = r + width / 2, r - width / 2
    a0, a1 = math.radians(start_deg), math.radians(end_deg)
    large = 1 if abs(end_deg - start_deg) > 180 else 0
    p0 = (cx + outer * math.cos(a0), cy + outer * math.sin(a0))
    p1 = (cx + outer * math.cos(a1), cy + outer * math.sin(a1))
    p2 = (cx + inner * math.cos(a1), cy + inner * math.sin(a1))
    p3 = (cx + inner * math.cos(a0), cy + inner * math.sin(a0))
    return (
        f"M{_f(p0[0])},{_f(p0[1])}"
        f"A{_f(outer)},{_f(outer)} 0 {large},1 {_f(p1[0])},{_f(p1[1])}"
        f"L{_f(p2[0])},{_f(p2[1])}"
        f"A{_f(inner)},{_f(inner)} 0 {large},0 {_f(p3[0])},{_f(p3[1])}Z"
    )


def contact_sheet(
    figures,
    out_path,
    *,
    fill="#EFE4D2",
    background="#0E1526",
    caption="#93A2CC",
    stroke=None,
    stroke_width=0.0,
    cols=4,
):
    """그림들을 한 장에 모은다. 아래에 작은 줄을 붙여 작을 때를 함께 본다.

    figures: (이름, 경로문자열) 목록
    """
    cell, pad, small = 130, 20, 44
    rows = (len(figures) + cols - 1) // cols
    w = cols * cell + pad * 2
    h = rows * cell + pad * 3 + small + 40

    paint = f'fill="{fill}"'
    if stroke:
        paint = (
            f'fill="none" stroke="{stroke}" stroke-width="{stroke_width}"'
            ' stroke-linecap="round" stroke-linejoin="round"'
        )

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}"'
        f' viewBox="0 0 {w} {h}">',
        f'<rect width="{w}" height="{h}" fill="{background}"/>',
    ]

    for i, (name, d) in enumerate(figures):
        cx = pad + (i % cols) * cell
        cy = pad + (i // cols) * cell
        parts.append(f'<g transform="translate({cx + 15},{cy + 8})">')
        parts.append(f'<path d="{d}" {paint}/>')
        parts.append("</g>")
        parts.append(
            f'<text x="{cx + 65}" y="{cy + 122}" fill="{caption}" font-size="14"'
            f' text-anchor="middle">{name}</text>'
        )

    # 작을 때 읽히는지 보는 줄. 대부분의 실패가 여기서 드러난다.
    scale = small / BOX
    base = pad + rows * cell + pad
    parts.append(
        f'<text x="{pad}" y="{base + 14}" fill="{caption}" font-size="12">'
        "작은 크기에서 읽히는가</text>"
    )
    for i, (_, d) in enumerate(figures):
        x = pad + i * (small + 10)
        parts.append(
            f'<g transform="translate({x},{base + 24}) scale({scale})">'
            f'<path d="{d}" {paint}/></g>'
        )

    parts.append("</svg>")
    Path(out_path).write_text("\n".join(parts), encoding="utf-8")
    return out_path
