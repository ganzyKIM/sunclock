import { HANYANG_LATITUDE } from "./geometry";
import {
  buildFlatGeometry,
  flatLightDirection,
  flatPoint,
  INNER_RADIUS,
  OUTER_RADIUS,
  buildMoonPath,
  isMoonUp,
  radiusFor,
  rotateFlatPoint,
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

describe("rotateFlatPoint", () => {
  it("북쪽을 맞췄으면 그림자가 제자리에 있다", () => {
    const point = { x: 0.2, y: -0.5 };
    const turned = rotateFlatPoint(point, 0);
    expect(turned.x).toBeCloseTo(point.x, 9);
    expect(turned.y).toBeCloseTo(point.y, 9);
  });

  it("휴대폰을 동쪽으로 돌리면 북쪽이 왼쪽으로 간다", () => {
    // 화면 위쪽이 북쪽이다. 휴대폰 머리를 동쪽으로 돌리면 북쪽은 왼편에 선다.
    const north = rotateFlatPoint({ x: 0, y: -1 }, 90);
    expect(north.x).toBeCloseTo(-1, 9);
    expect(north.y).toBeCloseTo(0, 9);
  });

  it("반 바퀴 돌리면 정반대를 가리킨다", () => {
    const turned = rotateFlatPoint({ x: 0, y: -1 }, 180);
    expect(turned.x).toBeCloseTo(0, 9);
    expect(turned.y).toBeCloseTo(1, 9);
  });

  it("돌려도 가운데에서 떨어진 거리는 그대로다", () => {
    const point = { x: 0.31, y: -0.62 };
    for (const heading of [17, 73, 128, 249, 341]) {
      const turned = rotateFlatPoint(point, heading);
      expect(Math.hypot(turned.x, turned.y)).toBeCloseTo(
        Math.hypot(point.x, point.y),
        9
      );
    }
  });

  it("한 바퀴를 다 돌면 처음으로 돌아온다", () => {
    const point = { x: 0.4, y: 0.1 };
    const turned = rotateFlatPoint(point, 360);
    expect(turned.x).toBeCloseTo(point.x, 9);
    expect(turned.y).toBeCloseTo(point.y, 9);
  });
});

describe("펼친 원반의 달 이름", () => {
  it("주선마다 달로 읽을 이름을 함께 새긴다", () => {
    const majors = buildFlatGeometry(HANYANG_LATITUDE).hourLines.filter((l) => l.isMajor);
    expect(majors).toHaveLength(12);
    for (const line of majors) {
      expect(line.moonLabel).not.toBeNull();
      expect(line.moonLabel).not.toBe(line.label);
    }
  });

  it("달 이름은 해 이름에서 열두 시간 떨어져 있다", () => {
    const lines = buildFlatGeometry(HANYANG_LATITUDE).hourLines;
    const byMinutes = new Map(lines.map((l) => [l.apparentMinutes, l]));
    for (const line of lines) {
      if (!line.isMajor) continue;
      const opposite = byMinutes.get((line.apparentMinutes + 720) % 1440);
      expect(line.moonLabel).toBe(opposite?.label);
    }
  });

  it("주선이 아닌 선에는 붙이지 않는다", () => {
    const minors = buildFlatGeometry(HANYANG_LATITUDE).hourLines.filter((l) => !l.isMajor);
    expect(minors.every((l) => l.moonLabel === null)).toBe(true);
  });
});

describe("buildMoonPath", () => {
  it("달의 적위가 그 밤의 반지름을 정한다", () => {
    const path = buildMoonPath(HANYANG_LATITUDE, 10);
    expect(path.radius).toBeCloseTo(radiusFor(10), 9);
    expect(path.declination).toBe(10);
  });

  it("달이 해와 같은 적위면 그 절기선과 같은 자리를 지난다", () => {
    const arc = buildFlatGeometry(HANYANG_LATITUDE).termArcs[0];
    const path = buildMoonPath(HANYANG_LATITUDE, arc.declination);
    expect(path.radius).toBeCloseTo(arc.radius, 9);
    expect(path.halfDayAngle).toBeCloseTo(arc.halfDayAngle, 9);
  });

  it("해보다 남북으로 더 가면 절기선 밖이라고 알린다", () => {
    expect(buildMoonPath(HANYANG_LATITUDE, OBLIQUITY + 2).beyondTerms).toBe(true);
    expect(buildMoonPath(HANYANG_LATITUDE, 0).beyondTerms).toBe(false);
  });

  it("높이 뜬 달일수록 오래 떠 있다", () => {
    const high = buildMoonPath(HANYANG_LATITUDE, 20);
    const low = buildMoonPath(HANYANG_LATITUDE, -20);
    expect(high.halfDayAngle).toBeGreaterThan(low.halfDayAngle);
  });

  it("떠 있는 동안만 그 시각선을 읽을 수 있다", () => {
    const path = buildMoonPath(HANYANG_LATITUDE, 0);
    expect(isMoonUp(path, 0)).toBe(true);
    expect(isMoonUp(path, path.halfDayAngle - 1)).toBe(true);
    expect(isMoonUp(path, path.halfDayAngle + 1)).toBe(false);
    expect(isMoonUp(path, 180)).toBe(false);
  });

  it("아예 뜨지 않는 날은 어느 시각도 읽을 수 없다", () => {
    // 북극권에서 한겨울의 남쪽 적위. 하루 내내 지평선 아래에 있다.
    const path = buildMoonPath(80, -25);
    expect(path.halfDayAngle).toBe(0);
    expect(isMoonUp(path, 0)).toBe(false);
  });
});

describe("시가 갈리는 자리", () => {
  it("열둘이 한 바퀴를 고르게 나눈다", () => {
    const edges = geometry.hourLines.filter((line) => line.isBranchEdge);
    expect(edges).toHaveLength(12);
  });

  it("이름이 놓인 자리와 겹치지 않는다", () => {
    // 이름은 그 시의 한가운데에 있고 경계는 그 사이에 있다.
    for (const line of geometry.hourLines) {
      expect(line.isBranchEdge && line.isMajor).toBe(false);
    }
  });

  it("이름보다 한 시간 앞에서 그 시가 시작한다", () => {
    // 진시는 일곱 시에 시작해 아홉 시에 끝나고, 진이라는 이름은 여덟 시에 있다.
    const byMinutes = new Map(geometry.hourLines.map((l) => [l.apparentMinutes, l]));
    const dragonName = byMinutes.get(480);
    const dragonStart = byMinutes.get(420);
    expect(dragonName?.label).toBe("진");
    expect(dragonStart?.isBranchEdge).toBe(true);
    expect(dragonStart?.label).toBeNull();
  });
});

describe("빛이 놓이는 쪽", () => {
  it("영침을 사이에 두고 그림자의 정반대다", () => {
    // 빛과 영침과 그림자 끝이 한 줄에 서야 그림자가 왜 그쪽으로 뻗는지 보인다.
    for (const hourAngle of [-100, -45, 0, 30, 75]) {
      for (const declination of [-28, -10, 0, 23]) {
        for (const heading of [0, 40, 200]) {
          const tip = rotateFlatPoint(flatPoint(hourAngle, declination), heading);
          const light = flatLightDirection(hourAngle, heading);
          expect(light.x * tip.y - light.y * tip.x).toBeCloseTo(0, 9);
          expect(light.x * tip.x + light.y * tip.y).toBeLessThan(0);
        }
      }
    }
  });

  it("길이가 1이다", () => {
    const light = flatLightDirection(63, 17);
    expect(Math.hypot(light.x, light.y)).toBeCloseTo(1, 9);
  });

  it("남중한 빛은 아래쪽, 곧 남쪽에 있다", () => {
    const light = flatLightDirection(0, 0);
    expect(light.x).toBeCloseTo(0, 9);
    expect(light.y).toBeCloseTo(1, 9);
  });
});
