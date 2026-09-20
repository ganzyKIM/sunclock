import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AlignmentGuide } from "../../components/alignment-guide";
import { Dial } from "../../components/dial";
import { FlatDial } from "../../components/flat-dial";
import { Notice } from "../../components/notice";
import { ReadingCard } from "../../components/reading-card";
import { useDialGeometry, useFlatGeometry } from "../../hooks/use-dial-geometry";
import { useLocation } from "../../hooks/use-location";
import { useNow } from "../../hooks/use-now";
import { useOrientation } from "../../hooks/use-orientation";
import { useSettings } from "../../hooks/use-settings";
import { rodShadowPoints } from "../../lib/dial/projection";
import { dialLatitudeOf, isSupportedLatitude } from "../../lib/settings";
import { buildSundialState } from "../../lib/sundial";
import { FONT_SIZE, SPACING, themeAt } from "../../theme";

/**
 * 반구의 크기는 폭과 높이 둘 다에서 정한다.
 * 폭만 보면 세로로 긴 화면에서 빈 자리가 커지고,
 * 높이를 안 보면 작은 화면에서 읽기 카드를 밀어낸다.
 */
const MAX_DIAL_SIZE = 460;
const DIAL_HEIGHT_SHARE = 0.46;

export function DialScreen() {
  const { width, height } = useWindowDimensions();
  const now = useNow();
  const { settings } = useSettings();
  const location = useLocation(settings.manualLocation);
  const orientation = useOrientation();

  const dialLatitude = dialLatitudeOf(settings, location.latitude);
  const geometry = useDialGeometry(dialLatitude);
  const flatGeometry = useFlatGeometry(dialLatitude);

  /** 나침반이 없으면 맞춰 놓은 것으로 보고 눈금을 읽을 수 있게 둔다. */
  const heading = orientation.compassAvailable ? orientation.headingDegrees : 0;

  const state = buildSundialState({
    date: now,
    latitude: location.latitude,
    longitude: location.longitude,
    headingDegrees: heading,
    nightMode: settings.nightMode,
  });

  const palette = themeAt(state.sun.altitude);
  const size = Math.min(
    width - SPACING.lg * 2,
    height * DIAL_HEIGHT_SHARE,
    MAX_DIAL_SIZE
  );

  const light = state.mode === "moon" ? state.moon.position : state.sun;
  const rodShadow =
    settings.dialView === "bowl" && state.shadow
      ? rodShadowPoints(dialLatitude, light.altitude, light.azimuth, heading)
      : [];

  const sky = {
    sunAltitude: state.sun.altitude,
    sunAzimuth: state.sun.azimuth,
    moonAltitude: state.moon.position.altitude,
    moonAzimuth: state.moon.position.azimuth,
    moonFraction: state.moon.illuminatedFraction,
    heading,
    night: state.mode !== "sun",
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]}>
      {/* 낮에는 바탕이 밝고 밤에는 어두우므로 상태 표시줄도 따라 바뀐다. */}
      <StatusBar style={state.sun.altitude > 0 ? "dark" : "light"} />

      <View style={styles.header}>
        <Text style={[styles.date, { color: palette.textSoft }]}>
          {now.getMonth() + 1}월 {now.getDate()}일
        </Text>
        <View style={styles.links}>
          <Link href="/help" style={[styles.link, { color: palette.textSoft }]}>
            도움말
          </Link>
          <Link href="/settings" style={[styles.link, { color: palette.textSoft }]}>
            설정
          </Link>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isSupportedLatitude(location.latitude) ? (
          <>
            <View style={styles.stage}>
            {settings.dialView === "bowl" ? (
              <Dial
                geometry={geometry}
                shadow={state.shadow}
                rodShadow={rodShadow}
                palette={palette}
                size={size}
                glowing={orientation.isAligned}
                sky={sky}
              />
            ) : (
              <FlatDial
                geometry={flatGeometry}
                tip={state.flatTip}
                palette={palette}
                size={size}
                glowing={orientation.isAligned}
                sky={sky}
              />
            )}

            <AlignmentGuide
                headingDegrees={orientation.headingDegrees}
                isAligned={orientation.isAligned}
                isFlat={orientation.isFlat}
                tiltDegrees={orientation.tiltDegrees}
                accuracy={orientation.accuracy}
                compassAvailable={orientation.compassAvailable}
                palette={palette}
              />
            </View>

            <ReadingCard state={state} palette={palette} />
          </>
        ) : (
          <Notice
            title="이곳에서는 앙부일구를 쓸 수 없어요"
            body={
              "앙부일구는 북반구의 중위도에서 쓰던 해시계예요. " +
              "북위 0도에서 66도 사이에서만 눈금이 제대로 그려집니다. " +
              "설정에서 위치를 손으로 정하면 다른 곳의 해시계를 볼 수 있어요."
            }
            palette={palette}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  scroll: { width: "100%" },
  /** 화면이 넉넉하면 가운데에 모이고, 모자라면 스크롤된다. */
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  /**
   * 늘어나지 않는다. 늘어나면 읽기 카드를 화면 밖으로 밀어낸다.
   * 자리가 남을 때 가운데로 모으는 일은 바깥 스크롤이 맡는다.
   */
  stage: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: { fontSize: FONT_SIZE.body, fontWeight: "600" },
  links: { flexDirection: "row", gap: SPACING.lg },
  link: { fontSize: FONT_SIZE.caption },
});
