import { BlurMask, Circle, Path } from "@shopify/react-native-skia";
import { useMemo } from "react";

import { DialPoint } from "../../lib/dial/projection";
import { Palette } from "../../theme";
import { shadowBandPath, straightShadowPoints } from "../shadow-path";

interface HandProps {
  tip: DialPoint | null;
  radius: number;
  palette: Palette;
  glowing: boolean;
  /**
   * 뒤에 깔리는 그림자인지. 밤에 달이 실제로 드리운 그림자가 이것이다.
   * 달과 영침과 한 줄에 선다. 보정한 그림자가 앞에 빛무리를 달고 서므로
   * 이쪽은 끝에 빈 고리만 둘러 어디에 졌는지 보이게 한다.
   */
  ghost?: boolean;
}

/** 실제 달그림자 끝에 두르는 고리의 크기. 보정한 그림자의 빛무리보다 작다. */
const GHOST_RING = 0.045;

/**
 * 그림자는 영침에서 시작해 한쪽으로만 뻗는다. 시계바늘처럼 뒤로 내밀면
 * 그 자리에 있을 수 없는 꼬리가 생겨 그림자로 보이지 않는다.
 */
const BACK_SHARE = 0;
const SAMPLES = 14;

/** 영침은 뿌리가 굵고 끝이 뾰족하다. 그 그림자도 같은 만큼 좁아진다. */
const UMBRA_ROOT = 0.05;
const UMBRA_TIP = 0.012;
/** 그림자의 가장자리는 늘 흐리다. 멀어질수록 더 번진다. */
const PENUMBRA_ROOT = 0.085;
const PENUMBRA_TIP = 0.04;

/**
 * 그림자. 영침이 극을 향하므로 펼친 원반에서는 한가운데서 뻗어 나간다.
 * 시계바늘과 같은 움직임이다.
 *
 * 굵기가 일정한 선으로 그으면 자로 그은 금처럼 보인다. 그림자는 그렇지 않다.
 * 뿌리에서 넓고 끝으로 갈수록 좁아지며, 가장자리는 늘 흐리다. 그래서 짙은
 * 속과 흐린 둘레를 따로 겹쳐 그리고, 둘 다 바탕이 비쳐 보이게 둔다.
 */
export function Hand({ tip, radius, palette, glowing, ghost = false }: HandProps) {
  const bands = useMemo(() => {
    if (!tip) return null;
    const points = straightShadowPoints(tip, BACK_SHARE, SAMPLES);
    if (points.length < 2) return null;
    return {
      penumbra: shadowBandPath(points, radius, PENUMBRA_ROOT, PENUMBRA_TIP),
      umbra: shadowBandPath(points, radius, UMBRA_ROOT, UMBRA_TIP),
    };
  }, [tip, radius]);

  if (!tip || !bands || !bands.umbra || !bands.penumbra) return null;
  const x = tip.x * radius;
  const y = tip.y * radius;

  if (ghost) {
    return (
      <>
        <Path path={bands.penumbra} color={palette.shadow} opacity={0.16}>
          <BlurMask blur={radius * 0.04} style="normal" />
        </Path>
        <Path path={bands.umbra} color={palette.shadow} opacity={0.5}>
          <BlurMask blur={radius * 0.012} style="normal" />
        </Path>
        {/* 밤의 눈금판은 어두워 그림자만으로는 묻힌다. 끝에 빈 고리를 둘러 자리를 알린다. */}
        <Circle
          cx={x}
          cy={y}
          r={radius * GHOST_RING}
          style="stroke"
          strokeWidth={radius * 0.011}
          color={palette.star}
          opacity={0.7}
        />
        <Circle cx={x} cy={y} r={radius * 0.016} color={palette.shadow} opacity={0.85} />
      </>
    );
  }

  return (
    <>
      <Path path={bands.penumbra} color={palette.shadow} opacity={0.18}>
        <BlurMask blur={radius * 0.03} style="normal" />
      </Path>
      <Path path={bands.umbra} color={palette.shadow} opacity={0.6}>
        <BlurMask blur={radius * 0.008} style="normal" />
      </Path>

      <Circle
        cx={x}
        cy={y}
        r={radius * (glowing ? 0.085 : 0.065)}
        color={palette.glow}
        opacity={glowing ? 0.55 : 0.38}
      />
      <Circle cx={x} cy={y} r={radius * 0.024} color={palette.shadow} opacity={0.85} />
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
