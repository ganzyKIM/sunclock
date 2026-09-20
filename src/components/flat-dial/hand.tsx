import { Circle, Line, vec } from "@shopify/react-native-skia";

import { DialPoint } from "../../lib/dial/projection";
import { Palette } from "../../theme";

interface HandProps {
  tip: DialPoint | null;
  radius: number;
  palette: Palette;
  glowing: boolean;
}

/**
 * 그림자. 영침이 극을 향하므로 펼친 원반에서는 한가운데서 뻗어 나간다.
 * 시계바늘과 같은 움직임이다.
 */
export function Hand({ tip, radius, palette, glowing }: HandProps) {
  if (!tip) return null;
  const x = tip.x * radius;
  const y = tip.y * radius;

  return (
    <>
      <Line
        p1={vec(0, 0)}
        p2={vec(x, y)}
        color={palette.shadow}
        strokeWidth={radius * 0.028}
        strokeCap="round"
        opacity={0.6}
      />
      <Circle cx={x} cy={y} r={radius * (glowing ? 0.07 : 0.052)} color={palette.glow} opacity={glowing ? 0.5 : 0.32} />
      <Circle cx={x} cy={y} r={radius * 0.024} color={palette.shadow} />
      <Circle cx={x} cy={y} r={radius * 0.011} color={palette.glow} />
    </>
  );
}

/** 영침. 극축을 따라 서 있어 끝에서 내려다보면 점 하나로 보인다. */
export function Gnomon({ radius, palette }: { radius: number; palette: Palette }) {
  return (
    <>
      <Circle cx={0} cy={0} r={radius * 0.052} color={palette.rim} opacity={0.9} />
      <Circle cx={0} cy={0} r={radius * 0.034} color={palette.lineMajor} />
      <Circle
        cx={-radius * 0.011}
        cy={-radius * 0.011}
        r={radius * 0.012}
        color={palette.rim}
        opacity={0.75}
      />
    </>
  );
}
