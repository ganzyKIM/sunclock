import { useMemo } from "react";

import { buildDialGeometry, DialGeometry } from "../lib/dial/geometry";

/** 이만큼 위도가 바뀌어야 눈금을 다시 만든다. 몇 킬로미터 움직임은 무시한다. */
export const LATITUDE_REBUILD_STEP = 0.05;

export function quantizeLatitude(latitude: number): number {
  return Math.round(latitude / LATITUDE_REBUILD_STEP) * LATITUDE_REBUILD_STEP;
}

export function useDialGeometry(latitude: number): DialGeometry {
  const stepped = quantizeLatitude(latitude);
  return useMemo(() => buildDialGeometry(stepped), [stepped]);
}
