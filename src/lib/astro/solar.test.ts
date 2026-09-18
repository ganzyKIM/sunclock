import * as Astronomy from "astronomy-engine";
import {
  apparentSolarMinutes,
  horizonHourAngle,
  horizontalFromEquatorial,
  hourAngle,
  solarElements,
  sunPosition,
} from "./solar";

const SEOUL = { latitude: 37.5665, longitude: 126.978 };

describe("solarElements", () => {
  it("춘분에 적위가 0에 가깝다", () => {
    const { declination } = solarElements(new Date("2026-03-20T14:46:00Z"));
    expect(Math.abs(declination)).toBeLessThan(0.1);
  });

  it("하지에 적위가 가장 크다", () => {
    const { declination } = solarElements(new Date("2026-06-21T12:00:00Z"));
    expect(declination).toBeGreaterThan(23.3);
    expect(declination).toBeLessThan(23.5);
  });

  it("동지에 적위가 가장 작다", () => {
    const { declination } = solarElements(new Date("2026-12-21T12:00:00Z"));
    expect(declination).toBeLessThan(-23.3);
    expect(declination).toBeGreaterThan(-23.5);
  });

  it("11월 초에 균시차가 16분 남짓 앞선다", () => {
    const { equationOfTime } = solarElements(new Date("2026-11-03T03:00:00Z"));
    expect(equationOfTime).toBeGreaterThan(16);
    expect(equationOfTime).toBeLessThan(16.6);
  });

  it("2월 중순에 균시차가 14분 남짓 뒤진다", () => {
    const { equationOfTime } = solarElements(new Date("2026-02-11T03:00:00Z"));
    expect(equationOfTime).toBeLessThan(-14);
    expect(equationOfTime).toBeGreaterThan(-14.4);
  });

  it("적위가 기준 구현과 0.15도 안에서 맞는다", () => {
    const observer = new Astronomy.Observer(SEOUL.latitude, SEOUL.longitude, 0);
    for (const iso of [
      "2026-01-15T03:00:00Z",
      "2026-04-05T21:00:00Z",
      "2026-07-22T06:30:00Z",
      "2026-10-09T23:15:00Z",
    ]) {
      const date = new Date(iso);
      const expected = Astronomy.Equator(Astronomy.Body.Sun, date, observer, true, true).dec;
      expect(solarElements(date).declination).toBeCloseTo(expected, 1);
    }
  });
});

describe("hourAngle", () => {
  it("진태양시 정오에 0이다", () => {
    const date = new Date("2026-06-21T03:00:00Z");
    const minutes = apparentSolarMinutes(date, SEOUL.longitude);
    const noon = new Date(date.getTime() + (720 - minutes) * 60000);
    expect(hourAngle(noon, SEOUL.longitude)).toBeCloseTo(0, 2);
  });

  it("기준 구현과 0.15도 안에서 맞는다", () => {
    const observer = new Astronomy.Observer(SEOUL.latitude, SEOUL.longitude, 0);
    for (const iso of [
      "2026-01-15T03:00:00Z",
      "2026-04-05T01:00:00Z",
      "2026-07-22T06:30:00Z",
      "2026-10-09T23:15:00Z",
    ]) {
      const date = new Date(iso);
      const expectedHours = Astronomy.HourAngle(Astronomy.Body.Sun, date, observer);
      let expected = expectedHours * 15;
      if (expected >= 180) expected -= 360;
      expect(hourAngle(date, SEOUL.longitude)).toBeCloseTo(expected, 1);
    }
  });
});

describe("horizontalFromEquatorial", () => {
  const latitude = 37.653;

  it("춘분 남중에 고도가 90도에서 위도를 뺀 값이다", () => {
    const { altitude, azimuth } = horizontalFromEquatorial(0, 0, latitude);
    expect(altitude).toBeCloseTo(90 - latitude, 6);
    expect(azimuth).toBeCloseTo(180, 6);
  });

  it("하지 남중에 고도가 가장 높다", () => {
    const { altitude, azimuth } = horizontalFromEquatorial(0, 23.44, latitude);
    expect(altitude).toBeCloseTo(90 - latitude + 23.44, 6);
    expect(azimuth).toBeCloseTo(180, 6);
  });

  it("춘분 아침 여섯시에 정동쪽 지평선에 있다", () => {
    const { altitude, azimuth } = horizontalFromEquatorial(-90, 0, latitude);
    expect(altitude).toBeCloseTo(0, 6);
    expect(azimuth).toBeCloseTo(90, 6);
  });

  it("춘분 저녁 여섯시에 정서쪽 지평선에 있다", () => {
    const { altitude, azimuth } = horizontalFromEquatorial(90, 0, latitude);
    expect(altitude).toBeCloseTo(0, 6);
    expect(azimuth).toBeCloseTo(270, 6);
  });
});

describe("sunPosition", () => {
  it("서울의 여름 낮에 해가 높이 떠 있다", () => {
    const { altitude } = sunPosition(
      new Date("2026-06-21T03:30:00Z"),
      SEOUL.latitude,
      SEOUL.longitude
    );
    expect(altitude).toBeGreaterThan(70);
  });

  it("한밤중에 해가 지평선 아래에 있다", () => {
    const { altitude } = sunPosition(
      new Date("2026-06-21T15:00:00Z"),
      SEOUL.latitude,
      SEOUL.longitude
    );
    expect(altitude).toBeLessThan(0);
  });
});

describe("horizonHourAngle", () => {
  it("춘분에는 위도와 상관없이 90도다", () => {
    expect(horizonHourAngle(37.653, 0)).toBeCloseTo(90, 6);
    expect(horizonHourAngle(10, 0)).toBeCloseTo(90, 6);
  });

  it("서울의 하지에는 90도보다 크다", () => {
    expect(horizonHourAngle(37.653, 23.44)).toBeGreaterThan(109);
    expect(horizonHourAngle(37.653, 23.44)).toBeLessThan(110);
  });

  it("백야에는 180도가 된다", () => {
    expect(horizonHourAngle(70, 23.44)).toBe(180);
  });

  it("극야에는 0도가 된다", () => {
    expect(horizonHourAngle(70, -23.44)).toBe(0);
  });
});

describe("solarElements의 황경", () => {
  it("춘분에 0에 가깝다", () => {
    const { apparentLongitude } = solarElements(new Date("2026-03-20T14:46:00Z"));
    expect(Math.min(apparentLongitude, 360 - apparentLongitude)).toBeLessThan(0.2);
  });

  it("하지에 90도에 가깝다", () => {
    const { apparentLongitude } = solarElements(new Date("2026-06-21T08:25:00Z"));
    expect(apparentLongitude).toBeGreaterThan(89.5);
    expect(apparentLongitude).toBeLessThan(90.5);
  });

  it("0 이상 360 미만이다", () => {
    for (const iso of ["2026-01-01T00:00:00Z", "2026-08-01T00:00:00Z"]) {
      const { apparentLongitude } = solarElements(new Date(iso));
      expect(apparentLongitude).toBeGreaterThanOrEqual(0);
      expect(apparentLongitude).toBeLessThan(360);
    }
  });
});
