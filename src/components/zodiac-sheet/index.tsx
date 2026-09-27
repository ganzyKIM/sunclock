import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { zodiacOfBranch } from "../../lib/time/zodiac";
import { FONT_SIZE, Palette, RADIUS, SPACING } from "../../theme";
import { zodiacArt } from "./art";

interface ZodiacSheetProps {
  /** 열어 보일 지지. 닫혀 있으면 null이다. */
  branch: string | null;
  palette: Palette;
  /** 달시계로 읽는 밤인지. 밤에는 그림에 달빛이 얹힌다. */
  night?: boolean;
  onClose: () => void;
}

/** 그림을 동그랗게 오려 얹는 크기. */
const FIGURE_SIZE = 172;
/** 그림 뒤에 번지는 빛의 크기. */
const HALO_SIZE = 200;
/** 빛은 그림을 받치기만 한다. 진하면 테두리처럼 보인다. */
const HALO_OPACITY = 0.35;
/** 밤에 그림 위에 얹는 달빛. 짐승은 보이되 밤이라는 것도 보이는 만큼. */
const MOONLIGHT_OPACITY = 0.24;
const OPEN_MS = 620;

/**
 * 눈금판의 12지 이름을 누르면 열리는 쪽지다.
 *
 * 짐승이 먼저 떠오르고 글이 뒤따라 올라온다. 한꺼번에 나타나면 정보처럼
 * 보이지만, 차례를 두면 짐승이 그 시각에 깨어나는 것처럼 보인다.
 *
 * 그림은 빛나는 원반 위에 앉은 짐승이다. 그 원반을 동그랗게 오려 쪽지에 얹고
 * 뒤에 빛을 한 겹 깔아, 낮에는 볕 속에, 밤에는 달 속에 앉은 것처럼 보이게 한다.
 */
export function ZodiacSheet({ branch, palette, night = false, onClose }: ZodiacSheetProps) {
  const sign = branch === null ? undefined : zodiacOfBranch(branch);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!sign) return;
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: OPEN_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [sign, progress]);

  if (!sign) return null;
  const art = zodiacArt(sign.animal);

  /** 한 흐름을 구간마다 나눠 써서 차례로 떠오르게 한다. */
  const between = (from: number, to: number, outputRange: number[]) =>
    progress.interpolate({
      inputRange: [from, to],
      outputRange,
      extrapolate: "clamp",
    });

  const card = {
    opacity: between(0, 0.25, [0, 1]),
    transform: [{ translateY: between(0, 0.35, [28, 0]) }],
  };
  const halo = {
    opacity: between(0.1, 0.45, [0, HALO_OPACITY]),
    transform: [{ scale: between(0.1, 0.55, [0.72, 1]) }],
  };
  const figure = {
    opacity: between(0.2, 0.6, [0, 1]),
    transform: [
      { translateY: between(0.2, 0.7, [14, 0]) },
      { scale: between(0.2, 0.8, [0.88, 1]) },
    ],
  };
  const words = {
    opacity: between(0.4, 0.85, [0, 1]),
    transform: [{ translateY: between(0.4, 0.9, [14, 0]) }],
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="닫기">
        {/* 쪽지 안을 눌렀을 때는 닫히지 않게 한다. */}
        <Pressable onPress={() => undefined}>
          <Animated.View style={[styles.sheet, { backgroundColor: palette.card }, card]}>
            <View style={styles.stage}>
              <Animated.View
                style={[styles.halo, { backgroundColor: palette.glow }, halo]}
              />
              <Animated.View style={[styles.disc, figure]}>
                {art ? (
                  <Image
                    source={art}
                    style={styles.art}
                    resizeMode="cover"
                    accessibilityLabel={`${sign.animal} 그림`}
                    testID="zodiac-figure"
                  />
                ) : null}
                {night ? (
                  <View
                    testID="zodiac-moonlight"
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFill,
                      { backgroundColor: palette.bowl, opacity: MOONLIGHT_OPACITY },
                    ]}
                  />
                ) : null}
              </Animated.View>
            </View>

            <Animated.View style={[styles.words, words]}>
              <View style={styles.titleRow}>
                <Text style={[styles.hanja, { color: palette.text }]}>
                  {sign.branchHanja}
                </Text>
                <View style={styles.titleText}>
                  <Text testID="zodiac-branch" style={[styles.branch, { color: palette.text }]}>
                    {sign.branch}시
                  </Text>
                  <Text style={[styles.hours, { color: palette.textSoft }]}>
                    {sign.hours}
                  </Text>
                </View>
              </View>

              <Text testID="zodiac-animal" style={[styles.animal, { color: palette.accent }]}>
                {sign.animal} {sign.animalHanja}
              </Text>

              <Text style={[styles.body, { color: palette.text }]}>{sign.moment}</Text>
              <Text style={[styles.body, { color: palette.textSoft }]}>{sign.why}</Text>

              <Pressable onPress={onClose} accessibilityRole="button" hitSlop={SPACING.md}>
                <Text style={[styles.close, { color: palette.accent }]}>닫기</Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  sheet: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
    maxWidth: 360,
    alignItems: "center",
  },
  stage: {
    width: HALO_SIZE,
    height: HALO_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    width: HALO_SIZE,
    height: HALO_SIZE,
    borderRadius: RADIUS.round,
  },
  /** 그림을 동그랗게 오리는 틀. 달빛도 이 안에만 얹힌다. */
  disc: {
    width: FIGURE_SIZE,
    height: FIGURE_SIZE,
    borderRadius: RADIUS.round,
    overflow: "hidden",
  },
  art: { width: FIGURE_SIZE, height: FIGURE_SIZE },
  words: { width: "100%", gap: SPACING.sm },
  titleRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  titleText: { flexShrink: 1, gap: 2 },
  hanja: { fontSize: FONT_SIZE.hero, fontWeight: "700" },
  branch: { fontSize: FONT_SIZE.title, fontWeight: "700" },
  hours: { fontSize: FONT_SIZE.caption },
  animal: { fontSize: FONT_SIZE.body, fontWeight: "600" },
  body: { fontSize: FONT_SIZE.body, lineHeight: 24 },
  close: {
    fontSize: FONT_SIZE.body,
    fontWeight: "600",
    textAlign: "right",
    marginTop: SPACING.xs,
  },
});
