import { HANYANG_LATITUDE } from "./dial/geometry";
import {
  DEFAULT_SETTINGS,
  dialLatitudeOf,
  isSupportedLatitude,
  mergeSettings,
} from "./settings";

describe("mergeSettings", () => {
  it("빈 값이면 기본값을 준다", () => {
    expect(mergeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(mergeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(mergeSettings({})).toEqual(DEFAULT_SETTINGS);
  });

  it("아는 값만 받아들인다", () => {
    const merged = mergeSettings({ nightMode: "wait", 엉뚱한값: 1 });
    expect(merged.nightMode).toBe("wait");
    expect(merged).toEqual({ ...DEFAULT_SETTINGS, nightMode: "wait" });
  });

  it("엉뚱한 값은 기본값으로 되돌린다", () => {
    expect(mergeSettings({ nightMode: "해" }).nightMode).toBe(DEFAULT_SETTINGS.nightMode);
    expect(mergeSettings({ dialLatitude: 3 }).dialLatitude).toBe(DEFAULT_SETTINGS.dialLatitude);
  });

  it("수동 위치는 숫자 두 개일 때만 받는다", () => {
    expect(mergeSettings({ manualLocation: { latitude: 35, longitude: 129 } }).manualLocation)
      .toEqual({ latitude: 35, longitude: 129 });
    expect(mergeSettings({ manualLocation: { latitude: "35" } }).manualLocation).toBeNull();
    expect(mergeSettings({ manualLocation: { latitude: 95, longitude: 129 } }).manualLocation)
      .toBeNull();
    expect(mergeSettings({ manualLocation: { latitude: 35, longitude: 200 } }).manualLocation)
      .toBeNull();
  });
});

describe("isSupportedLatitude", () => {
  it("북반구의 중위도까지만 받는다", () => {
    expect(isSupportedLatitude(37.5)).toBe(true);
    expect(isSupportedLatitude(0)).toBe(false);
    expect(isSupportedLatitude(-10)).toBe(false);
    expect(isSupportedLatitude(66)).toBe(false);
    expect(isSupportedLatitude(65.9)).toBe(true);
  });
});

describe("dialLatitudeOf", () => {
  it("기기 위도를 쓴다", () => {
    expect(dialLatitudeOf({ ...DEFAULT_SETTINGS, dialLatitude: "device" }, 35.1)).toBe(35.1);
  });

  it("한양 원본을 고르면 고정한다", () => {
    expect(dialLatitudeOf({ ...DEFAULT_SETTINGS, dialLatitude: "hanyang" }, 35.1)).toBe(
      HANYANG_LATITUDE
    );
  });
});
