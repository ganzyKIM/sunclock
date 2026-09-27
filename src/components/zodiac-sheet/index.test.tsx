import { fireEvent, render, screen } from "@testing-library/react-native";

import { DAY_PALETTE, NIGHT_PALETTE } from "../../theme";
import { zodiacArt } from "./art";
import { ZodiacSheet } from "./index";

describe("ZodiacSheet", () => {
  it("닫혀 있으면 아무것도 내놓지 않는다", async () => {
    const view = await render(
      <ZodiacSheet branch={null} palette={DAY_PALETTE} onClose={() => undefined} />
    );
    expect(view.toJSON()).toBeNull();
  });

  it("모르는 이름에는 열리지 않는다", async () => {
    const view = await render(
      <ZodiacSheet branch="없음" palette={DAY_PALETTE} onClose={() => undefined} />
    );
    expect(view.toJSON()).toBeNull();
  });

  it("지지와 짐승과 한자를 함께 보여 준다", async () => {
    await render(
      <ZodiacSheet branch="자" palette={DAY_PALETTE} onClose={() => undefined} />
    );
    expect(screen.getByTestId("zodiac-branch")).toHaveTextContent("자시");
    expect(screen.getByTestId("zodiac-animal")).toHaveTextContent("쥐 鼠");
    // 열리는 동안 떠오르는 중이라 화면에 보이는지는 여기서 따지지 않는다.
    expect(screen.getByText("子")).toBeTruthy();
  });

  it("그 시각이 언제인지와 왜 그 짐승인지를 적는다", async () => {
    await render(
      <ZodiacSheet branch="오" palette={DAY_PALETTE} onClose={() => undefined} />
    );
    expect(screen.getByText(/아침 11시 ~ 낮 1시/)).toBeTruthy();
    expect(screen.getByText(/해가 가장 높은 때/)).toBeTruthy();
    expect(screen.getByText(/가장 씩씩한 짐승/)).toBeTruthy();
  });

  it("지지에 맞는 짐승 그림을 얹는다", async () => {
    await render(
      <ZodiacSheet branch="인" palette={DAY_PALETTE} onClose={() => undefined} />
    );
    const figure = screen.getByLabelText("호랑이 그림");
    expect(figure.props.source).toBe(zodiacArt("호랑이"));
    expect(screen.queryByTestId("zodiac-moonlight")).toBeNull();
  });

  it("밤에는 그림 위에 달빛을 얹는다", async () => {
    await render(
      <ZodiacSheet branch="인" palette={NIGHT_PALETTE} night onClose={() => undefined} />
    );
    expect(screen.getByLabelText("호랑이 그림")).toBeTruthy();
    expect(screen.getByTestId("zodiac-moonlight")).toBeTruthy();
  });

  it("닫기를 누르면 닫는다", async () => {
    const onClose = jest.fn();
    await render(<ZodiacSheet branch="축" palette={DAY_PALETTE} onClose={onClose} />);
    fireEvent.press(screen.getByText("닫기"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
