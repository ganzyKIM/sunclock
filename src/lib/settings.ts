import { HANYANG_LATITUDE } from "./dial/geometry";

export interface Settings {
  /** 눈금을 펼친 원반으로 볼지 오목한 반구로 볼지. */
  dialView: "flat" | "bowl";
  /** 눈금을 어느 위도로 그릴지. */
  dialLatitude: "device" | "hanyang";
  /** 밤에 달시계를 쓸지 일출을 기다릴지. */
  nightMode: "moon" | "wait";
  manualLocation: { latitude: number; longitude: number } | null;
}

export const DEFAULT_SETTINGS: Settings = {
  dialView: "flat",
  dialLatitude: "device",
  nightMode: "moon",
  manualLocation: null,
};

/** 경복궁. 위치를 모를 때 쓴다. */
export const DEFAULT_LOCATION = { latitude: 37.5796, longitude: 126.977 };

export const MIN_SUPPORTED_LATITUDE = 0;
export const MAX_SUPPORTED_LATITUDE = 66;

export function isSupportedLatitude(latitude: number): boolean {
  return latitude > MIN_SUPPORTED_LATITUDE && latitude < MAX_SUPPORTED_LATITUDE;
}

function readManualLocation(value: unknown): Settings["manualLocation"] {
  if (typeof value !== "object" || value === null) return null;
  const { latitude, longitude } = value as { latitude?: unknown; longitude?: unknown };
  if (typeof latitude !== "number" || typeof longitude !== "number") return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

export function mergeSettings(stored: unknown): Settings {
  if (typeof stored !== "object" || stored === null) return { ...DEFAULT_SETTINGS };
  const value = stored as Record<string, unknown>;

  return {
    dialView:
      value.dialView === "flat" || value.dialView === "bowl"
        ? value.dialView
        : DEFAULT_SETTINGS.dialView,
    dialLatitude:
      value.dialLatitude === "hanyang" || value.dialLatitude === "device"
        ? value.dialLatitude
        : DEFAULT_SETTINGS.dialLatitude,
    nightMode:
      value.nightMode === "moon" || value.nightMode === "wait"
        ? value.nightMode
        : DEFAULT_SETTINGS.nightMode,
    manualLocation: readManualLocation(value.manualLocation),
  };
}

export function dialLatitudeOf(settings: Settings, deviceLatitude: number): number {
  return settings.dialLatitude === "hanyang" ? HANYANG_LATITUDE : deviceLatitude;
}
