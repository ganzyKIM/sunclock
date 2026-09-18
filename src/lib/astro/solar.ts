import { normalizeDegrees, toDegrees, toRadians } from "../placement/angle";
import { toJulianCentury, toJulianDay } from "./julian";

export interface HorizontalPosition {
  /** 지평선 위 고도. 도 단위. */
  altitude: number;
  /** 북쪽이 0이고 동쪽으로 증가하는 방위각. 도 단위. */
  azimuth: number;
}

export interface SolarElements {
  /** 적위. 도 단위. */
  declination: number;
  /** 진태양시에서 평균태양시를 뺀 값. 분 단위. */
  equationOfTime: number;
  /** 춘분을 0으로 삼은 태양 황경. 도 단위. */
  apparentLongitude: number;
}

const MINUTES_PER_DAY = 1440;

/** 미국 해양대기청이 정리한 태양 위치 계산을 따른다. */
export function solarElements(date: Date): SolarElements {
  const t = toJulianCentury(toJulianDay(date));

  const meanLongitude = normalizeDegrees(280.46646 + t * (36000.76983 + t * 0.0003032));
  const meanAnomaly = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const eccentricity = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);

  const m = toRadians(meanAnomaly);
  const center =
    Math.sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * m) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * m) * 0.000289;

  const trueLongitude = meanLongitude + center;
  const omega = toRadians(125.04 - 1934.136 * t);
  const apparentLongitude = trueLongitude - 0.00569 - 0.00478 * Math.sin(omega);

  const meanObliquity =
    23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const obliquity = toRadians(meanObliquity + 0.00256 * Math.cos(omega));

  const declination = toDegrees(
    Math.asin(Math.sin(obliquity) * Math.sin(toRadians(apparentLongitude)))
  );

  const y = Math.tan(obliquity / 2) ** 2;
  const l0 = toRadians(meanLongitude);
  const equationOfTime =
    4 *
    toDegrees(
      y * Math.sin(2 * l0) -
        2 * eccentricity * Math.sin(m) +
        4 * eccentricity * y * Math.sin(m) * Math.cos(2 * l0) -
        0.5 * y * y * Math.sin(4 * l0) -
        1.25 * eccentricity * eccentricity * Math.sin(2 * m)
    );

  return {
    declination,
    equationOfTime,
    apparentLongitude: normalizeDegrees(apparentLongitude),
  };
}

function utcMinutesOfDay(date: Date): number {
  return (
    date.getUTCHours() * 60 +
    date.getUTCMinutes() +
    date.getUTCSeconds() / 60 +
    date.getUTCMilliseconds() / 60000
  );
}

export function apparentSolarMinutes(date: Date, longitude: number): number {
  const raw = utcMinutesOfDay(date) + solarElements(date).equationOfTime + 4 * longitude;
  return ((raw % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

export function hourAngle(date: Date, longitude: number): number {
  return apparentSolarMinutes(date, longitude) / 4 - 180;
}

export function horizontalFromEquatorial(
  hourAngleDeg: number,
  declinationDeg: number,
  latitude: number
): HorizontalPosition {
  const h = toRadians(hourAngleDeg);
  const d = toRadians(declinationDeg);
  const phi = toRadians(latitude);

  const sinAltitude =
    Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(h);
  const altitude = toDegrees(Math.asin(Math.min(1, Math.max(-1, sinAltitude))));

  const azimuth = normalizeDegrees(
    toDegrees(
      Math.atan2(
        -Math.cos(d) * Math.sin(h),
        Math.cos(phi) * Math.sin(d) - Math.sin(phi) * Math.cos(d) * Math.cos(h)
      )
    )
  );

  return { altitude, azimuth };
}

export function sunPosition(
  date: Date,
  latitude: number,
  longitude: number
): HorizontalPosition {
  return horizontalFromEquatorial(
    hourAngle(date, longitude),
    solarElements(date).declination,
    latitude
  );
}

export function horizonHourAngle(latitude: number, declination: number): number {
  const cosine = -Math.tan(toRadians(latitude)) * Math.tan(toRadians(declination));
  if (cosine <= -1) return 180;
  if (cosine >= 1) return 0;
  return toDegrees(Math.acos(cosine));
}
