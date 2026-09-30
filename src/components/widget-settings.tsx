import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  canPinWidget,
  openStandbySettings,
  pinWidget,
  widgetAvailable,
} from "../../modules/angbuilgu-widget";
import { FONT_SIZE, Palette, RADIUS, SPACING } from "../theme";

/**
 * 위젯을 놓고 대기화면을 고르는 자리.
 *
 * 둘 다 앱 밖에 있어서 있는 줄 모르고 지나치기 쉽다. 위젯은 런처가 허락하면
 * 여기서 바로 놓고, 대기화면은 안드로이드의 화면 보호기 설정으로 데려간다.
 */
export function WidgetSettings({ palette }: { palette: Palette }) {
  if (!widgetAvailable) return null;

  const chip = (label: string, onPress: () => void) => (
    <Pressable
      key={label}
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.chip, { borderColor: palette.accent }]}
    >
      <Text style={{ color: palette.accent }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.box, { backgroundColor: palette.card }]}>
      <Text style={[styles.title, { color: palette.text }]}>위젯</Text>
      <Text style={[styles.description, { color: palette.textSoft }]}>
        홈 화면에 눈금판을 놓는다. 작게 줄이면 눈금판과 시각만 남는다. 앱을 마지막으로 연
        곳의 해로 셈한다.
      </Text>
      {canPinWidget() ? (
        <View style={styles.chips}>
          {chip("작은 위젯 놓기", () => pinWidget("small"))}
          {chip("넓은 위젯 놓기", () => pinWidget("wide"))}
        </View>
      ) : (
        <Text style={[styles.description, { color: palette.text }]}>
          홈 화면의 빈 곳을 길게 눌러 위젯에서 앙부일구를 고른다.
        </Text>
      )}

      <Text style={[styles.title, styles.second, { color: palette.text }]}>대기화면</Text>
      <Text style={[styles.description, { color: palette.textSoft }]}>
        충전하는 동안 화면을 눈금판으로 채운다. 화면 보호기에서 앙부일구를 고른다.
      </Text>
      <View style={styles.chips}>{chip("화면 보호기 설정 열기", () => openStandbySettings())}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: RADIUS.lg, padding: SPACING.lg, gap: SPACING.sm, width: "100%" },
  title: { fontSize: FONT_SIZE.body, fontWeight: "700" },
  second: { marginTop: SPACING.md },
  description: { fontSize: FONT_SIZE.caption, lineHeight: 20 },
  chips: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.xs, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
    borderWidth: 1,
  },
});
