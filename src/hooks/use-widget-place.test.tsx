import { renderHook } from "@testing-library/react-native";

import { syncWidgetPlace } from "../../modules/angbuilgu-widget";
import { LocationState } from "./use-location";
import { useWidgetPlace } from "./use-widget-place";

jest.mock("../../modules/angbuilgu-widget", () => ({ syncWidgetPlace: jest.fn() }));

const sync = syncWidgetPlace as jest.Mock;

const at = (patch: Partial<LocationState>): LocationState => ({
  latitude: 37.5796,
  longitude: 126.977,
  source: "gps",
  permission: "granted",
  ...patch,
});

describe("useWidgetPlace", () => {
  beforeEach(() => sync.mockClear());

  it("앱이 아는 자리를 위젯에게 건넨다", async () => {
    await renderHook(() => useWidgetPlace(at({ latitude: 35.1, longitude: 129.04 })));
    expect(sync).toHaveBeenCalledWith(35.1, 129.04);
  });

  it("손으로 정한 자리도 건넨다", async () => {
    await renderHook(() => useWidgetPlace(at({ source: "manual", permission: "denied" })));
    expect(sync).toHaveBeenCalledTimes(1);
  });

  it("아직 자리를 모를 때는 적어 둔 자리를 덮지 않는다", async () => {
    await renderHook(() => useWidgetPlace(at({ source: "default", permission: "pending" })));
    expect(sync).not.toHaveBeenCalled();
  });

  it("자리가 바뀌지 않으면 다시 건네지 않는다", async () => {
    const hook = await renderHook(
      ({ location }: { location: LocationState }) => useWidgetPlace(location),
      { initialProps: { location: at({}) } }
    );
    await hook.rerender({ location: at({}) });
    expect(sync).toHaveBeenCalledTimes(1);
  });
});
