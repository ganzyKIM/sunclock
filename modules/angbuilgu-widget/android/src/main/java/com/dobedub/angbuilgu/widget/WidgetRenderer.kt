package com.dobedub.angbuilgu.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.util.SizeF
import android.util.TypedValue
import android.widget.RemoteViews
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * 위젯 하나를 그 크기에 맞게 짠다.
 *
 * 작을수록 덜어 낸다. 가장 작을 때는 눈금판과 시 이름, 시계 숫자뿐이다.
 * 넓어지면 각까지 적고 절기를 보태며, 크면 눈금판에 열두 이름을 앉힌다.
 */
object WidgetRenderer {
  /**
   * 크기에 따라 고르는 네 가지 모양.
   *
   * `edgeDp`는 가장자리 여백이고 `textDp`는 눈금판 아래 글줄이 차지하는 높이다.
   * 글이 옆에 놓이는 모양은 아래에 글줄이 없다.
   */
  enum class Shape(
    val layout: Int,
    val hasTerm: Boolean,
    val fullLabel: Boolean,
    val edgeDp: Float,
    val textDp: Float
  ) {
    /** 한 줄 높이. 눈금판 옆에 글을 둔다. */
    STRIP(R.layout.angbuilgu_widget_strip, false, false, 6f, 0f),
    /** 네모. 눈금판 아래에 한 줄. */
    SMALL(R.layout.angbuilgu_widget_small, false, false, 8f, 24f),
    /** 가로로 긴 것. 눈금판 옆에 세 줄. */
    WIDE(R.layout.angbuilgu_widget_wide, true, true, 10f, 0f),
    /** 큰 네모. 이름을 새긴 눈금판 아래에 두 줄. */
    LARGE(R.layout.angbuilgu_widget_large, true, true, 12f, 50f)
  }

  /** 비트맵이 너무 크면 런처로 건너가지 못한다. */
  private const val MAX_DIAL_PX = 720

  /**
   * 런처가 알려 주는 높이를 이만큼만 믿는다.
   *
   * 픽셀 런처는 실제로 놓이는 것보다 5퍼센트쯤 큰 높이를 알려 준다. 그대로
   * 믿으면 맞는 크기가 없다고 보고 엉뚱한 쪽의 모양을 고르고, 눈금판은 자리를
   * 넘친다. 조금 작게 잡아 두면 남는 자리는 여백이 될 뿐이다.
   */
  private const val HEIGHT_TRUST = 0.93f

  /** 가로로 긴 모양에서 눈금판과 글 사이의 틈, 그리고 가장 긴 이름의 글자 수. */
  private const val WIDE_GAP_DP = 16f
  private const val WIDE_TITLE_EMS = 5.8f

  fun shapeFor(widthDp: Float, heightDp: Float): Shape = when {
    heightDp < 100f -> Shape.STRIP
    widthDp >= 250f && heightDp >= 230f -> Shape.LARGE
    widthDp >= 200f && widthDp >= heightDp * 1.25f -> Shape.WIDE
    else -> Shape.SMALL
  }

  /** 그 모양에서 눈금판이 차지할 지름. 여백과 글줄을 뺀 나머지다. */
  fun dialDiameterDp(shape: Shape, widthDp: Float, heightDp: Float): Float {
    val tall = heightDp - 2 * shape.edgeDp - shape.textDp
    // 글이 옆에 놓이는 모양은 눈금판이 폭의 절반을 넘지 않게 한다.
    val wide = if (shape.textDp > 0f) widthDp - 2 * shape.edgeDp else widthDp * 0.5f
    return min(tall, wide).coerceAtLeast(40f)
  }

  private fun opaque(color: Int): Int = color or (0xff shl 24)

