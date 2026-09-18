import { MoonState, moonState } from "./astro/lunar";
import {
  HorizontalPosition,
  apparentSolarMinutes,
  horizonHourAngle,
  hourAngle,
  solarElements,
  sunPosition,
} from "./astro/solar";
import { SOLAR_TERMS } from "./dial/constants";
import { DialPoint, shadowPoint } from "./dial/projection";
import { normalizeDegrees } from "./placement/angle";
import {
  longitudeCorrectionMinutes,
  referenceLongitudeOf,
  standardMinutesFromApparent,
} from "./time/clock";
import { MoonDialReading, readMoonDial } from "./time/moon-dial";
import { TraditionalTime, toTraditionalTime } from "./time/traditional";

const MINUTES_PER_DAY = 1440;
const DEGREES_PER_SOLAR_TERM = 15;

export type DialMode = "sun" | "moon" | "waiting";
export type NightMode = "moon" | "wait";

export interface SundialInput {
  date: Date;
  latitude: number;
  longitude: number;
  /** 반구의 북쪽 축이 실제로 향한 방위. 도 단위. */
  headingDegrees: number;
  nightMode: NightMode;
}

export interface SundialState {
  mode: DialMode;
  /** 반구 위 그림자 끝. 그림자가 없으면 null이다. */
  shadow: DialPoint | null;
  apparentMinutes: number;
  standardMinutes: number;
  traditional: TraditionalTime;
  sun: HorizontalPosition;
  moon: MoonState;
  moonReading: MoonDialReading | null;
  equationOfTime: number;
  longitudeCorrection: number;
  solarTermName: string;
  /** 해가 져 있을 때 다음 일출까지 남은 분. 낮에는 null이다. */
  minutesUntilSunrise: number | null;
  notices: string[];
}

export function solarTermNameAt(apparentLongitude: number): string {
  const index = Math.floor(normalizeDegrees(apparentLongitude) / DEGREES_PER_SOLAR_TERM);
  return SOLAR_TERMS[index % SOLAR_TERMS.length].name;
}

function minutesUntilNextSunrise(
  apparentMinutes: number,
  latitude: number,
  declination: number
): number {
  const limit = horizonHourAngle(latitude, declination);
  if (limit <= 0) return MINUTES_PER_DAY;
  const sunriseMinutes = MINUTES_PER_DAY / 2 - limit * 4;
  const gap = sunriseMinutes - apparentMinutes;
  return gap > 0 ? gap : gap + MINUTES_PER_DAY;
}

export function buildSundialState(input: SundialInput): SundialState {
  const { date, latitude, longitude, headingDegrees, nightMode } = input;

  const elements = solarElements(date);
  const sun = sunPosition(date, latitude, longitude);
  const apparentMinutes = apparentSolarMinutes(date, longitude);
  const referenceLongitude = referenceLongitudeOf(date);

  const moon = moonState(date, latitude, longitude);
  const isDay = sun.altitude > 0;

  const moonReading: MoonDialReading | null =
    isDay || nightMode === "wait" ? null : readMoonDial(moon, hourAngle(date, longitude));

  const notices: string[] = [];
  let mode: DialMode = "sun";
  let shadow: DialPoint | null = null;

  if (isDay) {
    shadow = shadowPoint(sun.altitude, sun.azimuth, headingDegrees);
  } else if (moonReading) {
    mode = "moon";
    if (moonReading.shadowVisible) {
      shadow = shadowPoint(moon.position.altitude, moon.position.azimuth, headingDegrees);
      if (moonReading.beyondSolarTermLines) {
        notices.push("달이 태양보다 높거나 낮게 지나가 그림자가 절기선 밖으로 나갔어요.");
      }
    } else if (moon.position.altitude < 0) {
      notices.push("달이 지평선 아래에 있어요.");
    } else {
      notices.push(`${moon.phaseName}이라 달빛이 약해 그림자가 생기지 않아요.`);
    }
  } else {
    mode = "waiting";
  }

  return {
    mode,
    shadow,
    apparentMinutes,
    standardMinutes: standardMinutesFromApparent(
      apparentMinutes,
      elements.equationOfTime,
      longitude,
      referenceLongitude
    ),
    traditional: toTraditionalTime(apparentMinutes),
    sun,
    moon,
    moonReading,
    equationOfTime: elements.equationOfTime,
    longitudeCorrection: longitudeCorrectionMinutes(longitude, referenceLongitude),
    solarTermName: solarTermNameAt(elements.apparentLongitude),
    minutesUntilSunrise: isDay
      ? null
      : minutesUntilNextSunrise(apparentMinutes, latitude, elements.declination),
    notices,
  };
}
