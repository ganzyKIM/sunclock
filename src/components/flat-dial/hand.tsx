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

  // 바늘이 가운데서 나오므로 뒤쪽으로 조금 내밀어 시계바늘처럼 보이게 한다.
  const length = Math.hypot(x, y);
  const backX = length > 0 ? (-x / length) * radius * 0.09 : 0;
  const backY = length > 0 ? (-y / length) * radius * 0.09 : 0;

  return (
    <>
      <Line
        p1={vec(backX, backY)}
        p2={vec(x, y)}
        color={palette.shadow}
        strokeWidth={radius * 0.034}
        strokeCap="round"
        opacity={0.75}
      />
      <Line
        p1={vec(backX, backY)}
        p2={vec(x, y)}
        color={palette.glow}
        strokeWidth={radius * 0.008}
        strokeCap="round"
        opacity={0.35}
      />
      <Circle
        cx={x}
        cy={y}
        r={radius * (glowing ? 0.085 : 0.065)}
        color={palette.glow}
        opacity={glowing ? 0.55 : 0.38}
      />
      <Circle cx={x} cy={y} r={radius * 0.028} color={palette.shadow} />
      <Circle cx={x} cy={y} r={radius * 0.013} color={palette.glow} />
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
