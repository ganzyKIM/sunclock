import {
  ALIGN_DWELL_MS,
  INITIAL_ALIGNMENT,
  RELEASE_DWELL_MS,
  trackAlignment,
} from "./alignment";

describe("trackAlignment", () => {
  it("맞은 각도가 잠깐 스치면 아직 맞은 것이 아니다", () => {
    const a = trackAlignment(INITIAL_ALIGNMENT, 5, 1000);
    expect(a.aligned).toBe(false);
    expect(a.since).toBe(1000);
    const b = trackAlignment(a, 5, 1000 + ALIGN_DWELL_MS - 1);
    expect(b.aligned).toBe(false);
  });

  it("맞은 채로 머물면 맞았다고 본다", () => {
    const a = trackAlignment(INITIAL_ALIGNMENT, 5, 1000);
    const b = trackAlignment(a, 8, 1000 + ALIGN_DWELL_MS);
    expect(b).toEqual({ aligned: true, since: null });
  });

  it("머무는 도중에 벗어나면 처음부터 다시 센다", () => {
    const a = trackAlignment(INITIAL_ALIGNMENT, 5, 1000);
    const b = trackAlignment(a, 30, 1200);
    expect(b).toEqual({ aligned: false, since: null });
    const c = trackAlignment(b, 5, 1300);
    expect(c.since).toBe(1300);
  });

  it("맞은 뒤에는 잠깐 벗어나도 유지한다", () => {
    const aligned = { aligned: true, since: null };
    const a = trackAlignment(aligned, 30, 2000);
    expect(a.aligned).toBe(true);
    const b = trackAlignment(a, 30, 2000 + RELEASE_DWELL_MS - 1);
    expect(b.aligned).toBe(true);
    const c = trackAlignment(b, 30, 2000 + RELEASE_DWELL_MS);
    expect(c).toEqual({ aligned: false, since: null });
  });

  it("맞은 뒤에는 들어올 때보다 넓은 각도까지 봐준다", () => {
    const aligned = { aligned: true, since: null };
    // 15도는 넘었지만 22도 안이다. 벗어난 것으로 세지 않는다.
    const a = trackAlignment(aligned, 18, 3000);
    expect(a).toEqual({ aligned: true, since: null });
  });
});
