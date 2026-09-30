import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";

import { themeAt } from "../../theme";
import { widgetMomentAt } from "./moment";

/**
 * 위젯과 대기화면은 앱이 꺼져 있어도 돌아야 해서 코틀린으로 다시 적었다.
 * 두 쪽이 어긋나지 않도록 여기서 기준값을 뽑아 두고 코틀린 시험이 같은 값을
 * 내는지 본다. 계산을 고쳤으면 아래 명령으로 기준값을 다시 뽑는다.
 *
 *   UPDATE_WIDGET_VECTORS=1 npx jest src/lib/widget
 */
const VECTOR_DIR = join(
  __dirname,
  "../../../modules/angbuilgu-widget/android/src/test/resources"
);

const PLACES = [
  { latitude: 37.5796, longitude: 126.977 },
  { latitude: 33.4996, longitude: 126.5312 },
  { latitude: 40.7128, longitude: -74.006 },
  { latitude: 51.5072, longitude: -0.1276 },
  { latitude: 1.3521, longitude: 103.8198 },
];

function momentLines(): string[] {
  const lines: string[] = [];
  const start = Date.UTC(2026, 0, 3, 0, 7, 0);
  // 23일 하고 다섯 시간 남짓씩 건너뛰어 계절과 시각을 고루 밟는다.
  const step = (23 * 24 + 5) * 3600_000 + 13 * 60_000;
  for (let i = 0; i < 40; i += 1) {
    const place = PLACES[i % PLACES.length];
    const date = new Date(start + i * step);
    const m = widgetMomentAt(date, place.latitude, place.longitude);
    lines.push(
      [
        date.getTime(),
        place.latitude,
        place.longitude,
        m.isDay ? 1 : 0,
        m.sunAltitude.toFixed(8),
        m.apparentMinutes.toFixed(8),
        m.dialMinutes.toFixed(8),
        m.tip.x.toFixed(8),
        m.tip.y.toFixed(8),
        m.lightDeclination.toFixed(8),
        m.halfDayAngle.toFixed(8),
        m.traditional.branchIndex,
        m.traditional.label,
        m.solarTermName,
      ].join("\t")
    );
  }
  return lines;
}

function paletteLines(): string[] {
  return [-12, -6, -4.5, -3, -1, 0, 1.5, 3, 4.5, 6, 30].map((altitude) => {
    const p = themeAt(altitude);
    return [
      altitude,
      p.background,
      p.backgroundEdge,
      p.bowl,
      p.bowlDeep,
      p.rim,
      p.line,
      p.lineMajor,
      p.label,
      p.shadow,
      p.glow,
      p.accent,
      p.text,
      p.textSoft,
      p.card,
      p.star,
    ].join("\t");
  });
}

describe("코틀린과 나눠 쓰는 기준값", () => {
  const files: [string, () => string[]][] = [
    ["moments.tsv", momentLines],
    ["palettes.tsv", paletteLines],
  ];

  it.each(files)("%s가 지금 계산과 같다", (name, build) => {
    const path = join(VECTOR_DIR, name);
    const fresh = build().join("\n") + "\n";

    if (process.env.UPDATE_WIDGET_VECTORS === "1" || !existsSync(path)) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, fresh);
    }

    expect(readFileSync(path, "utf8")).toBe(fresh);
  });
});
