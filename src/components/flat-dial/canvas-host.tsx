import FlatCanvas, { FlatCanvasProps } from "./canvas";

/** 네이티브에서는 곧바로 그린다. */
export function FlatCanvasHost(props: FlatCanvasProps) {
  return <FlatCanvas {...props} />;
}
