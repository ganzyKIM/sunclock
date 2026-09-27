import { BlurMask, Circle, Path } from "@shopify/react-native-skia";
import { useMemo } from "react";

import { DialPoint } from "../../lib/dial/projection";
import { Palette } from "../../theme";
import { shadowBandPath } from "../shadow-path";

interface ShadowProps {
  points: DialPoint[];
  tip: DialPoint | null;
  radius: number;
  palette: Palette;
  glowing: boolean;
  /**
   * 뒤에 흐리게 깔리는 그림자인지. 밤에 달이 실제로 드리운 그림자가 이것이다.
   * 보정한 그림자가 앞에 또렷하게 서므로 이쪽은 있는 줄만 알도록 둔다.
   */
  ghost?: boolean;
}

/** 영침은 뿌리가 굵고 끝이 뾰족하다. 그 그림자도 같은 만큼 좁아진다. */
const UMBRA_ROOT = 0.045;
const UMBRA_TIP = 0.014;
/** 그림자의 가장자리는 늘 흐리다. 멀어질수록 더 번진다. */
const PENUMBRA_ROOT = 0.08;
const PENUMBRA_TIP = 0.042;

/**
 * 읽는 것은 그림자 끝이다. 그래서 끝에 빛무리를 맺어 눈이 먼저 닿게 한다.
 *
 * 그림자는 그릇의 곡면을 타고 휜다. 굵기가 일정한 선으로 그으면 면 위에
 * 누운 것이 아니라 공중에 뜬 철사처럼 보인다. 그래서 휜 선을 따라가며
 * 굵기를 조금씩 줄이고, 짙은 속과 흐린 둘레를 따로 겹쳐 그린다.
 */
export function Shadow({
  points,
  tip,
  radius,
  palette,
  glowing,
  ghost = false,
}: ShadowProps) {
  const bands = useMemo(
    () => ({
      penumbra: shadowBandPath(points, radius, PENUMBRA_ROOT, PENUMBRA_TIP),
      umbra: shadowBandPath(points, radius, UMBRA_ROOT, UMBRA_TIP),
    }),
    [points, radius]
  );

  if (!tip || !bands.umbra || !bands.penumbra) return null;

  if (ghost) {
    return (
      <>
        <Path path={bands.penumbra} color={palette.shadow} opacity={0.15}>
          <BlurMask blur={radius * 0.045} style="normal" />
        </Path>
        <Path path={bands.umbra} color={palette.shadow} opacity={0.42}>
          <BlurMask blur={radius * 0.02} style="normal" />
        </Path>
        <Circle
          cx={tip.x * radius}
          cy={tip.y * radius}
          r={radius * 0.02}
          color={palette.shadow}
          opacity={0.55}
        />
      </>
    );
  }

  return (
    <>
      <Path path={bands.penumbra} color={palette.shadow} opacity={0.16}>
        <BlurMask blur={radius * 0.03} style="normal" />
      </Path>
      <Path path={bands.umbra} color={palette.shadow} opacity={0.55}>
        <BlurMask blur={radius * 0.008} style="normal" />
      </Path>

      <Circle
        cx={tip.x * radius}
        cy={tip.y * radius}
        r={radius * (glowing ? 0.075 : 0.055)}
        color={palette.glow}
        opacity={glowing ? 0.55 : 0.35}
      />
      <Circle
        cx={tip.x * radius}
        cy={tip.y * radius}
        r={radius * 0.024}
        color={palette.shadow}
        opacity={0.85}
      />
    </>
  );
}
