import { Circle, Path } from "@shopify/react-native-skia";
import { useMemo } from "react";

import { DialPoint } from "../../lib/dial/projection";
import { Palette } from "../../theme";
import { toSkPath } from "./path";

interface ShadowProps {
  points: DialPoint[];
  tip: DialPoint | null;
  radius: number;
  palette: Palette;
  glowing: boolean;
}

/** 읽는 것은 그림자 끝이다. 그래서 끝에 빛무리를 맺어 눈이 먼저 닿게 한다. */
export function Shadow({ points, tip, radius, palette, glowing }: ShadowProps) {
  const path = useMemo(() => toSkPath(points, radius), [points, radius]);
  if (!tip) return null;

  return (
    <>
      <Path
        path={path}
        style="stroke"
        strokeWidth={radius * 0.03}
        strokeCap="round"
        color={palette.shadow}
        opacity={0.55}
      />
      <Circle
        cx={tip.x * radius}
        cy={tip.y * radius}
        r={radius * (glowing ? 0.075 : 0.055)}
        color={palette.glow}
        opacity={glowing ? 0.55 : 0.35}
      />
      <Circle cx={tip.x * radius} cy={tip.y * radius} r={radius * 0.026} color={palette.shadow} />
    </>
  );
}
