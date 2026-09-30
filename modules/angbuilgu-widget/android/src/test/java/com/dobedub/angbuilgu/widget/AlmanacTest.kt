package com.dobedub.angbuilgu.widget

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * 코틀린으로 다시 적은 셈이 앱의 셈과 같은 값을 내는지 본다.
 * 기준값은 `src/lib/widget/moment.test.ts`가 뽑는다.
 */
class AlmanacTest {
  private fun lines(name: String): List<List<String>> {
    val stream = checkNotNull(javaClass.classLoader?.getResourceAsStream(name)) { "$name 이 없다" }
    return stream.bufferedReader(Charsets.UTF_8).readLines()
      .filter { it.isNotBlank() }
      .map { it.split("\t") }
  }

  @Test
  fun 순간이_앱과_같다() {
    val rows = lines("moments.tsv")
    assertTrue(rows.size >= 30)

    for (row in rows) {
      val moment = Almanac.momentAt(row[0].toLong(), row[1].toDouble(), row[2].toDouble())
      val at = "기준값 ${row[0]}"

      assertEquals(at, row[3] == "1", moment.isDay)
      assertEquals(at, row[4].toDouble(), moment.sunAltitude, TOLERANCE)
      assertEquals(at, row[5].toDouble(), moment.apparentMinutes, TOLERANCE)
      assertEquals(at, row[6].toDouble(), moment.dialMinutes, TOLERANCE)
      assertEquals(at, row[7].toDouble(), moment.tip.x, TOLERANCE)
      assertEquals(at, row[8].toDouble(), moment.tip.y, TOLERANCE)
      assertEquals(at, row[9].toDouble(), moment.lightDeclination, TOLERANCE)
      assertEquals(at, row[10].toDouble(), moment.halfDayAngle, TOLERANCE)
      assertEquals(at, row[11].toInt(), moment.traditional.branchIndex)
      assertEquals(at, row[12], moment.traditional.label)
      assertEquals(at, row[13], moment.solarTermName)
    }
  }

  @Test
  fun 빛깔이_앱과_같다() {
    val rows = lines("palettes.tsv")
    assertTrue(rows.size >= 8)

    for (row in rows) {
      val palette = DialPalette.themeAt(row[0].toDouble())
      assertEquals("해 높이 ${row[0]}", row.drop(1), palette.toList().map { DialPalette.hex(it) })
    }
  }

  companion object {
    private const val TOLERANCE = 1e-6
  }
}
