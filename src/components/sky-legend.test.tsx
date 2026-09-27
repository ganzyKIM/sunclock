import { render, screen } from "@testing-library/react-native";

import { NIGHT_PALETTE } from "../theme";
import { SkyLegend } from "./sky-legend";

describe("SkyLegend", () => {
  it("밤에 그림자가 둘이면 어느 것이 무엇인지 적는다", async () => {
    await render(<SkyLegend sunUp={false} moonUp shadows palette={NIGHT_PALETTE} />);
    expect(screen.getByText("달 뜬 쪽")).toBeTruthy();
    expect(screen.getByText("달그림자")).toBeTruthy();
    expect(screen.getByTestId("legend-corrected")).toBeTruthy();
  });

  it("아무것도 떠 있지 않으면 비운다", async () => {
    const view = await render(<SkyLegend sunUp={false} moonUp={false} palette={NIGHT_PALETTE} />);
    expect(view.toJSON()).toBeNull();
  });
});
