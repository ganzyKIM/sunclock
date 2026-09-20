import { Canvas, Group } from "@shopify/react-native-skia";

import { FlatGeometry } from "../../lib/dial/flat";
import { DialPoint } from "../../lib/dial/projection";
import { Palette } from "../../theme";
import { Sky, SkyContent } from "../dial/sky";
import { Gnomon, Hand } from "./hand";
import { Plate } from "./plate";

export interface FlatCanvasProps {
  geometry: FlatGeometry;
  tip: DialPoint | null;
  palette: Palette;
  size: number;
  radius: number;
  glowing: boolean;
  sky?: SkyContent;
}

export default function FlatCanvas({
  geometry,
  tip,
  palette,
  size,
  radius,
  glowing,
  sky,
}: FlatCanvasProps) {
  const center = size / 2;

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group transform={[{ translateX: center }, { translateY: center }]}>
        {sky ? <Sky {...sky} radius={radius} palette={palette} /> : null}
        <Plate geometry={geometry} radius={radius} palette={palette} />
        <Hand tip={tip} radius={radius} palette={palette} glowing={glowing} />
        <Gnomon radius={radius} palette={palette} />
      </Group>
    </Canvas>
  );
}
