const MINUTES_PER_DAY = 1440;
const MINUTES_PER_DEGREE = 4;

/** 기기 시간대가 기준으로 삼는 자오선의 경도. 한국 표준시는 135도다. */
export function referenceLongitudeOf(date: Date): number {
  return -date.getTimezoneOffset() / MINUTES_PER_DEGREE;
}

/** 표준 자오선보다 서쪽이면 양수. 그만큼 해가 늦게 남중한다. */
export function longitudeCorrectionMinutes(
  longitude: number,
  referenceLongitude: number
): number {
  return (referenceLongitude - longitude) * MINUTES_PER_DEGREE;
}

export function standardMinutesFromApparent(
  apparentMinutes: number,
  equationOfTime: number,
  longitude: number,
  referenceLongitude: number
): number {
  const raw =
    apparentMinutes -
    equationOfTime +
    longitudeCorrectionMinutes(longitude, referenceLongitude);
  return ((raw % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

function splitHourMinute(minutesOfDay: number): { hour: number; minute: number } {
  const wrapped = ((minutesOfDay % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const total = Math.floor(wrapped);
  return { hour: Math.floor(total / 60), minute: total % 60 };
}

function partOfDay(hour: number): string {
  // 자정 무렵은 새벽이 아니라 밤이라고 부른다.
  if (hour === 0) return "밤";
  if (hour < 6) return "새벽";
  if (hour < 12) return "아침";
  if (hour < 18) return "낮";
  if (hour < 21) return "저녁";
  return "밤";
}

export function formatFriendlyTime(minutesOfDay: number): string {
  const { hour, minute } = splitHourMinute(minutesOfDay);
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${partOfDay(hour)} ${twelve}시 ${minute}분`;
}

export function formatClockTime(minutesOfDay: number): string {
  const { hour, minute } = splitHourMinute(minutesOfDay);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatSignedMinutes(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded === 0) return "차이 없음";
  return rounded > 0 ? `${rounded}분 빠름` : `${-rounded}분 느림`;
}
