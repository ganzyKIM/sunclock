import { BlurMask, Circle, Path, RadialGradient, Skia, vec } from "@shopify/react-native-skia";
import { useMemo } from "react";

import {
  FlatGeometry,
  FlatMoonPath,
  INNER_RADIUS,
  isMoonUp,
  OUTER_RADIUS,
} from "../../lib/dial/flat";
import { BRANCH_MINUTES, branchSpanOf } from "../../lib/dial/reading";
import { toRadians } from "../../lib/placement/angle";
import { desaturate, lerpColor, Palette } from "../../theme";

interface PlateProps {
  geometry: FlatGeometry;
  radius: number;
  palette: Palette;
  /** 밤에 달시계로 읽을 때, 오늘 밤 달이 지나는 길. 낮에는 null이다. */
  moon: FlatMoonPath | null;
  /** 북쪽을 맞춘 정도. 맞추면 테두리가 빛을 머금는다. */
  lit?: number;
  /** 그림자가 걸린 시각. 그 시의 구간을 밝힌다. 그림자가 없으면 null이다. */
  highlightMinutes?: number | null;
}

/** 달이 지나는 자리 둘레로 이만큼을 또렷하게 긋는다. */
const MOON_BAND = 0.055;
/**
 * 이름이 앉는 바깥 고리의 폭. 이름은 이 고리 한가운데에 있고, 고리는 시가
 * 갈리는 자리마다 끊겨 있다. 그래서 이름이 점이 아니라 한 시 전체의 것으로 보인다.
 */
export const BEZEL = 0.12;
/** 고리 토막 사이의 틈. 각도. */
const BEZEL_GAP = 1.2;
/** 맞추기 전에 눈금판에서 빼는 채도. 볕이 닿지 않은 청동처럼 가라앉는다. */
const ASLEEP = 0.75;

/** 절기선 한 줄. 해가 떠 있는 만큼만 그린다. 그래서 호의 길이가 곧 낮의 길이다. */
function arcPath(centerRadius: number, halfDayAngle: number, radius: number) {
  const r = centerRadius * radius;
  const path = Skia.Path.Make();
  // 정오가 위쪽이므로 -90도에서 시작한다. 스킨은 3시 방향이 0도다.
  path.addArc({ x: -r, y: -r, width: 2 * r, height: 2 * r }, -90 - halfDayAngle, 2 * halfDayAngle);
  return path;
}

function segment(a: { x: number; y: number }, b: { x: number; y: number }, radius: number) {
  const path = Skia.Path.Make();
  path.moveTo(a.x * radius, a.y * radius);
  path.lineTo(b.x * radius, b.y * radius);
  return path;
}

/**
 * 줄의 굵기를 정한다.
 *
 * 시가 갈리는 자리를 가장 굵게 긋는다. 이름은 그 시의 한가운데에 놓이므로,
 * 갈리는 자리가 보여야 이름이 어느 구역의 것인지 알 수 있다. 이름이 놓인
 * 정 자리는 그다음이고, 15분마다의 각은 가늘게 깔린다.
 */
function weightOf(
  line: { isMajor: boolean; isBranchEdge: boolean },
  radius: number,
  bright: boolean
): number {
  if (line.isBranchEdge) return radius * (bright ? 0.019 : 0.013);
  if (line.isMajor) return radius * (bright ? 0.008 : 0.006);
  return radius * (bright ? 0.005 : 0.004);
}

/** 시각선 위에서 안팎 두 반지름 사이만 잘라 낸다. */
function bandOnHourLine(hourAngle: number, from: number, to: number, radius: number) {
  const a = toRadians(hourAngle);
  const ux = Math.sin(a);
  const uy = -Math.cos(a);
  return segment({ x: ux * from, y: uy * from }, { x: ux * to, y: uy * to }, radius);
}

/** 시간각 h에서 반지름 r인 자리. 위쪽이 정오다. */
function at(hourAngle: number, r: number, radius: number) {
  const a = toRadians(hourAngle);
  return { x: Math.sin(a) * r * radius, y: -Math.cos(a) * r * radius };
}

/** 두 시간각 사이의 호. 선분으로 잇는다. */
function arcBetween(from: number, to: number, r: number, radius: number, samples = 10) {
  const path = Skia.Path.Make();
  for (let i = 0; i <= samples; i += 1) {
    const h = from + ((to - from) * i) / samples;
    const p = at(h, r, radius);
    if (i === 0) path.moveTo(p.x, p.y);
    else path.lineTo(p.x, p.y);
  }
  return path;
}

