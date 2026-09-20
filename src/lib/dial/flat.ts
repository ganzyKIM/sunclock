import { horizonHourAngle } from "../astro/solar";
import { toRadians } from "../placement/angle";
import {
  HOUR_LINE_END_MINUTES,
  HOUR_LINE_START_MINUTES,
  HOUR_LINE_STEP_MINUTES,
  MAJOR_HOUR_MINUTES,
  OBLIQUITY,
  SOLAR_TERM_GROUPS,
  SolarTermGroup,
  majorHourLabel,
} from "./constants";
import { DialPoint } from "./projection";

/**
 * 오목한 반구를 극축 기준으로 펼친 원반이다.
 *
 * 영침은 천구 북극을 향하므로, 그 축에서 내려다보면 영침은 한가운데 점이 되고
 * 그림자는 거기서 뻗어 나가는 바늘이 된다. 시각선은 사방으로 퍼지는 곧은 선,
 * 절기선은 동심원이 된다. 반구에서는 아래쪽 절반이 늘 비어 있었지만
 * 이 원반은 눈금이 고루 퍼져 한눈에 들어온다.
 *
 * 각도는 그대로 시간각이다. 반지름만 보기 좋게 늘여 가운데에 영침 자리를 둔다.
 */

/** 영침이 앉을 가운데 자리. */
export const INNER_RADIUS = 0.32;
/** 동지선이 놓이는 바깥 자리. */
export const OUTER_RADIUS = 0.95;

/** 극에서 떨어진 각도. 하지가 가장 작고 동지가 가장 크다. */
function polarDistance(declination: number): number {
  return 90 - declination;
}

export function radiusFor(declination: number): number {
  const t = (polarDistance(declination) - (90 - OBLIQUITY)) / (2 * OBLIQUITY);
  return INNER_RADIUS + (OUTER_RADIUS - INNER_RADIUS) * t;
}

/** 정오가 위쪽이고 시간이 흐를수록 시계 방향으로 돈다. */
export function flatPoint(hourAngle: number, declination: number): DialPoint {
  const r = radiusFor(declination);
  const a = toRadians(hourAngle);
  return { x: r * Math.sin(a), y: -r * Math.cos(a) };
}

export interface FlatTermArc {
  declination: number;
  label: string;
  termNames: string[];
  radius: number;
  /** 해가 뜨고 지는 시간각. 이 폭이 곧 그날의 낮 길이다. */
  halfDayAngle: number;
  /** 시각선이 덮는 범위를 넘는지. 여름에는 넘는다. */
  exceedsHourRange: boolean;
}

export interface FlatHourLine {
  hourAngle: number;
  apparentMinutes: number;
  isMajor: boolean;
  label: string | null;
  /** 해가 떠 있는 구간만 남긴 안쪽 끝과 바깥쪽 끝. */
  from: DialPoint;
  to: DialPoint;
}

export interface FlatGeometry {
  latitude: number;
  termArcs: FlatTermArc[];
  hourLines: FlatHourLine[];
}

const HOUR_ANGLE_START = HOUR_LINE_START_MINUTES / 4 - 180;
const HOUR_ANGLE_END = HOUR_LINE_END_MINUTES / 4 - 180;
const DECLINATION_SAMPLES = 61;

function buildTermArc(group: SolarTermGroup, latitude: number): FlatTermArc | null {
  const halfDayAngle = horizonHourAngle(latitude, group.declination);
  if (halfDayAngle <= 0) return null;

  return {
    declination: group.declination,
    label: group.label,
    termNames: group.terms.map((t) => t.name),
    radius: radiusFor(group.declination),
    halfDayAngle,
    exceedsHourRange: halfDayAngle > HOUR_ANGLE_END,
  };
}

function buildHourLine(minutes: number, latitude: number): FlatHourLine | null {
  const hourAngle = minutes / 4 - 180;

  let lowest: number | null = null;
  let highest: number | null = null;
  for (let i = 0; i < DECLINATION_SAMPLES; i += 1) {
    const declination = -OBLIQUITY + (2 * OBLIQUITY * i) / (DECLINATION_SAMPLES - 1);
    if (Math.abs(hourAngle) > horizonHourAngle(latitude, declination)) continue;
    if (lowest === null) lowest = declination;
    highest = declination;
  }
  if (lowest === null || highest === null || lowest === highest) return null;

  return {
    hourAngle,
    apparentMinutes: minutes,
    isMajor: MAJOR_HOUR_MINUTES.includes(minutes),
    label: majorHourLabel(minutes),
    // 적위가 클수록 안쪽이다.
    from: flatPoint(hourAngle, highest),
    to: flatPoint(hourAngle, lowest),
  };
}

export function buildFlatGeometry(latitude: number): FlatGeometry {
  const termArcs: FlatTermArc[] = [];
  for (const group of SOLAR_TERM_GROUPS) {
    const arc = buildTermArc(group, latitude);
    if (arc) termArcs.push(arc);
  }

  const hourLines: FlatHourLine[] = [];
  for (
    let minutes = HOUR_LINE_START_MINUTES;
    minutes <= HOUR_LINE_END_MINUTES;
    minutes += HOUR_LINE_STEP_MINUTES
  ) {
    const line = buildHourLine(minutes, latitude);
    if (line) hourLines.push(line);
  }

  return { latitude, termArcs, hourLines };
}

export { HOUR_ANGLE_START, HOUR_ANGLE_END };
