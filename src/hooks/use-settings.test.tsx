import { act, renderHook } from "@testing-library/react-native";

import { resetSettingsStore, useSettings } from "./use-settings";

describe("useSettings", () => {
  beforeEach(() => {
    resetSettingsStore();
  });

  it("한 화면에서 바꾼 설정을 다른 화면도 곧바로 본다", async () => {
    // 설정 화면과 해시계 화면이 따로 들고 있으면 돌아와도 안 바뀐다.
    const dial = await renderHook(() => useSettings());
    const settings = await renderHook(() => useSettings());

    await act(async () => {
      settings.result.current.update({ dialView: "bowl" });
    });

    expect(settings.result.current.settings.dialView).toBe("bowl");
    expect(dial.result.current.settings.dialView).toBe("bowl");
  });

  it("건드리지 않은 값은 그대로 둔다", async () => {
    const hook = await renderHook(() => useSettings());

    await act(async () => {
      hook.result.current.update({ dialView: "bowl" });
    });

    expect(hook.result.current.settings.nightMode).toBe("moon");
    expect(hook.result.current.settings.dialLatitude).toBe("device");
  });
});
