import { horizonHourAngle } from "../astro/solar";
import { toRadians } from "../placement/angle";
import { BRANCH_NAMES } from "../time/traditional";
import { OBLIQUITY, SOLAR_TERM_GROUPS, SolarTermGroup } from "./constants";
import { DialPoint } from "./projection";

/**
 * 오목한 반구를 극축 기준으로 펼친 원반이다.
 *
 * 영침은 천구 북극을 향하므로, 그 축에서 내려다보면 영침은 한가운데 점이 되고
 * 그림자는 거기서 뻗어 나가는 바늘이 된다. 시각선은 사방으로 퍼지는 곧은 선,
 * 절기선은 동심원이 된다.
 *
 * 각도는 그대로 시간각이다. 열두 시를 모두 새겨 원을 한 바퀴 채운다.
 * 낮에는 위쪽 절반을 해그림자가 쓰고, 밤에는 아래쪽을 달그림자가 쓴다.
 * 반지름만 보기 좋게 늘여 가운데에 영침 자리를 둔다.
 */

/** 영침이 앉을 가운데 자리. */
export const INNER_RADIUS = 0.32;
/** 동지선이 놓이는 바깥 자리. */
export const OUTER_RADIUS = 0.95;

/** 시각선은 30분마다 하나씩, 하루를 한 바퀴 돈다. */
export const HOUR_STEP_MINUTES = 30;
/** 주선은 각 시의 정에 놓인다. 두 시간마다 하나씩 열둘이다. */
export const MAJOR_STEP_MINUTES = 120;

const MINUTES_PER_DAY = 1440;
const DECLINATION_SAMPLES = 121;

/**
 * 적위를 원반 위의 반지름으로 옮긴다.
 *
 * 달은 태양보다 남북으로 넓게 움직여 눈금 밖으로 나간다. 그대로 두면
 * 바늘 끝이 가운데 영침 자리로 파고들어 보이지 않는다. 그래서 눈금의
 * 안팎 끝으로 붙인다. 눈금을 벗어났다는 사실은 글로 따로 알린다.
 */
export function radiusFor(declination: number): number {
  // 극에서 떨어진 각도. 하지가 가장 작고 동지가 가장 크다.
  const t = (90 - declination - (90 - OBLIQUITY)) / (2 * OBLIQUITY);
  const r = INNER_RADIUS + (OUTER_RADIUS - INNER_RADIUS) * t;
  return Math.min(OUTER_RADIUS, Math.max(INNER_RADIUS, r));
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
}

export interface FlatHourLine {
  hourAngle: number;
  apparentMinutes: number;
  isMajor: boolean;
  /** 주선에만 붙는 12지 이름. */
  label: string | null;
  /** 눈금이 그려지는 구간. 안쪽 끝과 바깥쪽 끝이다. */
  from: DialPoint;
  to: DialPoint;
  /** 그중 해가 떠 있을 수 있는 구간. 밤 시각선에는 없다. */
  daylight: { from: DialPoint; to: DialPoint } | null;
}

export interface FlatGeometry {
  latitude: number;
  termArcs: FlatTermArc[];
  hourLines: FlatHourLine[];
}

function buildTermArc(group: SolarTermGroup, latitude: number): FlatTermArc {
  return {
    declination: group.declination,
    label: group.label,
    termNames: group.terms.map((t) => t.name),
    radius: radiusFor(group.declination),
    halfDayAngle: horizonHourAngle(latitude, group.declination),
  };
}

/** 그 시각에 해가 떠 있을 수 있는 적위 구간을 찾는다. */
function daylightRange(
  hourAngle: number,
  latitude: number
): { low: number; high: number } | null {
  let low: number | null = null;
  let high: number | null = null;

  for (let i = 0; i < DECLINATION_SAMPLES; i += 1) {
    const declination = -OBLIQUITY + (2 * OBLIQUITY * i) / (DECLINATION_SAMPLES - 1);
    if (Math.abs(hourAngle) > horizonHourAngle(latitude, declination)) continue;
    if (low === null) low = declination;
    high = declination;
  }

  return low === null || high === null || low === high ? null : { low, high };
}

function buildHourLine(minutes: number, latitude: number): FlatHourLine {
  const hourAngle = minutes / 4 - 180;
  const range = daylightRange(hourAngle, latitude);
  const branchIndex = minutes / MAJOR_STEP_MINUTES;
  const isMajor = minutes % MAJOR_STEP_MINUTES === 0;

  return {
    hourAngle,
    apparentMinutes: minutes,
    isMajor,
    label: isMajor ? BRANCH_NAMES[branchIndex] : null,
    from: flatPoint(hourAngle, OBLIQUITY),
    to: flatPoint(hourAngle, -OBLIQUITY),
    daylight: range
      ? {
          from: flatPoint(hourAngle, range.high),
          to: flatPoint(hourAngle, range.low),
        }
      : null,
  };
}

export function buildFlatGeometry(latitude: number): FlatGeometry {
  const termArcs = SOLAR_TERM_GROUPS.map((group) => buildTermArc(group, latitude));

  const hourLines: FlatHourLine[] = [];
  for (let minutes = 0; minutes < MINUTES_PER_DAY; minutes += HOUR_STEP_MINUTES) {
    hourLines.push(buildHourLine(minutes, latitude));
  }

  return { latitude, termArcs, hourLines };
}
