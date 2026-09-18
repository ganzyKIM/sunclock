import { buildDialGeometry, HANYANG_LATITUDE } from "./geometry";
import { southRimDistanceInDiameters } from "./projection";

const geometry = buildDialGeometry(HANYANG_LATITUDE);

function noonPointOf(declination: number) {
  const line = geometry.solarTermLines.find(
    (l) => Math.abs(l.declination - declination) < 0.01
  );
  if (!line) throw new Error("절기선을 찾지 못했다");
  return line.points[(line.points.length - 1) / 2];
}

describe("buildDialGeometry", () => {
  it("한양 위도를 도로 바꾼 값을 쓴다", () => {
    expect(HANYANG_LATITUDE).toBeCloseTo(37 + 39 / 60 + 15 / 3600, 9);
  });

  it("절기선이 13개다", () => {
    expect(geometry.solarTermLines).toHaveLength(13);
  });

  it("영침 뿌리가 남쪽 가장자리에서 지름의 0.104만큼 떨어진다", () => {
    expect(southRimDistanceInDiameters(geometry.gnomonRoot)).toBeCloseTo(0.1045, 3);
  });

  it("하지선의 정오 자리가 지름의 0.623이다", () => {
    expect(southRimDistanceInDiameters(noonPointOf(23.4392911))).toBeCloseTo(0.6227, 3);
  });

  it("동지선의 정오 자리가 지름의 0.938이다", () => {
    expect(southRimDistanceInDiameters(noonPointOf(-23.4392911))).toBeCloseTo(0.9376, 3);
  });

  it("춘추분선의 정오 자리가 두 선의 가운데보다 남쪽에 있다", () => {
    const equinox = southRimDistanceInDiameters(noonPointOf(0));
    expect(equinox).toBeGreaterThan(0.62);
    expect(equinox).toBeLessThan(0.94);
  });

  it("모든 점이 원판 안에 있다", () => {
    const all = [
      ...geometry.solarTermLines.flatMap((l) => l.points),
      ...geometry.hourLines.flatMap((l) => l.points),
    ];
    expect(all.length).toBeGreaterThan(0);
    for (const point of all) {
      expect(Math.hypot(point.x, point.y)).toBeLessThanOrEqual(1.000001);
    }
  });

  it("시각선이 29개이고 그중 7개가 주선이다", () => {
    expect(geometry.hourLines).toHaveLength(29);
    expect(geometry.hourLines.filter((l) => l.isMajor)).toHaveLength(7);
  });

  it("주선에만 이름이 붙는다", () => {
    const labelled = geometry.hourLines.filter((l) => l.label !== null);
    expect(labelled.map((l) => l.label)).toEqual(["묘", "진", "사", "오", "미", "신", "유"]);
  });

  it("정오 시각선은 자오선 위의 곧은 선이다", () => {
    const noon = geometry.hourLines.find((l) => l.apparentMinutes === 720);
    expect(noon).toBeDefined();
    for (const point of noon!.points) {
      expect(Math.abs(point.x)).toBeLessThan(1e-9);
    }
  });

  it("아침과 저녁 시각선이 좌우 대칭이다", () => {
    const morning = geometry.hourLines.find((l) => l.apparentMinutes === 600)!;
    const evening = geometry.hourLines.find((l) => l.apparentMinutes === 840)!;
    expect(morning.points).toHaveLength(evening.points.length);
    morning.points.forEach((point, index) => {
      expect(point.x).toBeCloseTo(-evening.points[index].x, 9);
      expect(point.y).toBeCloseTo(evening.points[index].y, 9);
    });
  });

  it("가장 이른 시각선은 해가 일찍 뜨는 철에만 그려져 짧다", () => {
    const earliest = geometry.hourLines.find((l) => l.apparentMinutes === 300)!;
    const noon = geometry.hourLines.find((l) => l.apparentMinutes === 720)!;
    expect(earliest.points.length).toBeGreaterThan(1);
    expect(earliest.points.length).toBeLessThan(noon.points.length);
  });

  it("하지선은 시각선 범위를 넘는 구간을 따로 알려 준다", () => {
    const summer = geometry.solarTermLines.find((l) => l.declination > 23)!;
    expect(summer.points.some((p) => p.insideHourRange)).toBe(true);
    expect(summer.points.some((p) => !p.insideHourRange)).toBe(true);
  });

  it("춘추분선은 시각선 범위를 넘지 않는다", () => {
    const equinox = geometry.solarTermLines.find((l) => Math.abs(l.declination) < 0.01)!;
    expect(equinox.points.every((p) => p.insideHourRange)).toBe(true);
  });

  it("절기선에 이름이 붙는다", () => {
    const equinox = geometry.solarTermLines.find((l) => Math.abs(l.declination) < 0.01)!;
    expect(equinox.label).toBe("춘분 · 추분");
    expect(equinox.termNames.sort()).toEqual(["추분", "춘분"]);
  });

  it("위도가 높아지면 영침 뿌리가 중심 쪽으로 온다", () => {
    const low = southRimDistanceInDiameters(buildDialGeometry(20).gnomonRoot);
    const high = southRimDistanceInDiameters(buildDialGeometry(55).gnomonRoot);
    expect(high).toBeGreaterThan(low);
  });
});
