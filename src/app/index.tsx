import { useWindowDimensions, View } from "react-native";

import { Dial } from "../components/dial";
import { buildDialGeometry, HANYANG_LATITUDE } from "../lib/dial/geometry";
import { rodShadowPoints, shadowPoint } from "../lib/dial/projection";
import { DAY_PALETTE } from "../theme";

export default function Index() {
  const { width } = useWindowDimensions();
  const geometry = buildDialGeometry(HANYANG_LATITUDE);
  const size = Math.min(width - 32, 420);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: DAY_PALETTE.background,
      }}
    >
      <Dial
        geometry={geometry}
        shadow={shadowPoint(40, 220, 0)}
        rodShadow={rodShadowPoints(HANYANG_LATITUDE, 40, 220, 0)}
        palette={DAY_PALETTE}
        size={size}
        glowing
      />
    </View>
  );
}
