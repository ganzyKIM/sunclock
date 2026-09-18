export function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function normalizeDegrees(deg: number): number {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

export function angleDifference(a: number, b: number): number {
  const d = normalizeDegrees(a - b);
  return d > 180 ? d - 360 : d;
}

/** 정렬로 인정하는 방위 오차. 도 단위. */
export const ALIGNMENT_TOLERANCE_DEGREES = 3;
/** 수평으로 인정하는 기울기. 도 단위. */
export const FLAT_TOLERANCE_DEGREES = 5;

/** 0도와 360도 경계를 가로질러도 튀지 않게 각도를 누그러뜨린다. */
export function smoothAngle(previous: number | null, next: number, factor: number): number {
  if (previous === null) return normalizeDegrees(next);
  return normalizeDegrees(previous + angleDifference(next, previous) * factor);
}

/** 화면이 하늘을 볼 때 0도, 옆으로 세우면 90도, 엎어 놓으면 180도다. */
export function tiltFromRotation(betaRadians: number, gammaRadians: number): number {
  const cosine = Math.cos(betaRadians) * Math.cos(gammaRadians);
  return toDegrees(Math.acos(Math.min(1, Math.max(-1, cosine))));
}
