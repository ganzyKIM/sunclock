import { BlurMask, Circle, Group, Line, Path, RadialGradient, Skia, vec } from "@shopify/react-native-skia";
import { useMemo } from "react";

import { horizonDirection } from "../../lib/dial/projection";
import { Palette, withAlpha } from "../../theme";

export interface SkyContent {
  sunAltitude: number;
  sunAzimuth: number;
  moonAltitude: number;
  moonAzimuth: number;
  moonFraction: number;
  heading: number;
  night: boolean;
  /** 북쪽을 맞춘 정도. 0이면 아니고 1이면 맞았다. 사이는 옮겨 가는 중이다. */
  lit: number;
  /** 별이 깜빡이는 데 쓰는 시각. 초 단위. 맞추지 않았으면 멈춰 있다. */
  twinkle: number;
}

interface SkyProps extends SkyContent {
  radius: number;
  palette: Palette;
}

/**
 * 해와 달이 도는 고리. 이름 고리보다 바깥이되, 빛무리와 햇살까지 더해도
 * 눈금판의 틀을 넘지 않아야 한다. 틀을 넘으면 잘린 채로 보인다.
 */
const RING = 1.2;
/** 해와 달 표시의 가장 큰 크기. 반지름에 대한 비율. */
const MARK_MAX = 0.075;
const STAR_COUNT = 40;
/** 지평선 아래로 내려가면 하늘에서 지운다. 해시계는 떠 있는 빛만 센다. */
const HORIZON = 0;
/** 맞췄을 때 눈금판 둘레에 고이는 빛의 크기. */
const POOL = 1.6;
/** 낮에 맞추면 해에서 뻗는 햇살의 수. */
const RAY_COUNT = 8;
/** 낮에 맞추면 하늘에 떠다니는 꽃잎. */
const PETAL_COUNT = 7;
const PETAL_COLOR = "#e6b0b6";

