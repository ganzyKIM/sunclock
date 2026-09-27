import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { SundialState } from "../lib/sundial";
import { formatClockTime, formatFriendlyTime, formatSignedMinutes } from "../lib/time/clock";
import { formatMoonCorrection } from "../lib/time/moon-dial";
import { FONT_SIZE, lerpColor, Palette, RADIUS, SPACING, withAlpha } from "../theme";
import { InfoTooltip } from "./info-tooltip";

interface ReadingCardProps {
  state: SundialState;
  palette: Palette;
  /** 북쪽을 맞췄는지. 맞추기 전에는 아무 수치도 내지 않는다. */
  aligned?: boolean;
  /** 맞춘 정도. 0에서 1. 맞춰 둔 동안 카드가 빛을 머금는다. */
  lit?: number;
}

/**
 * 해시계는 제대로 놓았을 때만 읽는 물건이다.
 *
 * 맞추기 전에는 시계 숫자까지 모두 비운다. 무엇이든 미리 떠 있으면 맞추기
 * 전에 읽은 것처럼 보인다. 비운 자리는 채웠을 때와 같은 크기여야 한다.
 * 카드가 늘었다 줄었다 하면 눈이 그쪽으로 끌려간다. 줄 수를 못 박고,
 * 숫자의 빈자리는 숫자와 같은 폭으로 둔다.
 *
 * 줄은 셋이고 밤에는 하나가 더 붙는다. 그 이상은 눈금판을 밀어낸다.
 */
const UNREAD = "--";
const UNREAD_CLOCK = "--:--";

/** 숨었다 나오는 데 걸리는 시간. 길면 기다리게 되고 짧으면 뚝 끊긴다. */
const HIDE_MS = 130;
const SHOW_MS = 240;
/** 사그라들었을 때의 밝기. 0이면 빈 카드가 한 번 보인다. */
const HIDDEN_OPACITY = 0.12;
/** 맞춰 둔 동안 카드에 드는 빛의 양. 바탕은 조금, 테두리는 또렷하게. */
const LIT_CARD = 0.12;
const LIT_BORDER = 0.55;

