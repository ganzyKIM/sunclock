import { hourAngle, sunPosition } from "../astro/solar";
import { flatPoint, rotateFlatPoint } from "./flat";
import { buildDialGeometry } from "./geometry";
import { branchSpanOf, dialMinutesOf, findBranchEdges, flatMinutesAt } from "./reading";

const SEOUL = { latitude: 37.5665, longitude: 126.978 };

describe("flatMinutesAt", () => {
  it("원반 위의 점을 시각으로 되읽는다", () => {
    expect(flatMinutesAt({ x: 0, y: -0.5 })).toBeCloseTo(720, 6);
    expect(flatMinutesAt({ x: 0, y: 0.5 })).toBeCloseTo(0, 6);
    expect(flatMinutesAt({ x: 0.5, y: 0 })).toBeCloseTo(1080, 6);
  });

  it("그려 놓은 점을 되읽으면 그린 시각이 나온다", () => {
    for (const h of [-100, -30, 0, 45, 170]) {
      expect(flatMinutesAt(flatPoint(h, 10))).toBeCloseTo(((h + 180) * 4 + 1440) % 1440, 6);
    }
  });

  it("휴대폰을 돌리면 되읽는 시각도 그만큼 돈다", () => {
    const straight = flatMinutesAt(flatPoint(30, 0));
    const turned = flatMinutesAt(rotateFlatPoint(flatPoint(30, 0), 45));
    expect(((turned - straight) % 1440 + 1440) % 1440).toBeCloseTo(1440 - 180, 6);
  });
});

describe("dialMinutesOf", () => {
  it("방위가 맞으면 해의 시간각 그대로다", () => {
    for (const iso of ["2026-06-21T03:30:00Z", "2026-12-21T07:10:00Z", "2026-09-22T00:05:00Z"]) {
      const date = new Date(iso);
      const sun = sunPosition(date, SEOUL.latitude, SEOUL.longitude);
      const expected = ((hourAngle(date, SEOUL.longitude) + 180) * 4 + 1440) % 1440;
      expect(dialMinutesOf(sun.altitude, sun.azimuth, 0, SEOUL.latitude)).toBeCloseTo(expected, 4);
    }
  });

  it("반구를 돌리면 그림자가 걸린 눈금이 달라진다", () => {
    const date = new Date("2026-06-21T03:30:00Z");
    const sun = sunPosition(date, SEOUL.latitude, SEOUL.longitude);
    const straight = dialMinutesOf(sun.altitude, sun.azimuth, 0, SEOUL.latitude);
    const turned = dialMinutesOf(sun.altitude, sun.azimuth, 40, SEOUL.latitude);
    expect(Math.abs(turned - straight)).toBeGreaterThan(20);
  });
});

describe("branchSpanOf", () => {
  it("이름의 앞뒤 한 시간씩이 그 시다", () => {
    expect(branchSpanOf(480)).toEqual({ center: 480, start: 420, end: 540 });
    expect(branchSpanOf(430)).toEqual({ center: 480, start: 420, end: 540 });
    expect(branchSpanOf(539)).toEqual({ center: 480, start: 420, end: 540 });
  });

  it("자시는 자정을 가로지른다", () => {
    expect(branchSpanOf(10)).toEqual({ center: 0, start: 1380, end: 60 });
    expect(branchSpanOf(1400)).toEqual({ center: 0, start: 1380, end: 60 });
  });
});

describe("findBranchEdges", () => {
  const geometry = buildDialGeometry(37.5);

  it("낮의 시에는 반구에 양쪽 경계선이 있다", () => {
    const edges = findBranchEdges(geometry.hourLines, 730);
    expect(edges).not.toBeNull();
    expect(edges!.start.apparentMinutes).toBe(660);
    expect(edges!.end.apparentMinutes).toBe(780);
    expect(edges!.start.points.length).toBeGreaterThan(1);
  });

  it("반구에 새기지 않은 밤의 시에는 없다", () => {
    expect(findBranchEdges(geometry.hourLines, 10)).toBeNull();
  });
});
