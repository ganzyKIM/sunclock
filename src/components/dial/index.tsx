import { Canvas, Group } from "@shopify/react-native-skia";
import { View } from "react-native";

import { DialGeometry } from "../../lib/dial/geometry";
import { DialPoint } from "../../lib/dial/projection";
import { Palette } from "../../theme";
import { Bowl } from "./bowl";
import { Gnomon } from "./gnomon";
import { Grid } from "./grid";
import { DialLabels } from "./labels";
import { Shadow } from "./shadow";
import { Sky, SkyContent } from "./sky";

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
  const bowlRadius = center * (sky ? BOWL_SHARE_WITH_SKY : BOWL_SHARE_ALONE);

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ width: size, height: size }}>
        <Group transform={[{ translateX: center }, { translateY: center }]}>
          {sky ? <Sky {...sky} radius={bowlRadius} palette={palette} /> : null}
          <Bowl radius={bowlRadius} palette={palette} />
          <Grid geometry={geometry} radius={bowlRadius} palette={palette} />
          <Gnomon root={geometry.gnomonRoot} radius={bowlRadius} palette={palette} />
          <Shadow
            points={rodShadow}
            tip={shadow}
            radius={bowlRadius}
            palette={palette}
            glowing={glowing}
          />
        </Group>
      </Canvas>
      <DialLabels
        geometry={geometry}
        center={center}
        radius={bowlRadius}
        palette={palette}
      />
    </View>
  );
}
