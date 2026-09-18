import {
  formatClockTime,
  formatFriendlyTime,
  formatSignedMinutes,
  longitudeCorrectionMinutes,
  referenceLongitudeOf,
  standardMinutesFromApparent,
} from "./clock";

const KST_REFERENCE = 135;
const SEOUL_LONGITUDE = 126.978;

describe("longitudeCorrectionMinutes", () => {
  it("서울은 표준 자오선보다 32분가량 늦다", () => {
    const correction = longitudeCorrectionMinutes(SEOUL_LONGITUDE, KST_REFERENCE);
    expect(correction).toBeGreaterThan(32);
    expect(correction).toBeLessThan(32.2);
  });

  it("표준 자오선 위에서는 0이다", () => {
    expect(longitudeCorrectionMinutes(135, 135)).toBeCloseTo(0, 9);
  });
});

describe("standardMinutesFromApparent", () => {
  it("균시차와 경도를 함께 보정한다", () => {
    const result = standardMinutesFromApparent(720, 16.4, SEOUL_LONGITUDE, KST_REFERENCE);
    expect(result).toBeCloseTo(720 - 16.4 + 32.088, 2);
  });

  it("자정을 넘어가면 하루 안으로 접는다", () => {
    expect(standardMinutesFromApparent(1435, 0, 135, 135)).toBeCloseTo(1435, 6);
    expect(standardMinutesFromApparent(10, -30, 135, 135)).toBeCloseTo(40, 6);
    expect(standardMinutesFromApparent(10, 30, 135, 135)).toBeCloseTo(1420, 6);
  });
});

describe("referenceLongitudeOf", () => {
  it("시간대 차이를 경도로 바꾼다", () => {
    const date = new Date("2026-09-18T03:00:00Z");
    const expected = -date.getTimezoneOffset() / 4;
    expect(referenceLongitudeOf(date)).toBeCloseTo(expected, 9);
  });
});

describe("formatFriendlyTime", () => {
  it("때에 맞는 말을 앞에 붙인다", () => {
    expect(formatFriendlyTime(2 * 60 + 30)).toBe("새벽 2시 30분");
    expect(formatFriendlyTime(8 * 60 + 5)).toBe("아침 8시 5분");
    expect(formatFriendlyTime(12 * 60 + 15)).toBe("낮 12시 15분");
    expect(formatFriendlyTime(19 * 60)).toBe("저녁 7시 0분");
    expect(formatFriendlyTime(22 * 60 + 45)).toBe("밤 10시 45분");
  });

  it("자정은 밤 12시로 적는다", () => {
    expect(formatFriendlyTime(0)).toBe("밤 12시 0분");
  });
});

describe("formatClockTime", () => {
  it("두 자리로 맞춘다", () => {
    expect(formatClockTime(12 * 60 + 5)).toBe("12:05");
    expect(formatClockTime(0)).toBe("00:00");
    expect(formatClockTime(23 * 60 + 59)).toBe("23:59");
  });
});

describe("formatSignedMinutes", () => {
  it("부호를 말로 바꾼다", () => {
    expect(formatSignedMinutes(32)).toBe("32분 빠름");
    expect(formatSignedMinutes(-14)).toBe("14분 느림");
    expect(formatSignedMinutes(0)).toBe("차이 없음");
    expect(formatSignedMinutes(0.4)).toBe("차이 없음");
  });
});
