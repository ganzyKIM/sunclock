import { Canvas, Circle, Group, Path, Skia } from "@shopify/react-native-skia";
import { useMemo } from "react";

import { toRadians } from "../../lib/placement/angle";
import { Palette } from "../../theme";

export interface CompassNeedleProps {
  /** 휴대폰 머리가 향한 방위. 도 단위. */
  headingDegrees: number;
  aligned: boolean;
  size: number;
  palette: Palette;
}

function wedge(tipY: number, halfWidth: number, baseY: number) {
  const path = Skia.Path.Make();
  path.moveTo(0, tipY);
  path.lineTo(halfWidth, baseY);
  path.lineTo(-halfWidth, baseY);
  path.close();
  return path;
}

/**
 * 나침반 바늘.
 *
 * 휴대폰이 곧 해시계이므로 북쪽이 화면에서 돈다. 머리가 동쪽을 보면 북쪽은
 * 왼편에 선다. 그래서 바늘을 방위만큼 거꾸로 돌린다.
 */
export default function CompassNeedle({
  headingDegrees,
  aligned,
  size,
  palette,
}: CompassNeedleProps) {
  const middle = size / 2;
  // 바늘 끝과 테 사이에 북이라는 글자가 들어갈 자리를 남긴다.
  const reach = size * 0.25;

  const needles = useMemo(
    () => ({
      north: wedge(-reach, size * 0.07, size * 0.02),
      south: wedge(reach * 0.8, size * 0.055, -size * 0.02),
    }),
    [reach, size]
  );

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group transform={[{ translateX: middle }, { translateY: middle }]}>
        <Circle cx={0} cy={0} r={size * 0.46} color={palette.bowl} />
        <Circle
          cx={0}
          cy={0}
          r={size * 0.46}
          style="stroke"
          strokeWidth={size * 0.045}
          color={aligned ? palette.accent : palette.rim}
          opacity={aligned ? 0.9 : 0.8}
        />

        <Group transform={[{ rotate: toRadians(-headingDegrees) }]}>
          <Path path={needles.south} color={palette.line} opacity={0.5} />
          <Path path={needles.north} color={palette.accent} />
        </Group>

        <Circle cx={0} cy={0} r={size * 0.05} color={palette.lineMajor} />
      </Group>
    </Canvas>
  );
}
