import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocation } from "../../hooks/use-location";
import { useSettings } from "../../hooks/use-settings";
import { dialLatitudeOf } from "../../lib/settings";
import { DAY_PALETTE, FONT_SIZE, RADIUS, SPACING } from "../../theme";
import { TermAnimation } from "./term-animation";

const SECTIONS = [
  {
    title: "어떻게 쓰나요",
    body:
      "휴대폰을 바닥에 눕히고, 화면 위쪽이 북쪽을 보도록 천천히 돌려 주세요. " +
      "북쪽을 맞추면 그림자가 제자리를 찾습니다. 그림자 끝이 어느 눈금에 걸렸는지 보면 돼요.",
  },
  {
    title: "앙부일구가 뭔가요",
    body:
      "하늘을 우러르는 가마솥이라는 뜻이에요. 1434년 세종 때 처음 만들었고, " +
      "오목한 그릇 안쪽에 눈금을 새겨 시각과 절기를 함께 읽었습니다. " +
      "이 앱이 본뜬 것은 1871년 강건이 만든 손바닥만 한 휴대용이에요. " +
      "반구 지름이 2.8센티미터밖에 안 되고, 옆에 나침반이 붙어 있습니다.",
  },
  {
    title: "세로줄과 가로줄",
    body:
      "세로줄은 시각선이에요. 30분마다 하나씩, 오전 5시부터 오후 7시까지 있습니다. " +
      "굵은 줄 일곱 개에는 묘 진 사 오 미 신 유라는 이름이 붙어요. " +
      "가로줄은 절기선입니다. 열세 줄뿐인데, 동지와 하지만 홀로 쓰고 " +
      "나머지 스물두 절기는 해의 높이가 같은 것끼리 한 줄을 나눠 씁니다.",
  },
  {
    title: "영침이 기울어 있는 까닭",
    body:
      "그릇 안쪽에서 중심으로 뻗은 바늘을 영침이라고 해요. " +
      "북극성 쪽을 정확히 가리키도록 그 고장의 위도만큼 기울여 박습니다. " +
      "그래야 하루 종일, 사철 내내 그림자가 같은 눈금 위를 지나가요.",
  },
  {
    title: "달로도 시각을 읽어요",
    body:
      "보름달은 해의 정반대에 있어서 자정에 가장 높이 뜹니다. " +
      "그래서 보름날 밤에는 눈금을 12시간만 뒤집으면 시각이 맞아요. " +
      "보름에서 하루 멀어질 때마다 50분쯤 어긋나니, 이 앱이 달의 위치로 그만큼을 메워 줍니다. " +
      "옛 달시계에도 이 차이를 메우는 눈금이 따로 달려 있었어요.",
  },
  {
    title: "시계와 시각이 다른 까닭",
    body:
      "해시계는 해가 남중한 때를 정오로 삼아요. " +
      "우리나라 표준시는 동경 135도를 기준으로 삼는데 서울은 그보다 서쪽이라 " +
      "해가 32분쯤 늦게 남중합니다. 여기에 지구 궤도가 타원이라 생기는 균시차가 " +
      "계절마다 앞뒤로 더해져요. 두 가지를 합치면 최대 반 시간 넘게 벌어집니다.",
  },
];

export function HelpScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { settings } = useSettings();
  const location = useLocation(settings.manualLocation);
  const palette = DAY_PALETTE;
  const latitude = dialLatitudeOf(settings, location.latitude);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={[styles.back, { color: palette.accent }]}>← 돌아가기</Text>
        </Pressable>

        <TermAnimation
          latitude={latitude}
          palette={palette}
          size={Math.min(width - SPACING.xl * 4, 260)}
        />

        {SECTIONS.map((section) => (
          <View key={section.title} style={[styles.box, { backgroundColor: palette.card }]}>
            <Text style={[styles.title, { color: palette.text }]}>{section.title}</Text>
            <Text style={[styles.body, { color: palette.textSoft }]}>{section.body}</Text>
          </View>
        ))}

        <Text style={[styles.footnote, { color: palette.textSoft }]}>
          눈금은 김천휘와 두 사람이 2010년에 발표한 앙부일구 연구의 작도식을 따랐습니다.
          유물 정보는 국립중앙박물관과 국가유산포털을 따랐습니다.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: SPACING.xl, gap: SPACING.lg },
  back: { fontSize: FONT_SIZE.body, fontWeight: "600" },
  box: { borderRadius: RADIUS.lg, padding: SPACING.lg, gap: SPACING.sm },
  title: { fontSize: FONT_SIZE.body, fontWeight: "700" },
  body: { fontSize: FONT_SIZE.caption, lineHeight: 22 },
  footnote: { fontSize: FONT_SIZE.tiny, lineHeight: 18 },
});
