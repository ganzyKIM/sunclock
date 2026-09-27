import { StyleSheet, Text, View } from "react-native";

import {
  angleDifference,
  GUIDE_STEP_DEGREES,
  roundToStep,
} from "../lib/placement/angle";
import { FONT_SIZE, Palette, RADIUS, SPACING } from "../theme";

interface AlignmentGuideProps {
  headingDegrees: number;
  isAligned: boolean;
  isFlat: boolean;
  tiltDegrees: number;
  /** 0에서 3. 1 이하면 나침반을 보정해야 한다. */
  accuracy: number;
  compassAvailable: boolean;
  palette: Palette;
}

/** 나침반이 이 값 이하로 보고하면 보정을 권한다. */
const LOW_ACCURACY = 1;

/** 할 일은 하나뿐이다. 눕히고, 돌려서 북쪽을 맞추는 것이다. */
export function AlignmentGuide({
  headingDegrees,
  isAligned,
  isFlat,
  tiltDegrees,
  accuracy,
  compassAvailable,
  palette,
}: AlignmentGuideProps) {
  if (!compassAvailable) {
    return <Hint palette={palette} text="나침반 없음 · 맞춘 것으로 본다" />;
  }

  if (!isFlat) {
    return (
      <Hint
        palette={palette}
        text={`바닥에 눕힌다 · ${roundToStep(tiltDegrees, 5)}도 기울어짐`}
      />
    );
  }

  if (accuracy <= LOW_ACCURACY) {
    return <Hint palette={palette} text="나침반 흔들림 · 8자로 흔든다" />;
  }

  if (isAligned) {
    return <Hint palette={palette} text="북쪽 맞음" highlight />;
  }

  const offset = angleDifference(0, headingDegrees);
  const direction = offset > 0 ? "오른쪽" : "왼쪽";
  // 한 도 단위로 안내하면 숫자가 떨리고 맞추기도 어렵다.
  const amount = roundToStep(Math.abs(offset), GUIDE_STEP_DEGREES);
  return (
    <Hint palette={palette} text={`${direction}으로 ${amount}도 돌린다`} />
  );
}

function Hint({
  text,
  palette,
  highlight = false,
}: {
  text: string;
  palette: Palette;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: highlight ? palette.accent : palette.card }]}>
      <Text style={[styles.text, { color: highlight ? palette.card : palette.textSoft }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
    maxWidth: "100%",
    flexShrink: 1,
  },
  text: {
    fontSize: FONT_SIZE.caption,
    fontWeight: "600",
    textAlign: "center",
  },
});
