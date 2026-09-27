import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FlatGeometry, OUTER_RADIUS } from "../../lib/dial/flat";
import { toRadians } from "../../lib/placement/angle";
import { FONT_SIZE, Palette, SPACING } from "../../theme";

/** 글자는 바깥 테 바로 안쪽에 앉힌다. */
const RING = OUTER_RADIUS + 0.06;
const BOX = 40;

interface LabelsProps {
  geometry: FlatGeometry;
  center: number;
  radius: number;
  palette: Palette;
  /** 달시계로 읽는 밤인지. 그때는 달 이름이 앞으로 나온다. */
  night: boolean;
  /** 이름을 누르면 그 지지를 알려 준다. */
  onSelectBranch?: (branch: string) => void;
}

/**
 * 주선 열둘에 이름을 붙인다.
 *
 * 한 선에 이름이 둘이다. 해로 읽을 때의 이름과, 달로 읽을 때의 이름이다.
 * 보름달은 해의 정반대에 있어서 같은 선이 열두 시간 떨어진 두 시각을
 * 가리킨다. 지금 쓰는 쪽을 크고 진하게, 쉬는 쪽을 작고 흐리게 둔다.
 *
 * 해도 달도 닿지 않는 선이 있다. 그 시각에는 무엇도 지평선 위에 없어서
 * 그림자가 질 수 없다. 실물 앙부일구가 밤 시각을 아예 새기지 않은 까닭이다.
 * 여기서는 자리만 지키도록 흐리게 둔다.
 *
 * 이름은 누를 수 있다. 눌린 것은 앞에 나와 있는 쪽, 곧 지금 읽고 있는
 * 이름이다. 글자를 담는 판 자체는 손길을 받지 않아 눈금판을 가리지 않는다.
 */
export function FlatLabels({
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
          const a = toRadians(line.hourAngle);
          return {
            key: line.apparentMinutes,
            main: (night ? line.moonLabel : line.label) as string,
            sub: (night ? line.label : line.moonLabel) as string,
            /** 그림자가 닿을 수 없는 시각. 자리만 지킨다. */
            idle: line.daylight === null,
            left: center + Math.sin(a) * RING * radius - BOX / 2,
            top: center - Math.cos(a) * RING * radius - BOX / 2,
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
          <Text
            style={[styles.label, { color: palette.label }, label.idle && styles.idle]}
          >
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
  /** 해도 달도 닿지 않는 시각. 눈금판을 채우되 앞으로 나서지 않는다. */
  idle: { opacity: 0.62, fontWeight: "400" },
  /** 지금 쓰지 않는 쪽. 있는 줄만 알아볼 만큼만 보인다. */
  quiet: {
    fontSize: FONT_SIZE.caption * 0.74,
    fontWeight: "400",
    opacity: 0.66,
  },
});
