import { mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";

import { buildDialGeometry, contiguousRuns, HANYANG_LATITUDE } from "../src/lib/dial/geometry";
import { horizontalFromEquatorial } from "../src/lib/astro/solar";
import { gnomonRootPoint, rodShadowPoints, shadowPoint } from "../src/lib/dial/projection";

const OUT = process.env.GEO_OUT ?? "dial-geometry.json";

/** 아이콘과 스플래시가 앱과 같은 눈금을 쓰도록 좌표를 내보낸다. */
it("눈금 좌표를 내보낸다", () => {
  const g = buildDialGeometry(HANYANG_LATITUDE);

  // 늦은 오후의 해. 그림자가 북동쪽으로 길게 뻗는다.
  const light = horizontalFromEquatorial(52, 5, HANYANG_LATITUDE);

  const data = {
    latitude: HANYANG_LATITUDE,
    gnomonRoot: gnomonRootPoint(HANYANG_LATITUDE),
    solarTermLines: g.solarTermLines.map((l) => ({
      declination: l.declination,
      label: l.label,
      inside: contiguousRuns(l.points, true),
      outside: contiguousRuns(l.points, false),
    })),
    hourLines: g.hourLines.map((l) => ({
      apparentMinutes: l.apparentMinutes,
      isMajor: l.isMajor,
      label: l.label,
      points: l.points,
    })),
    shadow: {
      altitude: light.altitude,
      azimuth: light.azimuth,
      tip: shadowPoint(light.altitude, light.azimuth, 0),
      rod: rodShadowPoints(HANYANG_LATITUDE, light.altitude, light.azimuth, 0, 64),
    },
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(data));
  expect(data.solarTermLines).toHaveLength(13);
});
