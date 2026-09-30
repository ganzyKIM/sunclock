import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Notice } from "../../components/notice";
import { OptionRow } from "../../components/option-row";
import { WidgetSettings } from "../../components/widget-settings";
import { useLocation } from "../../hooks/use-location";
import { useSettings } from "../../hooks/use-settings";
import { Settings } from "../../lib/settings";
import { DAY_PALETTE, FONT_SIZE, RADIUS, SPACING } from "../../theme";

export function SettingsScreen() {
  const router = useRouter();
  const { settings, update } = useSettings();
  const location = useLocation(settings.manualLocation);
  const palette = DAY_PALETTE;

  const [latitudeText, setLatitudeText] = useState(
    settings.manualLocation ? String(settings.manualLocation.latitude) : ""
  );
  const [longitudeText, setLongitudeText] = useState(
    settings.manualLocation ? String(settings.manualLocation.longitude) : ""
  );

  const applyManualLocation = () => {
    const latitude = Number(latitudeText);
    const longitude = Number(longitudeText);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return;
    update({ manualLocation: { latitude, longitude } });
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={[styles.back, { color: palette.accent }]}>← 돌아가기</Text>
        </Pressable>

        <OptionRow
          title="눈금 보기"
          description={
            "펼친 원반은 반구를 극축에서 내려다본 모양이다. " +
            "영침이 가운데 점이 되고 그림자가 시계바늘처럼 돈다. 오목한 반구는 실물 그대로다."
          }
          options={[
            { value: "flat", label: "펼친 원반" },
            { value: "bowl", label: "오목한 반구" },
          ]}
          value={settings.dialView}
          onChange={(value) => update({ dialView: value as Settings["dialView"] })}
          palette={palette}
        />

        <OptionRow
          title="눈금의 위도"
          description={
            "앙부일구는 만든 곳의 위도로 눈금을 새긴다. " +
            "지금 있는 곳에 맞추면 어디서나 맞고, 한양 원본은 조선의 해시계 그대로다."
          }
          options={[
            { value: "device", label: "지금 있는 곳" },
            { value: "hanyang", label: "한양 원본" },
          ]}
          value={settings.dialLatitude}
          onChange={(value) => update({ dialLatitude: value as Settings["dialLatitude"] })}
          palette={palette}
        />

        <OptionRow
          title="밤에는"
          description={
            "해가 지면 달그림자로 읽는다. 달시계를 끄면 해 뜰 때까지 남은 시간을 보인다."
          }
          options={[
            { value: "moon", label: "달시계" },
            { value: "wait", label: "해 기다리기" },
          ]}
          value={settings.nightMode}
          onChange={(value) => update({ nightMode: value as Settings["nightMode"] })}
          palette={palette}
        />

        <WidgetSettings palette={palette} />

        <View style={[styles.box, { backgroundColor: palette.card }]}>
          <Text style={[styles.title, { color: palette.text }]}>위치를 손으로 정하기</Text>
          <Text style={[styles.description, { color: palette.textSoft }]}>
            지금 위치: 북위 {location.latitude.toFixed(3)}도, 동경{" "}
            {location.longitude.toFixed(3)}도
          </Text>
          <View style={styles.inputs}>
            <TextInput
              value={latitudeText}
              onChangeText={setLatitudeText}
              placeholder="위도"
              placeholderTextColor={palette.textSoft}
              keyboardType="numbers-and-punctuation"
              accessibilityLabel="위도"
              style={[styles.input, { borderColor: palette.textSoft, color: palette.text }]}
            />
            <TextInput
              value={longitudeText}
              onChangeText={setLongitudeText}
              placeholder="경도"
              placeholderTextColor={palette.textSoft}
              keyboardType="numbers-and-punctuation"
              accessibilityLabel="경도"
              style={[styles.input, { borderColor: palette.textSoft, color: palette.text }]}
            />
          </View>
          <View style={styles.actions}>
            <Pressable onPress={applyManualLocation} accessibilityRole="button">
              <Text style={[styles.action, { color: palette.accent }]}>이 위치로 보기</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                update({ manualLocation: null });
                setLatitudeText("");
                setLongitudeText("");
              }}
              accessibilityRole="button"
            >
              <Text style={[styles.action, { color: palette.textSoft }]}>
                위성 위치로 되돌리기
              </Text>
            </Pressable>
          </View>
        </View>

        {location.permission === "denied" && !settings.manualLocation ? (
          <Notice
            title="위치를 알 수 없다"
            body={
              "위치 권한이 없어 경복궁 기준으로 보인다. 위도와 경도를 직접 넣으면 그곳을 본다."
            }
            palette={palette}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: SPACING.xl, gap: SPACING.lg, width: "100%" },
  back: { fontSize: FONT_SIZE.body, fontWeight: "600" },
  box: { borderRadius: RADIUS.lg, padding: SPACING.lg, gap: SPACING.sm, width: "100%" },
  title: { fontSize: FONT_SIZE.body, fontWeight: "700" },
  description: { fontSize: FONT_SIZE.caption, lineHeight: 20 },
  inputs: { flexDirection: "row", gap: SPACING.sm, width: "100%" },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.body,
  },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: SPACING.xs },
  action: { fontSize: FONT_SIZE.caption, fontWeight: "600" },
});
