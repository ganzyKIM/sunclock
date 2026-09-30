import { requireOptionalNativeModule } from "expo";

/**
 * 위젯과 대기화면으로 가는 길. 안드로이드에만 있다.
 * 웹과 아이폰에서는 모듈이 없으므로 아무 일도 하지 않는다.
 */
interface AngbuilguWidgetModule {
  setPlace(latitude: number, longitude: number): void;
  canPinWidget(): boolean;
  pinWidget(kind: WidgetKind): boolean;
  openStandbySettings(): boolean;
}

export type WidgetKind = "small" | "wide";

const native = requireOptionalNativeModule<AngbuilguWidgetModule>("AngbuilguWidget");

/** 이 기기에서 위젯과 대기화면을 쓸 수 있는지. */
export const widgetAvailable = native !== null;

/** 앱이 아는 자리를 위젯에게 알려 준다. 위젯은 스스로 위치를 묻지 않는다. */
export function syncWidgetPlace(latitude: number, longitude: number): void {
  native?.setPlace(latitude, longitude);
}

/** 런처가 앱에서 바로 위젯을 놓게 해 주는지. */
export function canPinWidget(): boolean {
  return native?.canPinWidget() ?? false;
}

/** 홈 화면에 위젯을 놓겠느냐고 런처가 묻게 한다. 물었으면 참이다. */
export function pinWidget(kind: WidgetKind): boolean {
  return native?.pinWidget(kind) ?? false;
}

/** 안드로이드의 화면 보호기 설정을 연다. 열었으면 참이다. */
export function openStandbySettings(): boolean {
  return native?.openStandbySettings() ?? false;
}
