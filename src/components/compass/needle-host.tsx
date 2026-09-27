import CompassNeedle, { CompassNeedleProps } from "./needle";

/** 네이티브에서는 곧바로 그린다. */
export function CompassNeedleHost(props: CompassNeedleProps) {
  return <CompassNeedle {...props} />;
}
