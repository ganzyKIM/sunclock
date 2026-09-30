package com.dobedub.angbuilgu.widget

import kotlin.math.PI
import kotlin.math.acos
import kotlin.math.asin
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.tan

/**
 * 위젯과 대기화면이 쓰는 셈.
 *
 * 앱이 꺼져 있어도 돌아야 해서 `src/lib`의 계산을 코틀린으로 다시 적었다.
 * 기준은 `src/lib/widget/moment.ts`다. 고칠 때는 그쪽을 먼저 고치고 기준값을
 * 다시 뽑는다. `AlmanacTest`가 두 쪽이 같은 값을 내는지 지킨다.
 *
 * 안드로이드의 것을 하나도 쓰지 않는다. 그래야 기기 없이 시험할 수 있다.
 */
object Almanac {
  /** 황도 경사각. 도 단위. */
  const val OBLIQUITY = 23.4392911

  /** 영침이 앉을 가운데 자리와 동지선이 놓이는 바깥 자리. */
  const val INNER_RADIUS = 0.32
  const val OUTER_RADIUS = 0.95

  private const val MINUTES_PER_DAY = 1440.0
  private const val MILLISECONDS_PER_DAY = 86_400_000.0
  private const val UNIX_EPOCH_JULIAN_DAY = 2440587.5
  private const val J2000 = 2451545.0
  private const val DAYS_PER_JULIAN_CENTURY = 36525.0

  val BRANCH_NAMES = arrayOf("자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해")
  val BRANCH_HANJA = arrayOf("子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥")
  private val QUARTER_NAMES = arrayOf("초각", "1각", "2각", "3각")

  /** 춘분에서 시작해 황경 15도마다 하나씩이다. */
  val SOLAR_TERM_NAMES = arrayOf(
    "춘분", "청명", "곡우", "입하", "소만", "망종",
    "하지", "소서", "대서", "입추", "처서", "백로",
    "추분", "한로", "상강", "입동", "소설", "대설",
    "동지", "소한", "대한", "입춘", "우수", "경칩"
  )

  data class Point(val x: Double, val y: Double)

  data class Traditional(val branchIndex: Int, val half: String, val quarterIndex: Int) {
    val branchName: String get() = BRANCH_NAMES[branchIndex]
    val branchHanja: String get() = BRANCH_HANJA[branchIndex]
    /** "오정 2각"처럼 각까지 적은 이름. */
    val label: String get() = "$branchName$half ${QUARTER_NAMES[quarterIndex]}"
    /** "오정"처럼 한 시간 단위까지만 적은 이름. */
    val shortLabel: String get() = "$branchName$half"
  }

  data class Moment(
    val isDay: Boolean,
    val sunAltitude: Double,
    val apparentMinutes: Double,
    val dialMinutes: Double,
    val tip: Point,
    val lightDeclination: Double,
    val halfDayAngle: Double,
    val traditional: Traditional,
    val solarTermName: String
  )

  private class SolarElements(
    val declination: Double,
    val equationOfTime: Double,
    val apparentLongitude: Double
  )

  fun toRadians(degrees: Double): Double = degrees * PI / 180
  fun toDegrees(radians: Double): Double = radians * 180 / PI

  fun normalizeDegrees(degrees: Double): Double {
    val r = degrees % 360
    return if (r < 0) r + 360 else r
  }

  fun angleDifference(a: Double, b: Double): Double {
    val d = normalizeDegrees(a - b)
    return if (d > 180) d - 360 else d
  }

  /** 미국 해양대기청이 정리한 태양 위치 계산을 따른다. */
  private fun solarElements(epochMillis: Long): SolarElements {
    val julianDay = epochMillis / MILLISECONDS_PER_DAY + UNIX_EPOCH_JULIAN_DAY
    val t = (julianDay - J2000) / DAYS_PER_JULIAN_CENTURY

    val meanLongitude = normalizeDegrees(280.46646 + t * (36000.76983 + t * 0.0003032))
    val meanAnomaly = 357.52911 + t * (35999.05029 - 0.0001537 * t)
    val eccentricity = 0.016708634 - t * (0.000042037 + 0.0000001267 * t)

    val m = toRadians(meanAnomaly)
    val center =
      sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
        sin(2 * m) * (0.019993 - 0.000101 * t) +
        sin(3 * m) * 0.000289

    val trueLongitude = meanLongitude + center
    val omega = toRadians(125.04 - 1934.136 * t)
    val apparentLongitude = trueLongitude - 0.00569 - 0.00478 * sin(omega)

    val meanObliquity =
      23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60
    val obliquity = toRadians(meanObliquity + 0.00256 * cos(omega))

    val declination = toDegrees(asin(sin(obliquity) * sin(toRadians(apparentLongitude))))

    val y = tan(obliquity / 2).pow(2)
    val l0 = toRadians(meanLongitude)
    val equationOfTime =
      4 * toDegrees(
        y * sin(2 * l0) -
          2 * eccentricity * sin(m) +
          4 * eccentricity * y * sin(m) * cos(2 * l0) -
          0.5 * y * y * sin(4 * l0) -
          1.25 * eccentricity * eccentricity * sin(2 * m)
      )

    return SolarElements(declination, equationOfTime, normalizeDegrees(apparentLongitude))
  }

