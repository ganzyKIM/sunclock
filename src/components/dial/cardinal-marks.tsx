import { StyleSheet, Text, View } from "react-native";

import { FONT_SIZE, Palette } from "../../theme";

interface CardinalMarksProps {
  /** 눈금판 상자의 한가운데. */
  center: number;
  /** 눈금판 반지름. */
  radius: number;
  palette: Palette;
}

/** 글자를 앉히는 자리. 해와 달이 도는 고리 바깥, 상자 안쪽이다. */
const RING = 1.33;
const BOX = 18;

const MARKS = [
  { hanja: "北", angle: 0 },
  { hanja: "東", angle: 90 },
  { hanja: "南", angle: 180 },
  { hanja: "西", angle: 270 },
];

/**
 * 네 방위의 한자. 실물 앙부일구의 테두리에 새겨진 글자를 따랐다.
 * 화면 위쪽이 북쪽이다. 나침반이 이 글자를 향해 돌아온다.
 */
export function CardinalMarks({ center, radius, palette }: CardinalMarksProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {MARKS.map((mark) => {
        const a = (mark.angle * Math.PI) / 180;
        return (
          <Text
            key={mark.hanja}
            style={[
              styles.mark,
              {
                color: palette.textSoft,
                left: center + Math.sin(a) * RING * radius - BOX / 2,
                top: center - Math.cos(a) * RING * radius - BOX / 2,
              },
            ]}
          >
            {mark.hanja}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    position: "absolute",
    width: BOX,
    height: BOX,
    lineHeight: BOX,
    textAlign: "center",
    fontSize: FONT_SIZE.tiny,
    fontWeight: "600",
    opacity: 0.75,
  },
});
