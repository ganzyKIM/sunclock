/**
 * 빈자리를 채우는 잔가지 무늬.
 *
 * 그림책의 여백에 그려 넣는 가는 선 같은 것이다. 굵지 않고, 많지 않고,
 * 눈에 띄려 하지 않는다. 줄기 하나가 휘어 오르고 잎 몇 장이 번갈아 달리며
 * 끝에 열매 두엇이 맺힌다. 모두 0에서 100 사이의 상자 안에 그린다.
 * 줄기는 왼쪽 아래 구석에서 시작해 오른쪽 위로 향한다.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Sprig {
  /** 줄기. 한 획이다. */
  stem: string;
  /** 잎. 저마다 닫힌 한 획이다. */
  leaves: string[];
  /** 열매. 작은 원의 중심이다. */
  berries: Point[];
}

/** 줄기의 세 점 곡선. 상자 구석에서 시작해 완만한 S자로 오른다. */
const STEM: [Point, Point, Point, Point] = [
  { x: 4, y: 96 },
  { x: 10, y: 52 },
  { x: 48, y: 46 },
  { x: 72, y: 12 },
];

function bezier(t: number): Point {
  const [p0, p1, p2, p3] = STEM;
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

function tangent(t: number): Point {
  const [p0, p1, p2, p3] = STEM;
  const u = 1 - t;
  const x = 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
  const y = 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}

const f = (v: number) => v.toFixed(2);

/**
 * 잎 한 장. 줄기의 한 점에서 비스듬히 앞쪽으로 뻗는 물방울꼴이다.
 * `side`가 1이면 줄기의 왼편, -1이면 오른편에 단다.
 */
function leaf(t: number, side: 1 | -1, length: number, width: number): string {
  const base = bezier(t);
  const along = tangent(t);
  const normal = { x: -along.y * side, y: along.x * side };
  // 앞으로 조금 기울여 줄기를 따라 자라는 것처럼 보이게 한다.
  const dir = {
    x: normal.x * 0.8 + along.x * 0.6,
    y: normal.y * 0.8 + along.y * 0.6,
  };
  const scale = Math.hypot(dir.x, dir.y);
  const ux = dir.x / scale;
  const uy = dir.y / scale;
  const tip = { x: base.x + ux * length, y: base.y + uy * length };
  const mid = { x: base.x + ux * length * 0.5, y: base.y + uy * length * 0.5 };
  const wx = -uy * width;
  const wy = ux * width;
  return (
    `M ${f(base.x)} ${f(base.y)} ` +
    `Q ${f(mid.x + wx)} ${f(mid.y + wy)} ${f(tip.x)} ${f(tip.y)} ` +
    `Q ${f(mid.x - wx)} ${f(mid.y - wy)} ${f(base.x)} ${f(base.y)} Z`
  );
}

export function sprig(): Sprig {
  const [p0, p1, p2, p3] = STEM;
  const stem = `M ${f(p0.x)} ${f(p0.y)} C ${f(p1.x)} ${f(p1.y)} ${f(p2.x)} ${f(p2.y)} ${f(p3.x)} ${f(p3.y)}`;
  const leaves = [
    leaf(0.22, 1, 15, 5.5),
    leaf(0.4, -1, 14, 5),
    leaf(0.56, 1, 13, 4.6),
    leaf(0.72, -1, 11, 4),
    leaf(0.86, 1, 9, 3.4),
  ];
  const end = bezier(1);
  const along = tangent(1);
  const berries = [
    { x: end.x + along.x * 4, y: end.y + along.y * 4 },
    { x: end.x + along.x * 2 - along.y * 4.5, y: end.y + along.y * 2 + along.x * 4.5 },
    { x: end.x + along.x * 1 + along.y * 4.5, y: end.y + along.y * 1 - along.x * 4.5 },
  ];
  return { stem, leaves, berries };
}
