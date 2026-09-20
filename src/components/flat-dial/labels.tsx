import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FlatGeometry, OUTER_RADIUS } from "../../lib/dial/flat";
import { toRadians } from "../../lib/placement/angle";
import { FONT_SIZE, Palette } from "../../theme";

/** 글자는 바깥 테 바로 안쪽에 앉힌다. */
const RING = OUTER_RADIUS + 0.065;
const BOX = 30;

interface LabelsProps {
  geometry: FlatGeometry;
  center: number;
  radius: number;
  palette: Palette;
}

/** 주선 일곱 개에 묘 진 사 오 미 신 유를 붙인다. */
export function FlatLabels({ geometry, center, radius, palette }: LabelsProps) {
  const labels = useMemo(
    () =>
      geometry.hourLines
        .filter((line) => line.label !== null)
        .map((line) => {
          const a = toRadians(line.hourAngle);
          return {
            key: line.apparentMinutes,
            text: line.label as string,
            left: center + Math.sin(a) * RING * radius - BOX / 2,
            top: center - Math.cos(a) * RING * radius - BOX / 2,
          };
        }),
    [geometry, center, radius]
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {labels.map((label) => (
        <Text
          key={label.key}
          style={[styles.label, { left: label.left, top: label.top, color: palette.label }]}
        >
          {label.text}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    position: "absolute",
    width: BOX,
    height: BOX,
    lineHeight: BOX,
    textAlign: "center",
    fontSize: FONT_SIZE.caption,
    fontWeight: "600",
  },
});
