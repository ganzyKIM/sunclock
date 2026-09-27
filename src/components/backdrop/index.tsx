import BackdropCanvas, { BackdropCanvasProps } from "./canvas";

/** 네이티브에서는 곧바로 그린다. */
export function Backdrop(props: BackdropCanvasProps) {
  return <BackdropCanvas {...props} />;
}
