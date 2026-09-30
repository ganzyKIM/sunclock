import { useEffect } from "react";

import { syncWidgetPlace } from "../../modules/angbuilgu-widget";
import { LocationState } from "./use-location";

/**
 * 앱이 아는 자리를 위젯과 대기화면에게 건넨다.
 *
 * 위젯은 스스로 위치를 묻지 않는다. 뒤에서 위치를 읽으려면 늘 켜 두는 권한이
 * 있어야 하는데 시계에 그만한 권한을 달 까닭이 없다. 그래서 앱이 열려 있는
 * 동안 알게 된 자리를 적어 두고, 위젯은 마지막으로 적힌 자리로 셈한다.
 */
export function useWidgetPlace(location: LocationState): void {
  const { latitude, longitude, source } = location;

  useEffect(() => {
    // 아직 자리를 모를 때의 기본값으로 적어 둔 자리를 덮지 않는다.
    if (source === "default") return;
    syncWidgetPlace(latitude, longitude);
  }, [latitude, longitude, source]);
}
