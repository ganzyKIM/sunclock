import { ZODIAC, zodiacOfBranch } from "./zodiac";
import { toTraditionalTime } from "./traditional";

describe("ZODIAC", () => {
  it("열둘이다", () => {
    expect(ZODIAC).toHaveLength(12);
  });

  it("자시부터 해시까지 순서대로다", () => {
    expect(ZODIAC.map((z) => z.branch)).toEqual([
      "자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해",
    ]);
  });

  it("짐승과 한자가 짝을 이룬다", () => {
    expect(zodiacOfBranch("자")?.animal).toBe("쥐");
    expect(zodiacOfBranch("오")?.animal).toBe("말");
    expect(zodiacOfBranch("오")?.branchHanja).toBe("午");
    expect(zodiacOfBranch("인")?.animalHanja).toBe("虎");
  });

  it("두 시간씩 하루를 덮는다", () => {
    ZODIAC.forEach((sign, i) => {
      expect(sign.startHour).toBe((23 + i * 2) % 24);
    });
  });

  it("자시가 밤 11시에 시작하고 오시가 낮에 온다", () => {
    expect(zodiacOfBranch("자")?.hours).toBe("밤 11시 ~ 새벽 1시");
    expect(zodiacOfBranch("오")?.hours).toBe("아침 11시 ~ 낮 1시");
  });

  it("전통 시각 변환과 시작 시각이 맞는다", () => {
    for (const sign of ZODIAC) {
      const minutes = (sign.startHour * 60) % 1440;
      expect(toTraditionalTime(minutes).branchName).toBe(sign.branch);
    }
  });

  it("모든 칸에 설명이 있다", () => {
    for (const sign of ZODIAC) {
      expect(sign.moment.length).toBeGreaterThan(5);
      expect(sign.why.length).toBeGreaterThan(5);
    }
  });
});
