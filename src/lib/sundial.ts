import { MoonState, moonState } from "./astro/lunar";
import {
  HorizontalPosition,
  apparentSolarMinutes,
  horizonHourAngle,
  horizontalFromEquatorial,
  hourAngle,
  solarElements,
  sunPosition,
} from "./astro/solar";
import { SOLAR_TERMS } from "./dial/constants";
import { flatLightDirection, flatPoint, rotateFlatPoint } from "./dial/flat";
import { DialPoint, rodShadowToRim, shadowPoint } from "./dial/projection";
import { angleDifference, normalizeDegrees } from "./placement/angle";
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
  /**
   * 펼친 원반 위 그림자 끝. 반구와 같은 순간을 다른 방식으로 옮긴 것이다.
   * 반구와 마찬가지로 휴대폰이 향한 방위를 이미 반영했다.
   */
  flatTip: DialPoint | null;
  /**
   * 달시계일 때, 달이 보름달 자리인 해의 정반대에 있었다면 떨어졌을 그림자.
   * 달그림자에서 보정치를 미리 덜어 낸 자리라서 이 그림자가 실제 시각을
   * 가리킨다. 낮이거나 그림자가 없으면 null이다. 반구에서 그 자리의 달이
   * 아직 지평선 아래면 그림자가 반구 밖으로 나가므로, 그 시각선이 테두리에
   * 닿는 자리를 대신 낸다. 읽을 자리는 그 시각선이기 때문이다.
   */
  correctedShadow: DialPoint | null;
  correctedFlatTip: DialPoint | null;
  /** 보정한 그림자를 드리우는 가상의 광원, 곧 보름달이 있을 자리. */
  correctedLight: HorizontalPosition | null;
  /**
   * 펼친 원반에서 해와 달이 놓이는 쪽. 길이가 1인 방향이다.
   * 원반과 같은 방식으로 옮긴 것이라 영침을 사이에 두고 제 그림자의 정반대다.
   * 반구에서는 쓰지 않는다. 반구는 눌러 놓은 방위를 따른다(`bowlLightDirection`).
   */
  flatSunSide: DialPoint;
  flatMoonSide: DialPoint;
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
  let flatTip: DialPoint | null = null;
  let correctedShadow: DialPoint | null = null;
  let correctedFlatTip: DialPoint | null = null;
  let correctedLight: HorizontalPosition | null = null;

  if (isDay) {
    shadow = shadowPoint(sun.altitude, sun.azimuth, headingDegrees);
    flatTip = rotateFlatPoint(
      flatPoint(hourAngle(date, longitude), elements.declination),
      headingDegrees
    );
  } else if (moonReading) {
    mode = "moon";
    if (moonReading.shadowVisible) {
      shadow = shadowPoint(moon.position.altitude, moon.position.azimuth, headingDegrees);
      flatTip = rotateFlatPoint(
        flatPoint(moon.hourAngle, moon.declination),
        headingDegrees
      );

      // 보름달은 해의 정반대에 있다. 지금 달이 그 자리에 있었다면 눈금을
      // 뒤집어 읽은 값이 곧 실제 시각이다. 그 자리의 그림자를 함께 그린다.
      const fullMoonHourAngle = angleDifference(hourAngle(date, longitude) + 180, 0);
      correctedLight = horizontalFromEquatorial(fullMoonHourAngle, moon.declination, latitude);
      correctedFlatTip = rotateFlatPoint(
        flatPoint(fullMoonHourAngle, moon.declination),
        headingDegrees
      );
      correctedShadow =
        correctedLight.altitude > 0
          ? shadowPoint(correctedLight.altitude, correctedLight.azimuth, headingDegrees)
          : rodShadowToRim(
              latitude,
              correctedLight.altitude,
              correctedLight.azimuth,
              headingDegrees
            ).at(-1) ?? null;
      if (moonReading.beyondSolarTermLines) {
        notices.push("달이 해보다 높거나 낮게 지나 그림자가 절기선 밖이다.");
      }
    } else if (moon.position.altitude < 0) {
      notices.push("달이 지평선 아래다.");
    } else {
      notices.push(`${moon.phaseName}이라 달빛이 약해 그림자가 없다.`);
    }
  } else {
    mode = "waiting";
  }

  return {
    mode,
    shadow,
    flatTip,
    correctedShadow,
    correctedFlatTip,
    correctedLight,
    flatSunSide: flatLightDirection(hourAngle(date, longitude), headingDegrees),
    flatMoonSide: flatLightDirection(moon.hourAngle, headingDegrees),
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
