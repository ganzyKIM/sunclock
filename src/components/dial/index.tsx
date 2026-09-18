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

export interface DialProps {
  geometry: DialGeometry;
  shadow: DialPoint | null;
  rodShadow: DialPoint[];
  palette: Palette;
  size: number;
  glowing: boolean;
}

/** 반구는 휴대폰에 붙어 있으므로 화면에서 돌지 않는다. 움직이는 것은 그림자뿐이다. */
export function Dial({ geometry, shadow, rodShadow, palette, size, glowing }: DialProps) {
  const radius = size / 2;
  const bowlRadius = radius * 0.96;

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ width: size, height: size }}>
        <Group transform={[{ translateX: radius }, { translateY: radius }]}>
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
      <DialLabels geometry={geometry} radius={radius} palette={palette} />
    </View>
  );
}
