import * as Location from "expo-location";
import { useEffect, useState } from "react";

import { DEFAULT_LOCATION, Settings } from "../lib/settings";

export interface LocationState {
  latitude: number;
  longitude: number;
  source: "gps" | "manual" | "default";
  permission: "pending" | "granted" | "denied";
}

export function useLocation(manual: Settings["manualLocation"]): LocationState {
  const [state, setState] = useState<LocationState>({
    ...DEFAULT_LOCATION,
    source: "default",
    permission: "pending",
  });

  useEffect(() => {
    if (manual) {
      setState({ ...manual, source: "manual", permission: "denied" });
      return;
    }

    let subscription: Location.LocationSubscription | undefined;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      if (status !== "granted") {
        setState((previous) => ({ ...previous, permission: "denied" }));
        return;
      }

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 500 },
        ({ coords }) => {
          setState({
            latitude: coords.latitude,
            longitude: coords.longitude,
            source: "gps",
            permission: "granted",
          });
        }
      );
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [manual]);

  return state;
}
