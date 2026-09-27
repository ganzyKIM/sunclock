import { StyleSheet, View } from "react-native";

import { Palette, withAlpha } from "../theme";

/**
 * 두 자리 사이에 놓는 가는 장식 줄. 선 둘과 가운데 마름모 하나다.
 * 나뉜다는 것을 말하되 소리 내지 않는다.
 */
export function Flourish({ palette, width = 160 }: { palette: Palette; width?: number }) {
  const color = withAlpha(palette.line, 0.45);
  return (
    <View style={[styles.row, { width }]} pointerEvents="none">
      <View style={[styles.line, { backgroundColor: color }]} />
      <View style={[styles.dot, { borderColor: color }]} />
      <View style={[styles.diamond, { borderColor: color }]} />
      <View style={[styles.dot, { borderColor: color }]} />
      <View style={[styles.line, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center" },
  line: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
  diamond: { width: 7, height: 7, borderWidth: 1, transform: [{ rotate: "45deg" }] },
  dot: { width: 3, height: 3, borderWidth: 1, borderRadius: 2 },
});
