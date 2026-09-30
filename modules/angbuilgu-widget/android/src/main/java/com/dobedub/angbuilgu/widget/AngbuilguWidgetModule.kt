package com.dobedub.angbuilgu.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** 앱이 위젯에게 자리를 알려 주고, 위젯을 놓거나 대기화면 설정을 여는 길. */
class AngbuilguWidgetModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("AngbuilguWidget")

    // 앱이 아는 자리를 적어 두고, 놓여 있는 위젯을 그 자리로 다시 그린다.
    Function("setPlace") { latitude: Double, longitude: Double ->
      PlaceStore.save(context, latitude, longitude)
      WidgetUpdater.updateAll(context)
      WidgetUpdater.reschedule(context)
      WidgetUpdater.publishPreviews(context)
    }

    // 런처가 앱에서 바로 위젯을 놓게 해 주는지.
    Function("canPinWidget") {
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
        AppWidgetManager.getInstance(context)?.isRequestPinAppWidgetSupported == true
    }

    // 홈 화면에 위젯을 놓겠느냐고 런처가 묻게 한다. 물었으면 참이다.
    Function("pinWidget") { kind: String ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return@Function false
      val manager = AppWidgetManager.getInstance(context) ?: return@Function false
      if (!manager.isRequestPinAppWidgetSupported) return@Function false
      val provider =
        if (kind == "wide") WideDialWidgetProvider::class.java else DialWidgetProvider::class.java
      manager.requestPinAppWidget(ComponentName(context, provider), null, null)
    }

    // 안드로이드의 화면 보호기 설정을 연다. 거기서 앙부일구를 고른다.
    Function("openStandbySettings") {
      for (action in listOf(Settings.ACTION_DREAM_SETTINGS, Settings.ACTION_DISPLAY_SETTINGS)) {
        try {
          context.startActivity(Intent(action).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
          return@Function true
        } catch (_: Exception) {
          // 이 설정 화면이 없는 기기다. 다음 것을 열어 본다.
        }
      }
      false
    }
  }
}
