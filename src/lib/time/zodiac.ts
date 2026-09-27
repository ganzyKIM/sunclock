import { BRANCH_HANJA, BRANCH_NAMES } from "./traditional";

/**
 * 12지. 시각을 나누는 열두 칸이자 그 칸을 지키는 열두 짐승이다.
 *
 * 시각은 진태양시 기준이다. 자시가 밤 11시에 시작해 두 시간씩 이어진다.
 */

export interface ZodiacSign {
  /** 자, 축, 인… */
  branch: string;
  /** 子, 丑, 寅… */
  branchHanja: string;
  /** 쥐, 소, 호랑이… */
  animal: string;
  /** 鼠, 牛, 虎… */
  animalHanja: string;
  /** 하루의 몇 번째 칸인지. 자시가 0이다. */
  index: number;
  /** 그 시가 시작하는 시각. 24시간제 시. */
  startHour: number;
  /** "밤 11시 ~ 새벽 1시" */
  hours: string;
  /** 그 시각에 무슨 일이 일어나는 때인지. */
  moment: string;
  /** 그 짐승이 왜 그 자리에 놓였는지. */
  why: string;
}

const RAW: Array<Omit<ZodiacSign, "branch" | "branchHanja" | "index" | "hours">> = [
  {
    animal: "쥐", animalHanja: "鼠", startHour: 23,
    moment: "하루가 바뀌는 때. 어제와 오늘이 여기서 갈린다.",
    why: "가장 어두운 때에 가장 부지런한 짐승. 첫 자리를 맡았다.",
  },
  {
    animal: "소", animalHanja: "牛", startHour: 1,
    moment: "깊이 잠든 때. 세상이 가장 조용하다.",
    why: "밤새 되새김질하는 짐승. 쉬면서도 멈추지 않는다.",
  },
  {
    animal: "호랑이", animalHanja: "虎", startHour: 3,
    moment: "밤이 가장 깊었다가 풀리기 시작하는 때.",
    why: "범이 산을 도는 시각. 어둠 속의 기운을 맡았다.",
  },
  {
    animal: "토끼", animalHanja: "兎", startHour: 5,
    moment: "동이 트는 때. 해가 지평선에 걸린다.",
    why: "달에 산다는 짐승. 달을 물리고 해를 맞는 자리에 섰다.",
  },
  {
    animal: "용", animalHanja: "龍", startHour: 7,
    moment: "해가 제법 올라 하루 일이 시작되는 때.",
    why: "구름을 몰고 비를 부르는 때. 열둘 중 유일한 상상의 짐승.",
  },
  {
    animal: "뱀", animalHanja: "巳", startHour: 9,
    moment: "볕이 따뜻해지는 때.",
    why: "뱀이 굴에서 나와 몸을 데우는 시각. 조용히 나아감을 뜻한다.",
  },
  {
    animal: "말", animalHanja: "馬", startHour: 11,
    moment: "해가 가장 높은 때. 오정이 정오다.",
    why: "기운이 가장 센 때라 가장 씩씩한 짐승을 놓았다. 낮의 한가운데.",
  },
  {
    animal: "양", animalHanja: "羊", startHour: 13,
    moment: "볕이 기울기 시작하는 때.",
    why: "양이 풀을 뜯는 한가로운 시각. 누그러지는 기운.",
  },
  {
    animal: "원숭이", animalHanja: "猴", startHour: 15,
    moment: "그림자가 길어지기 시작하는 때.",
    why: "원숭이가 가장 활발하게 우는 시각이라 여겼다.",
  },
  {
    animal: "닭", animalHanja: "鷄", startHour: 17,
    moment: "해가 지는 때. 하루 일을 거둔다.",
    why: "닭이 홰에 오르는 시각. 돌아와 자리를 잡는다.",
  },
  {
    animal: "개", animalHanja: "狗", startHour: 19,
    moment: "어둑해지고 집집이 불을 켜는 때.",
    why: "개가 집을 지키기 시작하는 시각. 지킴을 맡았다.",
  },
  {
    animal: "돼지", animalHanja: "豬", startHour: 21,
    moment: "하루를 마치고 잠자리에 드는 때.",
    why: "배부르게 먹고 편히 자는 짐승. 마지막 자리를 맡았다.",
  },
];

function hourLabel(hour: number): string {
  if (hour === 0) return "밤 12시";
  if (hour < 6) return `새벽 ${hour}시`;
  if (hour < 12) return `아침 ${hour}시`;
  if (hour === 12) return "낮 12시";
  if (hour < 18) return `낮 ${hour - 12}시`;
  if (hour < 21) return `저녁 ${hour - 12}시`;
  return `밤 ${hour - 12}시`;
}

export const ZODIAC: readonly ZodiacSign[] = RAW.map((raw, index) => ({
  ...raw,
  branch: BRANCH_NAMES[index],
  branchHanja: BRANCH_HANJA[index],
  index,
  hours: `${hourLabel(raw.startHour)} ~ ${hourLabel((raw.startHour + 2) % 24)}`,
}));

export function zodiacOfBranch(branch: string): ZodiacSign | undefined {
  return ZODIAC.find((sign) => sign.branch === branch);
}
