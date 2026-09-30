package com.dobedub.angbuilgu.widget

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.text.format.DateFormat
import android.view.View
import android.widget.FrameLayout
import android.widget.TextClock
import java.io.File
import java.util.Date
import kotlin.math.roundToInt

/**
 * 위젯과 대기화면을 화면 밖에서 그려 그림 파일로 남긴다.
 *
 * 위젯 고르는 화면에 뜰 그림을 뽑고, 크기마다 모양이 맞는지 눈으로 보는 데 쓴다.
 * 밖에서는 부를 수 없게 닫아 두었다. `scripts/render-widget-previews.sh`가
 * 에뮬레이터에서 관리자 권한으로 부른다.
 *
 *   time  그릴 시각. 1970년부터의 밀리초. 없으면 지금이다.
 *   lat, lon  그릴 자리. 없으면 적어 둔 자리다.
 */
class PreviewReceiver : BroadcastReceiver() {
  private class Spec(val name: String, val widthDp: Float, val heightDp: Float)

  override fun onReceive(context: Context, intent: Intent) {
    val time = intent.getStringExtra("time")?.toLongOrNull() ?: System.currentTimeMillis()
    val stored = PlaceStore.load(context)
    val place = PlaceStore.Place(
      intent.getStringExtra("lat")?.toDoubleOrNull() ?: stored.latitude,
      intent.getStringExtra("lon")?.toDoubleOrNull() ?: stored.longitude
    )
    val tag = intent.getStringExtra("tag") ?: "now"

    val out = File(context.getExternalFilesDir(null), "previews").apply { mkdirs() }
    val density = context.resources.displayMetrics.density

    for (spec in WIDGETS) {
      val views = WidgetRenderer.build(context, spec.widthDp, spec.heightDp, time, place)
      val view = views.apply(context.applicationContext, FrameLayout(context))
      // 시계 숫자는 화면에 붙어야 돌기 시작한다. 화면 밖에서는 손으로 적어 준다.
      view.findViewById<TextClock>(R.id.angbuilgu_clock)?.let { clock ->
        val format =
          if (DateFormat.is24HourFormat(context)) clock.format24Hour else clock.format12Hour
        // 따로 정하지 않은 시계는 기기의 말과 습관을 따른다.
        clock.text = format?.let { DateFormat.format(it, time) }
          ?: DateFormat.getTimeFormat(context).format(Date(time))
      }
      save(view, spec, density, File(out, "${spec.name}-$tag.png"))
    }
    for (spec in STANDBY) {
      val view = StandbyView(context).apply { showAt(time) }
      save(view, spec, density, File(out, "${spec.name}-$tag.png"))
    }
  }

  private fun save(view: View, spec: Spec, density: Float, file: File) {
    val width = (spec.widthDp * density).roundToInt()
    val height = (spec.heightDp * density).roundToInt()
    view.measure(
      View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
      View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY)
    )
    view.layout(0, 0, width, height)

    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    view.draw(Canvas(bitmap))
    file.outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
  }

  companion object {
    private val WIDGETS = listOf(
      Spec("strip", 170f, 84f),
      Spec("strip-wide", 340f, 84f),
      Spec("small", 160f, 170f),
      Spec("wide", 320f, 150f),
      Spec("large", 330f, 360f)
    )
    private val STANDBY = listOf(
      Spec("standby-landscape", 800f, 360f),
      Spec("standby-portrait", 360f, 800f)
    )
  }
}
