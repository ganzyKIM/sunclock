import { useEffect, useRef, useState } from "react";

import { angleDifference, approachAngle, easeOutCubic, normalizeDegrees } from "../lib/placement/angle";

/** 자리를 잡는 데 걸리는 시간. 길면 굼뜨고 짧으면 뚝 뛴다. */
const SETTLE_MS = 380;
/** 이보다 가까우면 그냥 붙인다. 떨림을 쫓아다니지 않는다. */
const SNAP_DEGREES = 0.05;

/**
 * 각도가 목표로 스르르 미끄러져 가게 한다.
 *
 * 맞췄다고 본 순간 방위를 0도로 붙드는데, 그대로 두면 그림자가 최대
 * 15도를 한 번에 뛴다. 목표가 바뀔 때마다 지금 자리에서 새 목표까지
 * 짧은 쪽으로 돌아 들어간다. 앞은 빠르고 끝은 느리다.
 */
export function useEasedAngle(target: number): number {
  const [current, setCurrent] = useState(() => normalizeDegrees(target));
  const from = useRef(current);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const goal = normalizeDegrees(target);
    if (Math.abs(angleDifference(goal, from.current)) < SNAP_DEGREES) {
      from.current = goal;
      setCurrent(goal);
      return;
    }

    const start = from.current;
    const began = Date.now();

    const step = () => {
      const t = Math.min(1, (Date.now() - began) / SETTLE_MS);
      const next = approachAngle(start, goal, easeOutCubic(t));
      from.current = next;
      setCurrent(next);
      if (t < 1) frame.current = requestAnimationFrame(step);
      else frame.current = null;
    };
    frame.current = requestAnimationFrame(step);

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [target]);

  return current;
}
