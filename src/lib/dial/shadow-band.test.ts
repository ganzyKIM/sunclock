import { taperedBand } from "./shadow-band";

const straight = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 2, y: 0 },
];

describe("taperedBand", () => {
  it("점이 하나뿐이면 그릴 것이 없다", () => {
    expect(taperedBand([{ x: 0, y: 0 }], 1, 1)).toEqual([]);
    expect(taperedBand([], 1, 1)).toEqual([]);
  });

  it("점마다 양쪽으로 벌려 닫힌 윤곽을 만든다", () => {
    expect(taperedBand(straight, 2, 2)).toHaveLength(straight.length * 2);
  });

  it("곧은 선에서는 진행 방향에 수직으로 벌어진다", () => {
    const band = taperedBand(straight, 2, 2);
    expect(band[0]).toEqual({ x: 0, y: 1 });
    expect(band[band.length - 1]).toEqual({ x: 0, y: -1 });
  });

  it("뿌리에서 넓고 끝으로 갈수록 좁아진다", () => {
    const band = taperedBand(straight, 4, 0);
    const widthAt = (index: number) =>
      Math.hypot(
        band[index].x - band[band.length - 1 - index].x,
        band[index].y - band[band.length - 1 - index].y
      );
    expect(widthAt(0)).toBeCloseTo(4, 9);
    expect(widthAt(1)).toBeCloseTo(2, 9);
    expect(widthAt(2)).toBeCloseTo(0, 9);
  });

  it("휘어진 선에서는 굽은 자리의 법선을 따라 벌어진다", () => {
    // 꺾인 점에서 앞뒤 점을 함께 보아야 띠가 접히지 않는다.
    const corner = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ];
    const band = taperedBand(corner, 2, 2);
    const middle = band[1];
    expect(middle.x).toBeCloseTo(1 - Math.SQRT1_2, 9);
    expect(middle.y).toBeCloseTo(Math.SQRT1_2, 9);
  });

  it("같은 자리에 겹친 점이 있어도 무너지지 않는다", () => {
    const doubled = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ];
    for (const point of taperedBand(doubled, 2, 1)) {
      expect(Number.isFinite(point.x)).toBe(true);
      expect(Number.isFinite(point.y)).toBe(true);
    }
  });
});
