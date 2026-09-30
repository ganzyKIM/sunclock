import { solarElements } from "../astro/solar";
import { flatMinutesAt } from "../dial/reading";
import { widgetMomentAt } from "./moment";

const SEOUL = { latitude: 37.5796, longitude: 126.977 };
/** 한국 시각 낮 열두 시 반. */
const NOON = new Date("2026-09-30T03:30:00Z");
/** 한국 시각 밤 열두 시 반. */
const MIDNIGHT = new Date("2026-09-30T15:30:00Z");

describe("위젯이 보여 줄 순간", () => {
  it("낮에는 해그림자가 제 시각의 눈금에 선다", () => {
    const moment = widgetMomentAt(NOON, SEOUL.latitude, SEOUL.longitude);

    expect(moment.isDay).toBe(true);
    expect(moment.dialMinutes).toBeCloseTo(moment.apparentMinutes, 9);
    expect(flatMinutesAt(moment.tip)).toBeCloseTo(moment.dialMinutes, 6);
    // 한낮의 그림자는 원반 위쪽으로 뻗는다.
    expect(moment.tip.y).toBeLessThan(0);
    expect(moment.traditional.branchName).toBe("오");
    expect(moment.lightDeclination).toBeCloseTo(solarElements(NOON).declination, 9);
  });

  it("밤에는 보름달 자리의 그림자가 열두 시간 건너편 눈금에 선다", () => {
    const moment = widgetMomentAt(MIDNIGHT, SEOUL.latitude, SEOUL.longitude);

    expect(moment.isDay).toBe(false);
    expect(moment.dialMinutes).toBeCloseTo((moment.apparentMinutes + 720) % 1440, 9);
    expect(flatMinutesAt(moment.tip)).toBeCloseTo(moment.dialMinutes, 6);
    // 달그림자도 해그림자와 같은 위쪽 절반에 떨어진다.
    expect(moment.tip.y).toBeLessThan(0);
    // 읽는 시각은 눈금 자리가 아니라 실제 시각이다.
    expect(moment.traditional.branchName).toBe("자");
    expect(moment.lightDeclination).toBeCloseTo(-solarElements(MIDNIGHT).declination, 9);
  });

  it("보름달 자리는 해가 진 동안 내내 떠 있다", () => {
    const day = widgetMomentAt(NOON, SEOUL.latitude, SEOUL.longitude);
    const night = widgetMomentAt(MIDNIGHT, SEOUL.latitude, SEOUL.longitude);

    // 같은 날 낮의 길이와 밤의 길이를 더하면 한 바퀴다.
    expect(day.halfDayAngle + night.halfDayAngle).toBeCloseTo(180, 0);
  });

  it("절기 이름을 함께 알려 준다", () => {
    expect(widgetMomentAt(NOON, SEOUL.latitude, SEOUL.longitude).solarTermName).toBe("추분");
  });
});
