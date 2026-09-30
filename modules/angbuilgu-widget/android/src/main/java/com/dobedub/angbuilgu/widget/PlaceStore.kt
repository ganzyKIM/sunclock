package com.dobedub.angbuilgu.widget

import android.content.Context

/**
 * 위젯이 쓸 자리.
 *
 * 위젯은 스스로 위치를 묻지 않는다. 뒤에서 위치를 읽으려면 늘 켜 두는 권한이
 * 있어야 하는데, 시계 하나에 그만한 권한을 달 까닭이 없다. 앱이 열릴 때마다
 * 알고 있는 자리를 여기에 적어 두고, 위젯은 그것을 읽는다.
 */
object PlaceStore {
  data class Place(val latitude: Double, val longitude: Double)

  /** 경복궁. 앱을 한 번도 열지 않았을 때 쓴다. */
  val DEFAULT = Place(37.5796, 126.977)

  private const val FILE = "angbuilgu.widget"
  private const val LATITUDE = "latitude"
  private const val LONGITUDE = "longitude"

  fun load(context: Context): Place {
    val stored = context.getSharedPreferences(FILE, Context.MODE_PRIVATE)
    if (!stored.contains(LATITUDE) || !stored.contains(LONGITUDE)) return DEFAULT
    return Place(
      Double.fromBits(stored.getLong(LATITUDE, 0)),
      Double.fromBits(stored.getLong(LONGITUDE, 0))
    )
  }

  fun save(context: Context, latitude: Double, longitude: Double) {
    if (!latitude.isFinite() || !longitude.isFinite()) return
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return
    context.getSharedPreferences(FILE, Context.MODE_PRIVATE).edit()
      .putLong(LATITUDE, latitude.toRawBits())
      .putLong(LONGITUDE, longitude.toRawBits())
      .apply()
  }
}
