import { ALIGNMENT_RELEASE_DEGREES, ALIGNMENT_TOLERANCE_DEGREES } from "./angle";

/**
 * 북쪽을 맞췄는지를 판정한 기록.
 *
 * 각도의 여유(들어올 때 15도, 나갈 때 22도)만으로는 모자란다. 나침반은
 * 경계 근처에서 잘게 떨리고, 그때마다 맞았다 틀렸다를 오가면 화면이
 * 깜빡인다. 그래서 반대 상태가 잠깐 이어져야 비로소 넘어간다.
 */
export interface AlignmentTrack {
  aligned: boolean;
  /** 지금과 반대되는 조건이 이어지기 시작한 시각. 이어지지 않으면 null. */
  since: number | null;
}

/** 이만큼 맞은 채로 있어야 맞았다고 본다. 밀리초. */
export const ALIGN_DWELL_MS = 350;
/** 이만큼 벗어난 채로 있어야 풀린다. 풀리는 쪽이 더 느긋하다. */
export const RELEASE_DWELL_MS = 600;

export const INITIAL_ALIGNMENT: AlignmentTrack = { aligned: false, since: null };

/**
 * 새 방위 하나를 받아 판정을 한 걸음 옮긴다.
 *
 * `offsetDegrees`는 북쪽에서 벗어난 각도, `now`는 그 값을 받은 시각이다.
 */
export function trackAlignment(
  previous: AlignmentTrack,
  offsetDegrees: number,
  now: number
): AlignmentTrack {
  const within =
    offsetDegrees <=
    (previous.aligned ? ALIGNMENT_RELEASE_DEGREES : ALIGNMENT_TOLERANCE_DEGREES);

  if (within === previous.aligned) {
    // 지금 상태와 같은 쪽이다. 반대쪽으로 넘어가려던 기록은 지운다.
    return previous.since === null ? previous : { aligned: previous.aligned, since: null };
  }

  const since = previous.since ?? now;
  const dwell = previous.aligned ? RELEASE_DWELL_MS : ALIGN_DWELL_MS;
  if (now - since >= dwell) return { aligned: !previous.aligned, since: null };
  return { aligned: previous.aligned, since };
}
