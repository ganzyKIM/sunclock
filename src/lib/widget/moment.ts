import {
  apparentSolarMinutes,
  horizonHourAngle,
  horizontalFromEquatorial,
  solarElements,
} from "../astro/solar";
import { flatPoint } from "../dial/flat";
import { DialPoint } from "../dial/projection";
import { angleDifference } from "../placement/angle";
import { solarTermNameAt } from "../sundial";
import { TraditionalTime, toTraditionalTime } from "../time/traditional";

const MINUTES_PER_DAY = 1440;

/**
 * 위젯과 대기화면이 보여 줄 한순간.
 *
 * 위젯은 나침반을 읽지 못한다. 그래서 언제나 북쪽을 맞춘 눈금판을 그린다.
 * 달도 따로 셈하지 않는다. 시계는 달이 졌다고 멈출 수 없으므로, 밤에는 달이
 * 보름달 자리인 해의 정반대에 있다고 치고 그 그림자를 세운다. 앱에서 또렷하게
 * 세우는 보정한 그림자와 같은 자리이고, 실제 시각을 가리킨다.
 *
 * 앱이 꺼져 있어도 돌아야 해서 같은 셈을 코틀린의 `Almanac`이 다시 한다.
 * 여기가 기준이다. 고칠 때는 여기를 먼저 고치고 기준값을 다시 뽑는다.
 */
export interface WidgetMoment {
  /** 해가 지평선 위에 있는지. */
  isDay: boolean;
  /** 빛깔을 고르는 데 쓴다. 도 단위. */
  sunAltitude: number;
  /** 진태양시. 자정부터의 분. */
  apparentMinutes: number;
  /** 그림자가 걸린 눈금 자리. 밤에는 열두 시간 건너편이다. */
  dialMinutes: number;
  /** 펼친 원반 위 그림자 끝. 북쪽을 맞춘 자리다. */
  tip: DialPoint;
  /** 그림자를 드리우는 빛의 적위. 낮에는 해, 밤에는 해의 정반대다. */
  lightDeclination: number;
  /** 그 빛이 떠 있는 동안의 시간각 폭. 또렷하게 그을 호의 길이다. */
  halfDayAngle: number;
  /** 읽는 시각. 눈금 자리가 아니라 실제 진태양시에서 온다. */
  traditional: TraditionalTime;
  solarTermName: string;
}

export function widgetMomentAt(date: Date, latitude: number, longitude: number): WidgetMoment {
  const elements = solarElements(date);
  const apparentMinutes = apparentSolarMinutes(date, longitude);
  const sunHourAngle = apparentMinutes / 4 - 180;
  const sun = horizontalFromEquatorial(sunHourAngle, elements.declination, latitude);
  const isDay = sun.altitude > 0;

  const lightHourAngle = isDay ? sunHourAngle : angleDifference(sunHourAngle + 180, 0);
  const lightDeclination = isDay ? elements.declination : -elements.declination;

  return {
    isDay,
    sunAltitude: sun.altitude,
    apparentMinutes,
    dialMinutes: isDay ? apparentMinutes : (apparentMinutes + MINUTES_PER_DAY / 2) % MINUTES_PER_DAY,
    tip: flatPoint(lightHourAngle, lightDeclination),
    lightDeclination,
    halfDayAngle: horizonHourAngle(latitude, lightDeclination),
    traditional: toTraditionalTime(apparentMinutes),
    solarTermName: solarTermNameAt(elements.apparentLongitude),
  };
}
