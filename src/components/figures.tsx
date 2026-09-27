import { StyleSheet, Text, View } from "react-native";

import { FONT_SIZE, lerpColor, Palette, RADIUS, SPACING, withAlpha } from "../theme";

export type FigureKind = "shadow-length" | "hour-halves" | "moon-flip" | "two-shadows";

interface FigureProps {
  kind: FigureKind;
  palette: Palette;
  /** 그림의 너비. 높이는 그림마다 알맞게 잡는다. */
  width: number;
}

/**
 * 설명 곁에 놓는 작은 그림들.
 *
 * 글로 세 줄 걸릴 것을 한눈에 보이게 한다. 실제 눈금판을 다시 그리는 것이
 * 아니라 핵심 하나만 남긴 도식이라, 화면 부품만으로 그린다.
 */
export function Figure({ kind, palette, width }: FigureProps) {
  switch (kind) {
    case "shadow-length":
      return <ShadowLength palette={palette} width={width} />;
    case "hour-halves":
      return <HourHalves palette={palette} width={width} />;
    case "moon-flip":
      return <MoonFlip palette={palette} width={width} />;
    case "two-shadows":
      return <TwoShadows palette={palette} width={width} />;
  }
}

/** 한가운데서 뻗는 막대. 왼쪽 끝을 축으로 돌린다. */
function Bar({
  center,
  length,
  angle,
  thickness,
  color,
  opacity,
}: {
  center: number;
  length: number;
  angle: number;
  thickness: number;
  color: string;
  opacity: number;
}) {
  return (
    <View
      style={{
        position: "absolute",
        left: center,
        top: center - thickness / 2,
        width: length,
        height: thickness,
        borderRadius: thickness / 2,
        backgroundColor: color,
        opacity,
        transform: [
          { translateX: -length / 2 },
          { rotate: `${angle}deg` },
          { translateX: length / 2 },
        ],
      }}
    />
  );
}

function tip(center: number, length: number, angle: number) {
  const a = (angle * Math.PI) / 180;
  return { x: center + Math.cos(a) * length, y: center + Math.sin(a) * length };
}

/** 여름엔 짧아 안쪽 줄에, 겨울엔 길어 바깥 줄에 닿는다. */
function ShadowLength({ palette, width }: { palette: Palette; width: number }) {
  const size = Math.min(width, 220);
  const center = size / 2;
  const rings = [
    { r: 0.3, label: "하지" },
    { r: 0.58, label: "춘분·추분" },
    { r: 0.86, label: "동지" },
  ];
  const summer = tip(center, center * 0.3, -50);
  const winter = tip(center, center * 0.86, -130);

  return (
    <View style={{ width: size, height: size, alignSelf: "center" }}>
      {rings.map((ring) => (
        <View
          key={ring.label}
          style={{
            position: "absolute",
            left: center - center * ring.r,
            top: center - center * ring.r,
            width: center * ring.r * 2,
            height: center * ring.r * 2,
            borderRadius: RADIUS.round,
            borderWidth: 1,
            borderColor: withAlpha(palette.line, 0.5),
          }}
        />
      ))}
      {rings.map((ring) => (
        <Text
          key={`label-${ring.label}`}
          style={[
            styles.tiny,
            {
              position: "absolute",
              left: 0,
              right: 0,
              top: center + center * ring.r - 14,
              textAlign: "center",
              color: palette.textSoft,
            },
          ]}
        >
          {ring.label}
        </Text>
      ))}

      <Bar center={center} length={center * 0.3} angle={-50} thickness={5} color={palette.shadow} opacity={0.7} />
      <Bar center={center} length={center * 0.86} angle={-130} thickness={5} color={palette.shadow} opacity={0.7} />
      <Text style={[styles.tiny, { position: "absolute", left: summer.x + 4, top: summer.y - 18, color: palette.text }]}>
        여름 · 짧다
      </Text>
      <Text style={[styles.tiny, { position: "absolute", right: size - winter.x + 4, top: winter.y - 18, color: palette.text }]}>
        겨울 · 길다
      </Text>

      <View
        style={{
          position: "absolute",
          left: center - 5,
          top: center - 5,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: palette.lineMajor,
        }}
      />
    </View>
  );
}

