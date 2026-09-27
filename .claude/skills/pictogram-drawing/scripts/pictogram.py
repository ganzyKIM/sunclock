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
    "contact_sheet", "spiral", "contour", "spine", "BOX",
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



def _pt(p):
    return (float(p[0]), float(p[1]))


def _is_corner(p):
    return len(p) > 2 and p[2] == "corner"


def contour(points, tightness=6.0):
    """점들을 지나는 매끈한 닫힌 윤곽. 한 붓으로 그린 실루엣에 쓴다.

    원과 타원을 겹쳐 만든 몸은 이음매가 보여 도형 모음으로 읽힌다.
    윤곽 하나가 코에서 등을 지나 배로 돌아오면 그림으로 읽힌다.

    점은 (x, y)이거나 (x, y, "corner")다. 모서리로 표시한 점에서는 곡선이
    꺾인다. 귀 끝, 뿔 끝, 발굽, 부리처럼 날카로워야 하는 자리에 쓴다.
    tightness가 클수록 곡선이 점에 바짝 붙는다.
    """
    n = len(points)
    if n < 3:
        return ""
    out = f"M{_f(points[0][0])},{_f(points[0][1])}"
    for i in range(n):
        p0 = _pt(points[(i - 1) % n])
        p1 = _pt(points[i])
        p2 = _pt(points[(i + 1) % n])
        p3 = _pt(points[(i + 2) % n])
        if _is_corner(points[i]):
            c1 = p1
        else:
            c1 = (p1[0] + (p2[0] - p0[0]) / tightness, p1[1] + (p2[1] - p0[1]) / tightness)
        if _is_corner(points[(i + 1) % n]):
            c2 = p2
        else:
            c2 = (p2[0] - (p3[0] - p1[0]) / tightness, p2[1] - (p3[1] - p1[1]) / tightness)
        out += (
            f"C{_f(c1[0])},{_f(c1[1])} {_f(c2[0])},{_f(c2[1])} "
            f"{_f(p2[0])},{_f(p2[1])}"
        )
    return out + "Z"


def _spline_samples(points, per_segment=10):
    """열린 캣멀롬 곡선을 잘게 나눠 점으로 만든다."""
    pts = [_pt(p) for p in points]
    n = len(pts)
    if n < 2:
        return pts
    ext = [pts[0]] + pts + [pts[-1]]
    out = []
    for i in range(n - 1):
        p0, p1, p2, p3 = ext[i], ext[i + 1], ext[i + 2], ext[i + 3]
        for k in range(per_segment):
            t = k / per_segment
            t2, t3 = t * t, t * t * t
            x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t
                       + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2
                       + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t
                       + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2
                       + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            out.append((x, y))
    out.append(pts[-1])
    return out


def spine(points, widths, per_segment=10):
    """굽이치는 몸통. 점들을 잇는 매끈한 곡선을 따라 굵기가 점마다 바뀐다.

    뱀의 몸, 용의 몸, 말의 꼬리처럼 한 가닥으로 흐르는 것에 쓴다.
    widths는 점마다의 굵기다. 사이는 고르게 이어진다.
    """
    if len(points) != len(widths):
        raise ValueError("점과 굵기의 개수가 같아야 한다")
    samples = _spline_samples(points, per_segment)
    total = len(samples) - 1
    seg = len(points) - 1

    def width_at(idx):
        t = idx / total * seg
        i = min(int(t), seg - 1)
        u = t - i
        return widths[i] + (widths[i + 1] - widths[i]) * u

    left, right = [], []
    for idx, (x, y) in enumerate(samples):
        before = samples[max(0, idx - 1)]
        after = samples[min(total, idx + 1)]
        tx, ty = _unit(after[0] - before[0], after[1] - before[1])
        half = width_at(idx) / 2
        left.append((x - ty * half, y + tx * half))
        right.append((x + ty * half, y - tx * half))
    return poly(left + right[::-1])


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


