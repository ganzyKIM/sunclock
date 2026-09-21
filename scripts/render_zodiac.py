"""12지 동물 픽토그램을 만든다.

단순한 도형을 겹쳐 짐승의 실루엣을 만든다. 눈으로 보며 다듬으라고
SVG 한 장을 함께 뽑는다. 앱에는 경로 문자열만 넘긴다.

  python3 scripts/render_zodiac.py            # 타입스크립트 파일을 다시 쓴다
  ZODIAC_SHEET=out.svg python3 scripts/...    # 확인용 그림도 함께 뽑는다
"""

import math
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_TS = Path(os.environ.get("ZODIAC_TS", ROOT / "src/lib/time/zodiac-shapes.ts"))
SHEET = os.environ.get("ZODIAC_SHEET")

BOX = 100.0


def f(v: float) -> str:
    return f"{v:.2f}".rstrip("0").rstrip(".")


def ellipse(cx, cy, rx, ry, rot=0.0):
    a = math.radians(rot)
    dx, dy = 2 * rx * math.cos(a), 2 * rx * math.sin(a)
    sx, sy = cx - rx * math.cos(a), cy - rx * math.sin(a)
    return (
        f"M{f(sx)},{f(sy)}"
        f"a{f(rx)},{f(ry)} {f(rot)} 1,0 {f(dx)},{f(dy)}"
        f"a{f(rx)},{f(ry)} {f(rot)} 1,0 {f(-dx)},{f(-dy)}Z"
    )


def circle(cx, cy, r):
    return ellipse(cx, cy, r, r)


def poly(points):
    head = f"M{f(points[0][0])},{f(points[0][1])}"
    rest = "".join(f"L{f(x)},{f(y)}" for x, y in points[1:])
    return head + rest + "Z"


def _unit(vx, vy):
    n = math.hypot(vx, vy) or 1.0
    return vx / n, vy / n


def ribbon(p0, ctrl, p1, w0, w1):
    """굵기가 변하는 곡선 띠. 꼬리, 뿔, 수염에 쓴다."""
    n0x, n0y = _unit(*(ctrl[0] - p0[0], ctrl[1] - p0[1]))
    n1x, n1y = _unit(*(p1[0] - ctrl[0], p1[1] - ctrl[1]))
    nmx, nmy = _unit(*(p1[0] - p0[0], p1[1] - p0[1]))

    def side(px, py, nx, ny, w, sign):
        return px + sign * -ny * w / 2, py + sign * nx * w / 2

    a = side(*p0, n0x, n0y, w0, 1)
    b = side(*p1, n1x, n1y, w1, 1)
    c = side(*p1, n1x, n1y, w1, -1)
    d = side(*p0, n0x, n0y, w0, -1)
    wm = (w0 + w1) / 2
    co = side(*ctrl, nmx, nmy, wm, 1)
    ci = side(*ctrl, nmx, nmy, wm, -1)

    return (
        f"M{f(a[0])},{f(a[1])}Q{f(co[0])},{f(co[1])} {f(b[0])},{f(b[1])}"
        f"L{f(c[0])},{f(c[1])}Q{f(ci[0])},{f(ci[1])} {f(d[0])},{f(d[1])}Z"
    )


def blob(points, closed=True):
    """점들을 부드럽게 이은 덩어리. 몸통에 쓴다."""
    pts = list(points)
    if closed:
        pts.append(pts[0])
    out = f"M{f(pts[0][0])},{f(pts[0][1])}"
    for i in range(1, len(pts)):
        px, py = pts[i - 1]
        cx, cy = pts[i]
        mx, my = (px + cx) / 2, (py + cy) / 2
        out += f"Q{f(px)},{f(py)} {f(mx)},{f(my)}"
    return out + "Z"


