import { Link } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AlignmentGuide } from "../../components/alignment-guide";
import { Backdrop } from "../../components/backdrop";
import { Compass } from "../../components/compass";
import { Dial } from "../../components/dial";
import { FlatDial } from "../../components/flat-dial";
import { Flourish } from "../../components/flourish";
import { Notice } from "../../components/notice";
import { ReadingCard } from "../../components/reading-card";
import { SkyLegend } from "../../components/sky-legend";
import { ZodiacSheet } from "../../components/zodiac-sheet";
import { useDialGeometry, useFlatGeometry } from "../../hooks/use-dial-geometry";
import { useEasedAngle } from "../../hooks/use-eased-angle";
import { useEasedNumber } from "../../hooks/use-eased-number";
import { useTwinkle } from "../../hooks/use-twinkle";
import { useLocation } from "../../hooks/use-location";
import { useNow } from "../../hooks/use-now";
import { useOrientation } from "../../hooks/use-orientation";
import { useSettings } from "../../hooks/use-settings";
import { useWidgetPlace } from "../../hooks/use-widget-place";
import { buildMoonPath } from "../../lib/dial/flat";
import { buildMoonLine } from "../../lib/dial/geometry";
import { rodShadowPoints, rodShadowToRim } from "../../lib/dial/projection";
import { dialMinutesOf, flatMinutesAt } from "../../lib/dial/reading";
import { dialLatitudeOf, isSupportedLatitude } from "../../lib/settings";
import { buildSundialState } from "../../lib/sundial";
import { FONT_SIZE, lerpColor, SPACING, themeAt } from "../../theme";

/**
 * 반구의 크기는 폭과 높이 둘 다에서 정한다.
 * 폭만 보면 세로로 긴 화면에서 빈 자리가 커지고,
 * 높이를 안 보면 작은 화면에서 읽기 카드를 밀어낸다.
 */
const MAX_DIAL_SIZE = 460;
const DIAL_HEIGHT_SHARE = 0.44;

/** 맞았다 아니다 사이를 건너는 데 걸리는 시간. 번쩍이지 않고 스며들 만큼. */
const LIT_MS = 700;
/** 맞췄을 때 바탕에 드는 빛의 양. 낮은 볕이 들어 누렇게, 밤은 달빛이 조금. */
const LIT_BACKGROUND_DAY = 0.22;
const LIT_BACKGROUND_NIGHT = 0.07;

