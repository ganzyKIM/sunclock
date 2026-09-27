import { Canvas, Group } from "@shopify/react-native-skia";

import { FlatGeometry, FlatMoonPath } from "../../lib/dial/flat";
import { DialPoint } from "../../lib/dial/projection";
import { Palette } from "../../theme";
import { Sky, SkyContent } from "../dial/sky";
import { Gnomon, Hand } from "./hand";
import { Plate } from "./plate";

export interface FlatCanvasProps {
  geometry: FlatGeometry;
  tip: DialPoint | null;
  /** 앞의 그림자 뒤에 흐리게 깔리는 그림자. 밤의 실제 달그림자다. */
  ghostTip?: DialPoint | null;
  palette: Palette;
  size: number;
  radius: number;
  glowing: boolean;
  /** 밤에 달시계로 읽을 때 달이 지나는 길. 낮에는 null이다. */
  moon: FlatMoonPath | null;
  sky?: SkyContent;
  /** 북쪽을 맞춘 정도. 0에서 1. */
  lit?: number;
  /** 그림자가 걸린 시각. 그 시의 구간을 밝힌다. */
  highlightMinutes?: number | null;
}

export default function FlatCanvas({
  geometry,
  tip,
  ghostTip = null,
  palette,
  size,
  radius,
  glowing,
  moon,
  sky,
  lit = 0,
  highlightMinutes = null,
}: FlatCanvasProps) {
  const center = size / 2;

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group transform={[{ translateX: center }, { translateY: center }]}>
        {sky ? <Sky {...sky} radius={radius} palette={palette} /> : null}
        <Plate
          geometry={geometry}
          radius={radius}
          palette={palette}
          moon={moon}
          lit={lit}
          highlightMinutes={highlightMinutes}
        />
        <Hand tip={ghostTip} radius={radius} palette={palette} glowing={false} ghost />
        <Hand tip={tip} radius={radius} palette={palette} glowing={glowing} />
        <Gnomon radius={radius} palette={palette} />
      </Group>
    </Canvas>
  );
}