  private fun wrapMinutes(minutes: Double): Double =
    ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY

  private fun utcMinutesOfDay(epochMillis: Long): Double {
    val ofDay = ((epochMillis % 86_400_000L) + 86_400_000L) % 86_400_000L
    return ofDay / 60_000.0
  }

  /** 지평선 위 고도. 도 단위. */
  fun altitudeOf(hourAngle: Double, declination: Double, latitude: Double): Double {
    val h = toRadians(hourAngle)
    val d = toRadians(declination)
    val phi = toRadians(latitude)
    val sinAltitude = sin(phi) * sin(d) + cos(phi) * cos(d) * cos(h)
    return toDegrees(asin(min(1.0, max(-1.0, sinAltitude))))
  }

  /** 뜨고 지는 시간각. 이 폭이 곧 떠 있는 동안의 길이다. */
  fun horizonHourAngle(latitude: Double, declination: Double): Double {
    val cosine = -tan(toRadians(latitude)) * tan(toRadians(declination))
    if (cosine <= -1) return 180.0
    if (cosine >= 1) return 0.0
    return toDegrees(acos(cosine))
  }

  /** 적위를 원반 위의 반지름으로 옮긴다. 눈금을 벗어나면 안팎 끝에 붙인다. */
  fun radiusFor(declination: Double): Double {
    val t = (90 - declination - (90 - OBLIQUITY)) / (2 * OBLIQUITY)
    val r = INNER_RADIUS + (OUTER_RADIUS - INNER_RADIUS) * t
    return min(OUTER_RADIUS, max(INNER_RADIUS, r))
  }

  /** 정오가 위쪽이고 시간이 흐를수록 시계 방향으로 돈다. */
  fun flatPoint(hourAngle: Double, declination: Double): Point {
    val r = radiusFor(declination)
    val a = toRadians(hourAngle)
    return Point(r * sin(a), -r * cos(a))
  }

  /** 절기선 하나가 나타내는 적위. 황경으로 준다. */
  fun declinationOfLongitude(solarLongitude: Double): Double =
    toDegrees(asin(sin(toRadians(OBLIQUITY)) * sin(toRadians(solarLongitude))))

  fun traditionalOf(minutesOfDay: Double): Traditional {
    // 자시가 밤 열한 시에 시작하므로 그만큼 앞으로 당겨 센다.
    val shifted = (wrapMinutes(minutesOfDay) + 60) % MINUTES_PER_DAY
    val branchIndex = floor(shifted / 120).toInt()
    val withinBranch = shifted - branchIndex * 120
    val half = if (withinBranch < 60) "초" else "정"
    val quarterIndex = floor((withinBranch % 60) / 15).toInt()
    return Traditional(branchIndex, half, quarterIndex)
  }

  fun solarTermNameAt(apparentLongitude: Double): String {
    val index = floor(normalizeDegrees(apparentLongitude) / 15).toInt()
    return SOLAR_TERM_NAMES[index % SOLAR_TERM_NAMES.size]
  }

  /**
   * 그 순간 위젯이 보여 줄 것.
   *
   * 낮에는 해그림자다. 밤에는 달이 보름달 자리인 해의 정반대에 있다고 치고
   * 그 그림자를 세운다. 그 그림자가 실제 시각을 가리킨다.
   */
  fun momentAt(epochMillis: Long, latitude: Double, longitude: Double): Moment {
    val elements = solarElements(epochMillis)
    val apparentMinutes =
      wrapMinutes(utcMinutesOfDay(epochMillis) + elements.equationOfTime + 4 * longitude)
    val sunHourAngle = apparentMinutes / 4 - 180
    val sunAltitude = altitudeOf(sunHourAngle, elements.declination, latitude)
    val isDay = sunAltitude > 0

    val lightHourAngle = if (isDay) sunHourAngle else angleDifference(sunHourAngle + 180, 0.0)
    val lightDeclination = if (isDay) elements.declination else -elements.declination

    return Moment(
      isDay = isDay,
      sunAltitude = sunAltitude,
      apparentMinutes = apparentMinutes,
      dialMinutes = if (isDay) apparentMinutes else (apparentMinutes + MINUTES_PER_DAY / 2) % MINUTES_PER_DAY,
      tip = flatPoint(lightHourAngle, lightDeclination),
      lightDeclination = lightDeclination,
      halfDayAngle = horizonHourAngle(latitude, lightDeclination),
      traditional = traditionalOf(apparentMinutes),
      solarTermName = solarTermNameAt(elements.apparentLongitude)
    )
  }
}
