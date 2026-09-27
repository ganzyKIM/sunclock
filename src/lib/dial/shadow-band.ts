import { DialPoint } from "./projection";

/**
 * 그림자를 굵기가 변하는 띠로 만든다.
 *
 * 그림자를 굵기 일정한 선으로 그으면 자로 그은 금처럼 보인다. 실제 영침은
 * 뿌리가 굵고 끝이 뾰족한 바늘이라 그 그림자도 뿌리에서 넓고 끝으로 갈수록
 * 좁아진다. 반구에서는 그림자가 곡면을 타고 휘므로, 꺾인 선을 따라가며
 * 굵기를 조금씩 줄여야 면을 타고 누운 것처럼 보인다.
 *
 * 점들을 따라 한쪽으로 벌리고 반대쪽으로 벌린 뒤 되짚어 닫는다.
 * 나온 것은 채워 그릴 수 있는 닫힌 윤곽이다.
 */

/** 같은 자리에 겹친 점은 방향을 알 수 없으므로 건너뛴다. */
const EPSILON = 1e-9;

function tangentAt(points: DialPoint[], index: number): DialPoint {
  const before = points[Math.max(0, index - 1)];
  const after = points[Math.min(points.length - 1, index + 1)];
  const dx = after.x - before.x;
  const dy = after.y - before.y;
  const length = Math.hypot(dx, dy);
  if (length <= EPSILON) return { x: 1, y: 0 };
  return { x: dx / length, y: dy / length };
}

export function taperedBand(
  points: DialPoint[],
  startWidth: number,
  endWidth: number
): DialPoint[] {
  if (points.length < 2) return [];

  const left: DialPoint[] = [];
  const right: DialPoint[] = [];

  points.forEach((point, index) => {
    const t = index / (points.length - 1);
    const half = (startWidth + (endWidth - startWidth) * t) / 2;
    const tangent = tangentAt(points, index);
    // 진행 방향에 수직인 쪽으로 벌린다.
    const nx = -tangent.y * half;
    const ny = tangent.x * half;
    left.push({ x: point.x + nx, y: point.y + ny });
    right.push({ x: point.x - nx, y: point.y - ny });
  });

  return [...left, ...right.reverse()];
}
