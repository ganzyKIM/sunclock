import { Canvas, Group } from "@shopify/react-native-skia";

import { DialGeometry } from "../../lib/dial/geometry";
import { DialPoint } from "../../lib/dial/projection";
import { Palette } from "../../theme";
import { Bowl } from "./bowl";
import { Gnomon } from "./gnomon";
import { Grid } from "./grid";
import { Shadow } from "./shadow";
import { Sky, SkyContent } from "./sky";

export interface DialCanvasProps {
  geometry: DialGeometry;
  shadow: DialPoint | null;
  rodShadow: DialPoint[];
  palette: Palette;
  size: number;
  radius: number;
  glowing: boolean;
  sky?: SkyContent;
}

/** 스킨을 쓰는 부분만 모았다. 웹에서는 그래픽 엔진이 준비된 뒤에 읽혀야 한다. */
export default function DialCanvas({
  geometry,
  shadow,
  rodShadow,
  palette,
  size,
  radius,
  glowing,
  sky,
}: DialCanvasProps) {
  const center = size / 2;

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group transform={[{ translateX: center }, { translateY: center }]}>
        {sky ? <Sky {...sky} radius={radius} palette={palette} /> : null}
        <Bowl radius={radius} palette={palette} />
        <Grid geometry={geometry} radius={radius} palette={palette} />
        <Gnomon root={geometry.gnomonRoot} radius={radius} palette={palette} />
        <Shadow
          points={rodShadow}
          tip={shadow}
          radius={radius}
          palette={palette}
          glowing={glowing}
        />
      </Group>
    </Canvas>
  );
}
