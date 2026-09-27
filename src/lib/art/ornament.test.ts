import { sprig } from "./ornament";

describe("sprig", () => {
  const art = sprig();

  it("줄기 하나에 잎 다섯, 열매 셋이다", () => {
    expect(art.stem.startsWith("M ")).toBe(true);
    expect(art.leaves).toHaveLength(5);
    expect(art.berries).toHaveLength(3);
  });

  it("모두 0에서 100 사이의 상자 안에 있다", () => {
    const numbers = [art.stem, ...art.leaves]
      .join(" ")
      .split(/[^0-9.-]+/)
      .filter((token) => token !== "" && token !== "-")
      .map(Number);
    for (const n of numbers) {
      expect(n).toBeGreaterThanOrEqual(-2);
      expect(n).toBeLessThanOrEqual(102);
    }
    for (const b of art.berries) {
      expect(b.x).toBeGreaterThan(0);
      expect(b.y).toBeGreaterThan(0);
    }
  });

  it("잎은 닫힌 한 획이다", () => {
    for (const path of art.leaves) expect(path.endsWith("Z")).toBe(true);
  });
});
