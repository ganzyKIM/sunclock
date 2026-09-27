import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useSyncExternalStore } from "react";

import { DEFAULT_SETTINGS, mergeSettings, Settings } from "../lib/settings";

const STORAGE_KEY = "angbuilgu.settings.v1";

/**
 * 설정은 화면마다 따로 들고 있으면 안 된다.
 *
 * 설정 화면에서 눈금판을 바꿔도 해시계 화면은 제가 처음에 읽어 둔 값을
 * 그대로 쥐고 있었다. 돌아와 보면 아무것도 바뀌지 않은 것처럼 보였다.
 * 그래서 값을 모듈 하나에 두고 모든 화면이 같은 것을 본다.
 */

interface Snapshot {
  settings: Settings;
  /** 저장해 둔 값을 다 읽었는지. 읽기 전에는 기본값을 보여 준다. */
  ready: boolean;
}

let snapshot: Snapshot = { settings: DEFAULT_SETTINGS, ready: false };
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: Snapshot): void {
  snapshot = next;
  for (const listener of listeners) listener();
}

function load(): Promise<void> {
  if (!loading) {
    loading = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        publish({
          settings: raw ? mergeSettings(JSON.parse(raw)) : snapshot.settings,
          ready: true,
        });
      } catch {
        // 저장된 값을 읽지 못하면 기본값으로 시작한다.
        publish({ settings: snapshot.settings, ready: true });
      }
    })();
  }
  return loading;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  void load();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Snapshot {
  return snapshot;
}

export function updateSettings(patch: Partial<Settings>): void {
  const settings = { ...snapshot.settings, ...patch };
  publish({ settings, ready: snapshot.ready });
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => undefined);
}

/** 시험에서 앞선 시험이 남긴 값을 지운다. */
export function resetSettingsStore(): void {
  snapshot = { settings: DEFAULT_SETTINGS, ready: false };
  loading = null;
}

export function useSettings() {
  const { settings, ready } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const update = useCallback((patch: Partial<Settings>) => updateSettings(patch), []);
  return { settings, update, ready };
}
