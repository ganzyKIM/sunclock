import { useEffect, useState } from "react";

/** 별이 깜빡이는 빠르기. 너무 잦으면 배터리를 먹고, 드물면 끊겨 보인다. */
const TICK_MS = 125;

/**
 * 별이 깜빡이는 데 쓰는 시각이다. 초 단위로 흘러간다.
 *
 * 켜 두는 동안에만 흐르고, 끄면 그 자리에 멈춘다. 북쪽을 맞췄을 때만
 * 하늘이 살아 움직이게 하려는 것이다. 흐르는 동안에는 화면이 이 박자로
 * 다시 그려진다.
 */
export function useTwinkle(active: boolean): number {
  const [seconds, setSeconds] = useState(() => Date.now() / 1000);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setSeconds(Date.now() / 1000), TICK_MS);
    return () => clearInterval(timer);
  }, [active]);

  return seconds;
}
