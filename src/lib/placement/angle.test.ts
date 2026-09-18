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
