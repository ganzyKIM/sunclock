import {
  declinationOfSolarTerm,
  HOUR_LINE_END_MINUTES,
  HOUR_LINE_START_MINUTES,
  HOUR_LINE_STEP_MINUTES,
  majorHourLabel,
  MAJOR_HOUR_MINUTES,
  OBLIQUITY,
  SOLAR_TERM_GROUPS,
  SOLAR_TERMS,
} from "./constants";

describe("SOLAR_TERMS", () => {
  it("24개다", () => {
    expect(SOLAR_TERMS).toHaveLength(24);
  });

  it("15도 간격으로 황경이 늘어난다", () => {
    SOLAR_TERMS.forEach((term, index) => {
      expect(term.solarLongitude).toBe(index * 15);
    });
  });

  it("이름이 겹치지 않는다", () => {
    expect(new Set(SOLAR_TERMS.map((t) => t.name)).size).toBe(24);
  });

  it("춘분에서 시작해 하지와 동지를 담는다", () => {
    expect(SOLAR_TERMS[0].name).toBe("춘분");
    expect(SOLAR_TERMS.find((t) => t.name === "하지")?.solarLongitude).toBe(90);
    expect(SOLAR_TERMS.find((t) => t.name === "동지")?.solarLongitude).toBe(270);
  });
});

describe("declinationOfSolarTerm", () => {
  it("춘분과 추분은 0이다", () => {
    expect(declinationOfSolarTerm(SOLAR_TERMS[0])).toBeCloseTo(0, 9);
    expect(
      declinationOfSolarTerm(SOLAR_TERMS.find((t) => t.name === "추분")!)
    ).toBeCloseTo(0, 9);
  });

  it("하지는 황도 경사각과 같다", () => {
    expect(
      declinationOfSolarTerm(SOLAR_TERMS.find((t) => t.name === "하지")!)
    ).toBeCloseTo(OBLIQUITY, 9);
  });

  it("동지는 황도 경사각의 음수다", () => {
    expect(
      declinationOfSolarTerm(SOLAR_TERMS.find((t) => t.name === "동지")!)
    ).toBeCloseTo(-OBLIQUITY, 9);
  });
});

describe("SOLAR_TERM_GROUPS", () => {
  it("13개다", () => {
    expect(SOLAR_TERM_GROUPS).toHaveLength(13);
  });

  it("적위가 낮은 쪽부터 늘어선다", () => {
    for (let i = 1; i < SOLAR_TERM_GROUPS.length; i += 1) {
      expect(SOLAR_TERM_GROUPS[i].declination).toBeGreaterThan(
        SOLAR_TERM_GROUPS[i - 1].declination
      );
    }
  });

  it("동지와 하지만 홀로 쓰고 나머지는 둘씩 나눠 쓴다", () => {
    const alone = SOLAR_TERM_GROUPS.filter((g) => g.terms.length === 1);
    expect(alone).toHaveLength(2);
    expect(alone.map((g) => g.terms[0].name).sort()).toEqual(["동지", "하지"]);
    expect(SOLAR_TERM_GROUPS.filter((g) => g.terms.length === 2)).toHaveLength(11);
  });

  it("24절기를 빠짐없이 담는다", () => {
    const names = SOLAR_TERM_GROUPS.flatMap((g) => g.terms.map((t) => t.name));
    expect(new Set(names).size).toBe(24);
  });

  it("춘분과 추분이 한 선을 쓴다", () => {
    const group = SOLAR_TERM_GROUPS.find((g) => Math.abs(g.declination) < 1e-9);
    expect(group?.terms.map((t) => t.name).sort()).toEqual(["추분", "춘분"]);
    expect(group?.label).toBe("춘분 · 추분");
  });

  it("망종과 소서가 한 선을 쓴다", () => {
    const names = SOLAR_TERM_GROUPS.map((g) => g.terms.map((t) => t.name).sort().join(","));
    expect(names).toContain("망종,소서");
  });
});

describe("시각선 상수", () => {
  it("오전 5시부터 오후 7시까지 30분 간격이다", () => {
    expect(HOUR_LINE_START_MINUTES).toBe(300);
    expect(HOUR_LINE_END_MINUTES).toBe(1140);
    expect(HOUR_LINE_STEP_MINUTES).toBe(30);
  });

  it("주선은 일곱이고 두 시간 간격이다", () => {
    expect(MAJOR_HOUR_MINUTES).toEqual([360, 480, 600, 720, 840, 960, 1080]);
  });

  it("주선에만 이름을 붙인다", () => {
    expect(majorHourLabel(360)).toBe("묘");
    expect(majorHourLabel(720)).toBe("오");
    expect(majorHourLabel(1080)).toBe("유");
    expect(majorHourLabel(390)).toBeNull();
  });
});
