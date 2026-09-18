import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DialGeometry } from "../../lib/dial/geometry";
import { FONT_SIZE, Palette } from "../../theme";

/** 글자가 테에 걸치지 않도록 안쪽으로 조금 당긴다. */
const INSET = 0.86;
const BOX = 28;

interface LabelsProps {
  geometry: DialGeometry;
  radius: number;
  palette: Palette;
}

/**
 * 주선 일곱 개에 묘 진 사 오 미 신 유를 붙인다.
 * 스킨에 글자를 그리려면 글꼴 파일이 있어야 하므로, 한글이 제대로 나오도록
 * 화면 글자를 반구 위에 겹쳐 놓는다.
 */
export function DialLabels({ geometry, radius, palette }: LabelsProps) {
  const labels = useMemo(
    () =>
      geometry.hourLines
        .filter((line) => line.label !== null)
        .map((line) => {
          const end = line.points[line.points.length - 1];
          return {
            key: line.apparentMinutes,
            text: line.label as string,
            left: radius + end.x * radius * INSET - BOX / 2,
            top: radius + end.y * radius * INSET - BOX / 2,
          };
        }),
    [geometry, radius]
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {labels.map((label) => (
        <Text
          key={label.key}
          style={[
            styles.label,
            { left: label.left, top: label.top, color: palette.label },
          ]}
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
