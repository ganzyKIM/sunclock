import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { InfoBlock, InfoBlocks } from "../../components/info-blocks";
import { useLocation } from "../../hooks/use-location";
import { useSettings } from "../../hooks/use-settings";
import { dialLatitudeOf } from "../../lib/settings";
import { DAY_PALETTE, FONT_SIZE, RADIUS, SPACING } from "../../theme";
import { TermAnimation } from "./term-animation";

const SECTIONS: { title: string; blocks: InfoBlock[] }[] = [
  {
    title: "쓰는 법",
    blocks: [
      {
        kind: "steps",
        items: ["휴대폰을 바닥에 눕힌다", "화면 위쪽이 북쪽을 보게 돌린다", "바늘 끝이 걸린 눈금을 읽는다"],
      },
      {
        kind: "table",
        rows: [
          ["가운데 점", "영침"],
          ["뻗은 바늘", "그림자"],
          ["--", "아직 북쪽을 맞추지 않음"],
        ],
      },
    ],
  },
  {
    title: "왜 동그랗게 펼쳤나",
    blocks: [
      { kind: "lead", text: "그릇을 영침의 축에서 내려다본 모습이다." },
      {
        kind: "list",
        items: [
          "그릇 안쪽은 절반이 늘 비고, 눈금이 서로 가린다",
          "축에서 보면 영침은 점, 눈금은 사방으로 고르다",
          "같은 눈금을 다르게 옮겼을 뿐이라 읽는 시각은 같다",
        ],
      },
      { kind: "text", text: "설정에서 원래 그릇 모양으로 바꿀 수 있다." },
    ],
  },
  {
    title: "앙부일구",
    blocks: [
      {
        kind: "table",
        rows: [
          ["뜻", "하늘을 우러르는 가마솥"],
          ["처음", "1434년, 세종"],
          ["본뜬 것", "1871년 강건의 휴대용"],
          ["크기", "반구 지름 2.8cm, 곁에 나침반"],
        ],
      },
    ],
  },
  {
    title: "퍼진 줄과 동그란 줄",
    blocks: [
      { kind: "lead", text: "퍼진 줄이 시각, 동그란 줄이 절기다." },
      {
        kind: "table",
        rows: [
          ["퍼진 줄", "30분마다 하나. 굵은 열둘에 자·축·인·묘… 이름"],
          ["동그란 줄", "열세 줄. 안쪽이 여름, 바깥이 겨울"],
        ],
      },
      { kind: "figure", figure: "hour-halves" },
      {
        kind: "list",
        items: [
          "이름은 시의 한가운데. 바깥 고리 한 토막이 그 시의 범위다",
          "이름 왼쪽이 초, 오른쪽이 정. 가장 굵은 줄이 경계",
          "이름이 둘씩: 큰 글씨는 해, 작은 글씨는 달로 읽을 때. 누르면 짐승 설명",
          "동지와 하지만 홀로 한 줄, 나머지 절기는 둘씩 한 줄",
        ],
      },
    ],
  },
  {
    title: "방향은 시각, 길이는 절기",
    blocks: [
      { kind: "figure", figure: "shadow-length" },
      {
        kind: "list",
        items: [
          "방향: 해의 정반대. 해가 동에서 서로 가면 그림자 끝이 눈금 위를 지난다",
          "길이: 해가 높으면 짧고 낮으면 길다",
          "바늘 끝이 걸린 동그란 줄이 오늘의 절기",
        ],
      },
    ],
  },
  {
    title: "또렷한 줄과 흐린 줄",
    blocks: [
      { kind: "lead", text: "또렷한 부분이 그날 낮의 길이다." },
      {
        kind: "list",
        items: [
          "해가 떠 있을 수 있는 자리만 또렷하다",
          "하지 줄은 거의 한 바퀴, 동지 줄은 짧다",
          "밤에는 달이 오늘 지나는 자리가 또렷해진다",
        ],
      },
    ],
  },
  {
    title: "영침이 기운 까닭",
    blocks: [
      { kind: "lead", text: "북극성을 가리키도록 그 고장의 위도만큼 기운다." },
      {
        kind: "list",
        items: ["그래야 사철 내내 그림자가 같은 눈금 위를 지난다", "펼친 원반의 가운데 점이 바로 그 축이다"],
      },
    ],
  },
  {
    title: "달로 읽기",
    blocks: [
      { kind: "lead", text: "보름달은 해의 정반대. 같은 눈금이 12시간 차이다." },
      { kind: "figure", figure: "moon-flip" },
      {
        kind: "list",
        items: [
          "밤에는 달로 읽는 이름이 앞에 서고, 달이 떠 있는 시각선만 또렷하다",
          "보름에서 하루 멀어질 때마다 50분씩 어긋난다. 달의 자리로 메운다",
        ],
      },
      { kind: "figure", figure: "two-shadows" },
      {
        kind: "list",
        items: ["흐린 그림자: 지금 달그림자", "또렷한 그림자: 보정한 자리. 이것이 실제 시각"],
      },
      {
        kind: "table",
        rows: [
          ["길이", "절기가 아니라 달의 높이를 따른다"],
          ["여름 보름달", "낮게 떠 겨울 해처럼 길다"],
          ["겨울 보름달", "높이 떠 여름 해처럼 짧다"],
          ["절기선 밖", "달이 해보다 높거나 낮으면 가장자리 줄에 붙인다"],
        ],
      },
      { kind: "text", text: "실물에는 밤 시각이 없다. 해그림자가 없어서다. 옛 달시계는 이 차이를 메우는 눈금을 따로 달았다." },
    ],
  },
  {
    title: "시계와 다른 까닭",
    blocks: [
      { kind: "lead", text: "해시계의 정오는 해가 남중한 때다." },
      {
        kind: "table",
        rows: [
          ["경도 보정", "서울 +32분쯤. 기준선(동경 135도)보다 서쪽"],
          ["균시차", "±16분까지. 지구 궤도가 타원"],
          ["합치면", "많게는 반 시간 넘게"],
        ],
      },
    ],
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
            <InfoBlocks
              blocks={section.blocks}
              palette={palette}
              width={width - SPACING.xl * 2 - SPACING.lg * 2}
            />
          </View>
        ))}

        <Text style={[styles.footnote, { color: palette.textSoft }]}>
          눈금은 김천휘 외 2010년 앙부일구 연구의 작도식을, 유물 정보는 국립중앙박물관과
          국가유산포털을 따랐다.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: SPACING.xl, gap: SPACING.lg },
  back: { fontSize: FONT_SIZE.body, fontWeight: "600" },
  box: { borderRadius: RADIUS.lg, padding: SPACING.lg, gap: SPACING.md },
  title: { fontSize: FONT_SIZE.body, fontWeight: "700" },
  footnote: { fontSize: FONT_SIZE.tiny, lineHeight: 18 },
});
