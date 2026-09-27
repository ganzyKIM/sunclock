import { useEffect, useRef, useState } from "react";

import { easeOutCubic } from "../lib/placement/angle";

/** 이보다 가까우면 그냥 붙인다. */
const SNAP = 0.001;

/**
 * 숫자가 목표로 스르르 옮겨 가게 한다.
 *
 * 맞았다 아니다처럼 딱 갈리는 상태를 화면에 그대로 옮기면 뚝 바뀐다.
 * 0과 1 사이를 정해진 시간에 걸쳐 지나가게 해서, 밝기나 색을 이 값에
 * 걸어 두면 모든 것이 한 호흡으로 함께 옮겨 간다.
 */
export function useEasedNumber(target: number, durationMs: number): number {
  const [current, setCurrent] = useState(target);
  const from = useRef(target);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (Math.abs(target - from.current) < SNAP) {
      from.current = target;
      setCurrent(target);
      return;
    }

    const start = from.current;
    const began = Date.now();

    const step = () => {
      const t = Math.min(1, (Date.now() - began) / durationMs);
      const next = start + (target - start) * easeOutCubic(t);
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
  }, [target, durationMs]);

  return current;
}
