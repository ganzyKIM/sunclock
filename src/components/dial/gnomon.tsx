import { Circle, Line, vec } from "@shopify/react-native-skia";

import { DialPoint } from "../../lib/dial/projection";
import { Palette } from "../../theme";

/** 그릇 안쪽 남쪽 벽에서 중심으로 뻗은 바늘이다. 끝이 천구 북극을 향한다. */
export function Gnomon({
  root,
  radius,
  palette,
}: {
  root: DialPoint;
  radius: number;
  palette: Palette;
}) {
  return (
    <>
      <Line
        p1={vec(root.x * radius, root.y * radius)}
        p2={vec(0, 0)}
        color={palette.lineMajor}
        strokeWidth={radius * 0.022}
        strokeCap="round"
      />
      <Circle cx={0} cy={0} r={radius * 0.022} color={palette.lineMajor} />
    </>
  );
}
