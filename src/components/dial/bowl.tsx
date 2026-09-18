import { Circle, RadialGradient, vec } from "@shopify/react-native-skia";

import { Palette } from "../../theme";

/** 오목한 그릇이다. 빛이 위쪽에서 들어와 안쪽이 깊어 보이게 한다. */
export function Bowl({ radius, palette }: { radius: number; palette: Palette }) {
  return (
    <>
      <Circle cx={0} cy={0} r={radius}>
        <RadialGradient
          c={vec(0, -radius * 0.35)}
          r={radius * 1.5}
          colors={[palette.bowl, palette.bowlDeep]}
        />
      </Circle>
      <Circle
        cx={0}
        cy={0}
        r={radius}
        style="stroke"
        strokeWidth={radius * 0.045}
        color={palette.rim}
      />
    </>
  );
}
