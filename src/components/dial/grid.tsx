import { Path } from "@shopify/react-native-skia";
import { useMemo } from "react";

import { contiguousRuns, DialGeometry } from "../../lib/dial/geometry";
import { DialPoint } from "../../lib/dial/projection";
import { findBranchEdges } from "../../lib/dial/reading";
import { Palette } from "../../theme";
import { toSkPath } from "./path";

interface GridProps {
  geometry: DialGeometry;
  radius: number;
  palette: Palette;
  /** 그 밤에 달그림자가 지나는 길. 낮에는 비어 있다. */
  moonLine: DialPoint[];
  /** 그림자가 걸린 시각. 그 시의 구역을 칠한다. 그림자가 없으면 null이다. */
  highlightMinutes?: number | null;
}

/**
 * 시가 갈리는 두 선 사이를 채운 조각. 이름이 점이 아니라 이 구역의 것임을 보인다.
 * 두 선의 끝을 곧게 이어 닫으므로 절기선을 따라가는 호와는 조금 다르지만,
 * 옅게 칠하는 데는 충분하다. 반구에 없는 시각선이면 null이다.
 */
function sectorPath(geometry: DialGeometry, minutes: number, radius: number) {
  const edges = findBranchEdges(geometry.hourLines, minutes);
  if (!edges) return null;
  const path = toSkPath([...edges.start.points, ...[...edges.end.points].reverse()], radius);
  path.close();
  return path;
}

/**
 * 가로줄은 절기선 13개, 세로줄은 30분마다의 시각선이다.
 * 시각선이 덮지 못하는 절기선 구간은 옅게 그려 눈금이 없는 곳임을 보인다.
 * 그 구간은 좌우로 나뉘므로 이어진 토막끼리만 그려야 금이 생기지 않는다.
 *
 * 밤에 달시계로 읽을 때는 달이 오늘 지나는 길을 한 줄 더 밝힌다. 달의 적위는
 * 해와 달라 절기선 사이 어딘가를 지나므로, 그 줄이 곧 오늘 밤의 눈금이다.
 */
export function Grid({ geometry, radius, palette, moonLine, highlightMinutes = null }: GridProps) {
  const sector = useMemo(
    () => (highlightMinutes === null ? null : sectorPath(geometry, highlightMinutes, radius)),
    [geometry, highlightMinutes, radius]
  );

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
        isBranchEdge: line.isBranchEdge,
      })),
    [geometry, radius]
  );

  const moonPath = useMemo(
    () => (moonLine.length > 1 ? toSkPath(moonLine, radius) : null),
    [moonLine, radius]
  );

  return (
    <>
      {sector ? <Path path={sector} color={palette.glow} opacity={0.16} /> : null}
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
      {moonPath ? (
        <Path
          path={moonPath}
          style="stroke"
          strokeWidth={radius * 0.011}
          color={palette.star}
          opacity={0.8}
        />
      ) : null}
      {hourPaths.map((line) => (
        <Path
          key={`hour-${line.key}`}
          path={line.path}
          style="stroke"
          strokeWidth={
            line.isBranchEdge
              ? radius * 0.021
              : line.isMajor
                ? radius * 0.009
                : radius * 0.005
          }
          color={line.isMajor || line.isBranchEdge ? palette.lineMajor : palette.line}
          opacity={line.isBranchEdge ? 0.95 : line.isMajor ? 0.68 : 0.45}
        />
      ))}
    </>
  );
}
