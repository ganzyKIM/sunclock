import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { FONT_SIZE, Palette, RADIUS, SPACING } from "../theme";
import { InfoBlock, InfoBlocks } from "./info-blocks";

interface InfoTooltipProps {
  label: string;
  title: string;
  /** 요약, 목록, 표, 그림으로 나눈 설명. */
  blocks: InfoBlock[];
  palette: Palette;
}

const SHEET_MAX_WIDTH = 360;

/** 궁금해하는 자리에서 바로 열리는 짧은 설명이다. 긴 도움말을 먼저 읽게 하지 않는다. */
export function InfoTooltip({ label, title, blocks, palette }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const { width, height } = useWindowDimensions();
  const sheetWidth = Math.min(width - SPACING.xl * 2, SHEET_MAX_WIDTH);

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
          <Pressable onPress={() => undefined}>
            <View
              style={[
                styles.sheet,
                { backgroundColor: palette.card, width: sheetWidth, maxHeight: height * 0.8 },
              ]}
            >
              <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
                <InfoBlocks blocks={blocks} palette={palette} width={sheetWidth - SPACING.xl * 2} />
                <Pressable onPress={() => setOpen(false)} accessibilityRole="button" hitSlop={SPACING.md}>
                  <Text style={[styles.close, { color: palette.accent }]}>닫기</Text>
                </Pressable>
              </ScrollView>
            </View>
          </Pressable>
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
  sheet: { borderRadius: RADIUS.lg, overflow: "hidden" },
  content: { padding: SPACING.xl, gap: SPACING.md },
  /** 좁은 화면에서도 제목이 한 줄에 들어가도록 조금 작게 둔다. */
  title: { fontSize: FONT_SIZE.body + 3, fontWeight: "700" },
  close: { fontSize: FONT_SIZE.body, fontWeight: "600", textAlign: "right" },
});
