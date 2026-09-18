import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Dial } from "../../components/dial";
import { horizontalFromEquatorial } from "../../lib/astro/solar";
import { SOLAR_TERM_GROUPS } from "../../lib/dial/constants";
import { buildDialGeometry } from "../../lib/dial/geometry";
import { rodShadowPoints, shadowPoint } from "../../lib/dial/projection";
import { FONT_SIZE, Palette, SPACING } from "../../theme";

const FRAME_MS = 900;
/** 오전 10시에 해당하는 시간각. 절기만 바꿔 가며 견준다. */
const DEMO_HOUR_ANGLE = -30;

/** 같은 시각에 절기만 바꾸면 그림자가 남북으로 움직인다. */
export function TermAnimation({
  latitude,
  palette,
  size,
}: {
  latitude: number;
  palette: Palette;
  size: number;
}) {
  const [index, setIndex] = useState(0);
  const geometry = useMemo(() => buildDialGeometry(latitude), [latitude]);

  useEffect(() => {
    const timer = setInterval(
      () => setIndex((previous) => (previous + 1) % SOLAR_TERM_GROUPS.length),
      FRAME_MS
    );
    return () => clearInterval(timer);
  }, []);

  const group = SOLAR_TERM_GROUPS[index];
  const light = horizontalFromEquatorial(DEMO_HOUR_ANGLE, group.declination, latitude);
  const visible = light.altitude > 0;

  return (
    <View style={styles.box}>
      <Dial
        geometry={geometry}
        shadow={visible ? shadowPoint(light.altitude, light.azimuth, 0) : null}
        rodShadow={visible ? rodShadowPoints(latitude, light.altitude, light.azimuth, 0) : []}
        palette={palette}
        size={size}
        glowing={false}
      />
      <Text style={[styles.caption, { color: palette.textSoft }]}>
        같은 오전 10시라도 {group.label}에는 그림자가 이만큼 달라져요
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", gap: SPACING.sm },
  caption: { fontSize: FONT_SIZE.caption, textAlign: "center" },
});