/** 한 시는 초와 정으로 갈리고, 이름은 그 한가운데에 있다. */
function HourHalves({ palette, width }: { palette: Palette; width: number }) {
  const cells = ["초각", "이각", "삼각", "사각", "초각", "이각", "삼각", "사각"];
  return (
    <View style={{ width, gap: SPACING.xs }}>
      <View style={styles.row}>
        <Text style={[styles.half, { color: palette.textSoft }]}>진초</Text>
        <Text style={[styles.half, { color: palette.textSoft }]}>진정</Text>
      </View>
      <View style={[styles.row, { borderColor: withAlpha(palette.line, 0.5), borderWidth: 1, borderRadius: RADIUS.sm, overflow: "hidden" }]}>
        {cells.map((cell, index) => (
          <View
            key={index}
            style={{
              flex: 1,
              paddingVertical: SPACING.xs,
              alignItems: "center",
              backgroundColor:
                index < 4 ? withAlpha(palette.glow, 0.18) : withAlpha(palette.accent, 0.14),
              borderLeftWidth: index === 0 ? 0 : index === 4 ? 2 : 1,
              borderLeftColor: index === 4 ? palette.lineMajor : withAlpha(palette.line, 0.35),
            }}
          >
            <Text style={[styles.tiny, { color: palette.textSoft }]}>{cell}</Text>
          </View>
        ))}
      </View>
      <View style={styles.row}>
        <Text style={[styles.tiny, { flex: 1, color: palette.textSoft }]}>7시</Text>
        <Text style={[styles.tiny, { flex: 1, textAlign: "center", color: palette.text, fontWeight: "700" }]}>
          8시 = 진
        </Text>
        <Text style={[styles.tiny, { flex: 1, textAlign: "right", color: palette.textSoft }]}>9시</Text>
      </View>
    </View>
  );
}

/** 보름달은 해의 정반대라 같은 눈금이 열두 시간 떨어진 두 시각을 가리킨다. */
function MoonFlip({ palette, width }: { palette: Palette; width: number }) {
  const size = Math.min(width, 200);
  const center = size / 2;
  const ring = center * 0.62;
  return (
    <View style={{ width: size, height: size, alignSelf: "center" }}>
      <View
        style={{
          position: "absolute",
          left: center - ring,
          top: center - ring,
          width: ring * 2,
          height: ring * 2,
          borderRadius: RADIUS.round,
          borderWidth: 1,
          borderColor: withAlpha(palette.line, 0.5),
        }}
      />
      <View
        style={{
          position: "absolute",
          left: center - 0.5,
          top: center - ring,
          width: 1,
          height: ring * 2,
          backgroundColor: withAlpha(palette.line, 0.4),
        }}
      />
      <View style={[styles.dot, { left: center - 9, top: center - ring - 9, backgroundColor: palette.glow }]} />
      <View style={[styles.dot, { left: center - 9, top: center + ring - 9, backgroundColor: lerpColor(palette.star, palette.rim, 0.3), borderWidth: 1, borderColor: withAlpha(palette.line, 0.6) }]} />
      <Text style={[styles.tiny, { position: "absolute", left: 0, right: 0, top: 0, textAlign: "center", color: palette.text }]}>
        해 · 낮 12시
      </Text>
      <Text style={[styles.tiny, { position: "absolute", left: 0, right: 0, bottom: 0, textAlign: "center", color: palette.text }]}>
        보름달 · 밤 12시
      </Text>
      <Text style={[styles.tiny, { position: "absolute", left: 0, right: 0, top: center - 8, textAlign: "center", color: palette.textSoft }]}>
        같은 눈금 · 12시간 차이
      </Text>
    </View>
  );
}

/** 밤의 두 그림자. 흐린 것이 지금 달그림자, 또렷한 것이 보정한 자리. */
function TwoShadows({ palette, width }: { palette: Palette; width: number }) {
  const size = Math.min(width, 220);
  const center = size / 2;
  const length = center * 0.8;
  const faint = tip(center, length, -125);
  const crisp = tip(center, length, -55);
  // 막대는 위로만 뻗으므로 아래 절반은 필요 없다. 축이 되는 점을 바닥에 둔다.
  const height = size * 0.62;
  return (
    <View style={{ width: size, height, alignSelf: "center" }}>
      <View style={{ position: "absolute", left: 0, top: height - center - 12, width: size, height: size }}>
        <Bar center={center} length={length} angle={-125} thickness={7} color={palette.shadow} opacity={0.22} />
        <Bar center={center} length={length} angle={-55} thickness={5} color={palette.shadow} opacity={0.75} />
        <View
          style={{
            position: "absolute",
            left: crisp.x - 9,
            top: crisp.y - 9,
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: withAlpha(palette.glow, 0.55),
          }}
        />
        <Text style={[styles.tiny, { position: "absolute", right: size - faint.x + 6, top: faint.y - 20, color: palette.textSoft }]}>
          지금 달그림자
        </Text>
        <Text style={[styles.tiny, { position: "absolute", left: crisp.x + 6, top: crisp.y - 20, color: palette.text, fontWeight: "700" }]}>
          보정한 자리
        </Text>
        <View
          style={{
            position: "absolute",
            left: center - 5,
            top: center - 5,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: palette.lineMajor,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  tiny: { fontSize: FONT_SIZE.tiny, lineHeight: FONT_SIZE.tiny * 1.4 },
  half: { flex: 1, textAlign: "center", fontSize: FONT_SIZE.tiny, fontWeight: "600" },
  dot: { position: "absolute", width: 18, height: 18, borderRadius: 9 },
});