def spiral(cx, cy, r0, r1, a0, a1, w0, w1, steps=64):
    """중심으로 감겨 드는 띠. 뱀이 서린 몸이나 말린 꼬리에 쓴다.

    굵기가 일정한 고리를 여러 겹 놓으면 달팽이 껍데기로 보인다.
    반지름과 굵기가 함께 줄어야 한 가닥이 감긴 것으로 읽힌다.
    """
    outer, inner = [], []
    for i in range(steps + 1):
        t = i / steps
        a = math.radians(a0 + (a1 - a0) * t)
        r = r0 + (r1 - r0) * t
        w = w0 + (w1 - w0) * t
        outer.append((cx + (r + w / 2) * math.cos(a), cy + (r + w / 2) * math.sin(a)))
        inner.append((cx + (r - w / 2) * math.cos(a), cy + (r - w / 2) * math.sin(a)))
    return poly(outer + inner[::-1])


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

    figures: (이름, 그림) 목록. 그림은 경로 문자열 하나이거나,
    여러 겹을 쌓을 때는 (경로문자열, 색) 목록이다. 겹은 순서대로 덮어 그린다.
    """
    cell, pad, small = 130, 20, 44
    rows = (len(figures) + cols - 1) // cols
    w = cols * cell + pad * 2
    # 작은 줄도 폭에 맞춰 접는다. 넘치면 마지막 그림들이 잘려 시험이 안 된다.
    per_row = max(1, (w - pad * 2) // (small + 10))
    small_rows = (len(figures) + per_row - 1) // per_row
    h = rows * cell + pad * 3 + small_rows * (small + 10) + 40

    def paint_for(color):
        if stroke:
            return (
                f'fill="none" stroke="{stroke}" stroke-width="{stroke_width}"'
                ' stroke-linecap="round" stroke-linejoin="round"'
            )
        return f'fill="{color}"'

    def layers_of(figure):
        """한 겹짜리든 여러 겹짜리든 (경로, 색) 목록으로 펼친다."""
        if isinstance(figure, str):
            return [(figure, fill)]
        out = []
        for item in figure:
            if isinstance(item, str):
                out.append((item, fill))
                continue
            d, color = item
            if isinstance(d, (list, tuple)):
                out.extend((one, color) for one in d)
            else:
                out.append((d, color))
        return out

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}"'
        f' viewBox="0 0 {w} {h}">',
        f'<rect width="{w}" height="{h}" fill="{background}"/>',
    ]

    for i, (name, figure) in enumerate(figures):
        cx = pad + (i % cols) * cell
        cy = pad + (i // cols) * cell
        parts.append(f'<g transform="translate({cx + 15},{cy + 8})">')
        for d, color in layers_of(figure):
            parts.append(f'<path d="{d}" {paint_for(color)}/>')
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
    for i, (_, figure) in enumerate(figures):
        x = pad + (i % per_row) * (small + 10)
        y = base + 24 + (i // per_row) * (small + 10)
        parts.append(f'<g transform="translate({x},{y}) scale({scale})">')
        for d, color in layers_of(figure):
            parts.append(f'<path d="{d}" {paint_for(color)}/>')
        parts.append("</g>")

    parts.append("</svg>")
    Path(out_path).write_text("\n".join(parts), encoding="utf-8")
    return out_path


def smooth(points):
    """점들을 부드럽게 잇는 열린 곡선. 선 그림의 기본이다."""
    if len(points) < 2:
        return ""
    out = f"M{_f(points[0][0])},{_f(points[0][1])}"
    if len(points) == 2:
        return out + f"L{_f(points[1][0])},{_f(points[1][1])}"
    for i in range(1, len(points) - 1):
        px, py = points[i]
        nx, ny = points[i + 1]
        out += f"Q{_f(px)},{_f(py)} {_f((px + nx) / 2)},{_f((py + ny) / 2)}"
    out += f"Q{_f(points[-2][0])},{_f(points[-2][1])} {_f(points[-1][0])},{_f(points[-1][1])}"
    return out


def arc_open(cx, cy, r, start_deg, end_deg):
    """열린 원호. 등, 배, 뿔, 코일에 쓴다."""
    a0, a1 = math.radians(start_deg), math.radians(end_deg)
    large = 1 if abs(end_deg - start_deg) > 180 else 0
    sweep = 1 if end_deg > start_deg else 0
    return (
        f"M{_f(cx + r * math.cos(a0))},{_f(cy + r * math.sin(a0))}"
        f"A{_f(r)},{_f(r)} 0 {large},{sweep} "
        f"{_f(cx + r * math.cos(a1))},{_f(cy + r * math.sin(a1))}"
    )


__all__ += ["smooth", "arc_open"]
