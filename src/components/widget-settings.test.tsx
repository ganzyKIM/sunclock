import { fireEvent, render, screen } from "@testing-library/react-native";

import { openStandbySettings, pinWidget } from "../../modules/angbuilgu-widget";
import { DAY_PALETTE } from "../theme";
import { WidgetSettings } from "./widget-settings";

let mockAvailable = true;
let mockCanPin = true;

jest.mock("../../modules/angbuilgu-widget", () => ({
  get widgetAvailable() {
    return mockAvailable;
  },
  canPinWidget: () => mockCanPin,
  pinWidget: jest.fn(() => true),
  openStandbySettings: jest.fn(() => true),
}));

describe("WidgetSettings", () => {
  beforeEach(() => {
    mockAvailable = true;
    mockCanPin = true;
    (pinWidget as jest.Mock).mockClear();
    (openStandbySettings as jest.Mock).mockClear();
  });

  it("위젯을 크기별로 놓게 해 준다", async () => {
    await render(<WidgetSettings palette={DAY_PALETTE} />);

    await fireEvent.press(screen.getByText("작은 위젯 놓기"));
    expect(pinWidget).toHaveBeenCalledWith("small");

    await fireEvent.press(screen.getByText("넓은 위젯 놓기"));
    expect(pinWidget).toHaveBeenCalledWith("wide");
  });

  it("대기화면을 고르는 설정을 연다", async () => {
    await render(<WidgetSettings palette={DAY_PALETTE} />);

    await fireEvent.press(screen.getByText("화면 보호기 설정 열기"));
    expect(openStandbySettings).toHaveBeenCalledTimes(1);
  });

  it("런처가 바로 놓게 해 주지 않으면 손으로 놓는 법을 알려 준다", async () => {
    mockCanPin = false;
    await render(<WidgetSettings palette={DAY_PALETTE} />);

    expect(screen.queryByText("작은 위젯 놓기")).toBeNull();
    expect(screen.getByText(/홈 화면의 빈 곳을 길게 눌러/)).toBeTruthy();
  });

  it("위젯이 없는 기기에서는 비운다", async () => {
    mockAvailable = false;
    const view = await render(<WidgetSettings palette={DAY_PALETTE} />);
    expect(view.toJSON()).toBeNull();
  });
});
