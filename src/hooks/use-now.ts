import { useEffect, useState } from "react";
import { AppState } from "react-native";

/** 화면이 꺼지면 시계를 멈춘다. */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    const start = () => {
      setNow(new Date());
      timer = setInterval(() => setNow(new Date()), intervalMs);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };

    start();
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") {
        stop();
        start();
      } else {
        stop();
      }
    });

    return () => {
      stop();
      subscription.remove();
    };
  }, [intervalMs]);

  return now;
}
