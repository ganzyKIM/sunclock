import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FlatDial } from "../../components/flat-dial";
import { horizonHourAngle } from "../../lib/astro/solar";
import { SOLAR_TERM_GROUPS } from "../../lib/dial/constants";
import { buildFlatGeometry, flatPoint } from "../../lib/dial/flat";
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
  const geometry = useMemo(() => buildFlatGeometry(latitude), [latitude]);

  useEffect(() => {
    const timer = setInterval(
      () => setIndex((previous) => (previous + 1) % SOLAR_TERM_GROUPS.length),
      FRAME_MS
    );
    return () => clearInterval(timer);
  }, []);

  const group = SOLAR_TERM_GROUPS[index];
  const visible = Math.abs(DEMO_HOUR_ANGLE) <= horizonHourAngle(latitude, group.declination);

  return (
    <View style={styles.box}>
      <FlatDial
        geometry={geometry}
        tip={visible ? flatPoint(DEMO_HOUR_ANGLE, group.declination) : null}
        palette={palette}
        size={size}
        glowing={false}
        night={false}
        moon={null}
      />
      <Text style={[styles.caption, { color: palette.textSoft }]}>
        같은 오전 10시라도 {group.label}에는 바늘이 이만큼 길다
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", gap: SPACING.sm },
  caption: { fontSize: FONT_SIZE.caption, textAlign: "center" },
});
