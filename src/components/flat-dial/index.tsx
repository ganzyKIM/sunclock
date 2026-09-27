import { View } from "react-native";

import type { FlatGeometry, FlatMoonPath } from "../../lib/dial/flat";
import type { DialPoint } from "../../lib/dial/projection";
import type { Palette } from "../../theme";
import type { SkyContent } from "../dial/sky";
import { CardinalMarks } from "../dial/cardinal-marks";
import { FlatCanvasHost } from "./canvas-host";
import { FlatLabels } from "./labels";

export interface FlatDialProps {
  geometry: FlatGeometry;
  /** 그림자 끝. 그림자가 없으면 null이다. */
  tip: DialPoint | null;
  /** 그 뒤에 흐리게 깔리는 그림자 끝. 밤에 달이 실제로 드리운 그림자다. */
  ghostTip?: DialPoint | null;
  palette: Palette;
  size: number;
  glowing: boolean;
  /** 달시계로 읽는 밤인지. */
  night: boolean;
  /** 그 밤에 달이 지나는 길. 낮에는 null이다. */
  moon: FlatMoonPath | null;
  /** 12지 이름을 누르면 그 지지를 알려 준다. */
  onSelectBranch?: (branch: string) => void;
  sky?: SkyContent;
  /** 북쪽을 맞춘 정도. 0에서 1. 맞추면 테두리가 빛을 머금는다. */
  lit?: number;
  /** 그림자가 걸린 시각. 그 시의 구간을 밝힌다. */
  highlightMinutes?: number | null;
}

/** 하늘을 띄울 때는 이름 고리와 해와 달이 들어갈 자리를 남긴다. */
const PLATE_SHARE_WITH_SKY = 0.69;
const PLATE_SHARE_ALONE = 0.9;

/**
 * 반구를 극축 기준으로 펼친 원반이다.
 * 영침이 한가운데 점이 되고 그림자가 시계바늘처럼 돈다.
 */
export function FlatDial({
  geometry,
  tip,
  ghostTip = null,
  palette,
  size,
  glowing,
  night,
  moon,
  onSelectBranch,
  sky,
  lit = 0,
  highlightMinutes = null,
}: FlatDialProps) {
  const center = size / 2;
  const radius = center * (sky ? PLATE_SHARE_WITH_SKY : PLATE_SHARE_ALONE);

  return (
    <View style={{ width: size, height: size }}>
      <FlatCanvasHost
        geometry={geometry}
        tip={tip}
        ghostTip={ghostTip}
        palette={palette}
        size={size}
        radius={radius}
        glowing={glowing}
        moon={moon}
        sky={sky}
        lit={lit}
        highlightMinutes={highlightMinutes}
      />
      <FlatLabels
        geometry={geometry}
        center={center}
        radius={radius}
        palette={palette}
        night={night}
        onSelectBranch={onSelectBranch}
      />
      {sky ? <CardinalMarks center={center} radius={radius} palette={palette} /> : null}
    </View>
  );
}
