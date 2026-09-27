import { render, screen } from "@testing-library/react-native";

import { DAY_PALETTE } from "../theme";
import { InfoBlocks } from "./info-blocks";

describe("InfoBlocks", () => {
  it("요약, 목록, 표를 각각 그린다", async () => {
    await render(
      <InfoBlocks
        palette={DAY_PALETTE}
        width={300}
        blocks={[
          { kind: "lead", text: "요약 한 줄" },
          { kind: "steps", items: ["첫째", "둘째"] },
          { kind: "table", rows: [["이름", "값"]] },
        ]}
      />
    );
    expect(screen.getByText("요약 한 줄")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("둘째")).toBeTruthy();
    expect(screen.getByText("값")).toBeTruthy();
  });

  it("그림 넷을 모두 그릴 수 있다", async () => {
    await render(
      <InfoBlocks
        palette={DAY_PALETTE}
        width={300}
        blocks={[
          { kind: "figure", figure: "shadow-length" },
          { kind: "figure", figure: "hour-halves" },
          { kind: "figure", figure: "moon-flip" },
          { kind: "figure", figure: "two-shadows" },
        ]}
      />
    );
    expect(screen.getByText("여름 · 짧다")).toBeTruthy();
    expect(screen.getByText("8시 = 진")).toBeTruthy();
    expect(screen.getByText(/12시간 차이/)).toBeTruthy();
    expect(screen.getByText("보정한 자리")).toBeTruthy();
  });
});
