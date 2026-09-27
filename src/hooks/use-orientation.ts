import * as Location from "expo-location";
import { DeviceMotion } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { AlignmentTrack, INITIAL_ALIGNMENT, trackAlignment } from "../lib/placement/alignment";
import {
  FLAT_RELEASE_DEGREES,
  FLAT_TOLERANCE_DEGREES,
  steadyAngle,
  tiltFromRotation,
} from "../lib/placement/angle";

export interface OrientationState {
  /** 반구의 북쪽 축이 향한 방위. 도 단위. */
  headingDegrees: number;
  /** 0에서 3. 낮으면 나침반 보정이 필요하다. */
  accuracy: number;
  tiltDegrees: number;
  isFlat: boolean;
  isAligned: boolean;
  compassAvailable: boolean;
}

const MOTION_INTERVAL_MS = 100;

export function useOrientation(): OrientationState {
  const [state, setState] = useState<OrientationState>({
    headingDegrees: 0,
    accuracy: 3,
    tiltDegrees: 0,
    isFlat: true,
    isAligned: false,
    compassAvailable: false,
  });

  const smoothed = useRef<number | null>(null);
  /** 맞았는지의 판정. 각도뿐 아니라 얼마나 머물렀는지도 본다. */
  const alignment = useRef<AlignmentTrack>(INITIAL_ALIGNMENT);

  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled || status !== "granted") return;

      subscription = await Location.watchHeadingAsync((heading) => {
        const raw = heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;
        if (!Number.isFinite(raw) || raw < 0) return;

        // 가만히 두면 멎고 돌리면 곧 도는 값. 바늘과 그림자가 이것을 따른다.
        smoothed.current = steadyAngle(smoothed.current, raw);
        const headingDegrees = smoothed.current;
        const offset = Math.min(headingDegrees, 360 - headingDegrees);

        // 각도의 여유에 더해 잠깐 머물러야 넘어간다. 경계에서 깜빡이지 않게 한다.
        alignment.current = trackAlignment(alignment.current, offset, Date.now());
        const isAligned = alignment.current.aligned;

        setState((previous) => ({
          ...previous,
          headingDegrees,
          accuracy: heading.accuracy,
          isAligned,
          compassAvailable: true,
        }));
      });
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    let subscription: { remove: () => void } | undefined;
    let available = false;
    let cancelled = false;

    /** 기울기 센서가 없는 기기도 있다. 없으면 수평으로 놓인 것으로 본다. */
    const start = () => {
      if (subscription || !available) return;
      DeviceMotion.setUpdateInterval(MOTION_INTERVAL_MS);
      subscription = DeviceMotion.addListener(({ rotation }) => {
        if (!rotation) return;
        const tiltDegrees = tiltFromRotation(rotation.beta, rotation.gamma);
        setState((previous) => ({
          ...previous,
          tiltDegrees,
          isFlat: tiltDegrees <= (previous.isFlat
            ? FLAT_RELEASE_DEGREES
            : FLAT_TOLERANCE_DEGREES),
        }));
      });
    };

    const stop = () => {
      subscription?.remove();
      subscription = undefined;
    };

    const appState = AppState.addEventListener("change", (status) => {
      if (status === "active") start();
      else stop();
    });

    (async () => {
      try {
        available = await DeviceMotion.isAvailableAsync();
      } catch {
        available = false;
      }
      if (!cancelled) start();
    })();

    return () => {
      cancelled = true;
      stop();
      appState.remove();
    };
  }, []);

  return state;
}
