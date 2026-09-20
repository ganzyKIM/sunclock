import { Circle, Path, RadialGradient, Skia, vec } from "@shopify/react-native-skia";
import { useMemo } from "react";

import { FlatGeometry, INNER_RADIUS, OUTER_RADIUS } from "../../lib/dial/flat";
import { Palette } from "../../theme";

interface PlateProps {
  geometry: FlatGeometry;
  radius: number;
  palette: Palette;
}

/** 절기선 한 줄. 해가 떠 있는 만큼만 그린다. 그래서 호의 길이가 곧 낮의 길이다. */
function arcPath(centerRadius: number, halfDayAngle: number, radius: number) {
  const r = centerRadius * radius;
  const path = Skia.Path.Make();
  // 정오가 위쪽이므로 -90도에서 시작한다. 스킨은 3시 방향이 0도다.
  path.addArc({ x: -r, y: -r, width: 2 * r, height: 2 * r }, -90 - halfDayAngle, 2 * halfDayAngle);
  return path;
}

/** 펼친 원반. 가운데가 극이고 바깥으로 갈수록 겨울이다. */
export function Plate({ geometry, radius, palette }: PlateProps) {
  const arcs = useMemo(
    () =>
      geometry.termArcs.map((arc) => ({
        key: arc.label,
        full: arcPath(arc.radius, arc.halfDayAngle, radius),
        engraved: arcPath(arc.radius, Math.min(arc.halfDayAngle, 105), radius),
        beyond: arc.exceedsHourRange,
      })),
    [geometry, radius]
  );

  const hours = useMemo(
    () =>
      geometry.hourLines.map((line) => {
        const path = Skia.Path.Make();
        path.moveTo(line.from.x * radius, line.from.y * radius);
        path.lineTo(line.to.x * radius, line.to.y * radius);
        return { key: line.apparentMinutes, path, isMajor: line.isMajor };
      }),
    [geometry, radius]
  );

  return (
    <>
      <Circle cx={0} cy={0} r={OUTER_RADIUS * radius}>
        <RadialGradient
          c={vec(0, -radius * 0.2)}
          r={OUTER_RADIUS * radius * 1.35}
          colors={[palette.bowl, palette.bowlDeep]}
        />
      </Circle>
      <Circle
        cx={0}
        cy={0}
        r={OUTER_RADIUS * radius}
        style="stroke"
        strokeWidth={radius * 0.035}
        color={palette.rim}
      />

      {arcs.map((arc) =>
        arc.beyond ? (
          <Path
            key={`term-out-${arc.key}`}
            path={arc.full}
            style="stroke"
            strokeWidth={radius * 0.005}
            color={palette.line}
            opacity={0.3}
          />
        ) : null
      )}
      {arcs.map((arc) => (
        <Path
          key={`term-${arc.key}`}
          path={arc.engraved}
          style="stroke"
          strokeWidth={radius * 0.007}
          color={palette.line}
          opacity={0.8}
        />
      ))}

      {hours.map((line) => (
        <Path
          key={`hour-${line.key}`}
          path={line.path}
          style="stroke"
          strokeWidth={line.isMajor ? radius * 0.013 : radius * 0.005}
          color={line.isMajor ? palette.lineMajor : palette.line}
          opacity={line.isMajor ? 0.9 : 0.5}
        />
      ))}

      {/* 가운데 영침 자리. 눈금이 들어오지 않는 빈 터다. */}
      <Circle
        cx={0}
        cy={0}
        r={INNER_RADIUS * radius}
        style="stroke"
        strokeWidth={radius * 0.006}
        color={palette.line}
        opacity={0.45}
      />
    </>
  );
}
