package com.dobedub.angbuilgu.widget

import android.os.Handler
import android.os.Looper
import android.service.dreams.DreamService

/**
 * 안드로이드의 화면 보호기로 도는 대기화면.
 *
 * 설정의 화면 보호기에서 고르면 충전하거나 거치대에 올려 둔 동안 뜬다.
 * 1분마다 분이 넘어가는 때에 맞춰 다시 그린다.
 */
class StandbyDream : DreamService() {
  private val handler = Handler(Looper.getMainLooper())
  private var view: StandbyView? = null

  private val tick = object : Runnable {
    override fun run() {
      val now = System.currentTimeMillis()
      view?.showAt(now)
      handler.postDelayed(this, MINUTE_MS - now % MINUTE_MS + SLACK_MS)
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    // 만지면 깨어나고, 화면을 가득 채우며, 밝기는 낮춘다.
    isInteractive = false
    isFullscreen = true
    isScreenBright = false
    view = StandbyView(this).also { setContentView(it) }
  }

  override fun onDreamingStarted() {
    super.onDreamingStarted()
    tick.run()
  }

  override fun onDreamingStopped() {
    handler.removeCallbacks(tick)
    super.onDreamingStopped()
  }

  override fun onDetachedFromWindow() {
    handler.removeCallbacks(tick)
    view = null
    super.onDetachedFromWindow()
  }

  companion object {
    private const val MINUTE_MS = 60_000L
    private const val SLACK_MS = 40L
  }
}
