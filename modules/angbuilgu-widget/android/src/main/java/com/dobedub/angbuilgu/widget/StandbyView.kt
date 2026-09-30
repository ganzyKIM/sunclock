package com.dobedub.angbuilgu.widget

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.Shader
import android.graphics.Typeface
import android.text.format.DateFormat
import android.view.View
import java.util.Date
import java.util.Locale
import kotlin.math.max
import kotlin.math.min

/**
 * 대기화면. 충전하는 동안 화면을 눈금판 하나로 채운다.
 *
 * 바탕은 언제나 깊은 쪽빛이다. 머리맡에 세워 두어도 눈이 부시지 않아야 한다.
 * 그 위에 눈금판만 그때의 빛깔로 뜬다. 낮에는 돌빛, 밤에는 달빛이다.
 * 가로로 누이면 눈금판 옆에, 세우면 아래에 글을 둔다.
 */
class StandbyView(context: Context) : View(context) {
  private var epochMillis = System.currentTimeMillis()
  private var place = PlaceStore.load(context)
  private var moment = Almanac.momentAt(epochMillis, place.latitude, place.longitude)
  private var palette = DialPalette.themeAt(moment.sunAltitude)

  private val density = resources.displayMetrics.density
  private val bold = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)

  init {
    // 그림자의 흐린 가장자리는 하드웨어 가속에서 그려지지 않는다.
    setLayerType(LAYER_TYPE_SOFTWARE, null)
  }

  fun showAt(epochMillis: Long) {
    this.epochMillis = epochMillis
    place = PlaceStore.load(context)
    moment = Almanac.momentAt(epochMillis, place.latitude, place.longitude)
    palette = DialPalette.themeAt(moment.sunAltitude)
    invalidate()
  }

  private fun text(size: Float, color: Int, face: Typeface, align: Paint.Align): Paint =
    Paint(Paint.ANTI_ALIAS_FLAG).apply {
      textSize = size
      this.color = color
      typeface = face
      textAlign = align
    }

  override fun onDraw(canvas: Canvas) {
    val w = width.toFloat()
    val h = height.toFloat()
    if (w <= 0 || h <= 0) return

    canvas.drawColor(INK)
    val landscape = w > h

    // 같은 자리에 오래 머물면 화면에 자국이 남는다. 1분마다 조금씩 옮긴다.
    val step = ((epochMillis / 60_000L) % DRIFT.size).toInt()
    val dx = DRIFT[step][0] * DRIFT_DP * density
    val dy = DRIFT[step][1] * DRIFT_DP * density

    val diameter = if (landscape) min(h * 0.84f, w * 0.46f) else min(w * 0.86f, h * 0.48f)

    val time = moment.traditional
    val date = Date(epochMillis)
    val title = "${time.branchHanja} ${time.label}"
    val clock = DateFormat.getTimeFormat(context).format(date)
    val day = DateFormat.format(
      DateFormat.getBestDateTimePattern(Locale.getDefault(), "MMMMdEEEE"), date
    )
    val foot = context.getString(R.string.angbuilgu_standby_foot, moment.solarTermName, day)

    val align = if (landscape) Paint.Align.LEFT else Paint.Align.CENTER
    val room = if (landscape) w * 0.40f else w * 0.86f
    // 가장 긴 줄이 자리를 넘지 않게 글 크기를 맞춘다.
    var titleSize = if (landscape) h * 0.15f else w * 0.105f
    val probe = text(titleSize, IVORY, bold, align)
    val widest = max(probe.measureText(title), probe.measureText(clock) * CLOCK_SHARE)
    if (widest > room) titleSize *= room / widest

    val titlePaint = text(titleSize, IVORY, bold, align)
    val clockPaint = text(titleSize * CLOCK_SHARE, SOFT_IVORY, Typeface.DEFAULT, align)
    val footPaint = text(max(titleSize * FOOT_SHARE, 11f * density), QUIET, Typeface.DEFAULT, align)
    val gap = titleSize * 0.42f
    val block = titlePaint.textSize + gap + clockPaint.textSize + gap + footPaint.textSize
    val lead = titleSize * 0.7f

    // 세우면 눈금판과 글을 한 덩어리로 보고 화면 가운데에 둔다.
    val top = (h - (diameter + lead + block)) / 2f
    val cx = (if (landscape) w * 0.28f else w / 2f) + dx
    val cy = (if (landscape) h / 2f else top + diameter / 2f) + dy

    // 눈금판 뒤로 옅은 빛이 고인다. 가장자리는 어둠으로 돌아간다.
    canvas.drawCircle(cx, cy, diameter * 0.95f, Paint(Paint.ANTI_ALIAS_FLAG).apply {
      shader = RadialGradient(
        cx, cy, diameter * 0.95f,
        intArrayOf(POOL, POOL and 0x00ffffff),
        floatArrayOf(0.35f, 1f),
        Shader.TileMode.CLAMP
      )
    })

    DialPainter.draw(
      canvas, cx, cy, (diameter / 2f / DialPainter.EXTENT).toFloat(),
      moment, palette, place.latitude, DialPainter.detailFor(diameter / density),
      OUTSIDE
    )

    val x = (if (landscape) w * 0.56f else w / 2f) + dx
    var y = if (landscape) (h - block) / 2f + dy else cy + diameter / 2f + lead

    y += titlePaint.textSize
    canvas.drawText(title, x, y - titlePaint.descent() * 0.5f, titlePaint)
    y += gap + clockPaint.textSize
    canvas.drawText(clock, x, y - clockPaint.descent() * 0.5f, clockPaint)
    y += gap + footPaint.textSize
    canvas.drawText(foot, x, y - footPaint.descent() * 0.5f, footPaint)
  }

  companion object {
    /** 아이콘과 첫 화면의 그 쪽빛. */
    private const val INK = 0xff0a0f1e.toInt()
    private const val POOL = 0x2a3b4870
    private const val IVORY = 0xfff2e6d3.toInt()
    private const val SOFT_IVORY = 0xffd9ccb4.toInt()
    private const val QUIET = 0xff93a2cc.toInt()

    /** 눈금판 밖의 고리와 이름. 어두운 바탕 위라 밝은 빛깔로 쓴다. */
    private val OUTSIDE = DialPainter.OutsideInk(0xd9ccb4, 0xf2e6d3, 0xf2e6d3)

    private const val CLOCK_SHARE = 0.78f
    private const val FOOT_SHARE = 0.34f

    private const val DRIFT_DP = 5f
    private val DRIFT = arrayOf(
      floatArrayOf(0f, 0f), floatArrayOf(1f, 0f), floatArrayOf(1f, 1f), floatArrayOf(0f, 1f),
      floatArrayOf(-1f, 1f), floatArrayOf(-1f, 0f), floatArrayOf(-1f, -1f), floatArrayOf(0f, -1f),
      floatArrayOf(1f, -1f)
    )
  }
}
