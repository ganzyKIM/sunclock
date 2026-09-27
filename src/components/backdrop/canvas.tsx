import { Canvas, FractalNoise, RadialGradient, Rect, vec } from "@shopify/react-native-skia";

import { Palette, withAlpha } from "../../theme";

export interface BackdropCanvasProps {
  width: number;
  height: number;
  palette: Palette;
}

/**
 * 화면 전체의 바탕. 종이 결과 가장자리의 그늘이다.
 *
 * 평평한 한 색은 화면처럼 보이고, 결이 있으면 종이처럼 보인다. 결은 눈에
 * 띄지 않을 만큼만 얹는다. 가장자리를 조금 어둡게 하면 눈이 한가운데로
 * 모인다. 그림책의 책장이 그렇다.
 */
export default function BackdropCanvas({ width, height, palette }: BackdropCanvasProps) {
  const diagonal = Math.hypot(width, height);
  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      <Rect x={0} y={0} width={width} height={height} opacity={0.045} blendMode="softLight">
        <FractalNoise freqX={0.9} freqY={0.9} octaves={3} seed={7} />
      </Rect>
      <Rect x={0} y={0} width={width} height={height}>
        <RadialGradient
          c={vec(width / 2, height * 0.42)}
          r={diagonal * 0.7}
          colors={[
            withAlpha(palette.backgroundEdge, 0),
            withAlpha(palette.backgroundEdge, 0),
            withAlpha(palette.backgroundEdge, 0.32),
          ]}
          positions={[0, 0.45, 1]}
        />
      </Rect>
    </Canvas>
  );
}
