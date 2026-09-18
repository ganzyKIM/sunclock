import { WithSkiaWeb } from "@shopify/react-native-skia/lib/module/web";

import type { DialCanvasProps } from "./canvas";

/**
 * 웹에서는 그래픽 엔진을 내려받은 뒤에야 그리기 모듈을 읽을 수 있다.
 * 먼저 읽히면 빈 참조를 잡아 아무것도 그리지 못한다.
 */
export function DialCanvasHost(props: DialCanvasProps) {
  return (
    <WithSkiaWeb
      getComponent={() => import("./canvas")}
      componentProps={props}
      opts={{ locateFile: () => "/canvaskit.wasm" }}
      fallback={null}
    />
  );
}
