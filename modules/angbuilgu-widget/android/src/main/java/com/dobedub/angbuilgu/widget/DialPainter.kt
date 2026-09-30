package com.dobedub.angbuilgu.widget

import android.graphics.Bitmap
import android.graphics.BlurMaskFilter
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import kotlin.math.abs
import kotlin.math.atan
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.math.tan

/**
 * 펼친 원반을 그린다. 앱의 `Plate`, `Hand`, `Gnomon`을 옮긴 것이다.
 *
 * 위젯은 나침반을 읽지 못하므로 언제나 북쪽을 맞춘 모습이다. 그래서 맞춘
 * 뒤의 빛깔로 그리고, 그림자는 제 시각의 눈금 위에 세운다.
 *
 * 작을수록 덜 그린다. 눈금이 촘촘하면 작은 크기에서는 얼룩으로 보인다.
 */
object DialPainter {
  enum class Detail {
    /** 시가 갈리는 금과 그림자만. 이름은 옆의 글이 맡는다. */
    BARE,
    /** 절기선 몇 줄과 30분 눈금을 더한다. */
    PLAIN,
    /** 절기선을 모두 긋고 바깥 고리에 열두 이름을 앉힌다. */
    FULL
  }

  /**
   * 눈금판 바깥, 곧 바탕 위에 그리는 것의 빛깔.
   *
   * 바깥 고리와 이름은 눈금판이 아니라 그 뒤의 바탕 위에 놓인다. 위젯은 바탕도
   * 같은 빛깔로 물들어서 그대로 쓰면 되지만, 대기화면은 바탕이 언제나 어둡다.
   * 낮의 짙은 먹빛으로 쓰면 보이지 않으므로 그때는 밝은 빛깔을 따로 준다.
   */
  class OutsideInk(val line: Int, val major: Int, val label: Int)

  /** 이름이 앉는 바깥 고리의 폭. */
  const val BEZEL = 0.12

  /** 반지름을 1로 볼 때 그림이 차지하는 데까지. 바깥 고리와 빛무리를 담는다. */
  const val EXTENT = Almanac.OUTER_RADIUS + BEZEL + 0.025

  private const val BEZEL_GAP = 1.2
  private const val MOON_BAND = 0.055
  private const val HALF_BRANCH = 15.0

  fun detailFor(diameterDp: Float): Detail = when {
    diameterDp < 120f -> Detail.BARE
    diameterDp < 190f -> Detail.PLAIN
    else -> Detail.FULL
  }

  fun bitmap(
    sizePx: Int,
    moment: Almanac.Moment,
    palette: DialPalette,
    latitude: Double,
    detail: Detail
  ): Bitmap {
    val bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
    val half = sizePx / 2f
    draw(Canvas(bitmap), half, half, (half / EXTENT).toFloat(), moment, palette, latitude, detail)
    return bitmap
  }

  private fun argb(color: Int, alpha: Double): Int =
    (color and 0xffffff) or ((alpha.coerceIn(0.0, 1.0) * 255).roundToInt() shl 24)

  fun draw(
    canvas: Canvas,
    cx: Float,
    cy: Float,
    radius: Float,
    moment: Almanac.Moment,
    palette: DialPalette,
    latitude: Double,
    detail: Detail,
    outside: OutsideInk? = null
  ) {
    val ink = outside ?: OutsideInk(palette.line, palette.lineMajor, palette.label)
    val inner = Almanac.INNER_RADIUS
    val outer = Almanac.OUTER_RADIUS
    // 눈금은 북반구의 중위도까지만 새길 수 있다. 벗어나면 끝에 붙여 그린다.
    val phi = latitude.coerceIn(1.0, 65.0)

    fun px(r: Double): Float = (r * radius).toFloat()
    fun xAt(hourAngle: Double, r: Double): Float =
      cx + (sin(Almanac.toRadians(hourAngle)) * r * radius).toFloat()
    fun yAt(hourAngle: Double, r: Double): Float =
      cy - (cos(Almanac.toRadians(hourAngle)) * r * radius).toFloat()
    fun rect(r: Double): RectF = RectF(cx - px(r), cy - px(r), cx + px(r), cy + px(r))

    fun fill(color: Int, alpha: Double): Paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      style = Paint.Style.FILL
      this.color = argb(color, alpha)
    }