/** 안팎 두 반지름과 두 시간각으로 둘러싸인 고리 조각. */
function ringSector(from: number, to: number, inner: number, outer: number, radius: number) {
  const path = Skia.Path.Make();
  const samples = 12;
  for (let i = 0; i <= samples; i += 1) {
    const p = at(from + ((to - from) * i) / samples, outer, radius);
    if (i === 0) path.moveTo(p.x, p.y);
    else path.lineTo(p.x, p.y);
  }
  for (let i = samples; i >= 0; i -= 1) {
    const p = at(from + ((to - from) * i) / samples, inner, radius);
    path.lineTo(p.x, p.y);
  }
  path.close();
  return path;
}

/**
 * 펼친 원반. 가운데가 극이고 바깥으로 갈수록 겨울이다.
 *
 * 눈금 전체는 옅게 새겨 두고, 지금 읽을 수 있는 자리만 또렷하게 긋는다.
 * 낮에는 해가 오늘 지나는 절기선과 해가 떠 있는 동안의 시각선이고,
 * 밤에는 달이 오늘 지나는 자리와 달이 떠 있는 동안의 시각선이다.
 * 그래서 눈금판만 보아도 지금 무엇으로 시각을 읽고 있는지 알 수 있다.
 */
export function Plate({
  geometry,
  radius,
  palette,
  moon,
  lit = 0,
  highlightMinutes = null,
}: PlateProps) {
  /** 맞추기 전에는 색이 빠지고, 맞추면 본디 빛깔이 돌아온다. */
  const asleep = ASLEEP * (1 - lit);
  const bowl = desaturate(palette.bowl, asleep);
  const bowlDeep = desaturate(palette.bowlDeep, asleep);
  const rim = lerpColor(desaturate(palette.rim, asleep), palette.glow, 0.45 * lit);

  const arcs = useMemo(
    () =>
      geometry.termArcs.map((arc) => ({
        key: arc.label,
        // 온 둘레는 옅게, 해가 떠 있는 구간만 또렷하게 긋는다.
        ring: arcPath(arc.radius, 180, radius),
        daylight: arc.halfDayAngle > 0 ? arcPath(arc.radius, arc.halfDayAngle, radius) : null,
      })),
    [geometry, radius]
  );

  const hours = useMemo(
    () =>
      geometry.hourLines.map((line) => ({
        key: line.apparentMinutes,
        path: segment(line.from, line.to, radius),
        daylight: line.daylight
          ? segment(line.daylight.from, line.daylight.to, radius)
          : null,
        isMajor: line.isMajor,
        isBranchEdge: line.isBranchEdge,
      })),
    [geometry, radius]
  );

  /**
   * 이름이 앉는 바깥 고리. 시가 갈리는 자리마다 끊겨 열두 토막이다.
   * 토막의 양 끝에는 눈금판 안쪽의 굵은 경계선을 밖으로 이어 낸 금이 선다.
   */
  const bezel = useMemo(() => {
    const half = BRANCH_MINUTES / 8; // 한 시의 반, 각도로 15도
    return {
      arcs: geometry.hourLines
        .filter((line) => line.label !== null)
        .map((line) => ({
          key: line.apparentMinutes,
          path: arcBetween(
            line.hourAngle - half + BEZEL_GAP,
            line.hourAngle + half - BEZEL_GAP,
            OUTER_RADIUS + BEZEL,
            radius
          ),
        })),
      ticks: geometry.hourLines
        .filter((line) => line.isBranchEdge)
        .map((line) => ({
          key: line.apparentMinutes,
          path: bandOnHourLine(line.hourAngle, OUTER_RADIUS, OUTER_RADIUS + BEZEL, radius),
        })),
    };
  }, [geometry, radius]);

  /** 그림자가 걸린 시의 고리 조각. 이름과 함께 밝아진다. */
  const current = useMemo(() => {
    if (highlightMinutes === null) return null;
    const span = branchSpanOf(highlightMinutes);
    const center = span.center / 4 - 180;
    const half = BRANCH_MINUTES / 8;
    return ringSector(center - half, center + half, OUTER_RADIUS, OUTER_RADIUS + BEZEL, radius);
  }, [highlightMinutes, radius]);

  const moonlight = useMemo(() => {
    if (!moon || moon.halfDayAngle <= 0) return null;
    const from = Math.max(INNER_RADIUS, moon.radius - MOON_BAND);
    const to = Math.min(OUTER_RADIUS, moon.radius + MOON_BAND);

    return {
      arc: arcPath(moon.radius, moon.halfDayAngle, radius),
      hours: geometry.hourLines
        .filter((line) => isMoonUp(moon, line.hourAngle))
        .map((line) => ({
          key: line.apparentMinutes,
          path: bandOnHourLine(line.hourAngle, from, to, radius),
          isMajor: line.isMajor,
          isBranchEdge: line.isBranchEdge,
        })),
    };
  }, [geometry, moon, radius]);

  return (
    <>
      <Circle cx={0} cy={0} r={OUTER_RADIUS * radius}>
        <RadialGradient
          c={vec(0, -radius * 0.2)}
          r={OUTER_RADIUS * radius * 1.35}
          colors={[bowl, bowlDeep]}
        />
      </Circle>
      {lit > 0 ? (
        <Circle
          cx={0}
          cy={0}
          r={OUTER_RADIUS * radius}
          style="stroke"
          strokeWidth={radius * 0.09}
          color={palette.glow}
          opacity={0.3 * lit}
        >
          <BlurMask blur={radius * 0.03} style="normal" />
        </Circle>
      ) : null}
      <Circle
        cx={0}
        cy={0}
        r={OUTER_RADIUS * radius}
        style="stroke"
        strokeWidth={radius * 0.035}
        color={rim}
      />

      {arcs.map((arc) => (
        <Path
          key={`ring-${arc.key}`}
          path={arc.ring}
          style="stroke"
          strokeWidth={radius * 0.004}
          color={palette.line}
          opacity={0.22}
        />
      ))}
      {hours.map((line) => (
        <Path
          key={`hour-${line.key}`}
          path={line.path}
          style="stroke"
          strokeWidth={weightOf(line, radius, false)}
          color={palette.line}
          opacity={line.isBranchEdge ? 0.55 : line.isMajor ? 0.3 : 0.2}
        />
      ))}

      {/* 해로 읽는 동안에만 오늘의 절기선과 낮의 길이를 밝힌다. */}
      {moon
        ? null
        : arcs.map((arc) =>
            arc.daylight ? (
              <Path
                key={`term-${arc.key}`}
                path={arc.daylight}
                style="stroke"
                strokeWidth={radius * 0.007}
                color={palette.line}
                opacity={0.85}
              />
            ) : null
          )}
      {moon
        ? null
        : hours.map((line) =>
            line.daylight ? (
              <Path
                key={`day-${line.key}`}
                path={line.daylight}
                style="stroke"
                strokeWidth={weightOf(line, radius, true)}
                color={line.isMajor || line.isBranchEdge ? palette.lineMajor : palette.line}
                opacity={line.isBranchEdge ? 0.95 : line.isMajor ? 0.7 : 0.5}
              />
            ) : null
          )}

      {/* 달로 읽는 동안에는 달이 지나는 자리와 달이 떠 있는 시각만 밝힌다. */}
      {moonlight ? (
        <>
          {moonlight.hours.map((line) => (
            <Path
              key={`moon-hour-${line.key}`}
              path={line.path}
              style="stroke"
              strokeWidth={weightOf(line, radius, true)}
              color={line.isMajor || line.isBranchEdge ? palette.lineMajor : palette.line}
              opacity={line.isBranchEdge ? 0.95 : line.isMajor ? 0.7 : 0.5}
            />
          ))}
          <Path
            path={moonlight.arc}
            style="stroke"
            strokeWidth={radius * 0.009}
            color={palette.star}
            opacity={0.8}
          />
        </>
      ) : null}

      {/* 이름이 앉는 바깥 고리. 지금 시의 토막은 밝힌다. */}
      {current ? <Path path={current} color={palette.glow} opacity={0.22} /> : null}
      {bezel.arcs.map((arc) => (
        <Path
          key={`bezel-${arc.key}`}
          path={arc.path}
          style="stroke"
          strokeWidth={radius * 0.006}
          color={palette.line}
          opacity={0.5}
        />
      ))}
      {bezel.ticks.map((tick) => (
        <Path
          key={`tick-${tick.key}`}
          path={tick.path}
          style="stroke"
          strokeWidth={radius * 0.012}
          color={palette.lineMajor}
          opacity={0.8}
        />
      ))}

      {/* 가운데 영침 자리. 눈금이 들어오지 않는 빈 터다. */}
      <Circle
        cx={0}
        cy={0}
        r={INNER_RADIUS * radius}
        style="stroke"
        strokeWidth={radius * 0.006}
        color={palette.line}
        opacity={0.45}
      />
    </>
  );
}
