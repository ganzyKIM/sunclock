import { buildSundialState, solarTermNameAt } from "./sundial";
import { toTraditionalTime } from "./time/traditional";

const SEOUL = { latitude: 37.5665, longitude: 126.978 };

function stateAt(iso: string, headingDegrees = 0, nightMode: "moon" | "wait" = "moon") {
  return buildSundialState({
    date: new Date(iso),
    latitude: SEOUL.latitude,
    longitude: SEOUL.longitude,
    headingDegrees,
    nightMode,
  });
}

describe("solarTermNameAt", () => {
  it("황경을 절기 이름으로 바꾼다", () => {
    expect(solarTermNameAt(0)).toBe("춘분");
    expect(solarTermNameAt(14)).toBe("춘분");
    expect(solarTermNameAt(90)).toBe("하지");
    expect(solarTermNameAt(271)).toBe("동지");
    expect(solarTermNameAt(359)).toBe("경칩");
  });
});

describe("buildSundialState", () => {
  it("낮에는 해 모드이고 그림자가 있다", () => {
    const state = stateAt("2026-06-21T03:30:00Z");
    expect(state.mode).toBe("sun");
    expect(state.shadow).not.toBeNull();
    expect(state.sun.altitude).toBeGreaterThan(0);
  });

  it("그림자가 원판 안에 있다", () => {
    const { shadow } = stateAt("2026-06-21T03:30:00Z");
    expect(Math.hypot(shadow!.x, shadow!.y)).toBeLessThanOrEqual(1.000001);
  });

  it("밤에 달 모드를 고르면 달 읽기를 낸다", () => {
    const state = stateAt("2026-06-21T15:00:00Z", 0, "moon");
    expect(state.mode).toBe("moon");
    expect(state.moonReading).not.toBeNull();
  });

  it("밤에 대기 모드를 고르면 그림자가 없다", () => {
    const state = stateAt("2026-06-21T15:00:00Z", 0, "wait");
    expect(state.mode).toBe("waiting");
    expect(state.shadow).toBeNull();
    expect(state.minutesUntilSunrise).not.toBeNull();
    expect(state.minutesUntilSunrise!).toBeGreaterThan(0);
  });

  it("낮에는 일출까지 남은 시간을 내지 않는다", () => {
    expect(stateAt("2026-06-21T03:30:00Z").minutesUntilSunrise).toBeNull();
  });

  it("반구를 오른쪽으로 돌리면 그림자가 화면에서 왼쪽으로 돈다", () => {
    const straight = stateAt("2026-06-21T03:30:00Z", 0).shadow!;
    const turned = stateAt("2026-06-21T03:30:00Z", 40).shadow!;
    const angleOf = (p: { x: number; y: number }) => Math.atan2(p.y, p.x);
    const delta = ((angleOf(turned) - angleOf(straight)) * 180) / Math.PI;
    // 화면은 아래쪽이 양수라 반구를 돌린 방향과 반대로 보인다.
    expect(((delta % 360) + 360) % 360).toBeCloseTo(320, 4);
  });

  it("서울의 표준시가 진태양시와 한 시간 넘게 벌어지지 않는다", () => {
    const state = stateAt("2026-06-21T03:30:00Z");
    const gap = state.standardMinutes - state.apparentMinutes;
    expect(Math.abs(gap)).toBeLessThan(60);
  });

  it("전통 시각과 진태양시가 서로 맞는다", () => {
    const state = stateAt("2026-06-21T03:00:00Z");
    expect(state.traditional.label).toBe(toTraditionalTime(state.apparentMinutes).label);
  });

  it("경도 보정이 서울에서 32분가량이다", () => {
    const state = stateAt("2026-06-21T03:30:00Z");
    expect(state.longitudeCorrection).toBeGreaterThan(32);
    expect(state.longitudeCorrection).toBeLessThan(32.2);
  });

  it("오늘의 절기 이름을 낸다", () => {
    // 하지는 6월 21일 낮에 들어서므로 그 전에는 아직 망종이다.
    expect(stateAt("2026-06-21T03:30:00Z").solarTermName).toBe("망종");
    expect(stateAt("2026-06-25T03:30:00Z").solarTermName).toBe("하지");
    expect(stateAt("2026-12-25T03:30:00Z").solarTermName).toBe("동지");
  });

  it("달빛이 약하면 그림자를 그리지 않고 알린다", () => {
    let found = false;
    for (let i = 0; i < 30 && !found; i += 1) {
      const date = new Date(Date.parse("2026-03-01T16:00:00Z") + i * 86400000);
      const state = buildSundialState({
        date,
        latitude: SEOUL.latitude,
        longitude: SEOUL.longitude,
        headingDegrees: 0,
        nightMode: "moon",
      });
      if (state.mode === "moon" && state.moonReading && !state.moonReading.shadowVisible) {
        expect(state.shadow).toBeNull();
        expect(state.notices.length).toBeGreaterThan(0);
        found = true;
      }
    }
    expect(found).toBe(true);
  });
});
