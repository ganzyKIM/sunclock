import { View } from "react-native";

import type { FlatGeometry } from "../../lib/dial/flat";
import type { DialPoint } from "../../lib/dial/projection";
import type { Palette } from "../../theme";
import type { SkyContent } from "../dial/sky";
import { FlatCanvasHost } from "./canvas-host";
import { FlatLabels } from "./labels";

export interface FlatDialProps {
  geometry: FlatGeometry;
  /** 그림자 끝. 그림자가 없으면 null이다. */
  tip: DialPoint | null;
  palette: Palette;
  size: number;
  glowing: boolean;
  sky?: SkyContent;
}

/** 하늘을 띄울 때는 고리가 들어갈 자리를 남긴다. */
const PLATE_SHARE_WITH_SKY = 0.74;
const PLATE_SHARE_ALONE = 0.9;

/**
 * 반구를 극축 기준으로 펼친 원반이다.
 * 영침이 한가운데 점이 되고 그림자가 시계바늘처럼 돈다.
 */
export function FlatDial({ geometry, tip, palette, size, glowing, sky }: FlatDialProps) {
  const center = size / 2;
  const radius = center * (sky ? PLATE_SHARE_WITH_SKY : PLATE_SHARE_ALONE);

  return (
    <View style={{ width: size, height: size }}>
      <FlatCanvasHost
        geometry={geometry}
        tip={tip}
        palette={palette}
        size={size}
        radius={radius}
        glowing={glowing}
        sky={sky}
      />
      <FlatLabels geometry={geometry} center={center} radius={radius} palette={palette} />
    </View>
  );
}