# 각 짐승은 겹쳐 놓은 도형 몇 개다. 단순할수록 작은 화면에서 잘 읽힌다.
SHAPES = {
    "쥐": lambda: [
        ellipse(52, 62, 24, 16),
        poly([(30, 58), (16, 64), (30, 70)]),          # 뾰족한 주둥이
        circle(40, 48, 8),                              # 둥근 귀
        ribbon((74, 58), (88, 46), (78, 32), 5, 1.6),   # 가는 꼬리
    ],
    "소": lambda: [
        ellipse(50, 62, 22, 19),
        ribbon((32, 46), (24, 30), (38, 28), 6, 3),     # 왼 뿔
        ribbon((68, 46), (76, 30), (62, 28), 6, 3),     # 오른 뿔
        ellipse(50, 76, 11, 7),                          # 코
    ],
    "호랑이": lambda: [
        ellipse(50, 58, 25, 22),
        circle(31, 37, 9),
        circle(69, 37, 9),
        ribbon((26, 60), (14, 58), (10, 62), 3, 1.6),   # 수염
        ribbon((74, 60), (86, 58), (90, 62), 3, 1.6),
        ellipse(50, 66, 8, 6),
    ],
    "토끼": lambda: [
        ellipse(50, 66, 21, 18),
        ribbon((42, 50), (34, 24), (40, 14), 9, 4),     # 긴 귀
        ribbon((58, 50), (66, 24), (60, 14), 9, 4),
        circle(70, 74, 6),                               # 동그란 꼬리
    ],
    "용": lambda: [
        ribbon((18, 74), (42, 40), (66, 62), 11, 7),    # 굽이치는 몸
        ribbon((66, 62), (82, 76), (88, 60), 7, 3),
        ellipse(24, 36, 14, 11),                         # 머리
        ribbon((30, 26), (26, 12), (16, 14), 5, 2),     # 뿔
        ribbon((14, 30), (4, 24), (2, 32), 4, 1.5),     # 수염
    ],
    "뱀": lambda: [
        ribbon((22, 30), (58, 18), (74, 44), 9, 8),
        ribbon((74, 44), (84, 66), (50, 72), 8, 8),
        ribbon((50, 72), (20, 78), (24, 58), 8, 5),
        ellipse(22, 28, 11, 8),
        ribbon((14, 24), (4, 20), (8, 28), 3, 1.4),     # 혀
    ],
    "말": lambda: [
        ellipse(56, 58, 17, 22, -18),                   # 긴 얼굴
        poly([(44, 36), (38, 20), (50, 30)]),           # 귀
        poly([(62, 34), (60, 18), (70, 30)]),
        ribbon((70, 34), (86, 48), (80, 76), 12, 5),    # 갈기
        ellipse(46, 78, 9, 7),                           # 주둥이
    ],
    "양": lambda: [
        ellipse(50, 62, 20, 18),
        ellipse(30, 40, 11, 9, 20),                      # 말린 뿔
        ellipse(70, 40, 11, 9, -20),
        circle(30, 40, 4),
        circle(70, 40, 4),
        ellipse(50, 78, 9, 6),
    ],
    "원숭이": lambda: [
        circle(50, 56, 22),
        circle(26, 52, 9),                               # 큰 귀
        circle(74, 52, 9),
        ellipse(50, 64, 13, 10),                         # 주둥이
        ribbon((70, 78), (90, 82), (84, 62), 5, 2),     # 말린 꼬리
    ],
    "닭": lambda: [
        ellipse(46, 62, 21, 18),
        circle(62, 40, 12),                              # 머리
        poly([(56, 26), (60, 16), (64, 26), (68, 16), (72, 28)]),  # 볏
        poly([(74, 40), (88, 44), (74, 48)]),           # 부리
        ribbon((26, 56), (10, 40), (18, 66), 9, 3),     # 꼬리깃
    ],
    "개": lambda: [
        ellipse(52, 60, 23, 19),
        ribbon((32, 44), (22, 52), (28, 70), 9, 6),     # 늘어진 귀
        ribbon((72, 44), (82, 52), (76, 70), 9, 6),
        ellipse(52, 74, 10, 7),
        circle(52, 80, 4),
    ],
    "돼지": lambda: [
        ellipse(48, 62, 25, 20),
        poly([(30, 44), (26, 32), (40, 40)]),           # 작은 귀
        poly([(66, 44), (70, 32), (56, 40)]),
        ellipse(48, 72, 12, 9),                          # 코
        ribbon((72, 64), (86, 62), (80, 52), 4, 2),     # 말린 꼬리
    ],
}

ORDER = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"]


def path_for(name: str) -> str:
    return "".join(SHAPES[name]())


def write_typescript() -> None:
    lines = [
        "/**",
        " * 12지 동물 픽토그램.",
        " *",
        " * `scripts/render_zodiac.py`가 만든다. 손으로 고치지 말고 그 스크립트를",
        " * 고친 뒤 다시 뽑는다. 좌표는 100 × 100 상자 기준이다.",
        " */",
        "",
        "export const ZODIAC_SHAPE_BOX = 100;",
        "",
        "export const ZODIAC_SHAPES: Record<string, string> = {",
    ]
    for name in ORDER:
        lines.append(f'  {name}: "{path_for(name)}",')
    lines.append("};")
    OUT_TS.parent.mkdir(parents=True, exist_ok=True)
    OUT_TS.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_sheet(path: str) -> None:
    cols, cell, pad = 4, 130, 20
    rows = (len(ORDER) + cols - 1) // cols
    w, h = cols * cell + pad * 2, rows * cell + pad * 2 + 30
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">',
        f'<rect width="{w}" height="{h}" fill="#0E1526"/>',
    ]
    for i, name in enumerate(ORDER):
        cx = pad + (i % cols) * cell
        cy = pad + (i // cols) * cell
        parts.append(f'<g transform="translate({cx + 15},{cy + 10}) scale(1.0)">')
        parts.append(f'<path d="{path_for(name)}" fill="#EFE4D2"/>')
        parts.append("</g>")
        parts.append(
            f'<text x="{cx + 65}" y="{cy + 124}" fill="#93A2CC" font-size="15"'
            f' text-anchor="middle">{name}</text>'
        )
    parts.append("</svg>")
    Path(path).write_text("\n".join(parts), encoding="utf-8")


if __name__ == "__main__":
    write_typescript()
    print("경로 파일:", OUT_TS)
    if SHEET:
        write_sheet(SHEET)
        print("확인용 그림:", SHEET)
