import { MoonState, SYNODIC_MONTH_DAYS } from "../astro/lunar";
import { OBLIQUITY } from "../dial/constants";
import { angleDifference } from "../placement/angle";
import { toTraditionalTime } from "./traditional";

/** 이보다 어두우면 그림자가 생기지 않는다고 본다. */
export const MOON_SHADOW_MIN_FRACTION = 0.5;
/** 이보다 낮으면 그림자가 생기지 않는다고 본다. 도 단위. */
export const MOON_SHADOW_MIN_ALTITUDE = 10;

const MINUTES_PER_DAY = 1440;
const MINUTES_PER_DEGREE_OF_HOUR_ANGLE = 4;

export interface MoonDialReading {
  /** 눈금이 그대로 가리키는 값. 진태양시 자정부터의 분. */
  dialMinutes: number;
  /** 12시간을 뒤집은 값. */
  flippedMinutes: number;
  /** 뒤집은 값에 더해야 할 분. 달의 실제 위치로 구한다. */
  correctionMinutes: number;
  /** 보정을 마친 실제 진태양시. */
  correctedMinutes: number;
  /** 하루에 50분이라는 옛 어림셈으로 구한 보정. */
  roughCorrectionMinutes: number;
  dialLabel: string;
  flippedLabel: string;
  /** 달의 적위가 태양의 한계를 넘어 절기선 밖으로 나갔는지. */
  beyondSolarTermLines: boolean;
  /** 실제로 그림자가 생길 만한 밝기와 높이인지. */
  shadowVisible: boolean;
}

function wrapMinutes(minutes: number): number {
  return ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

export function readMoonDial(moon: MoonState, sunHourAngle: number): MoonDialReading {
  const dialMinutes = wrapMinutes((moon.hourAngle + 180) * MINUTES_PER_DEGREE_OF_HOUR_ANGLE);
  const flippedMinutes = wrapMinutes(dialMinutes + MINUTES_PER_DAY / 2);

  const correctionMinutes =
    angleDifference(sunHourAngle, moon.hourAngle + 180) * MINUTES_PER_DEGREE_OF_HOUR_ANGLE;

  return {
    dialMinutes,
    flippedMinutes,
    correctionMinutes,
    correctedMinutes: wrapMinutes(flippedMinutes + correctionMinutes),
    roughCorrectionMinutes: moon.daysFromFullMoon * (MINUTES_PER_DAY / SYNODIC_MONTH_DAYS),
    dialLabel: toTraditionalTime(dialMinutes).label,
    flippedLabel: toTraditionalTime(flippedMinutes).label,
    beyondSolarTermLines: Math.abs(moon.declination) > OBLIQUITY,
    shadowVisible:
      moon.illuminatedFraction >= MOON_SHADOW_MIN_FRACTION &&
      moon.position.altitude >= MOON_SHADOW_MIN_ALTITUDE,
  };
}

/**
 * 달 눈금에서 읽은 값에 더할 분. 부호를 그대로 적는다.
 * "빠름"이나 "느림"으로 적으면 무엇이 빠른지 되짚어야 한다.
 */
export function formatMoonCorrection(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded === 0) return "0분";
  return rounded > 0 ? `+${rounded}분` : `−${-rounded}분`;
}
