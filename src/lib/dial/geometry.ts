import { horizonHourAngle, horizontalFromEquatorial } from "../astro/solar";
import {
  HOUR_LINE_END_MINUTES,
  HOUR_LINE_START_MINUTES,
  HOUR_LINE_STEP_MINUTES,
  MAJOR_HOUR_MINUTES,
  OBLIQUITY,
  SOLAR_TERM_GROUPS,
  SolarTermGroup,
  majorHourLabel,
  moonHourLabel,
} from "./constants";
import { DialPoint, gnomonRootPoint, shadowPoint } from "./projection";

export const HANYANG_LATITUDE = 37 + 39 / 60 + 15 / 3600;

/** 두 끝점을 포함하도록 홀수로 잡는다. 가운데 표본이 정오가 된다. */
const SOLAR_TERM_SAMPLES = 121;
const HOUR_LINE_SAMPLES = 61;

const HOUR_ANGLE_START = HOUR_LINE_START_MINUTES / 4 - 180;
const HOUR_ANGLE_END = HOUR_LINE_END_MINUTES / 4 - 180;

export interface CurvePoint extends DialPoint {
  /** 시각선이 덮는 범위 안이면 참이다. */
  insideHourRange: boolean;
}

export interface SolarTermLine {
  declination: number;
  label: string;
  termNames: string[];
  points: CurvePoint[];
}

export interface HourLine {
  hourAngle: number;
  apparentMinutes: number;
  isMajor: boolean;
  /** 한 시가 시작하고 끝나는 자리인지. 이름은 그 사이의 한가운데에 놓인다. */
  isBranchEdge: boolean;
  label: string | null;
  /** 같은 선을 달시계로 읽을 때의 이름. 해 이름에서 열두 시간 떨어져 있다. */
  moonLabel: string | null;
  points: DialPoint[];
}

export interface DialGeometry {
  latitude: number;
  gnomonRoot: DialPoint;
  solarTermLines: SolarTermLine[];
  hourLines: HourLine[];
}

/** 눈금은 반구 자신의 기준으로 만든다. 그래서 방위를 0으로 둔다. */
const DIAL_FRAME_HEADING = 0;

function pointAt(hourAngle: number, declination: number, latitude: number): DialPoint {
  const { altitude, azimuth } = horizontalFromEquatorial(hourAngle, declination, latitude);
  return shadowPoint(altitude, azimuth, DIAL_FRAME_HEADING);
}

function isSunUp(hourAngle: number, declination: number, latitude: number): boolean {
  return Math.abs(hourAngle) <= horizonHourAngle(latitude, declination);
}

function buildSolarTermLine(
  group: SolarTermGroup,
  latitude: number
): SolarTermLine | null {
  const limit = horizonHourAngle(latitude, group.declination);
  if (limit <= 0) return null;

  const points: CurvePoint[] = [];
  for (let i = 0; i < SOLAR_TERM_SAMPLES; i += 1) {
    const hourAngle = -limit + (2 * limit * i) / (SOLAR_TERM_SAMPLES - 1);
    const { x, y } = pointAt(hourAngle, group.declination, latitude);
    points.push({
      x,
      y,
      insideHourRange: hourAngle >= HOUR_ANGLE_START && hourAngle <= HOUR_ANGLE_END,
    });
  }

  return {
    declination: group.declination,
    label: group.label,
    termNames: group.terms.map((t) => t.name),
    points,
  };
}

function buildHourLine(minutes: number, latitude: number): HourLine | null {
  const hourAngle = minutes / 4 - 180;
  const points: DialPoint[] = [];

  for (let i = 0; i < HOUR_LINE_SAMPLES; i += 1) {
    const declination = -OBLIQUITY + (2 * OBLIQUITY * i) / (HOUR_LINE_SAMPLES - 1);
    if (!isSunUp(hourAngle, declination, latitude)) continue;
    points.push(pointAt(hourAngle, declination, latitude));
  }

  if (points.length < 2) return null;

  return {
    hourAngle,
    apparentMinutes: minutes,
    isMajor: MAJOR_HOUR_MINUTES.includes(minutes),
    isBranchEdge: (minutes + 60) % 120 === 0,
    label: majorHourLabel(minutes),
    moonLabel: moonHourLabel(minutes),
    points,
  };
}

/**
 * 이어진 토막끼리만 묶는다. 하지선처럼 시각선 범위를 양 끝에서 넘는 선은
 * 넘는 구간이 좌우 두 토막이므로, 한 줄로 이으면 그릇을 가로지르는 금이 생긴다.
 */
export function contiguousRuns(
  points: CurvePoint[],
  insideHourRange: boolean
): DialPoint[][] {
  const runs: DialPoint[][] = [];
  let current: DialPoint[] | null = null;

  for (const point of points) {
    if (point.insideHourRange === insideHourRange) {
      if (!current) {
        current = [];
        runs.push(current);
      }
      current.push({ x: point.x, y: point.y });
    } else {
      current = null;
    }
  }

  return runs.filter((run) => run.length > 1);
}

export function buildDialGeometry(latitude: number): DialGeometry {
  const solarTermLines: SolarTermLine[] = [];
  for (const group of SOLAR_TERM_GROUPS) {
    const line = buildSolarTermLine(group, latitude);
    if (line) solarTermLines.push(line);
  }

  const hourLines: HourLine[] = [];
  for (
    let minutes = HOUR_LINE_START_MINUTES;
    minutes <= HOUR_LINE_END_MINUTES;
    minutes += HOUR_LINE_STEP_MINUTES
  ) {
    const line = buildHourLine(minutes, latitude);
    if (line) hourLines.push(line);
  }

  return {
    latitude,
    gnomonRoot: gnomonRootPoint(latitude),
    solarTermLines,
    hourLines,
  };
}

/**
 * 오늘 밤 달이 반구에 그리는 길.
 *
 * 절기선과 같은 방식으로 구한다. 다른 것은 적위뿐이다. 밤에는 이 선 하나만
 * 밝혀 두면 달그림자가 어디를 지날지 눈금판이 스스로 보여 준다.
 */
export function buildMoonLine(latitude: number, declination: number): DialPoint[] {
  const limit = horizonHourAngle(latitude, declination);
  if (limit <= 0) return [];

  const points: DialPoint[] = [];
  for (let i = 0; i < SOLAR_TERM_SAMPLES; i += 1) {
    const hourAngle = -limit + (2 * limit * i) / (SOLAR_TERM_SAMPLES - 1);
    points.push(pointAt(hourAngle, declination, latitude));
  }
  return points;
}
