import { toTraditionalTime } from "./traditional";

describe("toTraditionalTime", () => {
  it("정오는 오정 초각이다", () => {
    const t = toTraditionalTime(12 * 60);
    expect(t.branchName).toBe("오");
    expect(t.half).toBe("정");
    expect(t.quarterName).toBe("초각");
    expect(t.label).toBe("오정 초각");
  });

  it("낮 12시 40분은 오정 2각이다", () => {
    expect(toTraditionalTime(12 * 60 + 40).label).toBe("오정 2각");
  });

  it("오후 3시 20분은 신초 1각이다", () => {
    expect(toTraditionalTime(15 * 60 + 20).label).toBe("신초 1각");
  });

  it("자정은 자정 초각이다", () => {
    const t = toTraditionalTime(0);
    expect(t.branchName).toBe("자");
    expect(t.half).toBe("정");
    expect(t.label).toBe("자정 초각");
  });

  it("밤 11시에 자시가 시작한다", () => {
    const t = toTraditionalTime(23 * 60);
    expect(t.branchName).toBe("자");
    expect(t.half).toBe("초");
    expect(t.label).toBe("자초 초각");
  });

  it("각의 경계에서 다음 각으로 넘어간다", () => {
    expect(toTraditionalTime(12 * 60 + 14).quarterName).toBe("초각");
    expect(toTraditionalTime(12 * 60 + 15).quarterName).toBe("1각");
    expect(toTraditionalTime(12 * 60 + 44).quarterName).toBe("2각");
    expect(toTraditionalTime(12 * 60 + 45).quarterName).toBe("3각");
  });

  it("시의 경계에서 다음 시로 넘어간다", () => {
    expect(toTraditionalTime(13 * 60 - 1).branchName).toBe("오");
    expect(toTraditionalTime(13 * 60).branchName).toBe("미");
  });

  it("열두 시가 두 시간씩 하루를 덮는다", () => {
    const seen = new Set<string>();
    for (let m = 0; m < 1440; m += 1) seen.add(toTraditionalTime(m).branchName);
    expect(seen.size).toBe(12);
  });

  it("한자를 함께 낸다", () => {
    expect(toTraditionalTime(12 * 60).branchHanja).toBe("午");
  });

  it("1440분을 넘거나 음수인 값도 하루 안으로 접는다", () => {
    expect(toTraditionalTime(1440 + 720).label).toBe("오정 초각");
    expect(toTraditionalTime(22 * 60).label).toBe("해정 초각");
    // 한 시간 앞으로 돌리면 밤 11시가 되고, 그 순간 자시가 시작한다.
    expect(toTraditionalTime(-60).label).toBe("자초 초각");
  });
});
