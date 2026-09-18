import * as Astronomy from "astronomy-engine";
import { moonState, SYNODIC_MONTH_DAYS } from "./lunar";

const SEOUL = { latitude: 37.5665, longitude: 126.978 };
const DAY = 86400000;

function stateAt(iso: string) {
  return moonState(new Date(iso), SEOUL.latitude, SEOUL.longitude);
}

describe("moonState", () => {
  it("삭망월 길이를 쓴다", () => {
    expect(SYNODIC_MONTH_DAYS).toBeCloseTo(29.530588853, 9);
  });

  it("밝은 면 비율이 0과 1 사이다", () => {
    for (let i = 0; i < 30; i += 1) {
      const date = new Date(Date.parse("2026-01-01T12:00:00Z") + i * DAY);
      const { illuminatedFraction } = moonState(date, SEOUL.latitude, SEOUL.longitude);
      expect(illuminatedFraction).toBeGreaterThanOrEqual(0);
      expect(illuminatedFraction).toBeLessThanOrEqual(1);
    }
  });

  it("한 달 안에 보름과 그믐을 모두 지난다", () => {
    let brightest = 0;
    let darkest = 1;
    for (let i = 0; i < 30; i += 1) {
      const date = new Date(Date.parse("2026-01-01T12:00:00Z") + i * DAY);
      const { illuminatedFraction } = moonState(date, SEOUL.latitude, SEOUL.longitude);
      brightest = Math.max(brightest, illuminatedFraction);
      darkest = Math.min(darkest, illuminatedFraction);
    }
    expect(brightest).toBeGreaterThan(0.97);
    expect(darkest).toBeLessThan(0.03);
  });

  it("보름에 가까울수록 밝다", () => {
    for (let i = 0; i < 30; i += 1) {
      const date = new Date(Date.parse("2026-03-01T12:00:00Z") + i * DAY);
      const { illuminatedFraction, daysFromFullMoon } = moonState(
        date,
        SEOUL.latitude,
        SEOUL.longitude
      );
      if (Math.abs(daysFromFullMoon) < 1) expect(illuminatedFraction).toBeGreaterThan(0.95);
      if (Math.abs(daysFromFullMoon) > 14) expect(illuminatedFraction).toBeLessThan(0.05);
    }
  });

  it("보름에서 지난 날수가 삭망월 절반 안에 든다", () => {
    for (let i = 0; i < 40; i += 1) {
      const date = new Date(Date.parse("2026-05-01T12:00:00Z") + i * DAY);
      const { daysFromFullMoon } = moonState(date, SEOUL.latitude, SEOUL.longitude);
      expect(Math.abs(daysFromFullMoon)).toBeLessThanOrEqual(SYNODIC_MONTH_DAYS / 2 + 1e-6);
    }
  });

  it("적위가 기준 구현과 0.5도 안에서 맞는다", () => {
    const observer = new Astronomy.Observer(SEOUL.latitude, SEOUL.longitude, 0);
    for (const iso of [
      "2026-02-03T12:00:00Z",
      "2026-05-19T03:00:00Z",
      "2026-09-07T21:00:00Z",
    ]) {
      const date = new Date(iso);
      const expected = Astronomy.Equator(Astronomy.Body.Moon, date, observer, true, true).dec;
      expect(Math.abs(stateAt(iso).declination - expected)).toBeLessThan(0.5);
    }
  });

  it("시간각이 -180 이상 180 미만이다", () => {
    for (let i = 0; i < 24; i += 1) {
      const date = new Date(Date.parse("2026-07-04T00:00:00Z") + i * 3600000);
      const { hourAngle } = moonState(date, SEOUL.latitude, SEOUL.longitude);
      expect(hourAngle).toBeGreaterThanOrEqual(-180);
      expect(hourAngle).toBeLessThan(180);
    }
  });

  it("적위가 달의 한계 안에 머문다", () => {
    for (let i = 0; i < 60; i += 1) {
      const date = new Date(Date.parse("2026-01-01T00:00:00Z") + i * DAY);
      const { declination } = moonState(date, SEOUL.latitude, SEOUL.longitude);
      expect(Math.abs(declination)).toBeLessThan(29.5);
    }
  });

  it("달 모양에 이름을 붙인다", () => {
    const names = new Set<string>();
    for (let i = 0; i < 30; i += 1) {
      const date = new Date(Date.parse("2026-04-01T12:00:00Z") + i * DAY);
      names.add(moonState(date, SEOUL.latitude, SEOUL.longitude).phaseName);
    }
    expect(names.has("보름달")).toBe(true);
    expect(names.size).toBeGreaterThan(3);
  });
});
