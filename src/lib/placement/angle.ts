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

/**
 * 손으로 맞출 수 있는 만큼만 요구한다.
 * 몇 도 단위로 맞추라고 하면 아무도 맞출 수 없다.
 */
export const ALIGNMENT_TOLERANCE_DEGREES = 15;
export const FLAT_TOLERANCE_DEGREES = 15;

/**
 * 한번 맞았다고 본 뒤에는 조금 더 벗어나야 풀린다.
 * 경계에 걸쳐 있을 때 표시가 깜빡이는 것을 막는다.
 */
export const ALIGNMENT_RELEASE_DEGREES = 22;
export const FLAT_RELEASE_DEGREES = 22;

/** 안내하는 각도를 큰 단위로 끊는다. 숫자가 떨리지 않게 한다. */
export function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/** 돌리라고 안내할 때 쓰는 단위. */
export const GUIDE_STEP_DEGREES = 15;

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
