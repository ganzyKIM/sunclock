import { HANYANG_LATITUDE } from "./geometry";
import {
  buildFlatGeometry,
  flatPoint,
  INNER_RADIUS,
  OUTER_RADIUS,
  radiusFor,
} from "./flat";
import { OBLIQUITY } from "./constants";

const geometry = buildFlatGeometry(HANYANG_LATITUDE);

describe("radiusFor", () => {
  it("하지가 가장 안쪽이고 동지가 가장 바깥이다", () => {
    expect(radiusFor(OBLIQUITY)).toBeCloseTo(INNER_RADIUS, 9);
    expect(radiusFor(-OBLIQUITY)).toBeCloseTo(OUTER_RADIUS, 9);
  });

  it("적위가 낮아질수록 바깥으로 간다", () => {
    expect(radiusFor(10)).toBeLessThan(radiusFor(0));
    expect(radiusFor(0)).toBeLessThan(radiusFor(-10));
  });

  it("춘추분이 가운데 자리다", () => {
    expect(radiusFor(0)).toBeCloseTo((INNER_RADIUS + OUTER_RADIUS) / 2, 9);
  });

  it("눈금을 벗어난 적위는 안팎 끝에 붙인다", () => {
    // 달은 태양보다 남북으로 넓게 움직인다.
    expect(radiusFor(28)).toBeCloseTo(INNER_RADIUS, 9);
    expect(radiusFor(-28)).toBeCloseTo(OUTER_RADIUS, 9);
  });
});

describe("flatPoint", () => {
  it("정오는 위쪽이다", () => {
    const p = flatPoint(0, 0);
    expect(p.x).toBeCloseTo(0, 9);
    expect(p.y).toBeLessThan(0);
  });

  it("저녁 여섯시는 오른쪽이다", () => {
    const p = flatPoint(90, 0);
    expect(p.x).toBeGreaterThan(0);
    expect(p.y).toBeCloseTo(0, 9);
  });

  it("아침 여섯시는 왼쪽이다", () => {
    const p = flatPoint(-90, 0);
    expect(p.x).toBeLessThan(0);
    expect(p.y).toBeCloseTo(0, 9);
  });

  it("시간이 흐를수록 시계 방향으로 돈다", () => {
    const morning = flatPoint(-45, 0);
    const noon = flatPoint(0, 0);
    const evening = flatPoint(45, 0);
    expect(morning.x).toBeLessThan(noon.x);
    expect(noon.x).toBeLessThan(evening.x);
  });

  it("중심에서의 거리가 적위로만 정해진다", () => {
    for (const h of [-100, -30, 0, 55, 100]) {
      expect(Math.hypot(...Object.values(flatPoint(h, 12)))).toBeCloseTo(radiusFor(12), 9);
    }
  });
});

describe("buildFlatGeometry", () => {
  it("절기선이 13개다", () => {
    expect(geometry.termArcs).toHaveLength(13);
  });

  it("절기선이 안쪽부터 바깥으로 늘어선다", () => {
    for (let i = 1; i < geometry.termArcs.length; i += 1) {
      expect(geometry.termArcs[i].radius).toBeLessThan(geometry.termArcs[i - 1].radius);
    }
  });

  it("모든 눈금이 원반 안에 있다", () => {
    for (const arc of geometry.termArcs) {
      expect(arc.radius).toBeGreaterThanOrEqual(INNER_RADIUS - 1e-9);
      expect(arc.radius).toBeLessThanOrEqual(OUTER_RADIUS + 1e-9);
    }
    for (const line of geometry.hourLines) {
      for (const p of [line.from, line.to]) {
        const d = Math.hypot(p.x, p.y);
        expect(d).toBeGreaterThanOrEqual(INNER_RADIUS - 1e-9);
        expect(d).toBeLessThanOrEqual(OUTER_RADIUS + 1e-9);
      }
    }
  });

  it("여름 절기선이 겨울보다 길다. 낮이 길기 때문이다", () => {
    const summer = geometry.termArcs.find((a) => a.declination > 23)!;
    const winter = geometry.termArcs.find((a) => a.declination < -23)!;
    expect(summer.halfDayAngle).toBeGreaterThan(winter.halfDayAngle);
    expect(summer.halfDayAngle).toBeGreaterThan(109);
    expect(winter.halfDayAngle).toBeLessThan(71);
  });

  it("춘추분에는 낮이 정확히 반이다", () => {
    const equinox = geometry.termArcs.find((a) => Math.abs(a.declination) < 0.01)!;
    expect(equinox.halfDayAngle).toBeCloseTo(90, 6);
  });

  it("열두 시 이름이 한 바퀴 돈다", () => {
    const labels = geometry.hourLines.filter((l) => l.label).map((l) => l.label);
    expect(labels).toEqual(["자","축","인","묘","진","사","오","미","신","유","술","해"]);
  });

  it("자시 정은 아래쪽이고 오시 정은 위쪽이다", () => {
    const midnight = geometry.hourLines.find((l) => l.apparentMinutes === 0)!;
    const noon = geometry.hourLines.find((l) => l.apparentMinutes === 720)!;
    expect(midnight.to.y).toBeGreaterThan(0);
    expect(noon.to.y).toBeLessThan(0);
  });

  it("한밤중 시각선에는 해가 떠 있을 구간이 없다", () => {
    const midnight = geometry.hourLines.find((l) => l.apparentMinutes === 0)!;
    expect(midnight.daylight).toBeNull();
  });

  it("정오 시각선은 어느 철에도 해가 떠 있다", () => {
    const noon = geometry.hourLines.find((l) => l.apparentMinutes === 720)!;
    expect(noon.daylight).not.toBeNull();
  });

  it("시각선이 하루를 30분마다 한 바퀴 덮는다", () => {
    expect(geometry.hourLines).toHaveLength(48);
    expect(geometry.hourLines.filter((l) => l.isMajor)).toHaveLength(12);
  });

  it("낮 구간은 정오가 가장 길고 이른 아침은 짧다", () => {
    const noon = geometry.hourLines.find((l) => l.apparentMinutes === 720)!;
    const early = geometry.hourLines.find((l) => l.apparentMinutes === 300)!;
    const span = (l: typeof noon) =>
      l.daylight ? Math.hypot(l.daylight.to.x - l.daylight.from.x, l.daylight.to.y - l.daylight.from.y) : 0;
    expect(span(noon)).toBeGreaterThan(span(early));
    expect(span(early)).toBeGreaterThan(0);
  });

  it("이른 시각선의 낮 구간은 여름 쪽에만 남는다", () => {
    const early = geometry.hourLines.find((l) => l.apparentMinutes === 300)!;
    expect(Math.hypot(early.daylight!.to.x, early.daylight!.to.y)).toBeLessThan(radiusFor(15));
  });

  it("눈금의 자리는 위도와 무관하다. 달라지는 것은 낮의 길이뿐이다", () => {
    const jeju = buildFlatGeometry(33.5);
    geometry.termArcs.forEach((arc, i) => {
      expect(jeju.termArcs[i].radius).toBeCloseTo(arc.radius, 9);
    });
    const seoulSummer = geometry.termArcs.find((a) => a.declination > 23)!;
    const jejuSummer = jeju.termArcs.find((a) => a.declination > 23)!;
    expect(jejuSummer.halfDayAngle).toBeLessThan(seoulSummer.halfDayAngle);
  });
});