export function ReadingCard({
  state,
  palette,
  aligned = true,
  lit = aligned ? 1 : 0,
}: ReadingCardProps) {
  /**
   * 화면에 실제로 적혀 있는 상태. 맞은 순간과 한 박자 어긋난다.
   * 있던 글씨가 먼저 잦아들고 그 자리에 새 글씨가 배어 나온다.
   */
  const [shown, setShown] = useState(aligned);
  // 카드 하나의 짧은 밝기 변화라 자바스크립트 쪽에서 돌려도 부담이 없다.
  const fade = useRef(new Animated.Value(1)).current;
  /** 가장 마지막에 들어온 상태. 끝나는 자리는 늘 이 값이어야 한다. */
  const latest = useRef(aligned);
  latest.current = aligned;
  /** 한 번이라도 사그라든 적이 있는지. 없으면 밝힐 것도 없다. */
  const dimmed = useRef(false);

  useEffect(() => {
    if (shown === aligned) {
      // 쉬는 동안에는 반드시 또렷하다. 어느 길로 여기 왔든 밝기를 1에 못 박는다.
      if (!dimmed.current) {
        fade.setValue(1);
        return;
      }
      const settle = Animated.timing(fade, {
        toValue: 1,
        duration: SHOW_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      });
      settle.start(() => fade.setValue(1));
      return () => settle.stop();
    }

    dimmed.current = true;
    const dissolve = Animated.timing(fade, {
      toValue: HIDDEN_OPACITY,
      duration: HIDE_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: false,
    });
    // 중간에 끊겨도 반드시 마지막 상태로 갈아입는다. 밝아지는 일은 위에서 맡는다.
    dissolve.start(() => setShown(latest.current));
    return () => dissolve.stop();
  }, [aligned, shown, fade]);

  /** 그림자가 없으면 그림자가 가리키는 시각도 없다. */
  const shadowMinutes =
    state.shadow === null
      ? null
      : state.mode === "moon" && state.moonReading
        ? state.moonReading.correctedMinutes
        : state.apparentMinutes;
  const shadowName = state.mode === "moon" ? "달그림자" : "해그림자";
  const moon = state.mode === "moon" ? state.moonReading : null;

  return (
    <View
      testID="reading-card"
      style={[
        styles.card,
        {
          backgroundColor: lerpColor(palette.card, palette.glow, LIT_CARD * lit),
          borderColor: withAlpha(palette.accent, LIT_BORDER * lit),
        },
      ]}
    >
      {/* 안쪽에 한 겹 더 두른 가는 틀. 액자처럼 보이게 한다. */}
      <View
        pointerEvents="none"
        style={[styles.inner, { borderColor: withAlpha(palette.line, 0.22) }]}
      />
      <Animated.View testID="reading-body" style={[styles.body, { opacity: fade }]}>
        <View style={styles.row}>
          <Text
            testID="friendly-time"
            style={[styles.friendly, { color: palette.text }]}
            numberOfLines={1}
          >
            {shown ? formatFriendlyTime(state.standardMinutes) : UNREAD}
          </Text>
          <InfoTooltip
            label="그림자 길이"
            title="그림자 읽는 법"
            blocks={[
              { kind: "lead", text: "가리키는 쪽이 시각, 길이가 절기다." },
              { kind: "figure", figure: "shadow-length" },
              {
                kind: "list",
                items: [
                  "여름: 해가 높다 → 그림자 짧다 → 안쪽 줄",
                  "겨울: 해가 낮다 → 그림자 길다 → 바깥 줄",
                  "바늘 끝이 걸린 줄이 오늘의 절기",
                ],
              },
            ]}
            palette={palette}
          />
        </View>

        <View style={styles.row}>
          <Text style={[styles.traditional, { color: palette.text }]} numberOfLines={1}>
            {shown ? state.traditional.label : UNREAD}
            <Text style={[styles.term, { color: palette.textSoft }]}> · {state.solarTermName} 무렵</Text>
          </Text>
          <InfoTooltip
            label="전통 시각"
            title="96각법"
            blocks={[
              {
                kind: "table",
                rows: [
                  ["하루", "12시"],
                  ["한 시", "2시간 = 초 + 정"],
                  ["초·정", "1시간 = 4각"],
                  ["한 각", "15분"],
                ],
              },
              { kind: "figure", figure: "hour-halves" },
              {
                kind: "list",
                items: [
                  "이름은 시의 한가운데",
                  "이름 왼쪽이 초, 오른쪽이 정",
                  "가장 굵은 줄이 시의 경계",
                  "자시는 밤 11시 시작. 오정 초각이 정오",
                ],
              },
            ]}
            palette={palette}
          />
        </View>

        <View style={styles.row}>
          {/* 한 덩어리가 중간에서 잘리지 않도록 덩어리째 줄을 넘긴다. */}
          <View style={styles.units}>
            {shadowMinutes !== null ? (
              <>
                <Detail
                  label={shadowName}
                  value={shown ? formatClockTime(shadowMinutes) : UNREAD_CLOCK}
                  palette={palette}
                />
                <Text style={[styles.detail, { color: palette.textSoft }]}>·</Text>
              </>
            ) : null}
            <Detail
              label="시계"
              value={shown ? formatClockTime(state.standardMinutes) : UNREAD_CLOCK}
              palette={palette}
            />
          </View>
          <InfoTooltip
            label="왜 다를까"
            title="해시계와 시계"
            blocks={[
              { kind: "lead", text: "해시계의 정오는 해가 남중한 때다." },
              {
                kind: "table",
                rows: [
                  ["경도 보정", formatSignedMinutes(state.longitudeCorrection)],
                  ["균시차", formatSignedMinutes(state.equationOfTime)],
                  ["시계 − 해시계", formatSignedMinutes(state.standardMinutes - state.apparentMinutes)],
                ],
              },
              {
                kind: "list",
                items: [
                  "기준선(동경 135도)보다 서쪽이라 해가 늦게 남중한다",
                  "지구 궤도가 타원이라 계절마다 어긋난다",
                ],
              },
            ]}
            palette={palette}
          />
        </View>

        {moon ? (
          <View testID="moon-reading" style={styles.moonBox}>
            <View style={styles.row}>
              <View style={styles.units}>
                <Detail label="달 눈금" value={shown ? moon.flippedLabel : UNREAD} palette={palette} />
                <Text style={[styles.detail, { color: palette.textSoft }]}>·</Text>
                <Detail
                  label="보정"
                  value={shown ? formatMoonCorrection(moon.correctionMinutes) : UNREAD}
                  palette={palette}
                />
                <Text style={[styles.detail, { color: palette.textSoft }]}>·</Text>
                <Text style={[styles.detail, { color: palette.textSoft }]} numberOfLines={1}>
                  보름 {Math.abs(Math.round(state.moon.daysFromFullMoon))}일{" "}
                  {state.moon.daysFromFullMoon >= 0 ? "지남" : "전"} · {state.moon.phaseName}
                </Text>
              </View>
              <InfoTooltip
                label="달시계"
                title="달로 읽기"
                blocks={[
                  { kind: "lead", text: "보름달은 해의 정반대. 같은 눈금이 12시간 차이다." },
                  { kind: "figure", figure: "moon-flip" },
                  {
                    kind: "list",
                    items: [
                      "밤에는 달로 읽는 이름이 앞에 선다",
                      "보름에서 하루 멀어질 때마다 50분씩 어긋난다. 달의 자리로 메운다",
                    ],
                  },
                  { kind: "figure", figure: "two-shadows" },
                  {
                    kind: "list",
                    items: [
                      "흐린 그림자: 지금 달그림자",
                      "또렷한 그림자: 보정한 자리. 이것이 실제 시각",
                      "길이는 절기가 아니라 달의 높이를 따른다",
                    ],
                  },
                ]}
                palette={palette}
              />
            </View>
          </View>
        ) : null}

        {state.mode === "waiting" && state.minutesUntilSunrise !== null ? (
          <Text testID="until-sunrise" style={[styles.detail, { color: palette.textSoft }]}>
            해 뜨기까지 {Math.floor(state.minutesUntilSunrise / 60)}시간{" "}
            {Math.round(state.minutesUntilSunrise % 60)}분
          </Text>
        ) : null}

        {state.notices.map((notice) => (
          <Text key={notice} style={[styles.notice, { color: palette.accent }]}>
            {notice}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

/** 이름은 옅게, 값은 진하게. 숫자 폭을 고정해 빈자리와 채운 자리의 너비가 같다. */
function Detail({ label, value, palette }: { label: string; value: string; palette: Palette }) {
  return (
    <Text style={[styles.detail, { color: palette.textSoft }]} numberOfLines={1}>
      {label} <Text style={[styles.value, { color: palette.text }]}>{value}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    width: "100%",
    overflow: "hidden",
    /** 테두리는 늘 있되 맞추기 전에는 투명하다. 있다 없다 하면 크기가 흔들린다. */
    borderWidth: 1,
  },
  body: { gap: SPACING.xs, width: "100%" },
  inner: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADIUS.lg - 5,
  },
  term: { fontSize: FONT_SIZE.caption, fontWeight: "400" },
  /** 줄 높이를 못 박아 글자가 바뀌어도 자리가 같다. */
  friendly: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  traditional: {
    fontSize: FONT_SIZE.title,
    lineHeight: FONT_SIZE.title * 1.3,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  detail: { fontSize: FONT_SIZE.caption, lineHeight: FONT_SIZE.caption * 1.5 },
  value: { fontWeight: "600", fontVariant: ["tabular-nums"] },
  /** 덩어리마다 하나씩. 자리가 모자라면 덩어리째 다음 줄로 넘어간다. */
  units: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: SPACING.sm,
    rowGap: 0,
    flexShrink: 1,
  },
  notice: { fontSize: FONT_SIZE.caption, lineHeight: FONT_SIZE.caption * 1.5, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  moonBox: {},
});
