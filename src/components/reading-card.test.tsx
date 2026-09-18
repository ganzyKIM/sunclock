import { render, screen } from "@testing-library/react-native";

import { buildSundialState } from "../lib/sundial";
import { DAY_PALETTE } from "../theme";
import { ReadingCard } from "./reading-card";

function stateAt(iso: string, nightMode: "moon" | "wait" = "moon") {
  return buildSundialState({
    date: new Date(iso),
    latitude: 37.5665,
    longitude: 126.978,
    headingDegrees: 0,
    nightMode,
  });
}

describe("ReadingCard", () => {
  it("쉬운 말로 된 시각을 크게 보여 준다", async () => {
    await render(<ReadingCard state={stateAt("2026-06-21T03:30:00Z")} palette={DAY_PALETTE} />);
    expect(screen.getByTestId("friendly-time")).toBeVisible();
  });

  it("전통 시각을 함께 보여 준다", async () => {
    const state = stateAt("2026-06-21T03:30:00Z");
    await render(<ReadingCard state={state} palette={DAY_PALETTE} />);
    expect(screen.getByText(state.traditional.label)).toBeVisible();
  });

  it("오늘의 절기를 보여 준다", async () => {
    const state = stateAt("2026-06-21T03:30:00Z");
    await render(<ReadingCard state={state} palette={DAY_PALETTE} />);
    expect(screen.getByText(new RegExp(state.solarTermName))).toBeVisible();
  });

  it("밤에 달시계면 보름에서 지난 날수를 보여 준다", async () => {
    const state = stateAt("2026-06-21T15:00:00Z", "moon");
    await render(<ReadingCard state={state} palette={DAY_PALETTE} />);
    expect(screen.getByTestId("moon-reading")).toBeVisible();
  });

  it("대기 모드에서는 일출까지 남은 시간을 보여 준다", async () => {
    const state = stateAt("2026-06-21T15:00:00Z", "wait");
    await render(<ReadingCard state={state} palette={DAY_PALETTE} />);
    expect(screen.getByTestId("until-sunrise")).toBeVisible();
  });

  it("알림이 있으면 그대로 보여 준다", async () => {
    const state = { ...stateAt("2026-06-21T03:30:00Z"), notices: ["시험 알림"] };
    await render(<ReadingCard state={state} palette={DAY_PALETTE} />);
    expect(screen.getByText("시험 알림")).toBeVisible();
  });
});
