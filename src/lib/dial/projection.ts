import { toRadians } from "../placement/angle";

export interface Vector3 {
  /** 동쪽이 양수. */
  x: number;
  /** 북쪽이 양수. */
  y: number;
  /** 천정이 양수. */
  z: number;
}

/** 반지름 1인 원판 위의 점. 오른쪽과 아래쪽이 양수다. */
export interface DialPoint {
  x: number;
  y: number;
}

export function directionVector(altitude: number, azimuth: number): Vector3 {
  const a = toRadians(altitude);
  const z = toRadians(azimuth);
  return {
    x: Math.cos(a) * Math.sin(z),
    y: Math.cos(a) * Math.cos(z),
    z: Math.sin(a),
  };
}

/** 반구의 북쪽 축이 실제로 향한 방위만큼 되돌려 반구 기준 좌표로 옮긴다. */
export function rotateToDialFrame(v: Vector3, headingDeg: number): Vector3 {
  const h = toRadians(headingDeg);
  const cos = Math.cos(h);
  const sin = Math.sin(h);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
    z: v.z,
  };
}

export function projectToDial(v: Vector3): DialPoint {
  return { x: v.x, y: -v.y };
}

export function isInsideBowl(v: Vector3): boolean {
  return v.z < 0;
}

/** 영침 끝의 그림자는 언제나 광원의 정반대 방향으로 떨어진다. */
export function shadowPoint(
  altitude: number,
  azimuth: number,
  headingDeg: number
): DialPoint {
  const light = directionVector(altitude, azimuth);
  const away: Vector3 = { x: -light.x, y: -light.y, z: -light.z };
  return projectToDial(rotateToDialFrame(away, headingDeg));
}

/** 영침 뿌리는 정남 자오선에서 북극고도만큼 내려간 자리다. */
export function gnomonRootPoint(latitude: number, headingDeg: number): DialPoint {
  return projectToDial(rotateToDialFrame(directionVector(-latitude, 180), headingDeg));
}

export function southRimDistanceInDiameters(point: DialPoint): number {
  return (1 - point.y) / 2;
}
