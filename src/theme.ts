export interface Palette {
  background: string;
  backgroundEdge: string;
  bowl: string;
  bowlDeep: string;
  rim: string;
  line: string;
  lineMajor: string;
  label: string;
  shadow: string;
  glow: string;
  accent: string;
  text: string;
  textSoft: string;
  card: string;
  star: string;
}

/** 따뜻한 돌빛. */
export const DAY_PALETTE: Palette = {
  background: "#f7efe2",
  backgroundEdge: "#e6d5bd",
  bowl: "#dcc9ad",
  bowlDeep: "#b79f80",
  rim: "#f2e6d3",
  line: "#7d6a52",
  lineMajor: "#4f4131",
  label: "#3d3125",
  shadow: "#3a2e21",
  glow: "#ffd79a",
  accent: "#d98a2b",
  text: "#3d3125",
  textSoft: "#7d6a52",
  card: "#fffaf1",
  star: "#fff6e3",
};

/** 푸른 달빛. */
export const NIGHT_PALETTE: Palette = {
  background: "#111830",
  backgroundEdge: "#0a0f22",
  bowl: "#26304e",
  bowlDeep: "#161d33",
  rim: "#3b4870",
  line: "#7d91c4",
  lineMajor: "#b9c9f2",
  label: "#d7e2ff",
  shadow: "#070b18",
  glow: "#9dc2ff",
  accent: "#8fb4ff",
  text: "#e6ecff",
  textSoft: "#93a2cc",
  card: "#1b2340",
  star: "#ffffff",
};

/** 해가 지평선에 걸린 노을빛. 밤과 낮 사이를 이 색으로 지나 회색을 피한다. */
export const DUSK_PALETTE: Palette = {
  background: "#eccfb4",
  backgroundEdge: "#d2ad8e",
  bowl: "#cdae90",
  bowlDeep: "#a17f64",
  rim: "#f0d9c0",
  line: "#6f5745",
  lineMajor: "#47372b",
  label: "#3d2f26",
  shadow: "#382820",
  glow: "#ffbe74",
  accent: "#d0762f",
  text: "#3d2f26",
  textSoft: "#7b6350",
  card: "#f8e5d0",
  star: "#ffe6c6",
};

const TWILIGHT_LOW = -6;
const TWILIGHT_HIGH = 6;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function channel(color: string, index: number): number {
  return parseInt(color.slice(1 + index * 2, 3 + index * 2), 16);
}

/**
 * 색에서 채도를 뺀다. 0이면 그대로, 1이면 같은 밝기의 회색이다.
 * 북쪽을 맞추기 전의 눈금판이 이것이다. 볕이 닿지 않은 청동처럼 가라앉아 있다.
 */
export function desaturate(color: string, amount: number): string {
  const t = clamp01(amount);
  const r = channel(color, 0);
  const g = channel(color, 1);
  const b = channel(color, 2);
  const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  const hex = (v: number) => Math.round(v + (gray - v) * t).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** 여섯 자리 색에 투명도를 붙여 rgba 문자열로 만든다. */
export function withAlpha(color: string, alpha: number): string {
  const a = Math.round(clamp01(alpha) * 1000) / 1000;
  return `rgba(${channel(color, 0)}, ${channel(color, 1)}, ${channel(color, 2)}, ${a})`;
}

export function lerpColor(from: string, to: string, t: number): string {
  const ratio = clamp01(t);
  let result = "#";
  for (let i = 0; i < 3; i += 1) {
    const value = Math.round(channel(from, i) + (channel(to, i) - channel(from, i)) * ratio);
    result += value.toString(16).padStart(2, "0");
  }
  return result;
}

function blendPalettes(from: Palette, to: Palette, t: number): Palette {
  const blended = {} as Palette;
  for (const key of Object.keys(from) as (keyof Palette)[]) {
    blended[key] = lerpColor(from[key], to[key], t);
  }
  return blended;
}

/**
 * 해가 지평선 언저리에 있는 동안 밤빛과 낮빛이 서서히 섞인다.
 * 곧장 섞으면 가운데가 잿빛이 된다. 지평선에서는 노을빛을 지난다.
 */
export function themeAt(sunAltitude: number): Palette {
  const t = clamp01((sunAltitude - TWILIGHT_LOW) / (TWILIGHT_HIGH - TWILIGHT_LOW));
  if (t === 0) return NIGHT_PALETTE;
  if (t === 1) return DAY_PALETTE;
  if (t < 0.5) return blendPalettes(NIGHT_PALETTE, DUSK_PALETTE, t * 2);
  return blendPalettes(DUSK_PALETTE, DAY_PALETTE, (t - 0.5) * 2);
}

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const RADIUS = { sm: 10, md: 18, lg: 28, round: 999 } as const;
export const FONT_SIZE = {
  hero: 34,
  title: 22,
  body: 16,
  caption: 13,
  tiny: 11,
} as const;
