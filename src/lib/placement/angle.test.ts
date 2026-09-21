import { angleDifference, normalizeDegrees, toDegrees, toRadians } from "./angle";

describe("normalizeDegrees", () => {
  it("0 이상 360 미만으로 접는다", () => {
    expect(normalizeDegrees(0)).toBe(0);
    expect(normalizeDegrees(360)).toBe(0);
    expect(normalizeDegrees(370)).toBe(10);
    expect(normalizeDegrees(-10)).toBe(350);
    expect(normalizeDegrees(-370)).toBe(350);
  });
});

describe("angleDifference", () => {
  it("최단 방향의 차이를 낸다", () => {
    expect(angleDifference(10, 0)).toBe(10);
    expect(angleDifference(350, 0)).toBe(-10);
    expect(angleDifference(0, 350)).toBe(10);
    expect(angleDifference(180, 0)).toBe(180);
  });
});

describe("toRadians와 toDegrees", () => {
  it("서로를 되돌린다", () => {
    expect(toDegrees(toRadians(37.65))).toBeCloseTo(37.65, 10);
    expect(toRadians(180)).toBeCloseTo(Math.PI, 12);
  });
});

import { FLAT_TOLERANCE_DEGREES, smoothAngle, tiltFromRotation } from "./angle";

describe("smoothAngle", () => {
  it("이전 값이 없으면 새 값을 그대로 쓴다", () => {
    expect(smoothAngle(null, 40, 0.2)).toBe(40);
    expect(smoothAngle(null, 400, 0.2)).toBe(40);
  });

  it("새 값 쪽으로 조금씩 움직인다", () => {
    expect(smoothAngle(0, 100, 0.25)).toBeCloseTo(25, 9);
  });

  it("0도와 360도 경계를 가로질러 최단 방향으로 간다", () => {
    expect(smoothAngle(350, 10, 0.5)).toBeCloseTo(0, 9);
    expect(smoothAngle(10, 350, 0.5)).toBeCloseTo(0, 9);
  });

  it("결과가 항상 0 이상 360 미만이다", () => {
    expect(smoothAngle(359, 1, 1)).toBeCloseTo(1, 9);
    expect(smoothAngle(1, 359, 1)).toBeCloseTo(359, 9);
  });
});

describe("tiltFromRotation", () => {
  it("평평하면 0이다", () => {
    expect(tiltFromRotation(0, 0)).toBeCloseTo(0, 9);
  });

  it("옆으로 세우면 90도다", () => {
    expect(tiltFromRotation(0, Math.PI / 2)).toBeCloseTo(90, 6);
    expect(tiltFromRotation(Math.PI / 2, 0)).toBeCloseTo(90, 6);
  });

  it("엎어 놓으면 180도다", () => {
    expect(tiltFromRotation(Math.PI, 0)).toBeCloseTo(180, 6);
  });

  it("부호가 달라도 같은 값을 낸다", () => {
    expect(tiltFromRotation(-0.3, 0.2)).toBeCloseTo(tiltFromRotation(0.3, -0.2), 9);
  });

  it("살짝 기운 정도는 수평으로 본다", () => {
    expect(tiltFromRotation(0.05, 0.02)).toBeLessThan(FLAT_TOLERANCE_DEGREES);
  });
});

import {
  ALIGNMENT_RELEASE_DEGREES,
  ALIGNMENT_TOLERANCE_DEGREES,
  FLAT_RELEASE_DEGREES,
  GUIDE_STEP_DEGREES,
  roundToStep,
} from "./angle";

describe("허용치", () => {
  it("손으로 맞출 수 있을 만큼 넉넉하다", () => {
    expect(ALIGNMENT_TOLERANCE_DEGREES).toBeGreaterThanOrEqual(10);
    expect(FLAT_TOLERANCE_DEGREES).toBeGreaterThanOrEqual(10);
  });

  it("풀리는 값이 맞는 값보다 넉넉해야 깜빡이지 않는다", () => {
    expect(ALIGNMENT_RELEASE_DEGREES).toBeGreaterThan(ALIGNMENT_TOLERANCE_DEGREES);
    expect(FLAT_RELEASE_DEGREES).toBeGreaterThan(FLAT_TOLERANCE_DEGREES);
  });
});

describe("roundToStep", () => {
  it("가까운 눈금으로 끊는다", () => {
    expect(roundToStep(37, 15)).toBe(30);
    expect(roundToStep(38, 15)).toBe(45);
    expect(roundToStep(7, 15)).toBe(0);
    expect(roundToStep(8, 15)).toBe(15);
  });

  it("음수도 같은 방식으로 끊는다", () => {
    expect(roundToStep(-37, 15)).toBe(-30);
    expect(roundToStep(-38, 15)).toBe(-45);
  });

  it("허용치를 넘은 각도는 0으로 끊기지 않는다", () => {
    for (let offset = ALIGNMENT_TOLERANCE_DEGREES + 1; offset <= 180; offset += 1) {
      expect(roundToStep(offset, GUIDE_STEP_DEGREES)).toBeGreaterThan(0);
    }
  });
});