    /** 한 화소보다 가는 줄은 한 화소로 긋고 그만큼 옅게 한다. */
    fun stroke(color: Int, alpha: Double, width: Double): Paint {
      val w = px(width)
      return Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = max(w, 1f)
        this.color = argb(color, if (w < 1f) alpha * max(w.toDouble(), 0.5) else alpha)
      }
    }

    fun arc(r: Double, centerHourAngle: Double, halfWidth: Double, paint: Paint) {
      // 캔버스는 세 시 방향이 0도다. 정오가 위쪽이므로 90도를 뺀다.
      canvas.drawArc(
        rect(r),
        (centerHourAngle - halfWidth - 90).toFloat(),
        (2 * halfWidth).toFloat(),
        false,
        paint
      )
    }

    fun radial(hourAngle: Double, from: Double, to: Double, paint: Paint) {
      canvas.drawLine(
        xAt(hourAngle, from), yAt(hourAngle, from),
        xAt(hourAngle, to), yAt(hourAngle, to),
        paint
      )
    }

    /** 그 시간각에 해가 떠 있을 수 있는 가장 낮은 적위. */
    fun lowestDaylightDeclination(hourAngle: Double): Double =
      Almanac.toDegrees(atan(-cos(Almanac.toRadians(hourAngle)) / tan(Almanac.toRadians(phi))))

    // 바탕. 가운데가 밝고 가장자리로 가라앉는다.
    canvas.drawCircle(cx, cy, px(outer), Paint(Paint.ANTI_ALIAS_FLAG).apply {
      shader = RadialGradient(
        cx, cy - radius * 0.2f, px(outer) * 1.35f,
        argb(palette.bowl, 1.0), argb(palette.bowlDeep, 1.0),
        Shader.TileMode.CLAMP
      )
    })
    canvas.drawCircle(cx, cy, px(outer), stroke(palette.glow, 0.3, 0.09).apply {
      maskFilter = BlurMaskFilter(max(radius * 0.03f, 0.5f), BlurMaskFilter.Blur.NORMAL)
    })
    canvas.drawCircle(
      cx, cy, px(outer),
      stroke(DialPalette.lerpColor(palette.rim, palette.glow, 0.45), 1.0, 0.035)
    )

    // 절기선. 온 둘레는 옅게, 해가 떠 있는 구간만 또렷하게 긋는다.
    val ringLongitudes = when (detail) {
      Detail.FULL -> listOf(0.0, 15.0, 30.0, 45.0, 60.0, 75.0, 90.0)
      Detail.PLAIN -> listOf(0.0, 45.0)
      Detail.BARE -> emptyList()
    }
    for (longitude in ringLongitudes) {
      val declination = Almanac.declinationOfLongitude(longitude)
      val both = if (longitude == 0.0) listOf(0.0) else listOf(declination, -declination)
      for (d in both) {
        val r = Almanac.radiusFor(d)
        canvas.drawCircle(cx, cy, px(r), stroke(palette.line, 0.22, 0.004))
        val halfDay = Almanac.horizonHourAngle(phi, d)
        if (moment.isDay && halfDay > 0) arc(r, 0.0, halfDay, stroke(palette.line, 0.85, 0.007))
      }
    }

    // 지금 빛이 지나는 길. 낮에는 해, 밤에는 보름달 자리다.
    val pathRadius = Almanac.radiusFor(moment.lightDeclination)
    val pathHalf = Almanac.horizonHourAngle(phi, moment.lightDeclination)

    // 시각선. 30분마다 하나씩 하루를 한 바퀴 돈다.
    for (minutes in 0 until 1440 step 30) {
      val hourAngle = minutes / 4.0 - 180
      val isMajor = minutes % 120 == 0
      val isEdge = (minutes + 60) % 120 == 0
      if (detail == Detail.BARE && !isMajor && !isEdge) continue

      radial(
        hourAngle, inner, outer,
        stroke(
          palette.line,
          if (isEdge) 0.55 else if (isMajor) 0.3 else 0.2,
          if (isEdge) 0.013 else if (isMajor) 0.006 else 0.004
        )
      )

      val bright = stroke(
        if (isMajor || isEdge) palette.lineMajor else palette.line,
        if (isEdge) 0.95 else if (isMajor) 0.7 else 0.5,
        if (isEdge) 0.019 else if (isMajor) 0.008 else 0.005
      )
      if (moment.isDay) {
        val lowest = lowestDaylightDeclination(hourAngle)
        if (lowest < Almanac.OBLIQUITY) {
          radial(hourAngle, inner, Almanac.radiusFor(max(-Almanac.OBLIQUITY, lowest)), bright)
        }
      } else if (pathHalf > 0 && abs(hourAngle) <= pathHalf) {
        radial(
          hourAngle,
          max(inner, pathRadius - MOON_BAND),
          min(outer, pathRadius + MOON_BAND),
          bright
        )
      }
    }

    if (pathHalf > 0 && (!moment.isDay || detail != Detail.FULL)) {
      arc(
        pathRadius, 0.0, pathHalf,
        stroke(if (moment.isDay) palette.lineMajor else palette.star, 0.8, 0.009)
      )
    }

    // 그림자가 걸린 시의 고리 조각.
    val currentBranch = (moment.dialMinutes / 120.0).roundToInt() % 12
    val currentHourAngle = currentBranch * 30.0 - 180
    val sector = Path().apply {
      arcTo(rect(outer + BEZEL), (currentHourAngle - HALF_BRANCH - 90).toFloat(), (2 * HALF_BRANCH).toFloat())
      arcTo(rect(outer), (currentHourAngle + HALF_BRANCH - 90).toFloat(), (-2 * HALF_BRANCH).toFloat())
      close()
    }
    canvas.drawPath(sector, fill(palette.glow, if (detail == Detail.BARE) 0.42 else 0.28))

    // 이름이 앉는 바깥 고리. 시가 갈리는 자리마다 끊겨 열두 토막이다.
    for (branch in 0 until 12) {
      val hourAngle = branch * 30.0 - 180
      arc(outer + BEZEL, hourAngle, HALF_BRANCH - BEZEL_GAP, stroke(ink.line, 0.5, 0.006))
      radial(hourAngle + HALF_BRANCH, outer, outer + BEZEL, stroke(ink.major, 0.8, 0.012))
    }
    // 지금 시의 토막은 테두리도 짙게 두른다. 작은 크기에서는 옅은 빛만으로 눈에 띄지 않는다.
    arc(
      outer + BEZEL, currentHourAngle, HALF_BRANCH - BEZEL_GAP,
      stroke(palette.accent, 0.95, if (detail == Detail.BARE) 0.034 else 0.022)
    )

    // 가운데 영침 자리.
    canvas.drawCircle(cx, cy, px(inner), stroke(palette.line, 0.45, 0.006))

    // 그림자. 뿌리에서 넓고 끝으로 갈수록 좁아지며 가장자리는 흐리다.
    val tip = moment.tip
    val length = hypot(tip.x, tip.y)
    if (length > 0) {
      val nx = -tip.y / length
      val ny = tip.x / length
      val swell = if (detail == Detail.BARE) 1.5 else 1.0

      fun band(rootWidth: Double, tipWidth: Double): Path = Path().apply {
        val r = rootWidth * swell / 2
        val t = tipWidth * swell / 2
        moveTo(cx + px(nx * r), cy + px(ny * r))
        lineTo(cx + px(tip.x + nx * t), cy + px(tip.y + ny * t))
        lineTo(cx + px(tip.x - nx * t), cy + px(tip.y - ny * t))
        lineTo(cx - px(nx * r), cy - px(ny * r))
        close()
      }

      canvas.drawPath(band(0.085, 0.04), fill(palette.shadow, 0.18).apply {
        maskFilter = BlurMaskFilter(max(radius * 0.03f, 0.5f), BlurMaskFilter.Blur.NORMAL)
      })
      canvas.drawPath(band(0.05, 0.012), fill(palette.shadow, 0.6).apply {
        maskFilter = BlurMaskFilter(max(radius * 0.008f, 0.5f), BlurMaskFilter.Blur.NORMAL)
      })

      val tx = cx + px(tip.x)
      val ty = cy + px(tip.y)
      canvas.drawCircle(tx, ty, px(0.085 * swell), fill(palette.glow, 0.55))
      canvas.drawCircle(tx, ty, px(0.024 * swell), fill(palette.shadow, 0.85))
      canvas.drawCircle(tx, ty, px(0.011 * swell), fill(palette.glow, 1.0))
    }

    // 영침. 극축을 따라 서 있어 끝에서 내려다보면 점 하나로 보인다.
    canvas.drawCircle(cx, cy, px(0.052), fill(palette.rim, 0.9))
    canvas.drawCircle(cx, cy, px(0.034), fill(palette.lineMajor, 1.0))
    canvas.drawCircle(cx - px(0.011), cy - px(0.011), px(0.012), fill(palette.rim, 0.75))

    // 열두 이름. 밤에는 달로 읽는 이름이 앞으로 나온다.
    if (detail == Detail.FULL) {
      val bold = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
      for (branch in 0 until 12) {
        val hourAngle = branch * 30.0 - 180
        val name = Almanac.BRANCH_NAMES[if (moment.isDay) branch else (branch + 6) % 12]
        // 해도 달도 닿지 않는 시각은 자리만 지킨다.
        val idle = lowestDaylightDeclination(hourAngle) >= Almanac.OBLIQUITY
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
          textAlign = Paint.Align.CENTER
          textSize = px(0.095)
          typeface = if (idle) Typeface.DEFAULT else bold
          color = argb(ink.label, if (idle && branch != currentBranch) 0.62 else 1.0)
        }
        val metrics = paint.fontMetrics
        canvas.drawText(
          name,
          xAt(hourAngle, outer + BEZEL / 2),
          yAt(hourAngle, outer + BEZEL / 2) - (metrics.ascent + metrics.descent) / 2,
          paint
        )
      }
    }
  }
}
