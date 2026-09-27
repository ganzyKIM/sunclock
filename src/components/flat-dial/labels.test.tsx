import { fireEvent, render, screen } from "@testing-library/react-native";

import { buildFlatGeometry } from "../../lib/dial/flat";
import { DAY_PALETTE } from "../../theme";
import { FlatLabels } from "./labels";

const geometry = buildFlatGeometry(37.5);

function show(night: boolean, onSelectBranch?: (branch: string) => void) {
  return render(
    <FlatLabels
      geometry={geometry}
      center={150}
      radius={140}
      palette={DAY_PALETTE}
      night={night}
      onSelectBranch={onSelectBranch}
    />
  );
}

describe("FlatLabels", () => {
  it("열두 이름을 모두 누를 수 있게 둔다", async () => {
    await show(false, () => undefined);
    expect(screen.getAllByRole("button")).toHaveLength(12);
  });

  it("낮에는 해로 읽는 이름을 건넨다", async () => {
    const onSelect = jest.fn();
    await show(false, onSelect);
    fireEvent.press(screen.getByLabelText("오시 알아보기"));
    expect(onSelect).toHaveBeenCalledWith("오");
  });

  it("밤에는 달로 읽는 이름을 건넨다", async () => {
    // 달그림자가 오시 선에 걸리면 실제 시각은 자시다. 눌린 것도 자시여야 한다.
    const onSelect = jest.fn();
    await show(true, onSelect);
    fireEvent.press(screen.getByLabelText("자시 알아보기"));
    expect(onSelect).toHaveBeenCalledWith("자");
  });

  it("받을 곳이 없으면 눌러도 아무 일도 없다", async () => {
    await show(false);
    const buttons = screen.getAllByRole("button");
    expect(() => fireEvent.press(buttons[0])).not.toThrow();
  });
});
