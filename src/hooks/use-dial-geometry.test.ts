import { quantizeLatitude } from "./use-dial-geometry";

describe("quantizeLatitude", () => {
  it("0.05도 단위로 끊는다", () => {
    expect(quantizeLatitude(37.5123)).toBeCloseTo(37.5, 9);
    expect(quantizeLatitude(37.539)).toBeCloseTo(37.55, 9);
  });

  it("몇 킬로미터 움직여도 값이 그대로다", () => {
    expect(quantizeLatitude(37.5)).toBe(quantizeLatitude(37.52));
  });

  it("충분히 멀어지면 값이 달라진다", () => {
    expect(quantizeLatitude(37.5)).not.toBe(quantizeLatitude(37.7));
  });
});
