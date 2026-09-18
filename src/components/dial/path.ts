import { Skia, SkPath } from "@shopify/react-native-skia";

import { DialPoint } from "../../lib/dial/projection";

/** 원판 좌표를 화면 픽셀로 옮겨 선으로 잇는다. 원점은 반구의 중심이다. */
export function toSkPath(points: DialPoint[], radius: number): SkPath {
  const path = Skia.Path.Make();
  points.forEach((point, index) => {
    const x = point.x * radius;
    const y = point.y * radius;
    if (index === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  });
  return path;
}
