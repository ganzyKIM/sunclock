import { directionVector, DialPoint, rotateToDialFrame } from "./projection";
import { toDegrees, toRadians } from "../placement/angle";

const MINUTES_PER_DAY = 1440;
/** 한 시는 두 시간, 곧 120분이다. */
export const BRANCH_MINUTES = 120;

function wrapMinutes(minutes: number): number {
  return ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

/**
 * 펼친 원반 위의 점이 놓인 시각. 각도를 그대로 되읽는다.
 * 위쪽이 정오, 아래쪽이 자정이다.
 */
export function flatMinutesAt(point: DialPoint): number {
  const angle = toDegrees(Math.atan2(point.x, -point.y));
  return wrapMinutes((angle + 180) * 4);
}

/**
 * 광원이 반구 눈금에서 가리키는 시각.
 *
 * 반구는 휴대폰에 붙어 있어 방위가 어긋나면 그림자가 엉뚱한 시각선 위에 선다.
 * 그때 그림자가 실제로 걸린 눈금이 어디인지 알려면 광원을 반구 기준으로
 * 돌린 뒤 반구의 극축을 기준으로 시간각을 다시 재야 한다. 방위가 0이면
 * 그냥 그 광원의 시간각이다.
 */
export function dialMinutesOf(
  altitude: number,
  azimuth: number,
  headingDeg: number,
  latitude: number
): number {
  const light = rotateToDialFrame(directionVector(altitude, azimuth), headingDeg);
  const phi = toRadians(latitude);
  // 극축과 직각인 면에서, 정남 쪽 자오선 방향과 동쪽 방향으로 잰다.
  const meridian = -light.y * Math.sin(phi) + light.z * Math.cos(phi);
  const east = light.x;
  const hourAngle = toDegrees(Math.atan2(-east, meridian));
  return wrapMinutes((hourAngle + 180) * 4);
}

interface EdgeLike {
  isBranchEdge: boolean;
  apparentMinutes: number;
}

/**
 * 그 시각이 속한 시의 양쪽 경계선. 눈금판에 그 선이 없으면 null이다.
 * 반구는 낮 시각선만 새겨져 있어 밤에는 대개 없다.
 */
export function findBranchEdges<T extends EdgeLike>(
  lines: readonly T[],
  minutes: number
): { start: T; end: T } | null {
  const span = branchSpanOf(minutes);
  const at = (target: number) =>
    lines.find((line) => line.isBranchEdge && wrapMinutes(line.apparentMinutes) === target);
  const start = at(span.start);
  const end = at(span.end);
  return start && end ? { start, end } : null;
}

export interface BranchSpan {
  /** 이름이 놓인 한가운데. 분. */
  center: number;
  /** 시작과 끝. 분. 끝이 시작보다 작으면 자정을 가로지른다. */
  start: number;
  end: number;
}

/** 그 시각이 속한 시의 범위. 이름은 한가운데에 있고 앞뒤로 한 시간씩이다. */
export function branchSpanOf(minutes: number): BranchSpan {
  const center = wrapMinutes(Math.round(minutes / BRANCH_MINUTES) * BRANCH_MINUTES);
  return {
    center,
    start: wrapMinutes(center - BRANCH_MINUTES / 2),
    end: wrapMinutes(center + BRANCH_MINUTES / 2),
  };
}
