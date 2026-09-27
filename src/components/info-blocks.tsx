import { StyleSheet, Text, View } from "react-native";

import { FONT_SIZE, Palette, SPACING, withAlpha } from "../theme";
import { Figure, FigureKind } from "./figures";

/**
 * 설명 한 토막. 줄글 대신 요약, 목록, 표, 그림으로 나눠 놓는다.
 *
 * 읽는 사람은 눈금판을 보다가 잠깐 들른다. 한눈에 들어오지 않으면
 * 읽지 않고 닫는다. 그래서 한 토막은 한 가지만 말한다.
 */
export type InfoBlock =
  | { kind: "lead"; text: string }
  | { kind: "text"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "steps"; items: string[] }
  | { kind: "table"; rows: string[][] }
  | { kind: "figure"; figure: FigureKind };

interface InfoBlocksProps {
  blocks: InfoBlock[];
  palette: Palette;
  /** 그림이 차지할 수 있는 너비. */
  width: number;
}

export function InfoBlocks({ blocks, palette, width }: InfoBlocksProps) {
  return (
    <View style={styles.stack}>
      {blocks.map((block, index) => (
        <Block key={index} block={block} palette={palette} width={width} />
      ))}
    </View>
  );
}

function Block({ block, palette, width }: { block: InfoBlock; palette: Palette; width: number }) {
  switch (block.kind) {
    case "lead":
      return <Text style={[styles.lead, { color: palette.text }]}>{block.text}</Text>;
    case "text":
      return <Text style={[styles.text, { color: palette.textSoft }]}>{block.text}</Text>;
    case "list":
    case "steps":
      return (
        <View style={styles.list}>
          {block.items.map((item, index) => (
            <View key={index} style={styles.item}>
              <Text style={[styles.marker, { color: palette.accent }]}>
                {block.kind === "steps" ? `${index + 1}` : "•"}
              </Text>
              <Text style={[styles.text, styles.itemText, { color: palette.textSoft }]}>{item}</Text>
            </View>
          ))}
        </View>
      );
    case "table":
      return (
        <View style={[styles.table, { borderColor: withAlpha(palette.line, 0.35) }]}>
          {block.rows.map((row, rowIndex) => (
            <View
              key={rowIndex}
              style={[
                styles.tableRow,
                rowIndex > 0 && { borderTopWidth: 1, borderTopColor: withAlpha(palette.line, 0.25) },
              ]}
            >
              {row.map((cell, cellIndex) => (
                <Text
                  key={cellIndex}
                  style={[
                    styles.text,
                    cellIndex === 0 ? styles.tableHead : styles.tableCell,
                    { color: cellIndex === 0 ? palette.text : palette.textSoft },
                  ]}
                >
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </View>
      );
    case "figure":
      return (
        <View style={styles.figure}>
          <Figure kind={block.figure} palette={palette} width={width} />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  stack: { gap: SPACING.md },
  lead: { fontSize: FONT_SIZE.body, lineHeight: FONT_SIZE.body * 1.5, fontWeight: "600" },
  text: { fontSize: FONT_SIZE.caption, lineHeight: FONT_SIZE.caption * 1.6 },
  list: { gap: SPACING.xs },
  item: { flexDirection: "row", gap: SPACING.sm, alignItems: "flex-start" },
  marker: { width: 14, textAlign: "center", fontSize: FONT_SIZE.caption, lineHeight: FONT_SIZE.caption * 1.6, fontWeight: "700" },
  itemText: { flex: 1 },
  table: { borderWidth: 1, borderRadius: 10, overflow: "hidden" },
  tableRow: { flexDirection: "row", paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, gap: SPACING.sm },
  tableHead: { flex: 0.42, fontWeight: "600" },
  tableCell: { flex: 1 },
  figure: { paddingVertical: SPACING.xs },
});
