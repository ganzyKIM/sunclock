import { act, render, screen, waitFor } from "@testing-library/react-native";

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
    expect(screen.getByText(new RegExp(state.traditional.label))).toBeVisible();
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

describe("ReadingCard 방향 맞추기", () => {
  it("방향을 맞추기 전에는 눈금을 읽지 않는다", async () => {
    const state = stateAt("2026-06-21T03:30:00Z");
    await render(
      <ReadingCard state={state} palette={DAY_PALETTE} aligned={false} />
    );
    expect(screen.getByTestId("friendly-time")).toHaveTextContent("--");
    expect(screen.queryByText(new RegExp(state.traditional.label))).toBeNull();
  });

  it("방향을 맞추기 전에는 휴대폰 시계도 비운다", async () => {
    const state = stateAt("2026-06-21T03:30:00Z");
    await render(
      <ReadingCard state={state} palette={DAY_PALETTE} aligned={false} />
    );
    expect(screen.getByText(/시계 --:--/)).toBeTruthy();
    expect(screen.queryByText(/시계 \d{1,2}:\d{2}/)).toBeNull();
  });

  it("방향을 맞추면 눈금과 시계를 읽어 준다", async () => {
    const state = stateAt("2026-06-21T03:30:00Z");
    await render(<ReadingCard state={state} palette={DAY_PALETTE} aligned />);
    expect(screen.getByText(new RegExp(state.traditional.label))).toBeVisible();
    expect(screen.getByText(/시계 \d{1,2}:\d{2}/)).toBeTruthy();
  });

  it("읽기 전의 빈자리는 시각과 같은 꼴이다", async () => {
    const state = stateAt("2026-06-21T03:30:00Z");
    await render(
      <ReadingCard state={state} palette={DAY_PALETTE} aligned={false} />
    );
    // 시계 숫자 자리에는 같은 폭의 빈 숫자가 들어간다.
    expect(screen.getByText(/해그림자 --:--/)).toBeTruthy();
  });
});

describe("ReadingCard 스며들기", () => {
  it("맞추는 순간 곧바로 바뀌지 않고 한 박자 사그라든 뒤에 나온다", async () => {
    const state = stateAt("2026-06-21T03:30:00Z");
    const view = await render(
      <ReadingCard state={state} palette={DAY_PALETTE} aligned={false} />
    );
    expect(screen.getByTestId("friendly-time")).toHaveTextContent("--");

    await view.rerender(
      <ReadingCard state={state} palette={DAY_PALETTE} aligned />
    );
    // 사그라드는 동안에는 아직 옛 글씨가 남아 있다.
    expect(screen.getByTestId("friendly-time")).toHaveTextContent("--");

    await waitFor(() =>
      expect(screen.getByTestId("friendly-time")).not.toHaveTextContent("--")
    );
  });
});

/** 사그라드는 도중이 되도록 잠깐 기다린다. */
const midway = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 60)));

describe("ReadingCard 스며들다 끊길 때", () => {
  it("사그라드는 도중에 상태가 되돌아가도 흐린 채로 남지 않는다", async () => {
    // 나침반이 경계에서 떨릴 때 실제로 일어나는 일이다.
    const state = stateAt("2026-06-21T03:30:00Z");
    const view = await render(
      <ReadingCard state={state} palette={DAY_PALETTE} aligned={false} />
    );
    await view.rerender(<ReadingCard state={state} palette={DAY_PALETTE} aligned />);
    await midway();
    await view.rerender(
      <ReadingCard state={state} palette={DAY_PALETTE} aligned={false} />
    );

    await waitFor(() => {
      expect(screen.getByTestId("friendly-time")).toHaveTextContent("--");
      expect(screen.getByTestId("reading-body")).toHaveStyle({ opacity: 1 });
    });
  });

  it("끊긴 뒤에도 마지막 상태로 끝난다", async () => {
    const state = stateAt("2026-06-21T03:30:00Z");
    const view = await render(
      <ReadingCard state={state} palette={DAY_PALETTE} aligned={false} />
    );
    await view.rerender(<ReadingCard state={state} palette={DAY_PALETTE} aligned />);
    await midway();
    await view.rerender(
      <ReadingCard state={state} palette={DAY_PALETTE} aligned={false} />
    );
    await midway();
    await view.rerender(<ReadingCard state={state} palette={DAY_PALETTE} aligned />);

    await waitFor(() => {
      expect(screen.getByTestId("friendly-time")).not.toHaveTextContent("--");
      expect(screen.getByTestId("reading-body")).toHaveStyle({ opacity: 1 });
    });
  });
});
