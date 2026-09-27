import { BlurMask, Path, RadialGradient, Skia, vec } from "@shopify/react-native-skia";
import { useMemo } from "react";

import { bowlOutline } from "../../lib/dial/bowl-view";
import { desaturate, lerpColor, Palette } from "../../theme";

interface BowlProps {
  radius: number;
  palette: Palette;
  /** 북쪽을 맞춘 정도. 맞추면 테두리가 빛을 머금는다. */
  lit?: number;
}

/**
 * 오목한 그릇이다. 빛이 위쪽에서 들어와 안쪽이 깊어 보이게 한다.
 * 비스듬히 본 것처럼 눌러 놓았으므로 테두리는 원이 아니다.
 */
/** 맞추기 전에 그릇에서 빼는 채도. 볕이 닿지 않은 청동처럼 가라앉는다. */
const ASLEEP = 0.75;

export function Bowl({ radius, palette, lit = 0 }: BowlProps) {
  const asleep = ASLEEP * (1 - lit);
  const bowl = desaturate(palette.bowl, asleep);
  const bowlDeep = desaturate(palette.bowlDeep, asleep);
  const rim = lerpColor(desaturate(palette.rim, asleep), palette.glow, 0.45 * lit);

  const outline = useMemo(() => {
    const path = Skia.Path.Make();
    const points = bowlOutline();
    path.moveTo(points[0].x * radius, points[0].y * radius);
    for (const point of points.slice(1)) {
      path.lineTo(point.x * radius, point.y * radius);
    }
    path.close();
    return path;
  }, [radius]);

  return (
    <>
      <Path path={outline}>
        <RadialGradient
          c={vec(0, -radius * 0.35)}
          r={radius * 1.5}
          colors={[bowl, bowlDeep]}
        />
      </Path>
      {lit > 0 ? (
        <Path
          path={outline}
          style="stroke"
          strokeWidth={radius * 0.1}
          color={palette.glow}
          opacity={0.3 * lit}
        >
          <BlurMask blur={radius * 0.035} style="normal" />
        </Path>
      ) : null}
      <Path
        path={outline}
        style="stroke"
        strokeWidth={radius * 0.045}
        color={rim}
      />
    </>
  );
}
