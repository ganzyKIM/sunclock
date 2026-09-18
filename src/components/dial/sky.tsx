import { Circle, Group } from "@shopify/react-native-skia";
import { useMemo } from "react";

import { horizonDirection } from "../../lib/dial/projection";
import { Palette } from "../../theme";

export interface SkyContent {
  sunAltitude: number;
  sunAzimuth: number;
  moonAltitude: number;
  moonAzimuth: number;
  moonFraction: number;
  heading: number;
  night: boolean;
}

interface SkyProps extends SkyContent {
  radius: number;
  palette: Palette;
}

const RING = 1.18;
const STAR_COUNT = 40;
/** 이보다 더 내려가면 하늘에서 지운다. 박명이 끝나는 높이다. */
const HIDE_BELOW = -6;

/** 해와 달을 실제 방위에 맞춰 반구 바깥에 띄운다. 그림자가 왜 저쪽으로 뻗는지 보인다. */
export function Sky({
  sunAltitude,
  sunAzimuth,
  moonAltitude,
  moonAzimuth,
  moonFraction,
  heading,
  radius,
  palette,
  night,
}: SkyProps) {
  const stars = useMemo(() => {
    const items: { x: number; y: number; r: number }[] = [];
    for (let i = 0; i < STAR_COUNT; i += 1) {
      const angle = (i * 137.5 * Math.PI) / 180;
      const distance = RING * radius * (0.55 + ((i * 37) % 45) / 100);
      items.push({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        r: radius * (0.004 + ((i * 13) % 7) / 1400),
      });
    }
    return items;
  }, [radius]);

  const sun = horizonDirection(sunAzimuth, heading);
  const moon = horizonDirection(moonAzimuth, heading);
  const sunSize = radius * (0.05 + Math.max(0, sunAltitude) / 900);
  const moonSize = radius * (0.04 + Math.max(0, moonAltitude) / 1100);

  return (
    <Group>
      {night
        ? stars.map((star, index) => (
            <Circle
              key={`star-${index}`}
              cx={star.x}
              cy={star.y}
              r={star.r}
              color={palette.star}
              opacity={0.5}
            />
          ))
        : null}

      {sunAltitude > HIDE_BELOW ? (
        <>
          <Circle
            cx={sun.x * RING * radius}
            cy={sun.y * RING * radius}
            r={sunSize * 2.2}
            color={palette.glow}
            opacity={0.3}
          />
          <Circle
            cx={sun.x * RING * radius}
            cy={sun.y * RING * radius}
            r={sunSize}
            color={palette.glow}
          />
        </>
      ) : null}

      {moonAltitude > HIDE_BELOW ? (
        <>
          <Circle
            cx={moon.x * RING * radius}
            cy={moon.y * RING * radius}
            r={moonSize * 2}
            color={palette.accent}
            opacity={0.18 + moonFraction * 0.2}
          />
          <Circle
            cx={moon.x * RING * radius}
            cy={moon.y * RING * radius}
            r={moonSize}
            color={palette.star}
            opacity={0.35 + moonFraction * 0.6}
          />
        </>
      ) : null}
    </Group>
  );
}
