import { StyleSheet, Text, View } from "react-native";

import { FONT_SIZE, Palette, RADIUS, SPACING } from "../theme";

/** 앱이 멈추는 대신 무엇을 할 수 있는지 알려 준다. */
export function Notice({
  title,
  body,
  palette,
}: {
  title: string;
  body: string;
  palette: Palette;
}) {
  return (
    <View style={[styles.box, { backgroundColor: palette.card }]}>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.body, { color: palette.textSoft }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: RADIUS.lg, padding: SPACING.xl, gap: SPACING.sm, width: "100%" },
  title: { fontSize: FONT_SIZE.title, fontWeight: "700" },
  body: { fontSize: FONT_SIZE.body, lineHeight: 24 },
});
