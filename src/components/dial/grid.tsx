import { Path } from "@shopify/react-native-skia";
import { useMemo } from "react";

import { contiguousRuns, DialGeometry } from "../../lib/dial/geometry";
import { Palette } from "../../theme";
import { toSkPath } from "./path";

interface GridProps {
  geometry: DialGeometry;
  radius: number;
  palette: Palette;
}

/**
 * 가로줄은 절기선 13개, 세로줄은 30분마다의 시각선이다.
 * 시각선이 덮지 못하는 절기선 구간은 옅게 그려 눈금이 없는 곳임을 보인다.
 * 그 구간은 좌우로 나뉘므로 이어진 토막끼리만 그려야 금이 생기지 않는다.
 */
export function Grid({ geometry, radius, palette }: GridProps) {
  const solarTermPaths = useMemo(
    () =>
      geometry.solarTermLines.map((line) => ({
        key: line.label,
        inside: contiguousRuns(line.points, true).map((run) => toSkPath(run, radius)),
        outside: contiguousRuns(line.points, false).map((run) => toSkPath(run, radius)),
      })),
    [geometry, radius]
  );

  const hourPaths = useMemo(
    () =>
      geometry.hourLines.map((line) => ({
        key: line.apparentMinutes,
        path: toSkPath(line.points, radius),
        isMajor: line.isMajor,
      })),
    [geometry, radius]
  );

  return (
    <>
      {solarTermPaths.map((line) =>
        line.outside.map((path, index) => (
          <Path
            key={`term-out-${line.key}-${index}`}
            path={path}
            style="stroke"
            strokeWidth={radius * 0.006}
            color={palette.line}
            opacity={0.25}
          />
        ))
      )}
      {solarTermPaths.map((line) =>
        line.inside.map((path, index) => (
          <Path
            key={`term-${line.key}-${index}`}
            path={path}
            style="stroke"
            strokeWidth={radius * 0.008}
            color={palette.line}
            opacity={0.75}
          />
        ))
      )}
      {hourPaths.map((line) => (
        <Path
          key={`hour-${line.key}`}
          path={line.path}
          style="stroke"
          strokeWidth={line.isMajor ? radius * 0.014 : radius * 0.006}
          color={line.isMajor ? palette.lineMajor : palette.line}
          opacity={line.isMajor ? 0.9 : 0.55}
        />
      ))}
    </>
  );
}
