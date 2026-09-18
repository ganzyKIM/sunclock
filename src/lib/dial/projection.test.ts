import {
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
    const point = gnomonRootPoint(HANYANG_LATITUDE, 0);
    expect(southRimDistanceInDiameters(point)).toBeCloseTo(0.1045, 3);
  });

  it("자오선 위에 있다", () => {
    expect(gnomonRootPoint(HANYANG_LATITUDE, 0).x).toBeCloseTo(0, 9);
  });
});

describe("southRimDistanceInDiameters", () => {
  it("남쪽 가장자리가 0이고 북쪽 가장자리가 1이다", () => {
    expect(southRimDistanceInDiameters({ x: 0, y: 1 })).toBeCloseTo(0, 9);
    expect(southRimDistanceInDiameters({ x: 0, y: -1 })).toBeCloseTo(1, 9);
  });
});
