import {
  BOWL_PERSPECTIVE,
  BOWL_SQUASH,
  bowlLightDirection,
  bowlOutline,
  leanBowlGeometry,
  leanBowlPoint,
} from "./bowl-view";
import { buildDialGeometry, HANYANG_LATITUDE } from "./geometry";

describe("leanBowlPoint", () => {
  it("가운데는 움직이지 않는다", () => {
    expect(leanBowlPoint({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });

  it("위아래로 눌러 그릇처럼 보이게 한다", () => {
    expect(leanBowlPoint({ x: 0, y: 1 }).y).toBeCloseTo(BOWL_SQUASH, 9);
    expect(leanBowlPoint({ x: 0, y: -1 }).y).toBeCloseTo(-BOWL_SQUASH, 9);
  });

  it("먼 쪽을 가까운 쪽보다 좁게 만든다", () => {
    // 화면 위쪽이 먼 쪽이다. 거기가 좁아야 비스듬히 본 것처럼 보인다.
    const far = leanBowlPoint({ x: 1, y: -1 }).x;
    const near = leanBowlPoint({ x: 1, y: 1 }).x;
    expect(far).toBeLessThan(near);
    expect(far).toBeCloseTo(1 - BOWL_PERSPECTIVE, 9);
    expect(near).toBeCloseTo(1 + BOWL_PERSPECTIVE, 9);
  });

  it("두 자리가 한자리로 겹치지 않는다", () => {
    // 겹치면 그 시각의 눈금을 영영 읽을 수 없다. 그래서 눌러 보이기만 한다.
    const seen = new Set<string>();
    for (let i = -10; i <= 10; i += 1) {
      for (let j = -10; j <= 10; j += 1) {
        const from = { x: i / 10, y: j / 10 };
        if (Math.hypot(from.x, from.y) > 1) continue;
        const to = leanBowlPoint(from);
        const key = `${to.x.toFixed(6)},${to.y.toFixed(6)}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
  });

  it("좁히는 정도가 1을 넘지 않는다", () => {
    // 1을 넘으면 아래쪽 어딘가에서 좌우가 뒤집혀 눈금이 접힌다.
    expect(BOWL_PERSPECTIVE).toBeLessThan(1);
    expect(BOWL_PERSPECTIVE).toBeGreaterThan(0);
  });
});

describe("leanBowlGeometry", () => {
  const geometry = buildDialGeometry(HANYANG_LATITUDE);
  const leaned = leanBowlGeometry(geometry);

  it("눈금의 모든 점을 함께 옮긴다", () => {
    expect(leaned.latitude).toBe(geometry.latitude);
    expect(leaned.hourLines).toHaveLength(geometry.hourLines.length);
    expect(leaned.solarTermLines).toHaveLength(geometry.solarTermLines.length);
    expect(leaned.hourLines[0].points[0]).toEqual(
      leanBowlPoint(geometry.hourLines[0].points[0])
    );
    expect(leaned.gnomonRoot).toEqual(leanBowlPoint(geometry.gnomonRoot));
  });

  it("시각선 범위 표시는 그대로 지킨다", () => {
    expect(leaned.solarTermLines[0].points.map((p) => p.insideHourRange)).toEqual(
      geometry.solarTermLines[0].points.map((p) => p.insideHourRange)
    );
  });

  it("눈금이 테두리 밖으로 나가지 않는다", () => {
    for (const line of leaned.hourLines) {
      for (const point of line.points) {
        expect(Math.abs(point.x)).toBeLessThanOrEqual(1 + BOWL_PERSPECTIVE + 1e-9);
        expect(Math.abs(point.y)).toBeLessThanOrEqual(BOWL_SQUASH + 1e-9);
      }
    }
  });
});

describe("bowlOutline", () => {
  it("닫힌 테두리를 점으로 내어 준다", () => {
    const outline = bowlOutline(48);
    expect(outline).toHaveLength(48);
    expect(outline[0]).toEqual(leanBowlPoint({ x: 1, y: 0 }));
  });

  it("아래쪽이 위쪽보다 넓다", () => {
    const outline = bowlOutline(96);
    const widestBelow = Math.max(...outline.filter((p) => p.y > 0).map((p) => p.x));
    const widestAbove = Math.max(...outline.filter((p) => p.y < 0).map((p) => p.x));
    expect(widestBelow).toBeGreaterThan(widestAbove);
  });
});

describe("bowlLightDirection", () => {
  it("길이가 1이다", () => {
    const light = bowlLightDirection(35, 120, 20);
    expect(Math.hypot(light.x, light.y)).toBeCloseTo(1, 9);
  });

  it("동쪽 지평선의 빛은 오른쪽에 있다", () => {
    const light = bowlLightDirection(0, 90, 0);
    expect(light.x).toBeCloseTo(1, 9);
    expect(light.y).toBeCloseTo(0, 9);
  });

  it("천정의 빛은 그림자에 방향이 없으므로 방위를 따른다", () => {
    const light = bowlLightDirection(90, 90, 0);
    expect(light.x).toBeCloseTo(1, 9);
    expect(light.y).toBeCloseTo(0, 9);
  });
});
