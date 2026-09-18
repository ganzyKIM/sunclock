import DialCanvas, { DialCanvasProps } from "./canvas";

/** 네이티브에서는 곧바로 그린다. */
export function DialCanvasHost(props: DialCanvasProps) {
  return <DialCanvas {...props} />;
}
