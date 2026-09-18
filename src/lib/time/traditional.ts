export const BRANCH_NAMES = [
  "자", "축", "인", "묘", "진", "사",
  "오", "미", "신", "유", "술", "해",
] as const;

export const BRANCH_HANJA = [
  "子", "丑", "寅", "卯", "辰", "巳",
  "午", "未", "申", "酉", "戌", "亥",
] as const;

const QUARTER_NAMES = ["초각", "1각", "2각", "3각"] as const;

const MINUTES_PER_DAY = 1440;
const MINUTES_PER_BRANCH = 120;
const MINUTES_PER_HALF = 60;
const MINUTES_PER_QUARTER = 15;

/** 자시가 밤 11시에 시작하므로 그만큼 앞으로 당겨 센다. */
const BRANCH_START_OFFSET = 60;

export interface TraditionalTime {
  branchIndex: number;
  branchName: string;
  branchHanja: string;
  half: "초" | "정";
  quarterIndex: number;
  quarterName: string;
  label: string;
}

export function toTraditionalTime(minutesOfDay: number): TraditionalTime {
  const wrapped = ((minutesOfDay % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const shifted = (wrapped + BRANCH_START_OFFSET) % MINUTES_PER_DAY;

  const branchIndex = Math.floor(shifted / MINUTES_PER_BRANCH);
  const withinBranch = shifted - branchIndex * MINUTES_PER_BRANCH;
  const half = withinBranch < MINUTES_PER_HALF ? "초" : "정";
  const withinHour = withinBranch % MINUTES_PER_HALF;
  const quarterIndex = Math.floor(withinHour / MINUTES_PER_QUARTER);

  const branchName = BRANCH_NAMES[branchIndex];
  const quarterName = QUARTER_NAMES[quarterIndex];

  return {
    branchIndex,
    branchName,
    branchHanja: BRANCH_HANJA[branchIndex],
    half,
    quarterIndex,
    quarterName,
    label: `${branchName}${half} ${quarterName}`,
  };
}
