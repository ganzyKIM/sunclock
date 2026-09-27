import { WithSkiaWeb } from "@shopify/react-native-skia/lib/module/web";

import type { BackdropCanvasProps } from "./canvas";

/** 웹에서는 그래픽 엔진을 내려받은 뒤에야 그리기 모듈을 읽을 수 있다. */
export function Backdrop(props: BackdropCanvasProps) {
  return (
    <WithSkiaWeb
      getComponent={() => import("./canvas")}
      componentProps={props}
      opts={{ locateFile: () => "/canvaskit.wasm" }}
      fallback={null}
    />
  );
}
