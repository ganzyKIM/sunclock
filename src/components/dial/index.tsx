import { View } from "react-native";

import type { DialGeometry } from "../../lib/dial/geometry";
import type { DialPoint } from "../../lib/dial/projection";
import type { Palette } from "../../theme";
import { DialCanvasHost } from "./canvas-host";
import { DialLabels } from "./labels";
import type { SkyContent } from "./sky";

export interface DialProps {
  geometry: DialGeometry;
  shadow: DialPoint | null;
  rodShadow: DialPoint[];
  palette: Palette;
  /** 하늘까지 담는 바깥 상자의 한 변. */
  size: number;
  glowing: boolean;
  /** 반구 바깥에 해와 달을 띄운다. 없으면 그리지 않는다. */
  sky?: SkyContent;
}

/** 하늘을 띄울 때는 고리가 들어갈 자리를 남긴다. */
const BOWL_SHARE_WITH_SKY = 0.76;
const BOWL_SHARE_ALONE = 0.96;

/** 반구는 휴대폰에 붙어 있으므로 화면에서 돌지 않는다. 움직이는 것은 그림자뿐이다. */
export function Dial({
  geometry,
  shadow,
  rodShadow,
  palette,
  size,
  glowing,
  sky,
}: DialProps) {
  const center = size / 2;
  const radius = center * (sky ? BOWL_SHARE_WITH_SKY : BOWL_SHARE_ALONE);

  return (
    <View style={{ width: size, height: size }}>
      <DialCanvasHost
        geometry={geometry}
        shadow={shadow}
        rodShadow={rodShadow}
        palette={palette}
        size={size}
        radius={radius}
        glowing={glowing}
        sky={sky}
      />
      <DialLabels geometry={geometry} center={center} radius={radius} palette={palette} />
    </View>
  );
}
