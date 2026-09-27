import { StyleSheet, Text, View } from "react-native";

import { FONT_SIZE, Palette, RADIUS, SPACING } from "../theme";

interface SkyLegendProps {
  sunUp: boolean;
  moonUp: boolean;
  /** 밤에 그림자가 둘일 때. 어느 것이 무엇인지 여기서 밝힌다. */
  shadows?: boolean;
  palette: Palette;
}

/**
 * 눈금판 바깥의 표시가 무엇인지 한 줄로 밝힌다.
 *
 * 따뜻한 점이 해, 흰 점이 달이다. 둘 다 지금 하늘에서 그것이 있는 방위에
 * 떠 있다. 밤에 그림자가 둘이면 흐린 것과 또렷한 것이 무엇인지도 여기 적는다.
 * 카드 안에 적으면 카드가 길어져 눈금판을 밀어낸다.
 */
export function SkyLegend({ sunUp, moonUp, shadows = false, palette }: SkyLegendProps) {
  if (!sunUp && !moonUp && !shadows) return null;

  return (
    <View style={styles.row}>
      {sunUp ? <Dot color={palette.glow} label="해 뜬 쪽" palette={palette} /> : null}
      {moonUp ? <Dot color={palette.star} label="달 뜬 쪽" palette={palette} /> : null}
      {shadows ? (
        <>
          <Bar opacity={0.3} label="달그림자" palette={palette} />
          <Bar opacity={0.9} label="보정한 자리" palette={palette} testID="legend-corrected" />
        </>
      ) : null}
    </View>
  );
}

function Dot({ color, label, palette }: { color: string; label: string; palette: Palette }) {
  return (
    <View style={styles.mark}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.note, { color: palette.textSoft }]}>{label}</Text>
    </View>
  );
}

function Bar({
  opacity,
  label,
  palette,
  testID,
}: {
  opacity: number;
  label: string;
  palette: Palette;
  testID?: string;
}) {
  return (
    <View style={styles.mark} testID={testID}>
      <View style={[styles.bar, { backgroundColor: palette.text, opacity }]} />
      <Text style={[styles.note, { color: palette.textSoft }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: SPACING.md,
    rowGap: SPACING.xs,
    justifyContent: "center",
  },
  mark: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  dot: { width: 10, height: 10, borderRadius: RADIUS.round },
  bar: { width: 16, height: 4, borderRadius: 2 },
  note: { fontSize: FONT_SIZE.caption },
});
