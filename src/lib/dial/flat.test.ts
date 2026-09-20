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
        expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(OUTER_RADIUS + 1e-9);
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

  it("여름 절기선 몇 개가 시각선 범위를 넘는다", () => {
    // 서울에서는 소만 무렵부터 해가 오전 5시 전에 뜬다.
    const beyond = geometry.termArcs.filter((a) => a.exceedsHourRange);
    expect(beyond).toHaveLength(3);
    for (const arc of beyond) expect(arc.declination).toBeGreaterThan(20);
    expect(beyond.some((a) => a.declination > 23)).toBe(true);
  });

  it("겨울 절기선은 시각선 범위 안에 든다", () => {
    for (const arc of geometry.termArcs.filter((a) => a.declination <= 0)) {
      expect(arc.exceedsHourRange).toBe(false);
    }
  });

  it("시각선이 29개이고 그중 7개가 주선이다", () => {
    expect(geometry.hourLines).toHaveLength(29);
    expect(geometry.hourLines.filter((l) => l.isMajor)).toHaveLength(7);
  });

  it("주선에만 이름이 붙는다", () => {
    expect(geometry.hourLines.filter((l) => l.label).map((l) => l.label)).toEqual([
      "묘", "진", "사", "오", "미", "신", "유",
    ]);
  });

  it("정오 시각선이 가장 길다. 어느 철에도 해가 떠 있기 때문이다", () => {
    const noon = geometry.hourLines.find((l) => l.apparentMinutes === 720)!;
    const earliest = geometry.hourLines.find((l) => l.apparentMinutes === 300)!;
    const lengthOf = (l: typeof noon) => Math.hypot(l.to.x - l.from.x, l.to.y - l.from.y);
    expect(lengthOf(noon)).toBeGreaterThan(lengthOf(earliest));
  });

  it("이른 시각선은 여름 쪽에만 남는다", () => {
    const earliest = geometry.hourLines.find((l) => l.apparentMinutes === 300)!;
    expect(Math.hypot(earliest.to.x, earliest.to.y)).toBeLessThan(radiusFor(15));
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
