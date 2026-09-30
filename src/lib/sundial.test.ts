import { branchLabelAt } from "./dial/constants";
import { bowlLightDirection, leanBowlPoint } from "./dial/bowl-view";
import { DialPoint } from "./dial/projection";
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

/** 원반 위의 점이 놓인 시각. 각도를 그대로 되읽는다. */
function minutesAt(point: { x: number; y: number }): number {
  const angle = (Math.atan2(point.x, -point.y) * 180) / Math.PI;
  return (((angle + 180) * 4) % 1440 + 1440) % 1440;
}

/** 하루를 도는 두 시각의 차이. 자정을 가로질러도 짧은 쪽으로 잰다. */
function minutesApart(a: number, b: number): number {
  return Math.abs((((a - b + 720) % 1440) + 1440) % 1440 - 720);
}

describe("그림자가 선 자리와 적어 주는 시각", () => {

  it("그림자가 걸린 눈금의 이름이 적어 주는 12지와 같다", () => {
    // 이름은 그 시의 한가운데에 있다. 그래서 진초에는 그림자가 진보다
    // 왼쪽에 선다. 왼쪽에 서는 것이 맞는지를 각도로 되읽어 확인한다.
    for (const iso of [
      "2026-09-21T22:05:00Z",
      "2026-09-22T03:00:00Z",
      "2026-06-21T00:40:00Z",
      "2026-12-21T07:10:00Z",
    ]) {
      const state = buildSundialState({
        date: new Date(iso),
        latitude: 37.5665,
        longitude: 126.978,
        headingDegrees: 0,
        nightMode: "wait",
      });
      if (!state.flatTip) continue;
      expect(branchLabelAt(minutesAt(state.flatTip))).toBe(state.traditional.branchName);
    }
  });

  it("이름보다 앞에 서면 초, 뒤에 서면 정이다", () => {
    for (const iso of ["2026-09-21T22:05:00Z", "2026-09-22T02:20:00Z"]) {
      const state = buildSundialState({
        date: new Date(iso),
        latitude: 37.5665,
        longitude: 126.978,
        headingDegrees: 0,
        nightMode: "wait",
      });
      if (!state.flatTip) continue;
      const minutes = minutesAt(state.flatTip);
      const nameAt = Math.round(minutes / 120) * 120;
      const before = ((minutes - nameAt + 1440 + 60) % 120) - 60 < 0;
      expect(state.traditional.half).toBe(before ? "초" : "정");
    }
  });
});

describe("달시계의 두 그림자", () => {
  /** 달그림자가 실제로 지는 첫 밤을 찾는다. 보름 언저리의 어느 밤이다. */
  function moonShadowNight() {
    for (let i = 0; i < 40; i += 1) {
      const date = new Date(Date.parse("2026-06-25T15:00:00Z") + i * 86400000);
      const state = buildSundialState({
        date,
        latitude: SEOUL.latitude,
        longitude: SEOUL.longitude,
        headingDegrees: 0,
        nightMode: "moon",
      });
      if (state.mode === "moon" && state.flatTip && state.correctedFlatTip) return state;
    }
    throw new Error("달그림자가 지는 밤을 찾지 못했다");
  }

  it("보정한 그림자를 뒤집어 읽으면 곧 실제 시각이다", () => {
    const state = moonShadowNight();
    const read = minutesAt(state.correctedFlatTip!) + 720;
    expect(minutesApart(read, state.apparentMinutes)).toBeLessThan(0.01);
  });

  it("실제 달그림자를 뒤집고 보정치를 더하면 같은 시각이 된다", () => {
    const state = moonShadowNight();
    const read = minutesAt(state.flatTip!) + 720 + state.moonReading!.correctionMinutes;
    expect(minutesApart(read, state.apparentMinutes)).toBeLessThan(0.01);
    expect(minutesApart(read, state.moonReading!.correctedMinutes)).toBeLessThan(0.01);
  });

  it("보정한 그림자도 휴대폰이 향한 방위를 따라 돈다", () => {
    const straight = moonShadowNight();
    // 같은 밤을 방위만 바꿔 다시 만든다.
    const at = (heading: number) => {
      for (let i = 0; i < 40; i += 1) {
        const date = new Date(Date.parse("2026-06-25T15:00:00Z") + i * 86400000);
        const s = buildSundialState({
          date,
          latitude: SEOUL.latitude,
          longitude: SEOUL.longitude,
          headingDegrees: heading,
          nightMode: "moon",
        });
        if (s.mode === "moon" && s.correctedFlatTip) return s.correctedFlatTip;
      }
      throw new Error("없음");
    };
    const a = minutesAt(straight.correctedFlatTip!);
    const b = minutesAt(at(40));
    // 40도는 160분이다. 반구를 오른쪽으로 돌리면 그림자는 왼쪽으로 돈다.
    expect(minutesApart(b, a - 160)).toBeLessThan(0.01);
  });

  it("낮에는 보정한 그림자가 없다", () => {
    const state = stateAt("2026-06-21T03:30:00Z");
    expect(state.correctedShadow).toBeNull();
    expect(state.correctedFlatTip).toBeNull();
    expect(state.correctedLight).toBeNull();
  });
});

