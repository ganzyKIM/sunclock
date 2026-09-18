import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { FONT_SIZE, Palette, RADIUS, SPACING } from "../theme";

interface InfoTooltipProps {
  label: string;
  title: string;
  body: string;
  palette: Palette;
}

/** 궁금해하는 자리에서 바로 열리는 짧은 설명이다. 긴 도움말을 먼저 읽게 하지 않는다. */
export function InfoTooltip({ label, title, body, palette }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${title} 설명 열기`}
        hitSlop={SPACING.md}
      >
        <Text style={[styles.label, { color: palette.textSoft }]}>{label} ⓘ</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: palette.card }]}>
            <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
            <Text style={[styles.body, { color: palette.textSoft }]}>{body}</Text>
            <Text style={[styles.close, { color: palette.accent }]}>닫기</Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: FONT_SIZE.caption },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  sheet: {
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    gap: SPACING.md,
    maxWidth: 360,
  },
  title: { fontSize: FONT_SIZE.title, fontWeight: "700" },
  body: { fontSize: FONT_SIZE.body, lineHeight: 24 },
  close: { fontSize: FONT_SIZE.body, fontWeight: "600", textAlign: "right" },
});