export function DialScreen() {
  const { width, height } = useWindowDimensions();
  const now = useNow();
  const { settings } = useSettings();
  const location = useLocation(settings.manualLocation);
  useWidgetPlace(location);
  const orientation = useOrientation();
  /** 눈금판에서 누른 12지 이름. 아무것도 누르지 않았으면 null이다. */
  const [openBranch, setOpenBranch] = useState<string | null>(null);

  const dialLatitude = dialLatitudeOf(settings, location.latitude);
  const geometry = useDialGeometry(dialLatitude);
  const flatGeometry = useFlatGeometry(dialLatitude);

  /**
   * 눈금을 읽어도 되는 상태인지. 방향이 어긋난 채로 숫자를 띄우면
   * 해시계를 읽은 것처럼 보이지만 사실은 휴대폰 시계를 옮겨 적은 것뿐이다.
   * 나침반이 없는 기기에서는 맞춰 놓은 것으로 보고 읽게 둔다.
   */
  const readable = !orientation.compassAvailable || orientation.isAligned;

  /**
   * 맞췄다고 본 뒤에는 방향을 0도로 붙든다.
   *
   * 손으로 맞출 수 있는 만큼만 요구하느라 15도까지 봐주는데, 그 사이에서
   * 그림자가 계속 흔들리면 맞췄다고 해 놓고 엉뚱한 눈금을 가리킨다.
   * 맞은 것으로 본 이상 그림자는 제 눈금에 붙어 있어야 한다.
   */
  const targetHeading = readable ? 0 : orientation.headingDegrees;
  /** 목표가 바뀌면 그림자가 뚝 뛰지 않고 스르르 제자리로 미끄러져 들어간다. */
  const heading = useEasedAngle(targetHeading);

  /**
   * 맞춘 정도. 0이면 아니고 1이면 맞았다.
   *
   * 맞았다는 것을 전환 때 한 번 번쩍여서 알리면 놓치기 쉽고, 자주 오가면
   * 거슬린다. 대신 맞춰 놓은 동안 내내 바탕이 밝고, 하늘이 살아 있고,
   * 눈금판 테두리와 읽기 카드가 빛을 머금는다. 그 모두가 이 숫자 하나에
   * 걸려 있어 한 호흡으로 함께 옮겨 간다.
   */
  const lit = useEasedNumber(readable ? 1 : 0, LIT_MS);

  const state = buildSundialState({
    date: now,
    latitude: location.latitude,
    longitude: location.longitude,
    headingDegrees: heading,
    nightMode: settings.nightMode,
  });

  const palette = themeAt(state.sun.altitude);
  /** 별과 꽃잎은 맞췄을 때만 움직인다. 그때만 화면이 그 박자로 다시 그려진다. */
  const twinkle = useTwinkle(lit > 0);
  const background = lerpColor(
    palette.background,
    palette.glow,
    (state.mode === "sun" ? LIT_BACKGROUND_DAY : LIT_BACKGROUND_NIGHT) * lit
  );
  // 화면 좌우 여백만큼 뺀다. 그보다 크면 스크롤 영역이 가장자리를 잘라 낸다.
  const size = Math.min(
    width - SPACING.xl * 2,
    height * DIAL_HEIGHT_SHARE,
    MAX_DIAL_SIZE
  );

  /**
   * 밤에는 그림자가 둘이다. 달이 실제로 드리운 것과, 달이 보름달 자리에
   * 있었다면 드리웠을 것. 눈금을 읽는 쪽은 뒤엣것이다. 보정치를 미리 덜어
   * 실제 시각을 가리키기 때문이다. 그래서 그쪽을 앞에 또렷하게 세우고,
   * 실제 달그림자는 뒤에 흐리게 깔아 둘이 얼마나 어긋나는지 보여 준다.
   */
  const moonMode = state.mode === "moon";
  // 보름달 자리가 아직 지평선 아래면 보정한 그림자는 반구 테두리에 걸린다.
  // 그래도 읽을 시각선은 그 자리이므로 테두리까지 띠를 그린다.
  const bowlCorrected = moonMode && state.correctedShadow !== null;
  const shadow = bowlCorrected ? state.correctedShadow : state.shadow;
  const ghostShadow = bowlCorrected ? state.shadow : null;
  const light = bowlCorrected
    ? state.correctedLight!
    : moonMode
      ? state.moon.position
      : state.sun;
  const flatCorrected = moonMode && state.correctedFlatTip !== null;
  const flatTip = flatCorrected ? state.correctedFlatTip : state.flatTip;
  const ghostFlatTip = flatCorrected ? state.flatTip : null;

  /**
   * 그림자가 실제로 걸린 시각. 방위가 어긋나면 진짜 시각과 다르다.
   * 그 시의 구간을 눈금판에서 밝혀, 이름이 점이 아니라 구간임을 보인다.
   */
  const highlightMinutes =
    settings.dialView === "bowl"
      ? shadow
        ? dialMinutesOf(light.altitude, light.azimuth, heading, dialLatitude)
        : null
      : flatTip
        ? flatMinutesAt(flatTip)
        : null;

  const wantRod = settings.dialView === "bowl";
  const rodShadow =
    wantRod && shadow
      ? rodShadowToRim(dialLatitude, light.altitude, light.azimuth, heading)
      : [];
  const ghostRodShadow =
    wantRod && ghostShadow
      ? rodShadowPoints(
          dialLatitude,
          state.moon.position.altitude,
          state.moon.position.azimuth,
          heading
        )
      : [];

  /**
   * 밤에는 눈금판이 달시계가 된다. 해가 오늘 지나는 절기선 대신 달이 지나는
   * 자리를 밝히고, 달이 떠 있는 동안의 시각선만 또렷하게 둔다.
   */
  const moonPath =
    state.mode === "moon" ? buildMoonPath(dialLatitude, state.moon.declination) : null;
  const moonLine =
    state.mode === "moon" && settings.dialView === "bowl"
      ? buildMoonLine(dialLatitude, state.moon.declination)
      : [];

  const sky = {
    sunAltitude: state.sun.altitude,
    sunAzimuth: state.sun.azimuth,
    moonAltitude: state.moon.position.altitude,
    moonAzimuth: state.moon.position.azimuth,
    moonFraction: state.moon.illuminatedFraction,
    heading,
    night: state.mode !== "sun",
    lit,
    twinkle,
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: background }]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Backdrop width={width} height={height} palette={palette} />
      </View>

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
                shadow={shadow}
                rodShadow={rodShadow}
                ghostShadow={ghostShadow}
                ghostRodShadow={ghostRodShadow}
                palette={palette}
                size={size}
                glowing={readable}
                night={state.mode === "moon"}
                moonLine={moonLine}
                onSelectBranch={setOpenBranch}
                sky={sky}
                lit={lit}
                highlightMinutes={highlightMinutes}
              />
            ) : (
              <FlatDial
                geometry={flatGeometry}
                tip={flatTip}
                ghostTip={ghostFlatTip}
                palette={palette}
                size={size}
                glowing={readable}
                night={state.mode === "moon"}
                moon={moonPath}
                onSelectBranch={setOpenBranch}
                sky={sky}
                lit={lit}
                highlightMinutes={highlightMinutes}
              />
            )}

            <View style={styles.guideRow}>
                <Compass
                  headingDegrees={orientation.headingDegrees}
                  aligned={readable}
                  available={orientation.compassAvailable}
                  palette={palette}
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
              </View>

              <SkyLegend
                sunUp={state.sun.altitude > 0}
                moonUp={state.moon.position.altitude > 0}
                shadows={moonMode && state.correctedFlatTip !== null}
                palette={palette}
              />
            </View>

            <Flourish palette={palette} width={Math.min(200, size * 0.6)} />
            <ReadingCard state={state} palette={palette} aligned={readable} lit={lit} />
          </>
        ) : (
          <Notice
            title="여기서는 쓸 수 없다"
            body={
              "앙부일구는 북반구 중위도의 해시계다. 북위 0도에서 66도 사이에서만 눈금이 맞는다. " +
              "설정에서 위치를 직접 정하면 다른 곳을 볼 수 있다."
            }
            palette={palette}
          />
        )}
      </ScrollView>

      <ZodiacSheet
        branch={openBranch}
        palette={palette}
        night={state.mode === "moon"}
        onClose={() => setOpenBranch(null)}
      />
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
  /** 나침반과 안내를 나란히 둔다. 자리가 모자라면 안내가 줄을 넘긴다. */
  guideRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
    maxWidth: "100%",
  },
  stage: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
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