describe("보름달 자리가 뜨기 전의 보정한 그림자", () => {
  it("반구에서는 테두리에 걸리고, 원반에서는 그대로 있다", () => {
    // 2026년 9월 22일 저녁. 달은 떠 있지만 보름달 자리는 아직 지평선 아래다.
    const state = stateAt("2026-09-22T10:08:00Z", 0, "moon");
    expect(state.mode).toBe("moon");
    expect(state.correctedLight!.altitude).toBeLessThan(0);
    expect(state.correctedShadow).not.toBeNull();
    expect(Math.hypot(state.correctedShadow!.x, state.correctedShadow!.y)).toBeCloseTo(1, 3);
    expect(state.correctedFlatTip).not.toBeNull();
  });
});

describe("빛과 영침과 그림자가 한 줄에 선다", () => {
  /** 두 방향이 가운데를 사이에 두고 정반대인지. */
  function expectOpposite(light: DialPoint, tip: DialPoint) {
    const length = Math.hypot(tip.x, tip.y);
    expect(length).toBeGreaterThan(0);
    expect((light.x * tip.y - light.y * tip.x) / length).toBeCloseTo(0, 9);
    expect(light.x * tip.x + light.y * tip.y).toBeLessThan(0);
  }

  /** 달그림자가 실제로 지는 밤. 휴대폰이 향한 방위를 바꿔 볼 수 있다. */
  function moonShadowNight(headingDegrees: number) {
    for (let i = 0; i < 40; i += 1) {
      const state = buildSundialState({
        date: new Date(Date.parse("2026-06-25T13:30:00Z") + i * 86400000),
        latitude: SEOUL.latitude,
        longitude: SEOUL.longitude,
        headingDegrees,
        nightMode: "moon",
      });
      if (state.mode === "moon" && state.flatTip && state.shadow) return state;
    }
    throw new Error("달그림자가 지는 밤을 찾지 못했다");
  }

  it("펼친 원반에서 달과 영침과 실제 달그림자가 한 줄이다", () => {
    // 달 표시를 방위로 놓고 그림자를 시간각으로 놓으면 서로 어긋난다.
    for (const heading of [0, 35, 250]) {
      const state = moonShadowNight(heading);
      expectOpposite(state.flatMoonSide, state.flatTip!);
    }
  });

  it("펼친 원반에서 해와 영침과 해그림자가 한 줄이다", () => {
    for (const iso of ["2026-06-21T00:30:00Z", "2026-09-30T06:40:00Z", "2026-12-21T02:10:00Z"]) {
      for (const heading of [0, 35]) {
        const state = stateAt(iso, heading);
        expect(state.mode).toBe("sun");
        expectOpposite(state.flatSunSide, state.flatTip!);
      }
    }
  });

  it("반구에서 달과 영침 끝과 실제 달그림자 끝이 한 줄이다", () => {
    // 반구는 눌러서 비스듬히 보인다. 달을 누르지 않은 방위에 놓으면 몇 도 어긋난다.
    for (const heading of [0, 35, 250]) {
      const state = moonShadowNight(heading);
      const moon = bowlLightDirection(
        state.moon.position.altitude,
        state.moon.position.azimuth,
        heading
      );
      expectOpposite(moon, leanBowlPoint(state.shadow!));
    }
  });

  it("반구에서 해와 영침 끝과 해그림자 끝이 한 줄이다", () => {
    for (const iso of ["2026-06-21T00:30:00Z", "2026-09-30T06:40:00Z", "2026-12-21T02:10:00Z"]) {
      for (const heading of [0, 35]) {
        const state = stateAt(iso, heading);
        const sun = bowlLightDirection(state.sun.altitude, state.sun.azimuth, heading);
        expectOpposite(sun, leanBowlPoint(state.shadow!));
      }
    }
  });
});
