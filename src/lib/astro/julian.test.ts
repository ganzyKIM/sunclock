import { toJulianCentury, toJulianDay } from "./julian";

describe("toJulianDay", () => {
  it("2000년 1월 1일 12시 협정세계시는 2451545이다", () => {
    expect(toJulianDay(new Date("2000-01-01T12:00:00Z"))).toBeCloseTo(2451545, 6);
  });

  it("하루 뒤는 1만큼 크다", () => {
    const a = toJulianDay(new Date("2026-09-18T00:00:00Z"));
    const b = toJulianDay(new Date("2026-09-19T00:00:00Z"));
    expect(b - a).toBeCloseTo(1, 9);
  });

  it("1970년 1월 1일 0시 협정세계시는 2440587.5이다", () => {
    expect(toJulianDay(new Date("1970-01-01T00:00:00Z"))).toBeCloseTo(2440587.5, 6);
  });
});

describe("toJulianCentury", () => {
  it("기준 시점에서 0이다", () => {
    expect(toJulianCentury(2451545)).toBeCloseTo(0, 12);
  });

  it("36525일 뒤에 1이다", () => {
    expect(toJulianCentury(2451545 + 36525)).toBeCloseTo(1, 12);
  });
});
