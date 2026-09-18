import { StyleSheet, Text, View } from "react-native";

import { SundialState } from "../lib/sundial";
import { formatClockTime, formatFriendlyTime, formatSignedMinutes } from "../lib/time/clock";
import { FONT_SIZE, Palette, RADIUS, SPACING } from "../theme";
import { InfoTooltip } from "./info-tooltip";

interface ReadingCardProps {
  state: SundialState;
  palette: Palette;
}

/** 큰 글씨는 쉬운 말로, 작은 글씨는 전통 시각으로 적는다. */
export function ReadingCard({ state, palette }: ReadingCardProps) {
  const shadowMinutes =
    state.mode === "moon" && state.moonReading
      ? state.moonReading.correctedMinutes
      : state.apparentMinutes;

  return (
    <View style={[styles.card, { backgroundColor: palette.card }]}>
      <Text style={[styles.term, { color: palette.textSoft }]}>
        오늘은 {state.solarTermName} 무렵이에요
      </Text>

      <Text testID="friendly-time" style={[styles.friendly, { color: palette.text }]}>
        {formatFriendlyTime(state.standardMinutes)}
      </Text>

      <View style={styles.row}>
        <Text style={[styles.traditional, { color: palette.text }]}>
          {state.traditional.label}
        </Text>
        <InfoTooltip
          label="전통 시각"
          title="96각법으로 읽기"
          body={
            "하루를 열두 시로 나누고, 한 시를 초와 정으로 반씩 나눠요. " +
            "다시 15분짜리 각 넷으로 나눕니다. 자시가 밤 11시에 시작하니 오정 초각이 정오예요."
          }
          palette={palette}
        />
      </View>

      <View style={styles.row}>
        <Text style={[styles.detail, { color: palette.textSoft }]}>
          해그림자 {formatClockTime(shadowMinutes)} · 시계{" "}
          {formatClockTime(state.standardMinutes)}
        </Text>
        <InfoTooltip
          label="왜 다를까"
          title="해시계와 시계의 차이"
          body={
            `사는 곳이 표준시 기준선보다 서쪽이면 해가 늦게 남중해요. ` +
            `지금 ${formatSignedMinutes(state.longitudeCorrection)}입니다. ` +
            `여기에 지구 궤도 때문에 생기는 균시차가 ` +
            `${formatSignedMinutes(state.equationOfTime)}으로 더해집니다.`
          }
          palette={palette}
        />
      </View>

      {state.mode === "moon" && state.moonReading ? (
        <View testID="moon-reading" style={styles.moonBox}>
          <Text style={[styles.detail, { color: palette.textSoft }]}>
            달그림자가 가리키는 눈금 {state.moonReading.dialLabel}
          </Text>
          <Text style={[styles.detail, { color: palette.textSoft }]}>
            12시간 뒤집으면 {state.moonReading.flippedLabel}
          </Text>
          <View style={styles.row}>
            <Text style={[styles.detail, { color: palette.textSoft }]}>
              보름에서 {Math.abs(Math.round(state.moon.daysFromFullMoon))}일{" "}
              {state.moon.daysFromFullMoon >= 0 ? "지남" : "전"} · {state.moon.phaseName}
            </Text>
            <InfoTooltip
              label="달시계"
              title="달로 시각 읽기"
              body={
                "보름달은 해의 정반대에 있어 자정에 남중해요. 그래서 눈금을 12시간 뒤집으면 " +
                "보름날 밤에는 시각이 거의 맞습니다. 보름에서 하루 멀어질 때마다 50분쯤 " +
                "어긋나요. 옛 달시계에도 이 차이를 메우는 눈금이 따로 있었어요."
              }
              palette={palette}
            />
          </View>
        </View>
      ) : null}

      {state.mode === "waiting" && state.minutesUntilSunrise !== null ? (
        <Text testID="until-sunrise" style={[styles.detail, { color: palette.textSoft }]}>
          해가 뜨기까지 {Math.floor(state.minutesUntilSunrise / 60)}시간{" "}
          {Math.round(state.minutesUntilSunrise % 60)}분 남았어요
        </Text>
      ) : null}

      {state.notices.map((notice) => (
        <Text key={notice} style={[styles.notice, { color: palette.accent }]}>
          {notice}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    gap: SPACING.sm,
    width: "100%",
  },
  term: { fontSize: FONT_SIZE.caption },
  friendly: { fontSize: FONT_SIZE.hero, fontWeight: "700" },
  traditional: { fontSize: FONT_SIZE.title, fontWeight: "600" },
  detail: { fontSize: FONT_SIZE.caption, flexShrink: 1 },
  notice: { fontSize: FONT_SIZE.caption, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  moonBox: { gap: SPACING.xs, marginTop: SPACING.xs },
});
