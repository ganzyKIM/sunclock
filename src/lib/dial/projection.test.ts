import {
  rodShadowToRim,
  directionVector,
  gnomonRootPoint,
  isInsideBowl,
  projectToDial,
  rotateToDialFrame,
  shadowPoint,
  southRimDistanceInDiameters,
} from "./projection";

const HANYANG_LATITUDE = 37 + 39 / 60 + 15 / 3600;

describe("directionVector", () => {
  it("천정은 위쪽 단위벡터다", () => {
    const v = directionVector(90, 0);
    expect(v.x).toBeCloseTo(0, 9);
    expect(v.y).toBeCloseTo(0, 9);
    expect(v.z).toBeCloseTo(1, 9);
  });

  it("정북 지평선은 북쪽 단위벡터다", () => {
    const v = directionVector(0, 0);
    expect(v.x).toBeCloseTo(0, 9);
    expect(v.y).toBeCloseTo(1, 9);
    expect(v.z).toBeCloseTo(0, 9);
  });

  it("정동 지평선은 동쪽 단위벡터다", () => {
    const v = directionVector(0, 90);
    expect(v.x).toBeCloseTo(1, 9);
    expect(v.y).toBeCloseTo(0, 9);
    expect(v.z).toBeCloseTo(0, 9);
  });
});

describe("rotateToDialFrame", () => {
  it("방위가 0이면 그대로 둔다", () => {
    const v = rotateToDialFrame(directionVector(0, 0), 0);
    expect(v.y).toBeCloseTo(1, 9);
  });

  it("반구를 동쪽으로 돌리면 북쪽이 왼쪽으로 간다", () => {
    const v = rotateToDialFrame(directionVector(0, 0), 90);
    expect(v.x).toBeCloseTo(-1, 9);
    expect(v.y).toBeCloseTo(0, 9);
  });

  it("높이를 바꾸지 않는다", () => {
    const v = rotateToDialFrame(directionVector(30, 120), 47);
    expect(v.z).toBeCloseTo(Math.sin((30 * Math.PI) / 180), 9);
  });
});

describe("projectToDial", () => {
  it("북쪽은 화면 위쪽이다", () => {
    const p = projectToDial(directionVector(0, 0));
    expect(p.x).toBeCloseTo(0, 9);
    expect(p.y).toBeCloseTo(-1, 9);
  });

  it("남쪽은 화면 아래쪽이다", () => {
    const p = projectToDial(directionVector(0, 180));
    expect(p.y).toBeCloseTo(1, 9);
  });

  it("동쪽은 화면 오른쪽이다", () => {
    const p = projectToDial(directionVector(0, 90));
    expect(p.x).toBeCloseTo(1, 9);
  });

  it("바닥은 원판 중심이다", () => {
    const p = projectToDial(directionVector(-90, 0));
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(0, 9);
  });
});

describe("isInsideBowl", () => {
  it("지평선 아래를 향한 방향만 반구 안이다", () => {
    expect(isInsideBowl(directionVector(-10, 0))).toBe(true);
    expect(isInsideBowl(directionVector(10, 0))).toBe(false);
  });
});

describe("shadowPoint", () => {
  it("해가 동쪽 지평선에 있으면 그림자가 서쪽 가장자리에 닿는다", () => {
    const p = shadowPoint(0, 90, 0);
    expect(p.x).toBeCloseTo(-1, 6);
    expect(p.y).toBeCloseTo(0, 6);
  });

  it("해가 머리 위에 있으면 그림자가 중심에 모인다", () => {
    const p = shadowPoint(90, 180, 0);
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(0, 6);
  });

  it("해가 남쪽에 있으면 그림자가 북쪽으로 뻗는다", () => {
    const p = shadowPoint(50, 180, 0);
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.y).toBeLessThan(0);
  });

  it("중심에서의 거리가 고도의 코사인이다", () => {
    const p = shadowPoint(30, 140, 0);
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(Math.cos((30 * Math.PI) / 180), 9);
  });

  it("반구를 돌리면 그림자가 같은 각도만큼 반대로 돈다", () => {
    const straight = shadowPoint(20, 100, 0);
    const turned = shadowPoint(20, 130, 30);
    expect(turned.x).toBeCloseTo(straight.x, 9);
    expect(turned.y).toBeCloseTo(straight.y, 9);
  });
});

describe("gnomonRootPoint", () => {
  it("한양 위도에서 남쪽 가장자리로부터 지름의 0.104만큼 떨어진다", () => {
    const point = gnomonRootPoint(HANYANG_LATITUDE);
    expect(southRimDistanceInDiameters(point)).toBeCloseTo(0.1045, 3);
  });

  it("자오선 위에 있다", () => {
    expect(gnomonRootPoint(HANYANG_LATITUDE).x).toBeCloseTo(0, 9);
  });
});

