import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { DialGeometry } from "../../lib/dial/geometry";
import { FONT_SIZE, Palette, SPACING } from "../../theme";

/** 글자가 테에 걸치지 않도록 안쪽으로 조금 당긴다. */
const INSET = 0.9;
const BOX = 38;

interface LabelsProps {
  geometry: DialGeometry;
  /** 반구 중심의 화면 좌표. */
  center: number;
  /** 반구의 반지름. */
  radius: number;
  palette: Palette;
  /** 달시계로 읽는 밤인지. 그때는 달 이름이 앞으로 나온다. */
  night: boolean;
  /** 이름을 누르면 그 지지를 알려 준다. */
  onSelectBranch?: (branch: string) => void;
}

/**
 * 주선 일곱 개에 이름을 붙인다.
 *
 * 한 선에 이름이 둘이다. 해로 읽을 때의 묘 진 사 오 미 신 유와, 달로 읽을
 * 때의 유 술 해 자 축 인 묘다. 보름달은 해의 정반대에 있어 같은 선이 열두
 * 시간 떨어진 두 시각을 가리킨다. 실물에는 낮 이름만 새겨져 있지만, 이 앱은
 * 밤에도 달시계로 읽으므로 그렇게 해야 열두 지지가 모두 제자리를 얻는다.
 *
 * 스킨에 글자를 그리려면 글꼴 파일이 있어야 하므로, 한글이 제대로 나오도록
 * 화면 글자를 반구 위에 겹쳐 놓는다.
 *
 * 이름은 누를 수 있다. 눌린 것은 앞에 나와 있는 쪽, 곧 지금 읽고 있는 이름이다.
 */
export function DialLabels({
  geometry,
  center,
  radius,
  palette,
  night,
  onSelectBranch,
}: LabelsProps) {
  const labels = useMemo(
    () =>
      geometry.hourLines
        .filter((line) => line.label !== null)
        .map((line) => {
          // 시각선의 테두리 쪽 끝에 붙인다. 안쪽 끝은 비스듬히 보면 서로 뭉친다.
          const end = line.points[0];
          return {
            key: line.apparentMinutes,
            main: (night ? line.moonLabel : line.label) as string,
            sub: (night ? line.label : line.moonLabel) as string,
            left: center + end.x * radius * INSET - BOX / 2,
            top: center + end.y * radius * INSET - BOX / 2,
          };
        }),
    [geometry, center, radius, night]
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {labels.map((label) => (
        <Pressable
          key={label.key}
          style={[styles.hit, { left: label.left, top: label.top }]}
          onPress={() => onSelectBranch?.(label.main)}
          disabled={!onSelectBranch}
          hitSlop={SPACING.xs}
          accessibilityRole="button"
          accessibilityLabel={`${label.main}시 알아보기`}
        >
          <Text style={[styles.label, { color: palette.label }]}>
            {label.main}
            <Text style={[styles.quiet, { color: palette.textSoft }]}>{label.sub}</Text>
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { position: "absolute", width: BOX, height: BOX },
  label: {
    width: BOX,
    height: BOX,
    lineHeight: BOX,
    textAlign: "center",
    fontSize: FONT_SIZE.caption,
    fontWeight: "600",
  },
  /** 지금 쓰지 않는 쪽. 있는 줄만 알아볼 만큼만 보인다. */
  quiet: {
    fontSize: FONT_SIZE.caption * 0.74,
    fontWeight: "400",
    opacity: 0.66,
  },
});
