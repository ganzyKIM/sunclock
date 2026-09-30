package com.dobedub.angbuilgu.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.SystemClock

/**
 * 놓여 있는 위젯을 다시 그린다.
 *
 * 시계 숫자는 시스템이 스스로 넘긴다. 눈금판의 그림자는 한 시간에 15도밖에
 * 움직이지 않으므로 5분마다 다시 그리면 넉넉하다. 기기를 깨우지 않는 알람을
 * 쓴다. 화면이 꺼져 있으면 쉬고, 켜지면 밀린 것을 한 번에 따라잡는다.
 */
object WidgetUpdater {
  const val ACTION_TICK = "com.dobedub.angbuilgu.widget.TICK"

  private const val TICK_MS = 5 * 60 * 1000L

  private class Kind(val provider: Class<*>, val widthDp: Float, val heightDp: Float)

  /** 위젯 고르는 화면에 뜨는 두 가지. 놓은 뒤에는 어느 쪽이든 크기를 따라 모양이 바뀐다. */
  private val KINDS = listOf(
    Kind(DialWidgetProvider::class.java, 160f, 170f),
    Kind(WideDialWidgetProvider::class.java, 320f, 150f)
  )

  fun updateAll(context: Context) {
    val manager = AppWidgetManager.getInstance(context) ?: return
    val now = System.currentTimeMillis()
    val place = PlaceStore.load(context)
    for (kind in KINDS) {
      for (id in manager.getAppWidgetIds(ComponentName(context, kind.provider))) {
        manager.updateAppWidget(
          id,
          WidgetRenderer.forOptions(
            context, manager.getAppWidgetOptions(id), kind.widthDp, kind.heightDp, now, place
          )
        )
      }
    }
  }

  fun hasWidgets(context: Context): Boolean {
    val manager = AppWidgetManager.getInstance(context) ?: return false
    return KINDS.any { manager.getAppWidgetIds(ComponentName(context, it.provider)).isNotEmpty() }
  }

  private fun tickIntent(context: Context): PendingIntent =
    PendingIntent.getBroadcast(
      context, 0,
      Intent(context, DialWidgetProvider::class.java).setAction(ACTION_TICK),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

  /** 위젯이 하나라도 있으면 알람을 걸고, 없으면 거둔다. */
  fun reschedule(context: Context) {
    val alarms = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
    val intent = tickIntent(context)
    alarms.cancel(intent)
    if (!hasWidgets(context)) return
    alarms.setRepeating(
      AlarmManager.ELAPSED_REALTIME,
      SystemClock.elapsedRealtime() + TICK_MS,
      TICK_MS,
      intent
    )
  }

  /**
   * 위젯 고르는 화면에 뜰 그림을 지금 모습으로 바꿔 둔다. 안드로이드 15부터 된다.
   * 시스템이 횟수를 제한하므로 앱이 열릴 때만 부른다. 그 아래 판에서는 묶어 둔 그림이 뜬다.
   */
  fun publishPreviews(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) return
    val manager = AppWidgetManager.getInstance(context) ?: return
    val now = System.currentTimeMillis()
    val place = PlaceStore.load(context)
    for (kind in KINDS) {
      try {
        manager.setWidgetPreview(
          ComponentName(context, kind.provider),
          android.appwidget.AppWidgetProviderInfo.WIDGET_CATEGORY_HOME_SCREEN,
          WidgetRenderer.build(context, kind.widthDp, kind.heightDp, now, place)
        )
      } catch (_: Exception) {
        // 횟수를 넘겼거나 런처가 받지 않으면 묶어 둔 그림이 그대로 뜬다.
      }
    }
  }
}
