import { Link } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AlignmentGuide } from "../../components/alignment-guide";
import { Dial } from "../../components/dial";
import { Notice } from "../../components/notice";
import { ReadingCard } from "../../components/reading-card";
import { useDialGeometry } from "../../hooks/use-dial-geometry";
import { useLocation } from "../../hooks/use-location";
import { useNow } from "../../hooks/use-now";
import { useOrientation } from "../../hooks/use-orientation";
import { useSettings } from "../../hooks/use-settings";
import { rodShadowPoints } from "../../lib/dial/projection";
import { dialLatitudeOf, isSupportedLatitude } from "../../lib/settings";
import { buildSundialState } from "../../lib/sundial";
import { FONT_SIZE, SPACING, themeAt } from "../../theme";

const MAX_DIAL_SIZE = 400;

export function DialScreen() {
  const { width } = useWindowDimensions();
  const now = useNow();
  const { settings } = useSettings();
  const location = useLocation(settings.manualLocation);
  const orientation = useOrientation();

  const dialLatitude = dialLatitudeOf(settings, location.latitude);
  const geometry = useDialGeometry(dialLatitude);

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
  const size = Math.min(width - SPACING.xl * 2, MAX_DIAL_SIZE);

  const light = state.mode === "moon" ? state.moon.position : state.sun;
  const rodShadow = state.shadow
    ? rodShadowPoints(dialLatitude, light.altitude, light.azimuth, heading)
    : [];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]}>
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

      {isSupportedLatitude(location.latitude) ? (
        <>
          <Dial
            geometry={geometry}
            shadow={state.shadow}
            rodShadow={rodShadow}
            palette={palette}
            size={size}
            glowing={orientation.isAligned}
            sky={{
              sunAltitude: state.sun.altitude,
              sunAzimuth: state.sun.azimuth,
              moonAltitude: state.moon.position.altitude,
              moonAzimuth: state.moon.position.azimuth,
              moonFraction: state.moon.illuminatedFraction,
              heading,
              night: state.mode !== "sun",
            }}
          />

          <AlignmentGuide
            headingDegrees={orientation.headingDegrees}
            isAligned={orientation.isAligned}
            isFlat={orientation.isFlat}
            tiltDegrees={orientation.tiltDegrees}
            accuracy={orientation.accuracy}
            compassAvailable={orientation.compassAvailable}
            palette={palette}
          />

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
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
