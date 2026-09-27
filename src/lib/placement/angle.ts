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

/** 이보다 작은 변화는 떨림으로 보고 무겁게 누른다. 도 단위. */
export const JITTER_DEGREES = 6;
/** 떨림일 때와 진짜 돌릴 때의 따라가는 비율. */
export const JITTER_SHARE = 0.06;
export const TURN_SHARE = 0.3;

/**
 * 나침반 값을 누그러뜨린다.
 *
 * 나침반은 가만히 두어도 몇 도씩 떨린다. 그 떨림을 그대로 옮기면 바늘이
 * 계속 움직인다. 작은 변화는 아주 천천히만 따라가고, 크게 돌릴 때는 바로
 * 따라간다. 그래서 가만히 두면 멎고, 돌리면 곧 돈다.
 */
export function steadyAngle(previous: number | null, next: number): number {
  if (previous === null) return normalizeDegrees(next);
  const share = Math.abs(angleDifference(next, previous)) > JITTER_DEGREES ? TURN_SHARE : JITTER_SHARE;
  return smoothAngle(previous, next, share);
}

/** 화면이 하늘을 볼 때 0도, 옆으로 세우면 90도, 엎어 놓으면 180도다. */
export function tiltFromRotation(betaRadians: number, gammaRadians: number): number {
  const cosine = Math.cos(betaRadians) * Math.cos(gammaRadians);
  return toDegrees(Math.acos(Math.min(1, Math.max(-1, cosine))));
}

/**
 * 지금 각도에서 목표 각도 쪽으로 정해진 비율만큼 다가간다.
 *
 * 0도와 360도의 경계를 가로질러도 짧은 쪽으로 돈다. 맞췄다고 본 순간
 * 그림자가 제 눈금으로 뚝 뛰어가지 않고 스르르 미끄러져 들어가게 한다.
 */
export function approachAngle(current: number, target: number, share: number): number {
  const clamped = Math.min(1, Math.max(0, share));
  return normalizeDegrees(current + angleDifference(target, current) * clamped);
}

/** 앞은 빠르고 끝은 느리게. 자리에 닿을 때 멈추는 것처럼 보인다. */
export function easeOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - (1 - clamped) ** 3;
}
