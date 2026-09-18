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

const TWILIGHT_LOW = -6;
const TWILIGHT_HIGH = 6;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function channel(color: string, index: number): number {
  return parseInt(color.slice(1 + index * 2, 3 + index * 2), 16);
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

/** 해가 지평선 언저리에 있는 동안 밤빛과 낮빛이 서서히 섞인다. */
export function themeAt(sunAltitude: number): Palette {
  const t = clamp01((sunAltitude - TWILIGHT_LOW) / (TWILIGHT_HIGH - TWILIGHT_LOW));
  if (t === 0) return NIGHT_PALETTE;
  if (t === 1) return DAY_PALETTE;

  const blended = {} as Palette;
  for (const key of Object.keys(DAY_PALETTE) as (keyof Palette)[]) {
    blended[key] = lerpColor(NIGHT_PALETTE[key], DAY_PALETTE[key], t);
  }
  return blended;
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
