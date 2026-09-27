import { Skia, SkPath } from "@shopify/react-native-skia";

import { DialPoint } from "../lib/dial/projection";
import { taperedBand } from "../lib/dial/shadow-band";

/**
 * 그림자 띠를 화면에 채워 그릴 수 있는 닫힌 경로로 만든다.
 *
 * 굵기는 눈금판 반지름을 1로 본 값으로 준다. 그래야 화면이 커지고 작아져도
 * 그림자와 눈금의 비례가 그대로다.
 */
export function shadowBandPath(
  points: DialPoint[],
  radius: number,
  startWidth: number,
  endWidth: number
): SkPath | null {
  const outline = taperedBand(points, startWidth, endWidth);
  if (outline.length < 3) return null;

  const path = Skia.Path.Make();
  outline.forEach((point, index) => {
    const x = point.x * radius;
    const y = point.y * radius;
    if (index === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  });
  path.close();
  return path;
}

/** 끝점까지 곧게 뻗는 그림자를 여러 점으로 잘라 둔다. 굵기를 고르게 줄이려면 필요하다. */
export function straightShadowPoints(
  tip: DialPoint,
  backShare: number,
  samples: number
): DialPoint[] {
  const length = Math.hypot(tip.x, tip.y);
  if (length <= 0) return [];

  const ux = tip.x / length;
  const uy = tip.y / length;
  const from = -backShare;

  const points: DialPoint[] = [];
  for (let i = 0; i < samples; i += 1) {
    const at = from + ((length - from) * i) / (samples - 1);
    points.push({ x: ux * at, y: uy * at });
  }
  return points;
}
