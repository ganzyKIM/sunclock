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

/**
 * 영침 뿌리는 정남 자오선에서 북극고도만큼 내려간 자리다.
 * 영침은 반구에 박혀 있으므로 휴대폰을 돌려도 반구 기준으로는 제자리에 있다.
 */
export function gnomonRootPoint(latitude: number): DialPoint {
  return projectToDial(gnomonRootDirection(latitude));
}

function gnomonRootDirection(latitude: number): Vector3 {
  return directionVector(-latitude, 180);
}

export function southRimDistanceInDiameters(point: DialPoint): number {
  return (1 - point.y) / 2;
}

function normalize(v: Vector3): Vector3 {
  const length = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / length, y: v.y / length, z: v.z / length };
}

/** 구 위의 두 방향을 큰 원을 따라 잇는다. */
function slerp(from: Vector3, to: Vector3, t: number): Vector3 {
  const dot = Math.min(1, Math.max(-1, from.x * to.x + from.y * to.y + from.z * to.z));
  const omega = Math.acos(dot);
  if (omega < 1e-9) return from;

  const a = Math.sin((1 - t) * omega) / Math.sin(omega);
  const b = Math.sin(t * omega) / Math.sin(omega);
  return normalize({
    x: from.x * a + to.x * b,
    y: from.y * a + to.y * b,
    z: from.z * a + to.z * b,
  });
}

/**
 * 영침은 천구 북극을 향한다. 영침과 광원이 이루는 평면이 곧 그때의 시각선이
 * 놓인 평면이므로, 영침의 그림자는 언제나 그 시각의 시각선을 따라 뻗는다.
 */
export function rodShadowPoints(
  latitude: number,
  altitude: number,
  azimuth: number,
  headingDeg: number,
  samples = 24
): DialPoint[] {
  const root = gnomonRootDirection(latitude);
  const light = directionVector(altitude, azimuth);
  const tip = rotateToDialFrame(
    { x: -light.x, y: -light.y, z: -light.z },
    headingDeg
  );

  const points: DialPoint[] = [];
  for (let i = 0; i < samples; i += 1) {
    const t = samples === 1 ? 0 : i / (samples - 1);
    points.push(projectToDial(slerp(root, tip, t)));
  }
  return points;
}

/**
 * 광원이 지평선 아래에 있으면 그림자는 반구 밖으로 나간다. 그래도 그림자가
 * 놓일 시각선은 정해져 있으므로, 영침 뿌리에서 그 시각선을 따라 테두리에
 * 닿는 데까지만 그린다. 광원이 떠 있으면 `rodShadowPoints`와 같다.
 *
 * 보름달 자리가 아직 뜨지 않은 밤에 보정한 그림자를 그릴 때 쓴다. 그때도
 * 눈금을 읽을 자리는 테두리에 걸린 그 시각선이다.
 */
export function rodShadowToRim(
  latitude: number,
  altitude: number,
  azimuth: number,
  headingDeg: number,
  samples = 24
): DialPoint[] {
  const root = gnomonRootDirection(latitude);
  const light = directionVector(altitude, azimuth);
  const tip = rotateToDialFrame(
    { x: -light.x, y: -light.y, z: -light.z },
    headingDeg
  );

  const points: DialPoint[] = [];
  let previous = 0;
  for (let i = 0; i < samples; i += 1) {
    const t = samples === 1 ? 0 : i / (samples - 1);
    const v = slerp(root, tip, t);
    if (v.z > 0) {
      // 지평선을 넘었다. 넘기 직전과 사이에서 테두리에 닿는 자리를 찾는다.
      let inside = previous;
      let outside = t;
      for (let step = 0; step < 24; step += 1) {
        const middle = (inside + outside) / 2;
        if (slerp(root, tip, middle).z > 0) outside = middle;
        else inside = middle;
      }
      points.push(projectToDial(slerp(root, tip, inside)));
      return points;
    }
    points.push(projectToDial(v));
    previous = t;
  }
  return points;
}

export function scalePoint(point: DialPoint, radius: number): DialPoint {
  return { x: point.x * radius, y: point.y * radius };
}

/** 그 방위가 반구 기준으로 어느 쪽인지 알려 주는 단위 방향이다. */
export function horizonDirection(azimuth: number, headingDeg: number): DialPoint {
  const angle = toRadians(azimuth - headingDeg);
  return { x: Math.sin(angle), y: -Math.cos(angle) };
}
