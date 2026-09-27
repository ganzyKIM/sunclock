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
  /** 앞의 그림자 뒤에 흐리게 깔리는 그림자. 밤의 실제 달그림자다. */
  ghostShadow?: DialPoint | null;
  ghostRodShadow?: DialPoint[];
  palette: Palette;
  size: number;
  radius: number;
  glowing: boolean;
  /** 그 밤에 달그림자가 지나는 길. 낮에는 비어 있다. */
  moonLine: DialPoint[];
  sky?: SkyContent;
  /** 북쪽을 맞춘 정도. 0에서 1. */
  lit?: number;
  /** 그림자가 걸린 시각. 그 시의 구역을 칠한다. */
  highlightMinutes?: number | null;
}

/** 스킨을 쓰는 부분만 모았다. 웹에서는 그래픽 엔진이 준비된 뒤에 읽혀야 한다. */
export default function DialCanvas({
  geometry,
  shadow,
  rodShadow,
  ghostShadow = null,
  ghostRodShadow = [],
  palette,
  size,
  radius,
  glowing,
  moonLine,
  sky,
  lit = 0,
  highlightMinutes = null,
}: DialCanvasProps) {
  const center = size / 2;

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group transform={[{ translateX: center }, { translateY: center }]}>
        {sky ? <Sky {...sky} radius={radius} palette={palette} /> : null}
        <Bowl radius={radius} palette={palette} lit={lit} />
        <Grid
          geometry={geometry}
          radius={radius}
          palette={palette}
          moonLine={moonLine}
          highlightMinutes={highlightMinutes}
        />
        <Gnomon root={geometry.gnomonRoot} radius={radius} palette={palette} />
        <Shadow
          points={ghostRodShadow}
          tip={ghostShadow}
          radius={radius}
          palette={palette}
          glowing={false}
          ghost
        />
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
