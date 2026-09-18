import { OBLIQUITY } from "../dial/constants";
import { angleDifference, normalizeDegrees, toDegrees, toRadians } from "../placement/angle";
import { toJulianDay } from "./julian";
import { HorizontalPosition, horizontalFromEquatorial, solarElements } from "./solar";

export const SYNODIC_MONTH_DAYS = 29.530588853;

/**
 * 측정한 오차는 적위 0.4도, 시간각 0.71도다. 눈금 읽기로 치면 3분 안쪽이다.
 * 화면에 뜨는 실제 시각은 달이 아니라 시계에서 오므로 이 오차가 시각을 흐리지 않는다.
 */

const J2000 = 2451545;
const DAYS_PER_JULIAN_CENTURY = 36525;
const EARTH_RADIUS_KM = 6378.14;

export interface MoonState {
  position: HorizontalPosition;
  /** 적위. 도 단위. */
  declination: number;
  /** 시간각. 도 단위. -180 이상 180 미만. 남중에서 0. */
  hourAngle: number;
  /** 밝은 면의 비율. 0이 삭, 1이 보름. */
  illuminatedFraction: number;
  /** 보름에서 지난 날수. 음수면 보름 전이다. */
  daysFromFullMoon: number;
  phaseName: string;
  /** 차오르는 중이면 참이다. */
  waxing: boolean;
}

interface EclipticPosition {
  longitude: number;
  latitude: number;
  /** 지구 중심에서 달까지의 거리. 킬로미터. */
  distance: number;
}

/**
 * 메우스가 정리한 달 위치 식에서 큰 항만 골라 쓴다.
 * 항을 하나만 쓰면 한 도 가까이 벌어져 그림자가 눈에 띄게 어긋난다.
 */
function moonEcliptic(daysSinceJ2000: number): EclipticPosition {
  const t = daysSinceJ2000 / DAYS_PER_JULIAN_CENTURY;

  const meanLongitude = 218.3164477 + 481267.88123421 * t;
  const elongation = toRadians(297.8501921 + 445267.1114034 * t);
  const sunAnomaly = toRadians(357.5291092 + 35999.0502909 * t);
  const moonAnomaly = toRadians(134.9633964 + 477198.8675055 * t);
  const latitudeArgument = toRadians(93.272095 + 483202.0175233 * t);

  const longitude =
    meanLongitude +
    6.289 * Math.sin(moonAnomaly) +
    1.274 * Math.sin(2 * elongation - moonAnomaly) +
    0.658 * Math.sin(2 * elongation) +
    0.214 * Math.sin(2 * moonAnomaly) -
    0.186 * Math.sin(sunAnomaly) -
    0.114 * Math.sin(2 * latitudeArgument);

  const latitude =
    5.128 * Math.sin(latitudeArgument) +
    0.281 * Math.sin(moonAnomaly + latitudeArgument) -
    0.278 * Math.sin(latitudeArgument - moonAnomaly) -
    0.173 * Math.sin(2 * elongation - latitudeArgument) +
    0.055 * Math.sin(2 * elongation + latitudeArgument - moonAnomaly) -
    0.046 * Math.sin(2 * elongation - latitudeArgument - moonAnomaly) +
    0.033 * Math.sin(2 * elongation + latitudeArgument);

  const distance =
    385000.56 -
    20905.355 * Math.cos(moonAnomaly) -
    3699.111 * Math.cos(2 * elongation - moonAnomaly) -
    2955.968 * Math.cos(2 * elongation) -
    569.925 * Math.cos(2 * moonAnomaly);

  return { longitude: normalizeDegrees(longitude), latitude, distance };
}

interface Equatorial {
  rightAscension: number;
  declination: number;
}

/**
 * 달은 가까워서 보는 자리에 따라 한 도까지 어긋난다.
 * 지구 중심에서 본 자리를 관측자가 선 자리에서 본 자리로 옮긴다.
 */
function toTopocentric(
  geocentric: Equatorial,
  distanceKm: number,
  siderealDegrees: number,
  latitude: number
): Equatorial {
  const distance = distanceKm / EARTH_RADIUS_KM;
  const ra = toRadians(geocentric.rightAscension);
  const dec = toRadians(geocentric.declination);
  const theta = toRadians(siderealDegrees);
  const phi = toRadians(latitude);

  const x = distance * Math.cos(dec) * Math.cos(ra) - Math.cos(phi) * Math.cos(theta);
  const y = distance * Math.cos(dec) * Math.sin(ra) - Math.cos(phi) * Math.sin(theta);
  const z = distance * Math.sin(dec) - Math.sin(phi);

  return {
    rightAscension: normalizeDegrees(toDegrees(Math.atan2(y, x))),
    declination: toDegrees(Math.asin(z / Math.hypot(x, y, z))),
  };
}

function eclipticToDeclination(ecliptic: EclipticPosition): number {
  const l = toRadians(ecliptic.longitude);
  const b = toRadians(ecliptic.latitude);
  const e = toRadians(OBLIQUITY);
  return toDegrees(
    Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l))
  );
}

function eclipticToRightAscension(ecliptic: EclipticPosition): number {
  const l = toRadians(ecliptic.longitude);
  const b = toRadians(ecliptic.latitude);
  const e = toRadians(OBLIQUITY);
  return normalizeDegrees(
    toDegrees(
      Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l))
    )
  );
}

function localSiderealDegrees(daysSinceJ2000: number, longitude: number): number {
  return normalizeDegrees(280.16 + 360.9856235 * daysSinceJ2000 + longitude);
}

function phaseNameOf(fraction: number, waxing: boolean): string {
  if (fraction < 0.04) return "삭";
  if (fraction > 0.96) return "보름달";
  if (fraction < 0.45) return waxing ? "초승달" : "그믐달";
  if (fraction <= 0.55) return waxing ? "상현달" : "하현달";
  return waxing ? "차오르는 달" : "기우는 달";
}

export function moonState(
  date: Date,
  latitude: number,
  longitude: number
): MoonState {
  const days = toJulianDay(date) - J2000;
  const ecliptic = moonEcliptic(days);
  const sidereal = localSiderealDegrees(days, longitude);

  const seen = toTopocentric(
    {
      rightAscension: eclipticToRightAscension(ecliptic),
      declination: eclipticToDeclination(ecliptic),
    },
    ecliptic.distance,
    sidereal,
    latitude
  );

  const declination = seen.declination;
  const hourAngle = angleDifference(sidereal, seen.rightAscension);
  const position = horizontalFromEquatorial(hourAngle, declination, latitude);

  const elongation = angleDifference(
    ecliptic.longitude,
    solarElements(date).apparentLongitude
  );
  const illuminatedFraction = (1 - Math.cos(toRadians(elongation))) / 2;
  const daysFromFullMoon =
    (angleDifference(elongation, 180) / 360) * SYNODIC_MONTH_DAYS;
  const waxing = daysFromFullMoon < 0;

  return {
    position,
    declination,
    hourAngle,
    illuminatedFraction,
    daysFromFullMoon,
    phaseName: phaseNameOf(illuminatedFraction, waxing),
    waxing,
  };
}