/**
 * 해와 달을 실제 방위에 맞춰 반구 바깥에 띄운다. 그림자가 왜 저쪽으로 뻗는지 보인다.
 *
 * 북쪽을 맞추면 하늘이 답한다. 눈금판 둘레에 빛이 고이고, 낮에는 해에서
 * 햇살이 뻗고 꽃잎이 떠다니며, 밤에는 별이 또렷해져 저마다의 박자로
 * 깜빡인다. 맞추기 전에는 모두 잠잠하다. 밝기만 바꾸면 낮에는 티가 나지
 * 않는다. 그래서 낮에는 있다 없다가 분명한 것들로 답한다.
 */
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
  lit,
  twinkle,
}: SkyProps) {
  const stars = useMemo(() => {
    const items: { x: number; y: number; r: number; speed: number; phase: number }[] = [];
    for (let i = 0; i < STAR_COUNT; i += 1) {
      const angle = (i * 137.5 * Math.PI) / 180;
      const distance = RING * radius * (0.55 + ((i * 37) % 45) / 100);
      items.push({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        r: radius * (0.004 + ((i * 13) % 7) / 1400),
        // 별마다 다른 빠르기와 박자. 다 같이 깜빡이면 신호등처럼 보인다.
        speed: 1.3 + (i % 5) * 0.55,
        phase: i * 1.7,
      });
    }
    return items;
  }, [radius]);

  const petals = useMemo(() => {
    const items: { angle: number; distance: number; size: number; spin: number; phase: number }[] = [];
    for (let i = 0; i < PETAL_COUNT; i += 1) {
      items.push({
        angle: (i * 360) / PETAL_COUNT + (i % 3) * 11,
        distance: radius * (0.98 + ((i * 29) % 25) / 100),
        size: radius * (0.03 + ((i * 7) % 4) / 250),
        spin: 25 + (i % 4) * 9,
        phase: i * 1.3,
      });
    }
    return items;
  }, [radius]);

  const petal = useMemo(() => {
    const path = Skia.Path.Make();
    path.addOval({ x: -1, y: -0.6, width: 2, height: 1.2 });
    return path;
  }, []);

  const sun = horizonDirection(sunAzimuth, heading);
  const moon = horizonDirection(moonAzimuth, heading);
  const sunSize = radius * Math.min(MARK_MAX, 0.045 + Math.max(0, sunAltitude) / 1500);
  const moonSize = radius * Math.min(MARK_MAX * 0.85, 0.035 + Math.max(0, moonAltitude) / 1800);
  const pool = night ? palette.accent : palette.glow;

  return (
    <Group>
      {/* 맞췄을 때 눈금판 둘레에 고이는 빛. 낮에는 볕, 밤에는 달빛이다. */}
      {lit > 0 ? (
        <Circle cx={0} cy={0} r={radius * POOL} opacity={lit * (night ? 0.24 : 0.32)}>
          <RadialGradient
            c={vec(0, 0)}
            r={radius * POOL}
            colors={[pool, withAlpha(pool, 0)]}
          />
        </Circle>
      ) : null}

      {night
        ? stars.map((star, index) => {
            // 맞추기 전에는 고요하다. 맞추면 밝아지고 저마다 깜빡인다.
            const flicker =
              lit > 0 ? 1 - 0.3 * lit * (0.5 + 0.5 * Math.sin(twinkle * star.speed + star.phase)) : 1;
            const opacity = (0.5 + 0.45 * lit) * flicker;
            return (
              <Group key={`star-${index}`}>
                {index % 5 === 0 && lit > 0 ? (
                  <Circle
                    cx={star.x}
                    cy={star.y}
                    r={star.r * 3.5}
                    color={palette.star}
                    opacity={0.28 * lit * flicker}
                  />
                ) : null}
                <Circle cx={star.x} cy={star.y} r={star.r} color={palette.star} opacity={opacity} />
              </Group>
            );
          })
        : null}

      {/* 낮에 맞추면 꽃잎이 천천히 돈다. 밤의 별과 같은 구실이다. */}
      {!night && lit > 0
        ? petals.map((item, index) => {
            const angle = ((item.angle + twinkle * 3) * Math.PI) / 180;
            const bob = Math.sin(twinkle * 0.7 + item.phase) * radius * 0.03;
            const x = Math.cos(angle) * item.distance;
            const y = Math.sin(angle) * item.distance + bob;
            const spin = twinkle * item.spin + item.phase * 40;
            return (
              <Group
                key={`petal-${index}`}
                transform={[
                  { translateX: x },
                  { translateY: y },
                  { rotate: (spin * Math.PI) / 180 },
                  { scale: item.size },
                ]}
                opacity={0.8 * lit}
              >
                <Path path={petal} color={PETAL_COLOR} />
              </Group>
            );
          })
        : null}

      {sunAltitude > HORIZON ? (
        <>
          {lit > 0 ? (
            <>
              <Circle
                cx={sun.x * RING * radius}
                cy={sun.y * RING * radius}
                r={sunSize * 3.2}
                color={palette.glow}
                opacity={0.16 * lit}
              />
              {/* 햇살. 천천히 돈다. */}
              {Array.from({ length: RAY_COUNT }, (_, i) => {
                const a = ((i * 360) / RAY_COUNT + twinkle * 4) * (Math.PI / 180);
                const cx = sun.x * RING * radius;
                const cy = sun.y * RING * radius;
                const from = sunSize * 2.2;
                const to = sunSize * 2.2 + radius * 0.08;
                return (
                  <Line
                    key={`ray-${i}`}
                    p1={vec(cx + Math.cos(a) * from, cy + Math.sin(a) * from)}
                    p2={vec(cx + Math.cos(a) * to, cy + Math.sin(a) * to)}
                    color={palette.glow}
                    strokeWidth={radius * 0.014}
                    opacity={0.45 * lit}
                  >
                    <BlurMask blur={radius * 0.012} style="normal" />
                  </Line>
                );
              })}
            </>
          ) : null}
          <Circle
            cx={sun.x * RING * radius}
            cy={sun.y * RING * radius}
            r={sunSize * (2.2 + 0.8 * lit)}
            color={palette.glow}
            opacity={0.3 + 0.15 * lit}
          />
          <Circle
            cx={sun.x * RING * radius}
            cy={sun.y * RING * radius}
            r={sunSize}
            color={palette.glow}
          />
        </>
      ) : null}

      {moonAltitude > HORIZON ? (
        <>
          <Circle
            cx={moon.x * RING * radius}
            cy={moon.y * RING * radius}
            r={moonSize * (2 + 1.0 * lit)}
            color={palette.accent}
            opacity={0.18 + moonFraction * 0.2 + 0.12 * lit}
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
