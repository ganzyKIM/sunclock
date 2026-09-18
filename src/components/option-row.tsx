import { Pressable, StyleSheet, Text, View } from "react-native";

import { FONT_SIZE, Palette, RADIUS, SPACING } from "../theme";

interface OptionRowProps {
  title: string;
  description: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  palette: Palette;
}

export function OptionRow({
  title,
  description,
  options,
  value,
  onChange,
  palette,
}: OptionRowProps) {
  return (
    <View style={[styles.box, { backgroundColor: palette.card }]}>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.description, { color: palette.textSoft }]}>{description}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? palette.accent : "transparent",
                  borderColor: selected ? palette.accent : palette.textSoft,
                },
              ]}
            >
              <Text style={{ color: selected ? palette.card : palette.textSoft }}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: RADIUS.lg, padding: SPACING.lg, gap: SPACING.sm, width: "100%" },
  title: { fontSize: FONT_SIZE.body, fontWeight: "700" },
  description: { fontSize: FONT_SIZE.caption, lineHeight: 20 },
  options: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.xs, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
    borderWidth: 1,
  },
});