  fun build(
    context: Context,
    widthDp: Float,
    heightDp: Float,
    epochMillis: Long,
    place: PlaceStore.Place
  ): RemoteViews {
    val moment = Almanac.momentAt(epochMillis, place.latitude, place.longitude)
    val palette = DialPalette.themeAt(moment.sunAltitude)
    val shape = shapeFor(widthDp, heightDp)

    val diameterDp = dialDiameterDp(shape, widthDp, heightDp)
    val density = context.resources.displayMetrics.density
    val sizePx = min((diameterDp * density).roundToInt(), MAX_DIAL_PX)
    val dial = DialPainter.bitmap(
      sizePx, moment, palette, place.latitude, DialPainter.detailFor(diameterDp)
    )

    val time = moment.traditional
    val name = if (shape.fullLabel) time.label else time.shortLabel

    return RemoteViews(context.packageName, shape.layout).apply {
      setImageViewBitmap(R.id.angbuilgu_dial, dial)
      setContentDescription(
        R.id.angbuilgu_dial,
        context.getString(R.string.angbuilgu_widget_reading, time.label)
      )
      setInt(R.id.angbuilgu_bg, "setColorFilter", opaque(palette.background))

      setTextViewText(R.id.angbuilgu_title, "${time.branchHanja} $name")
      if (shape == Shape.WIDE) {
        // 옆자리가 좁으면 글을 줄인다. 가장 긴 이름이 여섯 자 남짓이다.
        val room = widthDp - diameterDp - 2 * shape.edgeDp - WIDE_GAP_DP
        val size = (room / WIDE_TITLE_EMS).coerceIn(14f, 21f)
        setTextViewTextSize(R.id.angbuilgu_title, TypedValue.COMPLEX_UNIT_DIP, size)
        setTextViewTextSize(R.id.angbuilgu_clock, TypedValue.COMPLEX_UNIT_DIP, size * 0.76f)
      }
      setTextColor(R.id.angbuilgu_title, opaque(palette.text))
      setTextColor(R.id.angbuilgu_clock, opaque(palette.textSoft))

      if (shape.hasTerm) {
        setTextViewText(
          R.id.angbuilgu_term,
          context.getString(R.string.angbuilgu_widget_term, moment.solarTermName)
        )
        setTextColor(R.id.angbuilgu_term, opaque(palette.textSoft))
      }

      // 세로로 길면 눈금판과 글 사이가 벌어진다. 남는 높이를 위아래로 나눠 한 덩어리로 모은다.
      if (shape.textDp > 0f) {
        val spare = (heightDp - 2 * shape.edgeDp - shape.textDp - diameterDp).coerceAtLeast(0f)
        val side = (shape.edgeDp * density).roundToInt()
        val ends = ((shape.edgeDp + spare / 2) * density).roundToInt()
        setViewPadding(R.id.angbuilgu_content, side, ends, side, ends)
      }

      launchIntent(context)?.let { setOnClickPendingIntent(android.R.id.background, it) }
    }
  }

  /** 위젯을 누르면 앱을 연다. */
  private fun launchIntent(context: Context): PendingIntent? {
    val intent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
    return PendingIntent.getActivity(
      context, 0, intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  /**
   * 런처가 알려 준 크기에 맞춘다.
   *
   * 안드로이드 12부터는 세로와 가로의 크기를 함께 받아 둘 다 짜 둔다.
   * 그래야 화면을 돌려도 런처가 맞는 쪽을 골라 쓴다.
   */
  fun forOptions(
    context: Context,
    options: Bundle,
    fallbackWidthDp: Float,
    fallbackHeightDp: Float,
    epochMillis: Long,
    place: PlaceStore.Place
  ): RemoteViews {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      @Suppress("DEPRECATION")
      val sizes: ArrayList<SizeF>? =
        options.getParcelableArrayList(AppWidgetManager.OPTION_APPWIDGET_SIZES)
      if (!sizes.isNullOrEmpty()) {
        return RemoteViews(
          sizes.map { SizeF(it.width, it.height * HEIGHT_TRUST) }.distinct()
            .associateWith { build(context, it.width, it.height, epochMillis, place) }
        )
      }
    }

    // 세로로 든 화면의 크기는 가장 좁은 폭과 가장 큰 높이다.
    val width = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0)
    val height = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0)
    return build(
      context,
      if (width > 0) width.toFloat() else fallbackWidthDp,
      if (height > 0) height * HEIGHT_TRUST else fallbackHeightDp,
      epochMillis,
      place
    )
  }
}
