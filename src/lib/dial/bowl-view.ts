import { CurvePoint, DialGeometry } from "./geometry";
import { DialPoint, horizonDirection, shadowPoint } from "./projection";

/**
 * 오목한 반구를 어떻게 화면에 놓고 볼지 정한다.
 *
 * 곧장 내려다보면 그릇이 납작한 원으로만 보인다. 그렇다고 진짜로 눈을
 * 낮추면 가까운 테두리가 바로 아래 안벽을 가린다. 여름 새벽과 저녁의
 * 눈금이 하필 거기 있어서, 눈을 조금만 낮춰도 그 시각이 화면에서 접혀
 * 서로 겹친다. 안 보이는 시각을 만들지 않는 것이 이 앱의 약속이다.
 *
 * 그래서 진짜 시점 대신 눌러 보이기만 한다. 위아래로 눌러 그릇처럼 보이게
 * 하고, 먼 쪽을 조금 좁혀 비스듬한 느낌을 낸다. 두 점이 한자리로 겹치는
 * 일이 없는 옮김이라 눈금은 하나도 가려지지 않는다.
 *
 * 눈금을 만드는 일과는 따로 둔다. `geometry.ts`가 내놓는 좌표는 논문과
 * 맞춰 검증한 값이고, 여기서 하는 일은 그것을 어떻게 보일지 정하는 것뿐이다.
 */

/** 위아래로 누르는 정도. 1이면 곧장 내려다보는 것이다. */
export const BOWL_SQUASH = 0.86;

/** 먼 쪽을 좁히는 정도. 1보다 작아야 겹치는 자리가 생기지 않는다. */
export const BOWL_PERSPECTIVE = 0.15;

export function leanBowlPoint(point: DialPoint): DialPoint {
  return {
    x: point.x * (1 + BOWL_PERSPECTIVE * point.y),
    y: point.y * BOWL_SQUASH,
  };
}

/**
 * 눌러 놓은 그릇에서 빛이 놓이는 쪽. 길이가 1인 방향이다.
 *
 * 그림자 끝은 그릇과 함께 눌린다. 해와 달을 누르지 않은 방위에 놓으면 빛과
 * 영침 끝과 그림자 끝이 몇 도 어긋난다. 눌린 그림자 끝의 정반대에 놓아야
 * 셋이 한 줄에 서고, 그림자가 왜 그쪽으로 뻗는지 보인다.
 */
export function bowlLightDirection(
  altitude: number,
  azimuth: number,
  headingDeg: number
): DialPoint {
  const tip = leanBowlPoint(shadowPoint(altitude, azimuth, headingDeg));
  const length = Math.hypot(tip.x, tip.y);
  // 천정의 빛은 그림자가 영침 끝 바로 아래라 방향이 없다. 방위로 대신한다.
  if (length < 1e-9) return horizonDirection(azimuth, headingDeg);
  return { x: -tip.x / length, y: -tip.y / length };
}

function leanCurvePoint(point: CurvePoint): CurvePoint {
  const { x, y } = leanBowlPoint(point);
  return { x, y, insideHourRange: point.insideHourRange };
}

export function leanBowlGeometry(geometry: DialGeometry): DialGeometry {
  return {
    latitude: geometry.latitude,
    gnomonRoot: leanBowlPoint(geometry.gnomonRoot),
    solarTermLines: geometry.solarTermLines.map((line) => ({
      ...line,
      points: line.points.map(leanCurvePoint),
    })),
    hourLines: geometry.hourLines.map((line) => ({
      ...line,
      points: line.points.map(leanBowlPoint),
    })),
  };
}

/** 눌러 놓은 그릇의 테두리. 원이 아니므로 점을 찍어 잇는다. */
export function bowlOutline(samples = 96): DialPoint[] {
  const points: DialPoint[] = [];
  for (let i = 0; i < samples; i += 1) {
    const angle = (i / samples) * Math.PI * 2;
    points.push(leanBowlPoint({ x: Math.cos(angle), y: Math.sin(angle) }));
  }
  return points;
}
