import { mkdirSync, writeFileSync } from "fs";

import { spreadBowlPoint } from "../src/lib/dial/bowl-view";
import {
  buildDialGeometry,
  contiguousRuns,
  HANYANG_LATITUDE,
} from "../src/lib/dial/geometry";
import { DialPoint, rodShadowPoints, shadowPoint } from "../src/lib/dial/projection";
import { DAY_PALETTE } from "../src/theme";

/**
 * 오목한 반구를 화면에 어떻게 눕혀 보일지 후보를 나란히 뽑아 본다.
 *
 * 곧장 내려다보면 테두리 쪽 눈금이 한 줄로 몰리고, 너무 펼치면 가운데가
 * 좁아져 눈금이 뭉친다. 그 사이 어디가 좋은지는 눈으로 봐야 안다.
 *
 *   npx jest --config jest.preview.config.js -t "반구 투영"
 */

const R = 210;
const OUT = process.env.BOWL_OUT ?? "dial-preview";

type Mapper = (point: DialPoint) => DialPoint;

const identity: Mapper = (p) => p;

/** 어안렌즈처럼 펴서 테두리 쪽에 자리를 준다. */
const spread: Mapper = spreadBowlPoint;

/**
 * 그릇을 비스듬히 본 것처럼 눌러 보인다.
 *
 * 진짜로 눈을 낮추면 가까운 테두리가 아래 안벽을 가려, 그 자리의 눈금이
 * 화면에서 접혀 서로 겹친다. 여름 새벽과 저녁의 눈금이 바로 거기 있다.
 * 그래서 진짜 시점 대신 눌러 보이기만 한다. 위아래로 눌러 그릇처럼 보이게
 * 하고, 먼 쪽을 조금 좁혀 비스듬한 느낌을 준다. 이 옮김은 겹치는 자리가
 * 없으므로 눈금이 하나도 가려지지 않는다.
 */
function lean(squash: number, perspective: number): Mapper {
  return (point) => ({
    x: point.x * (1 + perspective * point.y),
    y: point.y * squash,
  });
}

/** 글자를 시각선의 어느 끝에 붙일지. */
type Anchor = "summer" | "winter";

const VIEWS: { title: string; map: Mapper; anchor: Anchor }[] = [
  { title: "곧장 내려다보기", map: identity, anchor: "winter" },
  { title: "살짝 눌러 0.9 · 0.12", map: lean(0.9, 0.12), anchor: "winter" },
  { title: "눌러 0.82 · 0.18", map: lean(0.82, 0.18), anchor: "winter" },
  { title: "많이 눌러 0.72 · 0.26", map: lean(0.72, 0.26), anchor: "winter" },
];

function poly(points: DialPoint[], map: Mapper): string {
  return points
    .map((p) => {
      const q = map(p);
      return `${(q.x * R).toFixed(2)},${(q.y * R).toFixed(2)}`;
    })
    .join(" ");
}

function rimPath(map: Mapper): string {
  const points: DialPoint[] = [];
  for (let i = 0; i <= 180; i += 1) {
    const angle = (i / 180) * Math.PI * 2;
    points.push({ x: Math.cos(angle), y: Math.sin(angle) });
  }
  return poly(points, map);
}

function panel(
  map: Mapper,
  title: string,
  anchor: Anchor,
  x: number,
  y: number
): string {
  const p = DAY_PALETTE;
  const g = buildDialGeometry(HANYANG_LATITUDE);
  const tip = map(shadowPoint(45, 225, 0));
  const rod = rodShadowPoints(HANYANG_LATITUDE, 45, 225, 0);
  const root = map(g.gnomonRoot);

  const terms = g.solarTermLines
    .map((line) =>
      contiguousRuns(line.points, true)
        .map(
          (run) =>
            `<polyline points="${poly(run, map)}" fill="none" stroke="${p.line}"` +
            ` stroke-width="1.6" opacity="0.7"/>`
        )
        .join("")
    )
    .join("");

  const hours = g.hourLines
    .map(
      (line) =>
        `<polyline points="${poly(line.points, map)}" fill="none" stroke="${
          line.isMajor ? p.lineMajor : p.line
        }" stroke-width="${line.isMajor ? 3 : 1.3}" opacity="${
          line.isMajor ? 0.9 : 0.5
        }"/>`
    )
    .join("");

  const labels = g.hourLines
    .filter((line) => line.label)
    .map((line) => {
      const raw =
        anchor === "summer" ? line.points[line.points.length - 1] : line.points[0];
      const end = map(raw);
      const inset = anchor === "summer" ? 0.88 : 0.9;
      return (
        `<text x="${(end.x * R * inset).toFixed(1)}" y="${(
          end.y * R * inset +
          6
        ).toFixed(1)}" fill="${p.label}" font-size="17" text-anchor="middle">${
          line.label
        }</text>`
      );
    })
    .join("");

  return `<g transform="translate(${x},${y})">
    <polygon points="${rimPath(map)}" fill="${p.bowl}" stroke="${p.rim}" stroke-width="8"/>
    ${terms}${hours}${labels}
    <line x1="${(root.x * R).toFixed(1)}" y1="${(root.y * R).toFixed(1)}" x2="0" y2="0"
      stroke="${p.lineMajor}" stroke-width="5" stroke-linecap="round"/>
    <polyline points="${poly(rod, map)}" fill="none" stroke="${p.shadow}"
      stroke-width="6" stroke-linecap="round" opacity="0.55"/>
    <circle cx="${(tip.x * R).toFixed(1)}" cy="${(tip.y * R).toFixed(1)}" r="14"
      fill="${p.glow}" opacity="0.5"/>
    <circle cx="${(tip.x * R).toFixed(1)}" cy="${(tip.y * R).toFixed(1)}" r="6"
      fill="${p.shadow}"/>
    <text x="0" y="${R + 40}" fill="${p.text}" font-size="20" text-anchor="middle">${title}</text>
  </g>`;
}

it("반구 투영 후보를 그림으로 뽑는다", () => {
  mkdirSync(OUT, { recursive: true });

  const cell = R * 2 + 70;
  const cols = 2;
  const rows = Math.ceil(VIEWS.length / cols);
  const width = cols * cell;
  const height = rows * cell;

  const panels = VIEWS.map((view, index) =>
    panel(
      view.map,
      view.title,
      view.anchor,
      (index % cols) * cell + cell / 2,
      Math.floor(index / cols) * cell + R + 20
    )
  ).join("\n");

  writeFileSync(
    `${OUT}/bowl-views.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${DAY_PALETTE.background}"/>
  ${panels}
</svg>`
  );

  expect(VIEWS.length).toBeGreaterThan(0);
});
