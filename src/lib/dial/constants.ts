import { toDegrees, toRadians } from "../placement/angle";

/** 황도 경사각. 도 단위. */
export const OBLIQUITY = 23.4392911;

export interface SolarTerm {
  name: string;
  hanja: string;
  /** 춘분을 0으로 삼은 태양 황경. 도 단위. */
  solarLongitude: number;
}

export const SOLAR_TERMS: readonly SolarTerm[] = [
  { name: "춘분", hanja: "春分", solarLongitude: 0 },
  { name: "청명", hanja: "淸明", solarLongitude: 15 },
  { name: "곡우", hanja: "穀雨", solarLongitude: 30 },
  { name: "입하", hanja: "立夏", solarLongitude: 45 },
  { name: "소만", hanja: "小滿", solarLongitude: 60 },
  { name: "망종", hanja: "芒種", solarLongitude: 75 },
  { name: "하지", hanja: "夏至", solarLongitude: 90 },
  { name: "소서", hanja: "小暑", solarLongitude: 105 },
  { name: "대서", hanja: "大暑", solarLongitude: 120 },
  { name: "입추", hanja: "立秋", solarLongitude: 135 },
  { name: "처서", hanja: "處暑", solarLongitude: 150 },
  { name: "백로", hanja: "白露", solarLongitude: 165 },
  { name: "추분", hanja: "秋分", solarLongitude: 180 },
  { name: "한로", hanja: "寒露", solarLongitude: 195 },
  { name: "상강", hanja: "霜降", solarLongitude: 210 },
  { name: "입동", hanja: "立冬", solarLongitude: 225 },
  { name: "소설", hanja: "小雪", solarLongitude: 240 },
  { name: "대설", hanja: "大雪", solarLongitude: 255 },
  { name: "동지", hanja: "冬至", solarLongitude: 270 },
  { name: "소한", hanja: "小寒", solarLongitude: 285 },
  { name: "대한", hanja: "大寒", solarLongitude: 300 },
  { name: "입춘", hanja: "立春", solarLongitude: 315 },
  { name: "우수", hanja: "雨水", solarLongitude: 330 },
  { name: "경칩", hanja: "驚蟄", solarLongitude: 345 },
];

export function declinationOfSolarTerm(term: SolarTerm): number {
  return toDegrees(
    Math.asin(Math.sin(toRadians(OBLIQUITY)) * Math.sin(toRadians(term.solarLongitude)))
  );
}

export interface SolarTermGroup {
  /** 이 선이 나타내는 태양 적위. 도 단위. */
  declination: number;
  terms: SolarTerm[];
  /** "춘분 · 추분"처럼 선에 붙일 이름. */
  label: string;
}

function buildGroups(): SolarTermGroup[] {
  const buckets = new Map<string, SolarTerm[]>();
  for (const term of SOLAR_TERMS) {
    const key = declinationOfSolarTerm(term).toFixed(6);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(term);
    else buckets.set(key, [term]);
  }

  return [...buckets.entries()]
    .map(([key, terms]) => ({
      declination: Number(key),
      terms,
      label: terms.map((t) => t.name).join(" · "),
    }))
    .sort((a, b) => a.declination - b.declination);
}

export const SOLAR_TERM_GROUPS: readonly SolarTermGroup[] = buildGroups();

/** 시각선은 진태양시 오전 5시부터 오후 7시까지 30분 간격이다. */
export const HOUR_LINE_START_MINUTES = 300;
export const HOUR_LINE_END_MINUTES = 1140;
export const HOUR_LINE_STEP_MINUTES = 30;

/** 주선은 각 시의 정에 놓인다. */
export const MAJOR_HOUR_MINUTES: readonly number[] = [360, 480, 600, 720, 840, 960, 1080];

const MAJOR_HOUR_LABELS: readonly string[] = ["묘", "진", "사", "오", "미", "신", "유"];

export function majorHourLabel(minutes: number): string | null {
  const index = MAJOR_HOUR_MINUTES.indexOf(minutes);
  return index < 0 ? null : MAJOR_HOUR_LABELS[index];
}
