import { DAY_PALETTE, lerpColor, NIGHT_PALETTE, themeAt } from "./theme";

describe("lerpColor", () => {
  it("양 끝에서 원래 색을 낸다", () => {
    expect(lerpColor("#000000", "#ffffff", 0)).toBe("#000000");
    expect(lerpColor("#000000", "#ffffff", 1)).toBe("#ffffff");
  });

  it("가운데에서 절반씩 섞는다", () => {
    expect(lerpColor("#000000", "#ffffff", 0.5)).toBe("#808080");
  });

  it("범위 밖의 값을 잘라 낸다", () => {
    expect(lerpColor("#000000", "#ffffff", -1)).toBe("#000000");
    expect(lerpColor("#000000", "#ffffff", 2)).toBe("#ffffff");
  });
});

describe("themeAt", () => {
  it("해가 높으면 낮 색이다", () => {
    expect(themeAt(30)).toEqual(DAY_PALETTE);
  });

  it("해가 깊이 지면 밤 색이다", () => {
    expect(themeAt(-30)).toEqual(NIGHT_PALETTE);
  });

  it("지평선 근처에서는 두 색 사이에 있다", () => {
    const dawn = themeAt(0);
    expect(dawn.background).not.toBe(DAY_PALETTE.background);
    expect(dawn.background).not.toBe(NIGHT_PALETTE.background);
  });

  it("해가 높아질수록 낮 색에 가까워진다", () => {
    const low = themeAt(-4);
    const high = themeAt(4);
    const distance = (a: string, b: string) =>
      Math.abs(parseInt(a.slice(1), 16) - parseInt(b.slice(1), 16));
    expect(distance(high.background, DAY_PALETTE.background)).toBeLessThan(
      distance(low.background, DAY_PALETTE.background)
    );
  });

  it("모든 색 항목을 빠짐없이 낸다", () => {
    expect(Object.keys(themeAt(0)).sort()).toEqual(Object.keys(DAY_PALETTE).sort());
  });
});
