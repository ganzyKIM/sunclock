import { mkdirSync, writeFileSync } from "fs";
import { buildDialGeometry, contiguousRuns, HANYANG_LATITUDE } from "../src/lib/dial/geometry";
import { rodShadowPoints, shadowPoint } from "../src/lib/dial/projection";
import { DAY_PALETTE, NIGHT_PALETTE, Palette } from "../src/theme";

const R = 300;
const OUT = process.env.DIAL_OUT ?? "dial-preview";

function poly(points: { x: number; y: number }[]): string {
  return points.map((p) => `${(p.x * R).toFixed(2)},${(p.y * R).toFixed(2)}`).join(" ");
}

function render(latitude: number, altitude: number, azimuth: number, p: Palette, title: string) {
  const g = buildDialGeometry(latitude);
  const tip = shadowPoint(altitude, azimuth, 0);
  const rod = rodShadowPoints(latitude, altitude, azimuth, 0);

  const terms = g.solarTermLines
    .map((l) => {
      const outside = contiguousRuns(l.points, false)
        .map((run) => `<polyline points="${poly(run)}" fill="none" stroke="${p.line}" stroke-width="1.6" opacity="0.25"/>`)
        .join("\n    ");
      const inside = contiguousRuns(l.points, true)
        .map((run) => `<polyline points="${poly(run)}" fill="none" stroke="${p.line}" stroke-width="2.2" opacity="0.75"/>`)
        .join("\n    ");
      return `${outside}\n    ${inside}`;
    })
    .join("\n    ");

  const hours = g.hourLines
    .map(
      (l) =>
        `<polyline points="${poly(l.points)}" fill="none" stroke="${
          l.isMajor ? p.lineMajor : p.line
        }" stroke-width="${l.isMajor ? 4 : 1.8}" opacity="${l.isMajor ? 0.9 : 0.55}"/>`
    )
    .join("\n    ");

  const labels = g.hourLines
    .filter((l) => l.label)
    .map((l) => {
      const q = l.points[l.points.length - 1];
      const inset = 0.86;
      return `<text x="${(q.x * R * inset).toFixed(1)}" y="${(q.y * R * inset + 7).toFixed(1)}" fill="${
        p.label
      }" font-size="22" text-anchor="middle">${l.label}</text>`;
    })
    .join("\n    ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${R * 2 + 40}" height="${R * 2 + 70}" viewBox="${-R - 20} ${-R - 50} ${R * 2 + 40} ${R * 2 + 70}">
  <rect x="${-R - 20}" y="${-R - 50}" width="${R * 2 + 40}" height="${R * 2 + 70}" fill="${p.background}"/>
  <text x="0" y="${-R - 20}" fill="${p.text}" font-size="22" text-anchor="middle">${title}</text>
  <circle cx="0" cy="0" r="${R}" fill="${p.bowl}"/>
  <circle cx="0" cy="0" r="${R}" fill="none" stroke="${p.rim}" stroke-width="12"/>
    ${terms}
    ${hours}
    ${labels}
  <line x1="${(g.gnomonRoot.x * R).toFixed(1)}" y1="${(g.gnomonRoot.y * R).toFixed(1)}" x2="0" y2="0" stroke="${p.lineMajor}" stroke-width="7" stroke-linecap="round"/>
  <polyline points="${poly(rod)}" fill="none" stroke="${p.shadow}" stroke-width="9" stroke-linecap="round" opacity="0.55"/>
  <circle cx="${(tip.x * R).toFixed(1)}" cy="${(tip.y * R).toFixed(1)}" r="22" fill="${p.glow}" opacity="0.5"/>
  <circle cx="${(tip.x * R).toFixed(1)}" cy="${(tip.y * R).toFixed(1)}" r="8" fill="${p.shadow}"/>
</svg>`;
}

/**
 * 눈금이 실물과 같은 모양으로 나오는지 눈으로 보려고 쓰는 도구다.
 * `npm run render-dial`로 돌리면 SVG 세 장이 나온다.
 */
it("반구를 그림으로 뽑는다", () => {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    `${OUT}/dial-day.svg`,
    render(HANYANG_LATITUDE, 45, 225, DAY_PALETTE, "한양 위도 · 오후 해그림자")
  );
  writeFileSync(
    `${OUT}/dial-night.svg`,
    render(HANYANG_LATITUDE, 35, 160, NIGHT_PALETTE, "한양 위도 · 밤 달그림자")
  );
  writeFileSync(
    `${OUT}/dial-jeju.svg`,
    render(33.5, 45, 225, DAY_PALETTE, "제주 위도 33.5도")
  );
  expect(true).toBe(true);
});
