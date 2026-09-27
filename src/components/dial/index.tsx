import { useMemo } from "react";
import { View } from "react-native";

import { leanBowlGeometry, leanBowlPoint } from "../../lib/dial/bowl-view";
import type { DialGeometry } from "../../lib/dial/geometry";
import type { DialPoint } from "../../lib/dial/projection";
import type { Palette } from "../../theme";
import { DialCanvasHost } from "./canvas-host";
import { DialLabels } from "./labels";
import type { SkyContent } from "./sky";

export interface DialProps {
  geometry: DialGeometry;
  shadow: DialPoint | null;
  rodShadow: DialPoint[];
  /** 그 뒤에 흐리게 깔리는 그림자. 밤에 달이 실제로 드리운 그림자다. */
  ghostShadow?: DialPoint | null;
  ghostRodShadow?: DialPoint[];
  palette: Palette;
  /** 하늘까지 담는 바깥 상자의 한 변. */
  size: number;
  glowing: boolean;
  /** 달시계로 읽는 밤인지. */
  night: boolean;
  /** 그 밤에 달그림자가 지나는 길. 낮에는 비어 있다. */
  moonLine: DialPoint[];
  /** 12지 이름을 누르면 그 지지를 알려 준다. */
  onSelectBranch?: (branch: string) => void;
  /** 반구 바깥에 해와 달을 띄운다. 없으면 그리지 않는다. */
  sky?: SkyContent;
  /** 북쪽을 맞춘 정도. 0에서 1. 맞추면 테두리가 빛을 머금는다. */
  lit?: number;
  /** 그림자가 걸린 시각. 그 시의 구역을 칠한다. */
  highlightMinutes?: number | null;
}

/** 하늘을 띄울 때는 고리가 들어갈 자리를 남긴다. */
const BOWL_SHARE_WITH_SKY = 0.7;
const BOWL_SHARE_ALONE = 0.96;
/** 기본값이 매번 새 배열이면 메모가 헛돈다. */
const EMPTY: DialPoint[] = [];

/**
 * 반구는 휴대폰에 붙어 있으므로 화면에서 돌지 않는다. 움직이는 것은 그림자뿐이다.
 *
 * 그릇은 비스듬히 본 것처럼 눌러 보인다. 곧장 내려다보면 납작한 원으로만
 * 보이고, 진짜로 눈을 낮추면 여름 새벽과 저녁의 눈금이 가려진다.
 */
export function Dial({
  geometry,
  shadow,
  rodShadow,
  ghostShadow = null,
  ghostRodShadow = EMPTY,
  palette,
  size,
  glowing,
  night,
  moonLine,
  onSelectBranch,
  sky,
  lit = 0,
  highlightMinutes = null,
}: DialProps) {
  const center = size / 2;
  const radius = center * (sky ? BOWL_SHARE_WITH_SKY : BOWL_SHARE_ALONE);

  const leaned = useMemo(() => leanBowlGeometry(geometry), [geometry]);
  const leanedShadow = shadow ? leanBowlPoint(shadow) : null;
  const leanedRodShadow = useMemo(() => rodShadow.map(leanBowlPoint), [rodShadow]);
  const leanedGhostShadow = ghostShadow ? leanBowlPoint(ghostShadow) : null;
  const leanedGhostRodShadow = useMemo(
    () => ghostRodShadow.map(leanBowlPoint),
    [ghostRodShadow]
  );
  const leanedMoonLine = useMemo(() => moonLine.map(leanBowlPoint), [moonLine]);

  return (
    <View style={{ width: size, height: size }}>
      <DialCanvasHost
        geometry={leaned}
        shadow={leanedShadow}
        rodShadow={leanedRodShadow}
        ghostShadow={leanedGhostShadow}
        ghostRodShadow={leanedGhostRodShadow}
        palette={palette}
        size={size}
        radius={radius}
        glowing={glowing}
        moonLine={leanedMoonLine}
        sky={sky}
        lit={lit}
        highlightMinutes={highlightMinutes}
      />
      <DialLabels
        geometry={leaned}
        center={center}
        radius={radius}
        palette={palette}
        night={night}
        onSelectBranch={onSelectBranch}
      />
    </View>
  );
}
