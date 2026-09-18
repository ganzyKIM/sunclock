const UNIX_EPOCH_JULIAN_DAY = 2440587.5;
const MILLISECONDS_PER_DAY = 86400000;
const DAYS_PER_JULIAN_CENTURY = 36525;
const J2000 = 2451545;

export function toJulianDay(date: Date): number {
  return date.getTime() / MILLISECONDS_PER_DAY + UNIX_EPOCH_JULIAN_DAY;
}

export function toJulianCentury(julianDay: number): number {
  return (julianDay - J2000) / DAYS_PER_JULIAN_CENTURY;
}
