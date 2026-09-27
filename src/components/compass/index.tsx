import { StyleSheet, Text, View } from "react-native";

import { useEasedAngle } from "../../hooks/use-eased-angle";
import { toRadians } from "../../lib/placement/angle";
import { FONT_SIZE, Palette } from "../../theme";
import { CompassNeedleHost } from "./needle-host";

interface CompassProps {
  headingDegrees: number;
  aligned: boolean;
  /** 나침반이 달린 기기인지. 없으면 맞춘 것으로 보고 북쪽을 위에 둔다. */
  available: boolean;
  palette: Palette;
}

const SIZE = 66;
/** 글자를 바늘 끝 바로 안쪽에 앉힌다. */
const LETTER_RING = 0.335;
const LETTER_BOX = 14;

/**
 * 작은 나침반.
 *
 * 실물 휴대용 앙부일구에도 반구 옆에 나침반이 붙어 있다. 그것이 없으면
 * 해시계를 바로 놓을 수가 없어서다. 이 앱에서도 같은 일을 한다.
 * 북쪽이 어디인지 보여 주고, 맞았을 때 테를 밝힌다.
 *
 * 바늘은 눈금판의 그림자와 같은 값을 따른다. 맞았다고 본 뒤에는 정북에
 * 붙어 멎는다. 그림자는 제자리에 섰는데 바늘만 떨리면 둘 중 하나가
 * 거짓말하는 것처럼 보인다.
 */
export function Compass({ headingDegrees, aligned, available, palette }: CompassProps) {
  const target = !available || aligned ? 0 : headingDegrees;
  const heading = useEasedAngle(target);
  const angle = toRadians(-heading);
  const middle = SIZE / 2;

  return (
    <View style={[styles.box, !available && styles.faded]}>
      <CompassNeedleHost
        headingDegrees={heading}
        aligned={aligned}
        size={SIZE}
        palette={palette}
      />
      <Text
        style={[
          styles.letter,
          {
            color: palette.accent,
            left: middle + Math.sin(angle) * LETTER_RING * SIZE - LETTER_BOX / 2,
            top: middle - Math.cos(angle) * LETTER_RING * SIZE - LETTER_BOX / 2,
          },
        ]}
      >
        북
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: SIZE, height: SIZE },
  faded: { opacity: 0.45 },
  letter: {
    position: "absolute",
    width: LETTER_BOX,
    height: LETTER_BOX,
    lineHeight: LETTER_BOX,
    textAlign: "center",
    fontSize: FONT_SIZE.tiny,
    fontWeight: "700",
  },
});
