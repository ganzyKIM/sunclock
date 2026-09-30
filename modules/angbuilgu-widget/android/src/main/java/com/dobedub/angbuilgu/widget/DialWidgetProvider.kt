package com.dobedub.angbuilgu.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.os.Bundle

/**
 * 홈 화면과 잠금 화면에 놓는 눈금판.
 *
 * 5분마다의 알람과 시각·시간대가 바뀌었다는 알림도 여기서 받는다.
 */
open class DialWidgetProvider : AppWidgetProvider() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      WidgetUpdater.ACTION_TICK,
      Intent.ACTION_TIME_CHANGED,
      Intent.ACTION_TIMEZONE_CHANGED -> {
        WidgetUpdater.updateAll(context)
        if (intent.action != WidgetUpdater.ACTION_TICK) WidgetUpdater.reschedule(context)
      }
      else -> super.onReceive(context, intent)
    }
  }

  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    WidgetUpdater.updateAll(context)
    // 기기를 다시 켜면 알람이 사라진다. 시스템이 이때 한 번 부르므로 다시 건다.
    WidgetUpdater.reschedule(context)
  }

  override fun onAppWidgetOptionsChanged(
    context: Context,
    manager: AppWidgetManager,
    id: Int,
    options: Bundle
  ) {
    WidgetUpdater.updateAll(context)
  }

  override fun onDeleted(context: Context, ids: IntArray) {
    WidgetUpdater.reschedule(context)
  }

  override fun onDisabled(context: Context) {
    WidgetUpdater.reschedule(context)
  }
}

/** 가로로 긴 쪽. 고르는 화면에서 따로 보이도록 이름만 나눴다. */
class WideDialWidgetProvider : DialWidgetProvider()