describe("southRimDistanceInDiameters", () => {
  it("남쪽 가장자리가 0이고 북쪽 가장자리가 1이다", () => {
    expect(southRimDistanceInDiameters({ x: 0, y: 1 })).toBeCloseTo(0, 9);
    expect(southRimDistanceInDiameters({ x: 0, y: -1 })).toBeCloseTo(1, 9);
  });
});

import { horizonDirection, rodShadowPoints, scalePoint } from "./projection";

describe("rodShadowPoints", () => {
  const latitude = 37.653;

  it("첫 점이 영침 뿌리이고 끝 점이 그림자 끝이다", () => {
    const points = rodShadowPoints(latitude, 40, 200, 0);
    const root = gnomonRootPoint(latitude);
    const tip = shadowPoint(40, 200, 0);
    expect(points[0].x).toBeCloseTo(root.x, 9);
    expect(points[0].y).toBeCloseTo(root.y, 9);
    expect(points[points.length - 1].x).toBeCloseTo(tip.x, 9);
    expect(points[points.length - 1].y).toBeCloseTo(tip.y, 9);
  });

  it("표본 수만큼 점을 낸다", () => {
    expect(rodShadowPoints(latitude, 40, 200, 0, 16)).toHaveLength(16);
  });

  it("모든 점이 원판 안에 있다", () => {
    for (const point of rodShadowPoints(latitude, 12, 95, 0, 40)) {
      expect(Math.hypot(point.x, point.y)).toBeLessThanOrEqual(1.000001);
    }
  });

  it("정오에는 자오선 위의 곧은 선이 된다", () => {
    for (const point of rodShadowPoints(latitude, 52.35, 180, 0, 20)) {
      expect(Math.abs(point.x)).toBeLessThan(1e-9);
    }
  });

  it("반구를 돌리면 함께 돈다", () => {
    const straight = rodShadowPoints(latitude, 30, 150, 0, 8);
    const turned = rodShadowPoints(latitude, 30, 180, 30, 8);
    straight.forEach((point, index) => {
      expect(turned[index].x).toBeCloseTo(point.x, 9);
      expect(turned[index].y).toBeCloseTo(point.y, 9);
    });
  });
});

describe("scalePoint", () => {
  it("반지름을 곱한다", () => {
    expect(scalePoint({ x: 0.5, y: -0.25 }, 120)).toEqual({ x: 60, y: -30 });
  });
});

describe("horizonDirection", () => {
  it("북쪽은 위쪽이다", () => {
    const d = horizonDirection(0, 0);
    expect(d.x).toBeCloseTo(0, 9);
    expect(d.y).toBeCloseTo(-1, 9);
  });

  it("동쪽은 오른쪽이다", () => {
    expect(horizonDirection(90, 0).x).toBeCloseTo(1, 9);
  });

  it("반구를 돌리면 함께 돈다", () => {
    const a = horizonDirection(120, 0);
    const b = horizonDirection(150, 30);
    expect(b.x).toBeCloseTo(a.x, 9);
    expect(b.y).toBeCloseTo(a.y, 9);
  });

  it("언제나 단위 길이다", () => {
    for (const azimuth of [0, 37, 180, 300]) {
      const d = horizonDirection(azimuth, 17);
      expect(Math.hypot(d.x, d.y)).toBeCloseTo(1, 9);
    }
  });
});

describe("rodShadowToRim", () => {
  const LAT = 37.5;

  it("광원이 떠 있으면 보통 그림자 띠와 같다", () => {
    const usual = rodShadowPoints(LAT, 30, 200, 0);
    const clipped = rodShadowToRim(LAT, 30, 200, 0);
    expect(clipped).toHaveLength(usual.length);
    clipped.forEach((p, i) => {
      expect(p.x).toBeCloseTo(usual[i].x, 9);
      expect(p.y).toBeCloseTo(usual[i].y, 9);
    });
  });

  it("광원이 지평선 아래면 테두리에서 끊는다", () => {
    const band = rodShadowToRim(LAT, -5, 110, 0);
    expect(band.length).toBeGreaterThan(1);
    const last = band[band.length - 1];
    expect(Math.hypot(last.x, last.y)).toBeCloseTo(1, 4);
    band.forEach((p) => expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(1.0001));
  });

  it("테두리에 걸린 자리는 그 시각선의 방향에 있다", () => {
    // 동남쪽 아래의 광원은 서북쪽 테두리를 가리킨다.
    const last = rodShadowToRim(LAT, -5, 110, 0).at(-1)!;
    expect(last.x).toBeLessThan(0);
    expect(last.y).toBeLessThan(0);
  });
});
