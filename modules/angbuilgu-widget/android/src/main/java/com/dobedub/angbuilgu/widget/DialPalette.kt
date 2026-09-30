package com.dobedub.angbuilgu.widget

import kotlin.math.max
import kotlin.math.min

/**
 * 해 높이에 따라 물드는 빛깔. `src/theme.ts`를 옮긴 것이다.
 * 색은 0xRRGGBB로 든다. 투명도는 그릴 때 붙인다.
 */
data class DialPalette(
  val background: Int,
  val backgroundEdge: Int,
  val bowl: Int,
  val bowlDeep: Int,
  val rim: Int,
  val line: Int,
  val lineMajor: Int,
  val label: Int,
  val shadow: Int,
  val glow: Int,
  val accent: Int,
  val text: Int,
  val textSoft: Int,
  val card: Int,
  val star: Int
) {
  fun toList(): List<Int> = listOf(
    background, backgroundEdge, bowl, bowlDeep, rim, line, lineMajor, label,
    shadow, glow, accent, text, textSoft, card, star
  )

  companion object {
    /** 따뜻한 돌빛. */
    val DAY = DialPalette(
      0xf7efe2, 0xe6d5bd, 0xdcc9ad, 0xb79f80, 0xf2e6d3, 0x7d6a52, 0x4f4131, 0x3d3125,
      0x3a2e21, 0xffd79a, 0xd98a2b, 0x3d3125, 0x7d6a52, 0xfffaf1, 0xfff6e3
    )

    /** 푸른 달빛. */
    val NIGHT = DialPalette(
      0x111830, 0x0a0f22, 0x26304e, 0x161d33, 0x3b4870, 0x7d91c4, 0xb9c9f2, 0xd7e2ff,
      0x070b18, 0x9dc2ff, 0x8fb4ff, 0xe6ecff, 0x93a2cc, 0x1b2340, 0xffffff
    )

    /** 해가 지평선에 걸린 노을빛. 밤과 낮 사이를 이 색으로 지나 회색을 피한다. */
    val DUSK = DialPalette(
      0xeccfb4, 0xd2ad8e, 0xcdae90, 0xa17f64, 0xf0d9c0, 0x6f5745, 0x47372b, 0x3d2f26,
      0x382820, 0xffbe74, 0xd0762f, 0x3d2f26, 0x7b6350, 0xf8e5d0, 0xffe6c6
    )

    private const val TWILIGHT_LOW = -6.0
    private const val TWILIGHT_HIGH = 6.0

    private fun clamp01(value: Double): Double = min(1.0, max(0.0, value))

    fun lerpColor(from: Int, to: Int, t: Double): Int {
      val ratio = clamp01(t)
      var result = 0
      for (shift in intArrayOf(16, 8, 0)) {
        val a = (from shr shift) and 0xff
        val b = (to shr shift) and 0xff
        result = result or (Math.round(a + (b - a) * ratio).toInt() shl shift)
      }
      return result
    }

    private fun blend(from: DialPalette, to: DialPalette, t: Double): DialPalette {
      val a = from.toList()
      val b = to.toList()
      val c = a.indices.map { lerpColor(a[it], b[it], t) }
      return DialPalette(
        c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], c[8], c[9], c[10], c[11], c[12], c[13], c[14]
      )
    }

    /** 해가 지평선 언저리에 있는 동안 밤빛과 낮빛이 노을빛을 지나 섞인다. */
    fun themeAt(sunAltitude: Double): DialPalette {
      val t = clamp01((sunAltitude - TWILIGHT_LOW) / (TWILIGHT_HIGH - TWILIGHT_LOW))
      if (t == 0.0) return NIGHT
      if (t == 1.0) return DAY
      return if (t < 0.5) blend(NIGHT, DUSK, t * 2) else blend(DUSK, DAY, (t - 0.5) * 2)
    }

    fun hex(color: Int): String = String.format("#%06x", color and 0xffffff)
  }
}
