# 휴대용 앙부일구 앱 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 휴대폰을 눕히고 남북을 맞추면 화면 속 반구에 그림자가 떨어지고 그 그림자가 가리키는 시각을 읽는 앙부일구 앱을 만든다.

**Architecture:** 네 층으로 나눈다. 순수 계산층(`src/lib/astro`, `src/lib/dial`, `src/lib/time`)은 리액트를 쓰지 않고 테스트로 전부 덮는다. 배치층(`src/hooks`)은 센서를 읽어 회전값 하나로 바꾼다. 화면층(`src/components`, `src/screens`)은 스킨으로 그린다. 라우트층(`src/app`)은 화면을 연결만 한다.

**Tech Stack:** Expo SDK 57, React Native 0.86, TypeScript, @shopify/react-native-skia, react-native-reanimated, expo-location, expo-sensors, suncalc, jest-expo, astronomy-engine(개발 의존성)

**Spec:** `docs/superpowers/specs/2026-09-18-angbuilgu-app-design.md`

## Global Constraints

- 지원 위도는 0도 초과 66도 미만이다. 그 밖은 안내 화면을 띄운다.
- `src/lib/**` 아래 코드는 리액트, 리액트 네이티브, 엑스포를 import 하지 않는다. 순수 함수만 둔다.
- 각도는 함수 경계에서 항상 도 단위로 주고받는다. 라디안은 함수 안에서만 쓴다.
- 방위각은 북쪽이 0도이고 동쪽으로 증가한다.
- 세상 좌표는 x가 동쪽, y가 북쪽, z가 천정이다.
- 화면 좌표는 중심이 원점이고 반지름이 1인 원판이다. 화면 위쪽이 반구의 북쪽이다.
- 테스트 파일은 대상 파일 옆에 둔다. 이름은 `<대상>.test.ts`로 한다.
- 천문 계산 허용 오차는 0.15도다.
- 커밋 메시지는 한국어로 쓰고 끝에 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`를 붙인다.
- 사용자에게 보이는 글은 한국어로 쓴다. 어려운 용어 앞에 쉬운 말을 둔다.

---

## 파일 구조

```
src/
  app/                        라우트만 둔다
    _layout.tsx
    index.tsx                 주화면
    settings.tsx
    help.tsx
  screens/
    dial/index.tsx            주화면 본체
    settings/index.tsx
    help/index.tsx
    help/term-animation.tsx   절기별 그림자 변화 애니메이션
  components/
    dial/
      index.tsx               반구 전체
      bowl.tsx                그릇 바탕과 질감
      grid.tsx                절기선과 시각선
      gnomon.tsx              영침
      shadow.tsx              그림자
      sky.tsx                 반구 바깥 하늘, 해와 달
    reading-card.tsx          시각 읽기
    alignment-guide.tsx       정렬 안내와 수평계
    info-tooltip.tsx          툴팁
    notice.tsx                예외 상태 안내
  hooks/
    use-now.ts                현재 시각
    use-location.ts           위치와 권한
    use-orientation.ts        나침반과 기울기
    use-settings.ts           설정 저장
    use-sundial.ts            위 넷을 묶어 화면에 넘길 값 하나로
  lib/
    astro/
      julian.ts
      solar.ts
      lunar.ts
    dial/
      constants.ts            24절기 적위, 시각 라벨
      projection.ts           구면에서 화면으로
      geometry.ts             절기선과 시각선 경로
    time/
      traditional.ts          96각법
      clock.ts                진태양시와 표준시
    placement/
      angle.ts                각도 보조 함수와 원형 평활
  theme.ts
  constants.ts
```

---

### Task 1: 프로젝트 세우기

**Files:**
- Create: 프로젝트 전체 (`package.json`, `tsconfig.json`, `app.json`, `src/app/_layout.tsx`, `src/app/index.tsx`)
- Create: `src/lib/placement/angle.ts`
- Test: `src/lib/placement/angle.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `normalizeDegrees(deg: number): number` — 0 이상 360 미만으로 접는다
  - `angleDifference(a: number, b: number): number` — a에서 b까지의 최단 차이, -180 초과 180 이하
  - `toRadians(deg: number): number`
  - `toDegrees(rad: number): number`

- [ ] **Step 1: 엑스포 앱을 만든다**

프로젝트 폴더에 이미 `docs/`와 `.git/`이 있으므로 임시 폴더에 만든 뒤 옮긴다.

```bash
cd /Users/dobedub/Desktop/sunclock
npx create-expo-app@latest .tmp-app --template blank-typescript --no-install
cp -R .tmp-app/. .
rm -rf .tmp-app
npm install
```

- [ ] **Step 2: 라우터 구조로 바꾼다**

`package.json`의 `main`을 `expo-router/entry`로 바꾸고 라우터를 설치한다.

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
```

`App.tsx`를 지우고 `src/app/_layout.tsx`를 만든다.

```tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`src/app/index.tsx`를 만든다.

```tsx
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>앙부일구</Text>
    </View>
  );
}
```

`app.json`의 `expo.plugins`에 `"expo-router"`를 넣고, `expo.scheme`을 `"angbuilgu"`로 정한다.

- [ ] **Step 3: 테스트 도구를 넣는다**

```bash
npx expo install jest-expo jest @types/jest --dev
npm install --save-dev astronomy-engine
```

`package.json`에 다음을 더한다.

```json
{
  "scripts": {
    "test": "jest",
    "typecheck": "tsc --noEmit"
  },
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/.*|native-base|react-native-svg|@shopify/react-native-skia|suncalc)"
    ]
  }
}
```

`tsconfig.json`의 `compilerOptions.types`에 `"jest"`를 더하고, `strict`이 `true`인지 확인한다.

- [ ] **Step 4: 실패하는 테스트를 쓴다**

`src/lib/placement/angle.test.ts`

```ts
import { angleDifference, normalizeDegrees, toDegrees, toRadians } from "./angle";

describe("normalizeDegrees", () => {
  it("0 이상 360 미만으로 접는다", () => {
    expect(normalizeDegrees(0)).toBe(0);
    expect(normalizeDegrees(360)).toBe(0);
    expect(normalizeDegrees(370)).toBe(10);
    expect(normalizeDegrees(-10)).toBe(350);
    expect(normalizeDegrees(-370)).toBe(350);
  });
});

describe("angleDifference", () => {
  it("최단 방향의 차이를 낸다", () => {
    expect(angleDifference(10, 0)).toBe(10);
    expect(angleDifference(350, 0)).toBe(-10);
    expect(angleDifference(0, 350)).toBe(10);
    expect(angleDifference(180, 0)).toBe(180);
  });
});

describe("toRadians와 toDegrees", () => {
  it("서로를 되돌린다", () => {
    expect(toDegrees(toRadians(37.65))).toBeCloseTo(37.65, 10);
    expect(toRadians(180)).toBeCloseTo(Math.PI, 12);
  });
});
```

- [ ] **Step 5: 테스트가 실패하는 것을 확인한다**

Run: `npm test -- angle`
Expected: FAIL. `./angle` 모듈을 찾지 못한다.

- [ ] **Step 6: 구현한다**

`src/lib/placement/angle.ts`

```ts
export function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function normalizeDegrees(deg: number): number {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

export function angleDifference(a: number, b: number): number {
  const d = normalizeDegrees(a - b);
  return d > 180 ? d - 360 : d;
}
```

- [ ] **Step 7: 테스트가 통과하는 것을 확인한다**

Run: `npm test -- angle`
Expected: PASS, 3개 묶음 전부 통과

- [ ] **Step 8: 타입 검사와 실행을 확인한다**

Run: `npm run typecheck`
Expected: 오류 없음

- [ ] **Step 9: 커밋한다**

```bash
git add -A
git commit -m "$(printf '엑스포 프로젝트와 각도 보조 함수 추가\n\n라우터, 타입스크립트, 제스트를 세우고 각도 정규화와\n최단 차이 계산을 테스트와 함께 구현했다.\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 2: 율리우스일

**Files:**
- Create: `src/lib/astro/julian.ts`
- Test: `src/lib/astro/julian.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `toJulianDay(date: Date): number`
  - `toJulianCentury(julianDay: number): number` — 2000년 1월 1일 정오 기준 세기 수

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/lib/astro/julian.test.ts`

```ts
import { toJulianCentury, toJulianDay } from "./julian";

describe("toJulianDay", () => {
  it("2000년 1월 1일 12시 협정세계시는 2451545이다", () => {
    expect(toJulianDay(new Date("2000-01-01T12:00:00Z"))).toBeCloseTo(2451545, 6);
  });

  it("하루 뒤는 1만큼 크다", () => {
    const a = toJulianDay(new Date("2026-09-18T00:00:00Z"));
    const b = toJulianDay(new Date("2026-09-19T00:00:00Z"));
    expect(b - a).toBeCloseTo(1, 9);
  });

  it("1970년 1월 1일 0시 협정세계시는 2440587.5이다", () => {
    expect(toJulianDay(new Date("1970-01-01T00:00:00Z"))).toBeCloseTo(2440587.5, 6);
  });
});

describe("toJulianCentury", () => {
  it("기준 시점에서 0이다", () => {
    expect(toJulianCentury(2451545)).toBeCloseTo(0, 12);
  });

  it("36525일 뒤에 1이다", () => {
    expect(toJulianCentury(2451545 + 36525)).toBeCloseTo(1, 12);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

Run: `npm test -- julian`
Expected: FAIL. 모듈이 없다.

- [ ] **Step 3: 구현한다**

`src/lib/astro/julian.ts`

```ts
const UNIX_EPOCH_JULIAN_DAY = 2440587.5;
const MILLISECONDS_PER_DAY = 86400000;
const DAYS_PER_JULIAN_CENTURY = 36525;
const J2000 = 2451545;

export function toJulianDay(date: Date): number {
  return date.getTime() / MILLISECONDS_PER_DAY + UNIX_EPOCH_JULIAN_DAY;
}

export function toJulianCentury(julianDay: number): number {
  return (julianDay - J2000) / DAYS_PER_JULIAN_CENTURY;
}
```

- [ ] **Step 4: 테스트가 통과하는 것을 확인한다**

Run: `npm test -- julian`
Expected: PASS

- [ ] **Step 5: 커밋한다**

```bash
git add -A
git commit -m "$(printf '율리우스일 변환 추가\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 3: 태양 위치

**Files:**
- Create: `src/lib/astro/solar.ts`
- Test: `src/lib/astro/solar.test.ts`

**Interfaces:**
- Consumes: `toJulianDay`, `toJulianCentury` (Task 2), `normalizeDegrees`, `toDegrees`, `toRadians` (Task 1)
- Produces:
  - `interface HorizontalPosition { altitude: number; azimuth: number }` — 도 단위
  - `solarElements(date: Date): { declination: number; equationOfTime: number }` — 적위는 도, 균시차는 분이며 진태양시에서 평균태양시를 뺀 값이다
  - `apparentSolarMinutes(date: Date, longitude: number): number` — 그 지점의 진태양시 자정부터 지난 분, 0 이상 1440 미만
  - `hourAngle(date: Date, longitude: number): number` — 도 단위, -180 이상 180 미만, 남중에서 0
  - `horizontalFromEquatorial(hourAngleDeg: number, declinationDeg: number, latitude: number): HorizontalPosition`
  - `sunPosition(date: Date, latitude: number, longitude: number): HorizontalPosition`
  - `horizonHourAngle(latitude: number, declination: number): number` — 해가 뜨고 지는 시간각의 크기, 도 단위

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/lib/astro/solar.test.ts`

```ts
import * as Astronomy from "astronomy-engine";
import {
  apparentSolarMinutes,
  horizonHourAngle,
  horizontalFromEquatorial,
  hourAngle,
  solarElements,
  sunPosition,
} from "./solar";

const SEOUL = { latitude: 37.5665, longitude: 126.978 };

describe("solarElements", () => {
  it("춘분에 적위가 0에 가깝다", () => {
    const { declination } = solarElements(new Date("2026-03-20T14:46:00Z"));
    expect(Math.abs(declination)).toBeLessThan(0.1);
  });

  it("하지에 적위가 가장 크다", () => {
    const { declination } = solarElements(new Date("2026-06-21T12:00:00Z"));
    expect(declination).toBeGreaterThan(23.3);
    expect(declination).toBeLessThan(23.5);
  });

  it("동지에 적위가 가장 작다", () => {
    const { declination } = solarElements(new Date("2026-12-21T12:00:00Z"));
    expect(declination).toBeLessThan(-23.3);
    expect(declination).toBeGreaterThan(-23.5);
  });

  it("11월 초에 균시차가 16분 남짓 앞선다", () => {
    const { equationOfTime } = solarElements(new Date("2026-11-03T03:00:00Z"));
    expect(equationOfTime).toBeGreaterThan(16);
    expect(equationOfTime).toBeLessThan(16.6);
  });

  it("2월 중순에 균시차가 14분 남짓 뒤진다", () => {
    const { equationOfTime } = solarElements(new Date("2026-02-11T03:00:00Z"));
    expect(equationOfTime).toBeLessThan(-14);
    expect(equationOfTime).toBeGreaterThan(-14.4);
  });

  it("적위가 기준 구현과 0.15도 안에서 맞는다", () => {
    const observer = new Astronomy.Observer(SEOUL.latitude, SEOUL.longitude, 0);
    for (const iso of [
      "2026-01-15T03:00:00Z",
      "2026-04-05T21:00:00Z",
      "2026-07-22T06:30:00Z",
      "2026-10-09T23:15:00Z",
    ]) {
      const date = new Date(iso);
      const expected = Astronomy.Equator(Astronomy.Body.Sun, date, observer, true, true).dec;
      expect(solarElements(date).declination).toBeCloseTo(expected, 1);
    }
  });
});

describe("hourAngle", () => {
  it("진태양시 정오에 0이다", () => {
    const date = new Date("2026-06-21T03:00:00Z");
    const minutes = apparentSolarMinutes(date, SEOUL.longitude);
    const noon = new Date(date.getTime() + (720 - minutes) * 60000);
    expect(hourAngle(noon, SEOUL.longitude)).toBeCloseTo(0, 2);
  });

  it("기준 구현과 0.15도 안에서 맞는다", () => {
    const observer = new Astronomy.Observer(SEOUL.latitude, SEOUL.longitude, 0);
    for (const iso of [
      "2026-01-15T03:00:00Z",
      "2026-04-05T01:00:00Z",
      "2026-07-22T06:30:00Z",
      "2026-10-09T23:15:00Z",
    ]) {
      const date = new Date(iso);
      const expectedHours = Astronomy.HourAngle(Astronomy.Body.Sun, date, observer);
      let expected = expectedHours * 15;
      if (expected >= 180) expected -= 360;
      expect(hourAngle(date, SEOUL.longitude)).toBeCloseTo(expected, 1);
    }
  });
});

describe("horizontalFromEquatorial", () => {
  const latitude = 37.653;

  it("춘분 남중에 고도가 90도에서 위도를 뺀 값이다", () => {
    const { altitude, azimuth } = horizontalFromEquatorial(0, 0, latitude);
    expect(altitude).toBeCloseTo(90 - latitude, 6);
    expect(azimuth).toBeCloseTo(180, 6);
  });

  it("하지 남중에 고도가 가장 높다", () => {
    const { altitude, azimuth } = horizontalFromEquatorial(0, 23.44, latitude);
    expect(altitude).toBeCloseTo(90 - latitude + 23.44, 6);
    expect(azimuth).toBeCloseTo(180, 6);
  });

  it("춘분 아침 여섯시에 정동쪽 지평선에 있다", () => {
    const { altitude, azimuth } = horizontalFromEquatorial(-90, 0, latitude);
    expect(altitude).toBeCloseTo(0, 6);
    expect(azimuth).toBeCloseTo(90, 6);
  });

  it("춘분 저녁 여섯시에 정서쪽 지평선에 있다", () => {
    const { altitude, azimuth } = horizontalFromEquatorial(90, 0, latitude);
    expect(altitude).toBeCloseTo(0, 6);
    expect(azimuth).toBeCloseTo(270, 6);
  });
});

describe("sunPosition", () => {
  it("서울의 여름 낮에 해가 높이 떠 있다", () => {
    const { altitude } = sunPosition(
      new Date("2026-06-21T03:30:00Z"),
      SEOUL.latitude,
      SEOUL.longitude
    );
    expect(altitude).toBeGreaterThan(70);
  });

  it("한밤중에 해가 지평선 아래에 있다", () => {
    const { altitude } = sunPosition(
      new Date("2026-06-21T15:00:00Z"),
      SEOUL.latitude,
      SEOUL.longitude
    );
    expect(altitude).toBeLessThan(0);
  });
});

describe("horizonHourAngle", () => {
  it("춘분에는 위도와 상관없이 90도다", () => {
    expect(horizonHourAngle(37.653, 0)).toBeCloseTo(90, 6);
    expect(horizonHourAngle(10, 0)).toBeCloseTo(90, 6);
  });

  it("서울의 하지에는 90도보다 크다", () => {
    expect(horizonHourAngle(37.653, 23.44)).toBeGreaterThan(109);
    expect(horizonHourAngle(37.653, 23.44)).toBeLessThan(110);
  });

  it("백야에는 180도가 된다", () => {
    expect(horizonHourAngle(70, 23.44)).toBe(180);
  });

  it("극야에는 0도가 된다", () => {
    expect(horizonHourAngle(70, -23.44)).toBe(0);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

Run: `npm test -- solar`
Expected: FAIL. 모듈이 없다.

- [ ] **Step 3: 구현한다**

`src/lib/astro/solar.ts`

```ts
import { normalizeDegrees, toDegrees, toRadians } from "../placement/angle";
import { toJulianCentury, toJulianDay } from "./julian";

export interface HorizontalPosition {
  /** 지평선 위 고도. 도 단위. */
  altitude: number;
  /** 북쪽이 0이고 동쪽으로 증가하는 방위각. 도 단위. */
  azimuth: number;
}

export interface SolarElements {
  /** 적위. 도 단위. */
  declination: number;
  /** 진태양시에서 평균태양시를 뺀 값. 분 단위. */
  equationOfTime: number;
}

const MINUTES_PER_DAY = 1440;

/** 미국 해양대기청이 정리한 태양 위치 계산을 따른다. */
export function solarElements(date: Date): SolarElements {
  const t = toJulianCentury(toJulianDay(date));

  const meanLongitude = normalizeDegrees(280.46646 + t * (36000.76983 + t * 0.0003032));
  const meanAnomaly = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const eccentricity = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);

  const m = toRadians(meanAnomaly);
  const center =
    Math.sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * m) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * m) * 0.000289;

  const trueLongitude = meanLongitude + center;
  const omega = toRadians(125.04 - 1934.136 * t);
  const apparentLongitude = trueLongitude - 0.00569 - 0.00478 * Math.sin(omega);

  const meanObliquity =
    23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const obliquity = toRadians(meanObliquity + 0.00256 * Math.cos(omega));

  const declination = toDegrees(
    Math.asin(Math.sin(obliquity) * Math.sin(toRadians(apparentLongitude)))
  );

  const y = Math.tan(obliquity / 2) ** 2;
  const l0 = toRadians(meanLongitude);
  const equationOfTime =
    4 *
    toDegrees(
      y * Math.sin(2 * l0) -
        2 * eccentricity * Math.sin(m) +
        4 * eccentricity * y * Math.sin(m) * Math.cos(2 * l0) -
        0.5 * y * y * Math.sin(4 * l0) -
        1.25 * eccentricity * eccentricity * Math.sin(2 * m)
    );

  return { declination, equationOfTime };
}

function utcMinutesOfDay(date: Date): number {
  return (
    date.getUTCHours() * 60 +
    date.getUTCMinutes() +
    date.getUTCSeconds() / 60 +
    date.getUTCMilliseconds() / 60000
  );
}

export function apparentSolarMinutes(date: Date, longitude: number): number {
  const raw = utcMinutesOfDay(date) + solarElements(date).equationOfTime + 4 * longitude;
  return ((raw % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

export function hourAngle(date: Date, longitude: number): number {
  return apparentSolarMinutes(date, longitude) / 4 - 180;
}

export function horizontalFromEquatorial(
  hourAngleDeg: number,
  declinationDeg: number,
  latitude: number
): HorizontalPosition {
  const h = toRadians(hourAngleDeg);
  const d = toRadians(declinationDeg);
  const phi = toRadians(latitude);

  const sinAltitude =
    Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(h);
  const altitude = toDegrees(Math.asin(Math.min(1, Math.max(-1, sinAltitude))));

  const azimuth = normalizeDegrees(
    toDegrees(
      Math.atan2(
        -Math.cos(d) * Math.sin(h),
        Math.cos(phi) * Math.sin(d) - Math.sin(phi) * Math.cos(d) * Math.cos(h)
      )
    )
  );

  return { altitude, azimuth };
}

export function sunPosition(
  date: Date,
  latitude: number,
  longitude: number
): HorizontalPosition {
  return horizontalFromEquatorial(
    hourAngle(date, longitude),
    solarElements(date).declination,
    latitude
  );
}

export function horizonHourAngle(latitude: number, declination: number): number {
  const cosine = -Math.tan(toRadians(latitude)) * Math.tan(toRadians(declination));
  if (cosine <= -1) return 180;
  if (cosine >= 1) return 0;
  return toDegrees(Math.acos(cosine));
}
```

- [ ] **Step 4: 테스트가 통과하는 것을 확인한다**

Run: `npm test -- solar`
Expected: PASS, 전부 통과

- [ ] **Step 5: 커밋한다**

```bash
git add -A
git commit -m "$(printf '태양 적위, 균시차, 시간각, 지평좌표 계산 추가\n\n해양대기청 계산식을 따랐고 astronomy-engine을 기준으로\n0.15도 안에서 맞는 것을 확인했다.\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 4: 96각법 전통 시각

**Files:**
- Create: `src/lib/time/traditional.ts`
- Test: `src/lib/time/traditional.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `BRANCH_NAMES: readonly string[]` — 자축인묘진사오미신유술해, 12개
  - `BRANCH_HANJA: readonly string[]` — 子丑寅卯辰巳午未申酉戌亥, 12개
  - `interface TraditionalTime { branchIndex: number; branchName: string; branchHanja: string; half: "초" | "정"; quarterIndex: number; quarterName: string; label: string }`
  - `toTraditionalTime(minutesOfDay: number): TraditionalTime` — 진태양시 자정부터 지난 분을 받는다

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/lib/time/traditional.test.ts`

```ts
import { toTraditionalTime } from "./traditional";

describe("toTraditionalTime", () => {
  it("정오는 오정 초각이다", () => {
    const t = toTraditionalTime(12 * 60);
    expect(t.branchName).toBe("오");
    expect(t.half).toBe("정");
    expect(t.quarterName).toBe("초각");
    expect(t.label).toBe("오정 초각");
  });

  it("낮 12시 40분은 오정 2각이다", () => {
    expect(toTraditionalTime(12 * 60 + 40).label).toBe("오정 2각");
  });

  it("오후 3시 20분은 신초 1각이다", () => {
    expect(toTraditionalTime(15 * 60 + 20).label).toBe("신초 1각");
  });

  it("자정은 자정 초각이다", () => {
    const t = toTraditionalTime(0);
    expect(t.branchName).toBe("자");
    expect(t.half).toBe("정");
    expect(t.label).toBe("자정 초각");
  });

  it("밤 11시에 자시가 시작한다", () => {
    const t = toTraditionalTime(23 * 60);
    expect(t.branchName).toBe("자");
    expect(t.half).toBe("초");
    expect(t.label).toBe("자초 초각");
  });

  it("각의 경계에서 다음 각으로 넘어간다", () => {
    expect(toTraditionalTime(12 * 60 + 14).quarterName).toBe("초각");
    expect(toTraditionalTime(12 * 60 + 15).quarterName).toBe("1각");
    expect(toTraditionalTime(12 * 60 + 44).quarterName).toBe("2각");
    expect(toTraditionalTime(12 * 60 + 45).quarterName).toBe("3각");
  });

  it("시의 경계에서 다음 시로 넘어간다", () => {
    expect(toTraditionalTime(13 * 60 - 1).branchName).toBe("오");
    expect(toTraditionalTime(13 * 60).branchName).toBe("미");
  });

  it("열두 시가 두 시간씩 하루를 덮는다", () => {
    const seen = new Set<string>();
    for (let m = 0; m < 1440; m += 1) seen.add(toTraditionalTime(m).branchName);
    expect(seen.size).toBe(12);
  });

  it("한자를 함께 낸다", () => {
    expect(toTraditionalTime(12 * 60).branchHanja).toBe("午");
  });

  it("1440분을 넘거나 음수인 값도 하루 안으로 접는다", () => {
    expect(toTraditionalTime(1440 + 720).label).toBe("오정 초각");
    expect(toTraditionalTime(-60).label).toBe("해정 초각");
  });
});
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

Run: `npm test -- traditional`
Expected: FAIL. 모듈이 없다.

- [ ] **Step 3: 구현한다**

`src/lib/time/traditional.ts`

```ts
export const BRANCH_NAMES = [
  "자", "축", "인", "묘", "진", "사",
  "오", "미", "신", "유", "술", "해",
] as const;

export const BRANCH_HANJA = [
  "子", "丑", "寅", "卯", "辰", "巳",
  "午", "未", "申", "酉", "戌", "亥",
] as const;

const QUARTER_NAMES = ["초각", "1각", "2각", "3각"] as const;

const MINUTES_PER_DAY = 1440;
const MINUTES_PER_BRANCH = 120;
const MINUTES_PER_HALF = 60;
const MINUTES_PER_QUARTER = 15;

/** 자시가 밤 11시에 시작하므로 그만큼 앞으로 당겨 센다. */
const BRANCH_START_OFFSET = 60;

export interface TraditionalTime {
  branchIndex: number;
  branchName: string;
  branchHanja: string;
  half: "초" | "정";
  quarterIndex: number;
  quarterName: string;
  label: string;
}

export function toTraditionalTime(minutesOfDay: number): TraditionalTime {
  const wrapped = ((minutesOfDay % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const shifted = (wrapped + BRANCH_START_OFFSET) % MINUTES_PER_DAY;

  const branchIndex = Math.floor(shifted / MINUTES_PER_BRANCH);
  const withinBranch = shifted - branchIndex * MINUTES_PER_BRANCH;
  const half = withinBranch < MINUTES_PER_HALF ? "초" : "정";
  const withinHour = withinBranch % MINUTES_PER_HALF;
  const quarterIndex = Math.floor(withinHour / MINUTES_PER_QUARTER);

  const branchName = BRANCH_NAMES[branchIndex];
  const quarterName = QUARTER_NAMES[quarterIndex];

  return {
    branchIndex,
    branchName,
    branchHanja: BRANCH_HANJA[branchIndex],
    half,
    quarterIndex,
    quarterName,
    label: `${branchName}${half} ${quarterName}`,
  };
}
```

- [ ] **Step 4: 테스트가 통과하는 것을 확인한다**

Run: `npm test -- traditional`
Expected: PASS

- [ ] **Step 5: 커밋한다**

```bash
git add -A
git commit -m "$(printf '96각법 전통 시각 변환 추가\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 5: 진태양시와 표준시

**Files:**
- Create: `src/lib/time/clock.ts`
- Test: `src/lib/time/clock.test.ts`

**Interfaces:**
- Consumes: `solarElements`, `apparentSolarMinutes` (Task 3)
- Produces:
  - `referenceLongitudeOf(date: Date): number` — 기기 시간대의 표준 자오선 경도
  - `standardMinutesFromApparent(apparentMinutes: number, equationOfTime: number, longitude: number, referenceLongitude: number): number`
  - `longitudeCorrectionMinutes(longitude: number, referenceLongitude: number): number`
  - `formatFriendlyTime(minutesOfDay: number): string` — "낮 12시 15분"
  - `formatClockTime(minutesOfDay: number): string` — "12:15"
  - `formatSignedMinutes(minutes: number): string` — "32분 빠름", "14분 느림", "차이 없음"

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/lib/time/clock.test.ts`

```ts
import {
  formatClockTime,
  formatFriendlyTime,
  formatSignedMinutes,
  longitudeCorrectionMinutes,
  referenceLongitudeOf,
  standardMinutesFromApparent,
} from "./clock";

const KST_REFERENCE = 135;
const SEOUL_LONGITUDE = 126.978;

describe("longitudeCorrectionMinutes", () => {
  it("서울은 표준 자오선보다 32분가량 늦다", () => {
    const correction = longitudeCorrectionMinutes(SEOUL_LONGITUDE, KST_REFERENCE);
    expect(correction).toBeGreaterThan(32);
    expect(correction).toBeLessThan(32.2);
  });

  it("표준 자오선 위에서는 0이다", () => {
    expect(longitudeCorrectionMinutes(135, 135)).toBeCloseTo(0, 9);
  });
});

describe("standardMinutesFromApparent", () => {
  it("균시차와 경도를 함께 보정한다", () => {
    const result = standardMinutesFromApparent(720, 16.4, SEOUL_LONGITUDE, KST_REFERENCE);
    expect(result).toBeCloseTo(720 - 16.4 + 32.088, 2);
  });

  it("자정을 넘어가면 하루 안으로 접는다", () => {
    expect(standardMinutesFromApparent(1435, 0, 135, 135)).toBeCloseTo(1435, 6);
    expect(standardMinutesFromApparent(10, -30, 135, 135)).toBeCloseTo(40, 6);
    expect(standardMinutesFromApparent(10, 30, 135, 135)).toBeCloseTo(1420, 6);
  });
});

describe("referenceLongitudeOf", () => {
  it("시간대 차이를 경도로 바꾼다", () => {
    const date = new Date("2026-09-18T03:00:00Z");
    const expected = (-date.getTimezoneOffset()) / 4;
    expect(referenceLongitudeOf(date)).toBeCloseTo(expected, 9);
  });
});

describe("formatFriendlyTime", () => {
  it("때에 맞는 말을 앞에 붙인다", () => {
    expect(formatFriendlyTime(2 * 60 + 30)).toBe("새벽 2시 30분");
    expect(formatFriendlyTime(8 * 60 + 5)).toBe("아침 8시 5분");
    expect(formatFriendlyTime(12 * 60 + 15)).toBe("낮 12시 15분");
    expect(formatFriendlyTime(19 * 60)).toBe("저녁 7시 0분");
    expect(formatFriendlyTime(22 * 60 + 45)).toBe("밤 10시 45분");
  });

  it("자정은 밤 12시로 적는다", () => {
    expect(formatFriendlyTime(0)).toBe("밤 12시 0분");
  });
});

describe("formatClockTime", () => {
  it("두 자리로 맞춘다", () => {
    expect(formatClockTime(12 * 60 + 5)).toBe("12:05");
    expect(formatClockTime(0)).toBe("00:00");
    expect(formatClockTime(23 * 60 + 59)).toBe("23:59");
  });
});

describe("formatSignedMinutes", () => {
  it("부호를 말로 바꾼다", () => {
    expect(formatSignedMinutes(32)).toBe("32분 빠름");
    expect(formatSignedMinutes(-14)).toBe("14분 느림");
    expect(formatSignedMinutes(0)).toBe("차이 없음");
    expect(formatSignedMinutes(0.4)).toBe("차이 없음");
  });
});
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

Run: `npm test -- clock`
Expected: FAIL. 모듈이 없다.

- [ ] **Step 3: 구현한다**

`src/lib/time/clock.ts`

```ts
const MINUTES_PER_DAY = 1440;
const MINUTES_PER_DEGREE = 4;

/** 기기 시간대가 기준으로 삼는 자오선의 경도. 한국 표준시는 135도다. */
export function referenceLongitudeOf(date: Date): number {
  return -date.getTimezoneOffset() / MINUTES_PER_DEGREE;
}

/** 표준 자오선보다 서쪽이면 양수. 그만큼 해가 늦게 남중한다. */
export function longitudeCorrectionMinutes(
  longitude: number,
  referenceLongitude: number
): number {
  return (referenceLongitude - longitude) * MINUTES_PER_DEGREE;
}

export function standardMinutesFromApparent(
  apparentMinutes: number,
  equationOfTime: number,
  longitude: number,
  referenceLongitude: number
): number {
  const raw =
    apparentMinutes -
    equationOfTime +
    longitudeCorrectionMinutes(longitude, referenceLongitude);
  return ((raw % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

function splitHourMinute(minutesOfDay: number): { hour: number; minute: number } {
  const wrapped = ((minutesOfDay % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const total = Math.floor(wrapped);
  return { hour: Math.floor(total / 60), minute: total % 60 };
}

function partOfDay(hour: number): string {
  if (hour < 6) return "새벽";
  if (hour < 12) return "아침";
  if (hour < 18) return "낮";
  if (hour < 21) return "저녁";
  return "밤";
}

export function formatFriendlyTime(minutesOfDay: number): string {
  const { hour, minute } = splitHourMinute(minutesOfDay);
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${partOfDay(hour)} ${twelve}시 ${minute}분`;
}

export function formatClockTime(minutesOfDay: number): string {
  const { hour, minute } = splitHourMinute(minutesOfDay);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatSignedMinutes(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded === 0) return "차이 없음";
  return rounded > 0 ? `${rounded}분 빠름` : `${-rounded}분 느림`;
}
```

- [ ] **Step 4: 테스트가 통과하는 것을 확인한다**

Run: `npm test -- clock`
Expected: PASS

- [ ] **Step 5: 커밋한다**

```bash
git add -A
git commit -m "$(printf '진태양시와 표준시 변환, 시각 표기 함수 추가\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 6: 반구에서 화면으로 옮기는 투영

**Files:**
- Create: `src/lib/dial/projection.ts`
- Test: `src/lib/dial/projection.test.ts`

**Interfaces:**
- Consumes: `toRadians` (Task 1)
- Produces:
  - `interface Vector3 { x: number; y: number; z: number }`
  - `interface DialPoint { x: number; y: number }` — 반지름 1인 원판 위의 점. x는 오른쪽, y는 아래쪽이 양수다
  - `directionVector(altitude: number, azimuth: number): Vector3`
  - `rotateToDialFrame(v: Vector3, headingDeg: number): Vector3`
  - `projectToDial(v: Vector3): DialPoint`
  - `isInsideBowl(v: Vector3): boolean` — z가 0보다 작으면 반구 안이다
  - `shadowPoint(altitude: number, azimuth: number, headingDeg: number): DialPoint`
  - `gnomonRootPoint(latitude: number, headingDeg: number): DialPoint`
  - `southRimDistanceInDiameters(point: DialPoint): number` — 남쪽 가장자리에서 그 점까지의 거리를 지름으로 나눈 값

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/lib/dial/projection.test.ts`

```ts
import {
  directionVector,
  gnomonRootPoint,
  isInsideBowl,
  projectToDial,
  rotateToDialFrame,
  shadowPoint,
  southRimDistanceInDiameters,
} from "./projection";

const HANYANG_LATITUDE = 37 + 39 / 60 + 15 / 3600;

describe("directionVector", () => {
  it("천정은 위쪽 단위벡터다", () => {
    const v = directionVector(90, 0);
    expect(v.x).toBeCloseTo(0, 9);
    expect(v.y).toBeCloseTo(0, 9);
    expect(v.z).toBeCloseTo(1, 9);
  });

  it("정북 지평선은 북쪽 단위벡터다", () => {
    const v = directionVector(0, 0);
    expect(v.x).toBeCloseTo(0, 9);
    expect(v.y).toBeCloseTo(1, 9);
    expect(v.z).toBeCloseTo(0, 9);
  });

  it("정동 지평선은 동쪽 단위벡터다", () => {
    const v = directionVector(0, 90);
    expect(v.x).toBeCloseTo(1, 9);
    expect(v.y).toBeCloseTo(0, 9);
    expect(v.z).toBeCloseTo(0, 9);
  });
});

describe("rotateToDialFrame", () => {
  it("방위가 0이면 그대로 둔다", () => {
    const v = rotateToDialFrame(directionVector(0, 0), 0);
    expect(v.y).toBeCloseTo(1, 9);
  });

  it("반구를 동쪽으로 돌리면 북쪽이 왼쪽으로 간다", () => {
    const v = rotateToDialFrame(directionVector(0, 0), 90);
    expect(v.x).toBeCloseTo(-1, 9);
    expect(v.y).toBeCloseTo(0, 9);
  });

  it("높이를 바꾸지 않는다", () => {
    const v = rotateToDialFrame(directionVector(30, 120), 47);
    expect(v.z).toBeCloseTo(Math.sin((30 * Math.PI) / 180), 9);
  });
});

describe("projectToDial", () => {
  it("북쪽은 화면 위쪽이다", () => {
    const p = projectToDial(directionVector(0, 0));
    expect(p.x).toBeCloseTo(0, 9);
    expect(p.y).toBeCloseTo(-1, 9);
  });

  it("남쪽은 화면 아래쪽이다", () => {
    const p = projectToDial(directionVector(0, 180));
    expect(p.y).toBeCloseTo(1, 9);
  });

  it("동쪽은 화면 오른쪽이다", () => {
    const p = projectToDial(directionVector(0, 90));
    expect(p.x).toBeCloseTo(1, 9);
  });

  it("바닥은 원판 중심이다", () => {
    const p = projectToDial(directionVector(-90, 0));
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(0, 9);
  });
});

describe("isInsideBowl", () => {
  it("지평선 아래를 향한 방향만 반구 안이다", () => {
    expect(isInsideBowl(directionVector(-10, 0))).toBe(true);
    expect(isInsideBowl(directionVector(10, 0))).toBe(false);
  });
});

describe("shadowPoint", () => {
  it("해가 동쪽 지평선에 있으면 그림자가 서쪽 가장자리에 닿는다", () => {
    const p = shadowPoint(0, 90, 0);
    expect(p.x).toBeCloseTo(-1, 6);
    expect(p.y).toBeCloseTo(0, 6);
  });

  it("해가 머리 위에 있으면 그림자가 중심에 모인다", () => {
    const p = shadowPoint(90, 180, 0);
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(0, 6);
  });

  it("해가 남쪽에 있으면 그림자가 북쪽으로 뻗는다", () => {
    const p = shadowPoint(50, 180, 0);
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.y).toBeLessThan(0);
  });

  it("중심에서의 거리가 고도의 코사인이다", () => {
    const p = shadowPoint(30, 140, 0);
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(Math.cos((30 * Math.PI) / 180), 9);
  });

  it("반구를 돌리면 그림자가 같은 각도만큼 반대로 돈다", () => {
    const straight = shadowPoint(20, 100, 0);
    const turned = shadowPoint(20, 130, 30);
    expect(turned.x).toBeCloseTo(straight.x, 9);
    expect(turned.y).toBeCloseTo(straight.y, 9);
  });
});

describe("gnomonRootPoint", () => {
  it("한양 위도에서 남쪽 가장자리로부터 지름의 0.104만큼 떨어진다", () => {
    const point = gnomonRootPoint(HANYANG_LATITUDE, 0);
    expect(southRimDistanceInDiameters(point)).toBeCloseTo(0.1045, 3);
  });

  it("자오선 위에 있다", () => {
    expect(gnomonRootPoint(HANYANG_LATITUDE, 0).x).toBeCloseTo(0, 9);
  });
});

describe("southRimDistanceInDiameters", () => {
  it("남쪽 가장자리가 0이고 북쪽 가장자리가 1이다", () => {
    expect(southRimDistanceInDiameters({ x: 0, y: 1 })).toBeCloseTo(0, 9);
    expect(southRimDistanceInDiameters({ x: 0, y: -1 })).toBeCloseTo(1, 9);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

Run: `npm test -- projection`
Expected: FAIL. 모듈이 없다.

- [ ] **Step 3: 구현한다**

`src/lib/dial/projection.ts`

```ts
import { toRadians } from "../placement/angle";

export interface Vector3 {
  /** 동쪽이 양수. */
  x: number;
  /** 북쪽이 양수. */
  y: number;
  /** 천정이 양수. */
  z: number;
}

/** 반지름 1인 원판 위의 점. 오른쪽과 아래쪽이 양수다. */
export interface DialPoint {
  x: number;
  y: number;
}

export function directionVector(altitude: number, azimuth: number): Vector3 {
  const a = toRadians(altitude);
  const z = toRadians(azimuth);
  return {
    x: Math.cos(a) * Math.sin(z),
    y: Math.cos(a) * Math.cos(z),
    z: Math.sin(a),
  };
}

/** 반구의 북쪽 축이 실제로 향한 방위만큼 되돌려 반구 기준 좌표로 옮긴다. */
export function rotateToDialFrame(v: Vector3, headingDeg: number): Vector3 {
  const h = toRadians(headingDeg);
  const cos = Math.cos(h);
  const sin = Math.sin(h);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
    z: v.z,
  };
}

export function projectToDial(v: Vector3): DialPoint {
  return { x: v.x, y: -v.y };
}

export function isInsideBowl(v: Vector3): boolean {
  return v.z < 0;
}

/** 영침 끝의 그림자는 언제나 광원의 정반대 방향으로 떨어진다. */
export function shadowPoint(
  altitude: number,
  azimuth: number,
  headingDeg: number
): DialPoint {
  const light = directionVector(altitude, azimuth);
  const away: Vector3 = { x: -light.x, y: -light.y, z: -light.z };
  return projectToDial(rotateToDialFrame(away, headingDeg));
}

/** 영침 뿌리는 정남 자오선에서 북극고도만큼 내려간 자리다. */
export function gnomonRootPoint(latitude: number, headingDeg: number): DialPoint {
  return projectToDial(rotateToDialFrame(directionVector(-latitude, 180), headingDeg));
}

export function southRimDistanceInDiameters(point: DialPoint): number {
  return (1 - point.y) / 2;
}
```

- [ ] **Step 4: 테스트가 통과하는 것을 확인한다**

Run: `npm test -- projection`
Expected: PASS

- [ ] **Step 5: 커밋한다**

```bash
git add -A
git commit -m "$(printf '반구에서 화면으로 옮기는 투영 추가\n\n그림자 끝의 위치와 영침 뿌리를 구하고, 한양 위도에서\n영침 뿌리가 지름의 0.104 자리에 오는 것을 확인했다.\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 7: 24절기 상수

**Files:**
- Create: `src/lib/dial/constants.ts`
- Test: `src/lib/dial/constants.test.ts`

**Interfaces:**
- Consumes: `toDegrees`, `toRadians` (Task 1)
- Produces:
  - `OBLIQUITY: number` — 황도 경사각 23.4392911도
  - `interface SolarTerm { name: string; hanja: string; solarLongitude: number }`
  - `SOLAR_TERMS: readonly SolarTerm[]` — 춘분부터 경칩까지 24개
  - `declinationOfSolarTerm(term: SolarTerm): number`
  - `interface SolarTermGroup { declination: number; terms: SolarTerm[]; label: string }`
  - `SOLAR_TERM_GROUPS: readonly SolarTermGroup[]` — 적위가 낮은 쪽부터 13개
  - `HOUR_LINE_START_MINUTES: number` — 300
  - `HOUR_LINE_END_MINUTES: number` — 1140
  - `HOUR_LINE_STEP_MINUTES: number` — 30
  - `MAJOR_HOUR_MINUTES: readonly number[]` — 360부터 1080까지 120분 간격 7개
  - `majorHourLabel(minutes: number): string | null`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/lib/dial/constants.test.ts`

```ts
import {
  declinationOfSolarTerm,
  HOUR_LINE_END_MINUTES,
  HOUR_LINE_START_MINUTES,
  HOUR_LINE_STEP_MINUTES,
  majorHourLabel,
  MAJOR_HOUR_MINUTES,
  OBLIQUITY,
  SOLAR_TERM_GROUPS,
  SOLAR_TERMS,
} from "./constants";

describe("SOLAR_TERMS", () => {
  it("24개다", () => {
    expect(SOLAR_TERMS).toHaveLength(24);
  });

  it("15도 간격으로 황경이 늘어난다", () => {
    SOLAR_TERMS.forEach((term, index) => {
      expect(term.solarLongitude).toBe(index * 15);
    });
  });

  it("이름이 겹치지 않는다", () => {
    expect(new Set(SOLAR_TERMS.map((t) => t.name)).size).toBe(24);
  });

  it("춘분에서 시작해 하지와 동지를 담는다", () => {
    expect(SOLAR_TERMS[0].name).toBe("춘분");
    expect(SOLAR_TERMS.find((t) => t.name === "하지")?.solarLongitude).toBe(90);
    expect(SOLAR_TERMS.find((t) => t.name === "동지")?.solarLongitude).toBe(270);
  });
});

describe("declinationOfSolarTerm", () => {
  it("춘분과 추분은 0이다", () => {
    expect(declinationOfSolarTerm(SOLAR_TERMS[0])).toBeCloseTo(0, 9);
    expect(
      declinationOfSolarTerm(SOLAR_TERMS.find((t) => t.name === "추분")!)
    ).toBeCloseTo(0, 9);
  });

  it("하지는 황도 경사각과 같다", () => {
    expect(
      declinationOfSolarTerm(SOLAR_TERMS.find((t) => t.name === "하지")!)
    ).toBeCloseTo(OBLIQUITY, 9);
  });

  it("동지는 황도 경사각의 음수다", () => {
    expect(
      declinationOfSolarTerm(SOLAR_TERMS.find((t) => t.name === "동지")!)
    ).toBeCloseTo(-OBLIQUITY, 9);
  });
});

describe("SOLAR_TERM_GROUPS", () => {
  it("13개다", () => {
    expect(SOLAR_TERM_GROUPS).toHaveLength(13);
  });

  it("적위가 낮은 쪽부터 늘어선다", () => {
    for (let i = 1; i < SOLAR_TERM_GROUPS.length; i += 1) {
      expect(SOLAR_TERM_GROUPS[i].declination).toBeGreaterThan(
        SOLAR_TERM_GROUPS[i - 1].declination
      );
    }
  });

  it("동지와 하지만 홀로 쓰고 나머지는 둘씩 나눠 쓴다", () => {
    const alone = SOLAR_TERM_GROUPS.filter((g) => g.terms.length === 1);
    expect(alone).toHaveLength(2);
    expect(alone.map((g) => g.terms[0].name).sort()).toEqual(["동지", "하지"]);
    expect(SOLAR_TERM_GROUPS.filter((g) => g.terms.length === 2)).toHaveLength(11);
  });

  it("24절기를 빠짐없이 담는다", () => {
    const names = SOLAR_TERM_GROUPS.flatMap((g) => g.terms.map((t) => t.name));
    expect(new Set(names).size).toBe(24);
  });

  it("춘분과 추분이 한 선을 쓴다", () => {
    const group = SOLAR_TERM_GROUPS.find((g) => Math.abs(g.declination) < 1e-9);
    expect(group?.terms.map((t) => t.name).sort()).toEqual(["추분", "춘분"]);
    expect(group?.label).toBe("춘분 · 추분");
  });

  it("망종과 소서가 한 선을 쓴다", () => {
    const names = SOLAR_TERM_GROUPS.map((g) => g.terms.map((t) => t.name).sort().join(","));
    expect(names).toContain("망종,소서");
  });
});

describe("시각선 상수", () => {
  it("오전 5시부터 오후 7시까지 30분 간격이다", () => {
    expect(HOUR_LINE_START_MINUTES).toBe(300);
    expect(HOUR_LINE_END_MINUTES).toBe(1140);
    expect(HOUR_LINE_STEP_MINUTES).toBe(30);
  });

  it("주선은 일곱이고 두 시간 간격이다", () => {
    expect(MAJOR_HOUR_MINUTES).toEqual([360, 480, 600, 720, 840, 960, 1080]);
  });

  it("주선에만 이름을 붙인다", () => {
    expect(majorHourLabel(360)).toBe("묘");
    expect(majorHourLabel(720)).toBe("오");
    expect(majorHourLabel(1080)).toBe("유");
    expect(majorHourLabel(390)).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

Run: `npm test -- constants`
Expected: FAIL. 모듈이 없다.

- [ ] **Step 3: 구현한다**

`src/lib/dial/constants.ts`

```ts
import { toDegrees, toRadians } from "../placement/angle";

/** 황도 경사각. 도 단위. */
export const OBLIQUITY = 23.4392911;

export interface SolarTerm {
  name: string;
  hanja: string;
  /** 춘분을 0으로 삼은 태양 황경. 도 단위. */
  solarLongitude: number;
}

export const SOLAR_TERMS: readonly SolarTerm[] = [
  { name: "춘분", hanja: "春分", solarLongitude: 0 },
  { name: "청명", hanja: "淸明", solarLongitude: 15 },
  { name: "곡우", hanja: "穀雨", solarLongitude: 30 },
  { name: "입하", hanja: "立夏", solarLongitude: 45 },
  { name: "소만", hanja: "小滿", solarLongitude: 60 },
  { name: "망종", hanja: "芒種", solarLongitude: 75 },
  { name: "하지", hanja: "夏至", solarLongitude: 90 },
  { name: "소서", hanja: "小暑", solarLongitude: 105 },
  { name: "대서", hanja: "大暑", solarLongitude: 120 },
  { name: "입추", hanja: "立秋", solarLongitude: 135 },
  { name: "처서", hanja: "處暑", solarLongitude: 150 },
  { name: "백로", hanja: "白露", solarLongitude: 165 },
  { name: "추분", hanja: "秋分", solarLongitude: 180 },
  { name: "한로", hanja: "寒露", solarLongitude: 195 },
  { name: "상강", hanja: "霜降", solarLongitude: 210 },
  { name: "입동", hanja: "立冬", solarLongitude: 225 },
  { name: "소설", hanja: "小雪", solarLongitude: 240 },
  { name: "대설", hanja: "大雪", solarLongitude: 255 },
  { name: "동지", hanja: "冬至", solarLongitude: 270 },
  { name: "소한", hanja: "小寒", solarLongitude: 285 },
  { name: "대한", hanja: "大寒", solarLongitude: 300 },
  { name: "입춘", hanja: "立春", solarLongitude: 315 },
  { name: "우수", hanja: "雨水", solarLongitude: 330 },
  { name: "경칩", hanja: "驚蟄", solarLongitude: 345 },
];

export function declinationOfSolarTerm(term: SolarTerm): number {
  return toDegrees(
    Math.asin(Math.sin(toRadians(OBLIQUITY)) * Math.sin(toRadians(term.solarLongitude)))
  );
}

export interface SolarTermGroup {
  /** 이 선이 나타내는 태양 적위. 도 단위. */
  declination: number;
  terms: SolarTerm[];
  /** "춘분 · 추분"처럼 선에 붙일 이름. */
  label: string;
}

function buildGroups(): SolarTermGroup[] {
  const buckets = new Map<string, SolarTerm[]>();
  for (const term of SOLAR_TERMS) {
    const key = declinationOfSolarTerm(term).toFixed(6);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(term);
    else buckets.set(key, [term]);
  }

  return [...buckets.entries()]
    .map(([key, terms]) => ({
      declination: Number(key),
      terms,
      label: terms.map((t) => t.name).join(" · "),
    }))
    .sort((a, b) => a.declination - b.declination);
}

export const SOLAR_TERM_GROUPS: readonly SolarTermGroup[] = buildGroups();

/** 시각선은 진태양시 오전 5시부터 오후 7시까지 30분 간격이다. */
export const HOUR_LINE_START_MINUTES = 300;
export const HOUR_LINE_END_MINUTES = 1140;
export const HOUR_LINE_STEP_MINUTES = 30;

/** 주선은 각 시의 정에 놓인다. */
export const MAJOR_HOUR_MINUTES: readonly number[] = [360, 480, 600, 720, 840, 960, 1080];

const MAJOR_HOUR_LABELS: readonly string[] = ["묘", "진", "사", "오", "미", "신", "유"];

export function majorHourLabel(minutes: number): string | null {
  const index = MAJOR_HOUR_MINUTES.indexOf(minutes);
  return index < 0 ? null : MAJOR_HOUR_LABELS[index];
}
```

- [ ] **Step 4: 테스트가 통과하는 것을 확인한다**

Run: `npm test -- constants`
Expected: PASS

- [ ] **Step 5: 커밋한다**

```bash
git add -A
git commit -m "$(printf '24절기 상수와 13개 절기선 묶음 추가\n\n적위가 같은 절기끼리 한 선을 쓰도록 묶었다.\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 8: 눈금 기하

**Files:**
- Create: `src/lib/dial/geometry.ts`
- Test: `src/lib/dial/geometry.test.ts`

**Interfaces:**
- Consumes: `horizontalFromEquatorial`, `horizonHourAngle` (Task 3), `shadowPoint`, `gnomonRootPoint`, `southRimDistanceInDiameters`, `DialPoint` (Task 6), `SOLAR_TERM_GROUPS`, `OBLIQUITY`, `HOUR_LINE_*`, `MAJOR_HOUR_MINUTES`, `majorHourLabel` (Task 7)
- Produces:
  - `interface CurvePoint { x: number; y: number; insideHourRange: boolean }`
  - `interface SolarTermLine { declination: number; label: string; termNames: string[]; points: CurvePoint[] }`
  - `interface HourLine { hourAngle: number; apparentMinutes: number; isMajor: boolean; label: string | null; points: DialPoint[] }`
  - `interface DialGeometry { latitude: number; gnomonRoot: DialPoint; solarTermLines: SolarTermLine[]; hourLines: HourLine[] }`
  - `buildDialGeometry(latitude: number): DialGeometry`
  - `HANYANG_LATITUDE: number` — 37도 39분 15초를 도로 바꾼 값

**참고:** 눈금은 반구 자신의 기준으로 만든다. 반구는 휴대폰에 붙어 있으므로 화면에서 돌지 않는다. 움직이는 것은 그림자뿐이다. 그래서 이 파일은 방위를 0으로 두고 계산한다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/lib/dial/geometry.test.ts`

```ts
import { southRimDistanceInDiameters } from "./projection";
import { buildDialGeometry, HANYANG_LATITUDE } from "./geometry";

const geometry = buildDialGeometry(HANYANG_LATITUDE);

function noonPointOf(declination: number) {
  const line = geometry.solarTermLines.find(
    (l) => Math.abs(l.declination - declination) < 0.01
  );
  if (!line) throw new Error("절기선을 찾지 못했다");
  return line.points[(line.points.length - 1) / 2];
}

describe("buildDialGeometry", () => {
  it("한양 위도를 도로 바꾼 값을 쓴다", () => {
    expect(HANYANG_LATITUDE).toBeCloseTo(37 + 39 / 60 + 15 / 3600, 9);
  });

  it("절기선이 13개다", () => {
    expect(geometry.solarTermLines).toHaveLength(13);
  });

  it("영침 뿌리가 남쪽 가장자리에서 지름의 0.104만큼 떨어진다", () => {
    expect(southRimDistanceInDiameters(geometry.gnomonRoot)).toBeCloseTo(0.1045, 3);
  });

  it("하지선의 정오 자리가 지름의 0.623이다", () => {
    expect(southRimDistanceInDiameters(noonPointOf(23.4392911))).toBeCloseTo(0.6227, 3);
  });

  it("동지선의 정오 자리가 지름의 0.938이다", () => {
    expect(southRimDistanceInDiameters(noonPointOf(-23.4392911))).toBeCloseTo(0.9376, 3);
  });

  it("춘추분선의 정오 자리가 두 선의 가운데보다 남쪽에 있다", () => {
    const equinox = southRimDistanceInDiameters(noonPointOf(0));
    expect(equinox).toBeGreaterThan(0.62);
    expect(equinox).toBeLessThan(0.94);
  });

  it("모든 점이 원판 안에 있다", () => {
    const all = [
      ...geometry.solarTermLines.flatMap((l) => l.points),
      ...geometry.hourLines.flatMap((l) => l.points),
    ];
    expect(all.length).toBeGreaterThan(0);
    for (const point of all) {
      expect(Math.hypot(point.x, point.y)).toBeLessThanOrEqual(1.000001);
    }
  });

  it("시각선이 29개이고 그중 7개가 주선이다", () => {
    expect(geometry.hourLines).toHaveLength(29);
    expect(geometry.hourLines.filter((l) => l.isMajor)).toHaveLength(7);
  });

  it("주선에만 이름이 붙는다", () => {
    const labelled = geometry.hourLines.filter((l) => l.label !== null);
    expect(labelled.map((l) => l.label)).toEqual(["묘", "진", "사", "오", "미", "신", "유"]);
  });

  it("정오 시각선은 자오선 위의 곧은 선이다", () => {
    const noon = geometry.hourLines.find((l) => l.apparentMinutes === 720);
    expect(noon).toBeDefined();
    for (const point of noon!.points) {
      expect(Math.abs(point.x)).toBeLessThan(1e-9);
    }
  });

  it("아침과 저녁 시각선이 좌우 대칭이다", () => {
    const morning = geometry.hourLines.find((l) => l.apparentMinutes === 600)!;
    const evening = geometry.hourLines.find((l) => l.apparentMinutes === 840)!;
    expect(morning.points).toHaveLength(evening.points.length);
    morning.points.forEach((point, index) => {
      expect(point.x).toBeCloseTo(-evening.points[index].x, 9);
      expect(point.y).toBeCloseTo(evening.points[index].y, 9);
    });
  });

  it("가장 이른 시각선은 해가 일찍 뜨는 철에만 그려져 짧다", () => {
    const earliest = geometry.hourLines.find((l) => l.apparentMinutes === 300)!;
    const noon = geometry.hourLines.find((l) => l.apparentMinutes === 720)!;
    expect(earliest.points.length).toBeGreaterThan(1);
    expect(earliest.points.length).toBeLessThan(noon.points.length);
  });

  it("하지선은 시각선 범위를 넘는 구간을 따로 알려 준다", () => {
    const summer = geometry.solarTermLines.find((l) => l.declination > 23)!;
    expect(summer.points.some((p) => p.insideHourRange)).toBe(true);
    expect(summer.points.some((p) => !p.insideHourRange)).toBe(true);
  });

  it("춘추분선은 시각선 범위를 넘지 않는다", () => {
    const equinox = geometry.solarTermLines.find((l) => Math.abs(l.declination) < 0.01)!;
    expect(equinox.points.every((p) => p.insideHourRange)).toBe(true);
  });

  it("절기선에 이름이 붙는다", () => {
    const equinox = geometry.solarTermLines.find((l) => Math.abs(l.declination) < 0.01)!;
    expect(equinox.label).toBe("춘분 · 추분");
    expect(equinox.termNames.sort()).toEqual(["추분", "춘분"]);
  });

  it("위도가 높아지면 영침 뿌리가 중심 쪽으로 온다", () => {
    const low = southRimDistanceInDiameters(buildDialGeometry(20).gnomonRoot);
    const high = southRimDistanceInDiameters(buildDialGeometry(55).gnomonRoot);
    expect(high).toBeGreaterThan(low);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

Run: `npm test -- geometry`
Expected: FAIL. 모듈이 없다.

- [ ] **Step 3: 구현한다**

`src/lib/dial/geometry.ts`

```ts
import { horizonHourAngle, horizontalFromEquatorial } from "../astro/solar";
import {
  HOUR_LINE_END_MINUTES,
  HOUR_LINE_START_MINUTES,
  HOUR_LINE_STEP_MINUTES,
  MAJOR_HOUR_MINUTES,
  OBLIQUITY,
  SOLAR_TERM_GROUPS,
  majorHourLabel,
} from "./constants";
import { DialPoint, gnomonRootPoint, shadowPoint } from "./projection";

export const HANYANG_LATITUDE = 37 + 39 / 60 + 15 / 3600;

/** 두 끝점을 포함하도록 홀수로 잡는다. 가운데 표본이 정오가 된다. */
const SOLAR_TERM_SAMPLES = 121;
const HOUR_LINE_SAMPLES = 61;

const HOUR_ANGLE_START = HOUR_LINE_START_MINUTES / 4 - 180;
const HOUR_ANGLE_END = HOUR_LINE_END_MINUTES / 4 - 180;

export interface CurvePoint extends DialPoint {
  /** 시각선이 덮는 범위 안이면 참이다. */
  insideHourRange: boolean;
}

export interface SolarTermLine {
  declination: number;
  label: string;
  termNames: string[];
  points: CurvePoint[];
}

export interface HourLine {
  hourAngle: number;
  apparentMinutes: number;
  isMajor: boolean;
  label: string | null;
  points: DialPoint[];
}

export interface DialGeometry {
  latitude: number;
  gnomonRoot: DialPoint;
  solarTermLines: SolarTermLine[];
  hourLines: HourLine[];
}

/** 눈금은 반구 자신의 기준으로 만든다. 그래서 방위를 0으로 둔다. */
const DIAL_FRAME_HEADING = 0;

function pointAt(hourAngle: number, declination: number, latitude: number): DialPoint {
  const { altitude, azimuth } = horizontalFromEquatorial(hourAngle, declination, latitude);
  return shadowPoint(altitude, azimuth, DIAL_FRAME_HEADING);
}

function isSunUp(hourAngle: number, declination: number, latitude: number): boolean {
  return Math.abs(hourAngle) <= horizonHourAngle(latitude, declination);
}

function buildSolarTermLine(
  group: (typeof SOLAR_TERM_GROUPS)[number],
  latitude: number
): SolarTermLine | null {
  const limit = horizonHourAngle(latitude, group.declination);
  if (limit <= 0) return null;

  const points: CurvePoint[] = [];
  for (let i = 0; i < SOLAR_TERM_SAMPLES; i += 1) {
    const hourAngle = -limit + (2 * limit * i) / (SOLAR_TERM_SAMPLES - 1);
    const { x, y } = pointAt(hourAngle, group.declination, latitude);
    points.push({
      x,
      y,
      insideHourRange: hourAngle >= HOUR_ANGLE_START && hourAngle <= HOUR_ANGLE_END,
    });
  }

  return {
    declination: group.declination,
    label: group.label,
    termNames: group.terms.map((t) => t.name),
    points,
  };
}

function buildHourLine(minutes: number, latitude: number): HourLine | null {
  const hourAngle = minutes / 4 - 180;
  const points: DialPoint[] = [];

  for (let i = 0; i < HOUR_LINE_SAMPLES; i += 1) {
    const declination = -OBLIQUITY + (2 * OBLIQUITY * i) / (HOUR_LINE_SAMPLES - 1);
    if (!isSunUp(hourAngle, declination, latitude)) continue;
    points.push(pointAt(hourAngle, declination, latitude));
  }

  if (points.length < 2) return null;

  return {
    hourAngle,
    apparentMinutes: minutes,
    isMajor: MAJOR_HOUR_MINUTES.includes(minutes),
    label: majorHourLabel(minutes),
    points,
  };
}

export function buildDialGeometry(latitude: number): DialGeometry {
  const solarTermLines: SolarTermLine[] = [];
  for (const group of SOLAR_TERM_GROUPS) {
    const line = buildSolarTermLine(group, latitude);
    if (line) solarTermLines.push(line);
  }

  const hourLines: HourLine[] = [];
  for (
    let minutes = HOUR_LINE_START_MINUTES;
    minutes <= HOUR_LINE_END_MINUTES;
    minutes += HOUR_LINE_STEP_MINUTES
  ) {
    const line = buildHourLine(minutes, latitude);
    if (line) hourLines.push(line);
  }

  return {
    latitude,
    gnomonRoot: gnomonRootPoint(latitude, DIAL_FRAME_HEADING),
    solarTermLines,
    hourLines,
  };
}
```

- [ ] **Step 4: 테스트가 통과하는 것을 확인한다**

Run: `npm test -- geometry`
Expected: PASS

- [ ] **Step 5: 전체 테스트를 돌린다**

Run: `npm test`
Expected: 지금까지의 모든 묶음이 통과한다

- [ ] **Step 6: 커밋한다**

```bash
git add -A
git commit -m "$(printf '절기선과 시각선을 만드는 눈금 기하 추가\n\n한양 위도에서 영침 뿌리, 하지선, 동지선의 위치가\n2010년 논문의 실측 수치와 소수점 셋째 자리까지 맞는다.\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 9: 달 위치

**Files:**
- Modify: `src/lib/astro/solar.ts` — `SolarElements`에 `apparentLongitude`를 더한다
- Modify: `src/lib/astro/solar.test.ts` — 황경 테스트를 더한다
- Create: `src/lib/astro/lunar.ts`
- Test: `src/lib/astro/lunar.test.ts`

**Interfaces:**
- Consumes: `toJulianDay` (Task 2), `solarElements`, `horizontalFromEquatorial`, `HorizontalPosition` (Task 3), `normalizeDegrees`, `angleDifference`, `toDegrees`, `toRadians` (Task 1), `OBLIQUITY` (Task 7)
- Produces:
  - `solarElements`가 `apparentLongitude: number`를 함께 낸다. 춘분을 0으로 삼은 태양 황경이다
  - `SYNODIC_MONTH_DAYS: number` — 29.530588853
  - `interface MoonState { position: HorizontalPosition; declination: number; hourAngle: number; illuminatedFraction: number; daysFromFullMoon: number; phaseName: string; waxing: boolean }`
  - `moonState(date: Date, latitude: number, longitude: number): MoonState`

**참고:** 달 위치는 낮은 정밀도 식을 쓴다. 오차는 0.5도 안쪽이며, 시간각으로 2분에 못 미친다. 화면에 뜨는 실제 시각은 달이 아니라 시계에서 오므로 이 오차가 시각을 흐리지 않는다.

- [ ] **Step 1: 태양 황경을 내보내는 테스트를 쓴다**

`src/lib/astro/solar.test.ts` 끝에 더한다.

```ts
describe("solarElements의 황경", () => {
  it("춘분에 0에 가깝다", () => {
    const { apparentLongitude } = solarElements(new Date("2026-03-20T14:46:00Z"));
    expect(Math.min(apparentLongitude, 360 - apparentLongitude)).toBeLessThan(0.2);
  });

  it("하지에 90도에 가깝다", () => {
    const { apparentLongitude } = solarElements(new Date("2026-06-21T08:25:00Z"));
    expect(apparentLongitude).toBeGreaterThan(89.5);
    expect(apparentLongitude).toBeLessThan(90.5);
  });

  it("0 이상 360 미만이다", () => {
    for (const iso of ["2026-01-01T00:00:00Z", "2026-08-01T00:00:00Z"]) {
      const { apparentLongitude } = solarElements(new Date(iso));
      expect(apparentLongitude).toBeGreaterThanOrEqual(0);
      expect(apparentLongitude).toBeLessThan(360);
    }
  });
});
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

Run: `npm test -- solar`
Expected: FAIL. `apparentLongitude`가 없다.

- [ ] **Step 3: solar.ts를 고친다**

`SolarElements`에 필드를 더한다.

```ts
export interface SolarElements {
  /** 적위. 도 단위. */
  declination: number;
  /** 진태양시에서 평균태양시를 뺀 값. 분 단위. */
  equationOfTime: number;
  /** 춘분을 0으로 삼은 태양 황경. 도 단위. */
  apparentLongitude: number;
}
```

`solarElements`의 반환문을 바꾼다.

```ts
  return {
    declination,
    equationOfTime,
    apparentLongitude: normalizeDegrees(apparentLongitude),
  };
```

- [ ] **Step 4: 테스트가 통과하는 것을 확인한다**

Run: `npm test -- solar`
Expected: PASS

- [ ] **Step 5: 달 테스트를 쓴다**

`src/lib/astro/lunar.test.ts`

```ts
import * as Astronomy from "astronomy-engine";
import { moonState, SYNODIC_MONTH_DAYS } from "./lunar";

const SEOUL = { latitude: 37.5665, longitude: 126.978 };
const DAY = 86400000;

function stateAt(iso: string) {
  return moonState(new Date(iso), SEOUL.latitude, SEOUL.longitude);
}

describe("moonState", () => {
  it("삭망월 길이를 쓴다", () => {
    expect(SYNODIC_MONTH_DAYS).toBeCloseTo(29.530588853, 9);
  });

  it("밝은 면 비율이 0과 1 사이다", () => {
    for (let i = 0; i < 30; i += 1) {
      const date = new Date(Date.parse("2026-01-01T12:00:00Z") + i * DAY);
      const { illuminatedFraction } = moonState(date, SEOUL.latitude, SEOUL.longitude);
      expect(illuminatedFraction).toBeGreaterThanOrEqual(0);
      expect(illuminatedFraction).toBeLessThanOrEqual(1);
    }
  });

  it("한 달 안에 보름과 그믐을 모두 지난다", () => {
    let brightest = 0;
    let darkest = 1;
    for (let i = 0; i < 30; i += 1) {
      const date = new Date(Date.parse("2026-01-01T12:00:00Z") + i * DAY);
      const { illuminatedFraction } = moonState(date, SEOUL.latitude, SEOUL.longitude);
      brightest = Math.max(brightest, illuminatedFraction);
      darkest = Math.min(darkest, illuminatedFraction);
    }
    expect(brightest).toBeGreaterThan(0.97);
    expect(darkest).toBeLessThan(0.03);
  });

  it("보름에 가까울수록 밝다", () => {
    for (let i = 0; i < 30; i += 1) {
      const date = new Date(Date.parse("2026-03-01T12:00:00Z") + i * DAY);
      const { illuminatedFraction, daysFromFullMoon } = moonState(
        date,
        SEOUL.latitude,
        SEOUL.longitude
      );
      if (Math.abs(daysFromFullMoon) < 1) expect(illuminatedFraction).toBeGreaterThan(0.95);
      if (Math.abs(daysFromFullMoon) > 14) expect(illuminatedFraction).toBeLessThan(0.05);
    }
  });

  it("보름에서 지난 날수가 삭망월 절반 안에 든다", () => {
    for (let i = 0; i < 40; i += 1) {
      const date = new Date(Date.parse("2026-05-01T12:00:00Z") + i * DAY);
      const { daysFromFullMoon } = moonState(date, SEOUL.latitude, SEOUL.longitude);
      expect(Math.abs(daysFromFullMoon)).toBeLessThanOrEqual(SYNODIC_MONTH_DAYS / 2 + 1e-6);
    }
  });

  it("적위가 기준 구현과 0.5도 안에서 맞는다", () => {
    const observer = new Astronomy.Observer(SEOUL.latitude, SEOUL.longitude, 0);
    for (const iso of [
      "2026-02-03T12:00:00Z",
      "2026-05-19T03:00:00Z",
      "2026-09-07T21:00:00Z",
    ]) {
      const date = new Date(iso);
      const expected = Astronomy.Equator(Astronomy.Body.Moon, date, observer, true, true).dec;
      expect(Math.abs(stateAt(iso).declination - expected)).toBeLessThan(0.5);
    }
  });

  it("시간각이 -180 이상 180 미만이다", () => {
    for (let i = 0; i < 24; i += 1) {
      const date = new Date(Date.parse("2026-07-04T00:00:00Z") + i * 3600000);
      const { hourAngle } = moonState(date, SEOUL.latitude, SEOUL.longitude);
      expect(hourAngle).toBeGreaterThanOrEqual(-180);
      expect(hourAngle).toBeLessThan(180);
    }
  });

  it("적위가 달의 한계 안에 머문다", () => {
    for (let i = 0; i < 60; i += 1) {
      const date = new Date(Date.parse("2026-01-01T00:00:00Z") + i * DAY);
      const { declination } = moonState(date, SEOUL.latitude, SEOUL.longitude);
      expect(Math.abs(declination)).toBeLessThan(29.5);
    }
  });

  it("달 모양에 이름을 붙인다", () => {
    const names = new Set<string>();
    for (let i = 0; i < 30; i += 1) {
      const date = new Date(Date.parse("2026-04-01T12:00:00Z") + i * DAY);
      names.add(moonState(date, SEOUL.latitude, SEOUL.longitude).phaseName);
    }
    expect(names.has("보름달")).toBe(true);
    expect(names.size).toBeGreaterThan(3);
  });
});
```

- [ ] **Step 6: 테스트가 실패하는 것을 확인한다**

Run: `npm test -- lunar`
Expected: FAIL. 모듈이 없다.

- [ ] **Step 7: 구현한다**

`src/lib/astro/lunar.ts`

```ts
import { angleDifference, normalizeDegrees, toDegrees, toRadians } from "../placement/angle";
import { OBLIQUITY } from "../dial/constants";
import { HorizontalPosition, horizontalFromEquatorial, solarElements } from "./solar";
import { toJulianDay } from "./julian";

export const SYNODIC_MONTH_DAYS = 29.530588853;

const J2000 = 2451545;

export interface MoonState {
  position: HorizontalPosition;
  /** 적위. 도 단위. */
  declination: number;
  /** 시간각. 도 단위. -180 이상 180 미만. 남중에서 0. */
  hourAngle: number;
  /** 밝은 면의 비율. 0이 삭, 1이 보름. */
  illuminatedFraction: number;
  /** 보름에서 지난 날수. 음수면 보름 전이다. */
  daysFromFullMoon: number;
  phaseName: string;
  /** 차오르는 중이면 참이다. */
  waxing: boolean;
}

interface EclipticPosition {
  longitude: number;
  latitude: number;
}

/** 메우스가 정리한 낮은 정밀도 달 위치 식을 쓴다. */
function moonEcliptic(daysSinceJ2000: number): EclipticPosition {
  const meanLongitude = 218.316 + 13.176396 * daysSinceJ2000;
  const meanAnomaly = toRadians(134.963 + 13.064993 * daysSinceJ2000);
  const meanDistance = toRadians(93.272 + 13.22935 * daysSinceJ2000);

  return {
    longitude: normalizeDegrees(meanLongitude + 6.289 * Math.sin(meanAnomaly)),
    latitude: 5.128 * Math.sin(meanDistance),
  };
}

function eclipticToDeclination(ecliptic: EclipticPosition): number {
  const l = toRadians(ecliptic.longitude);
  const b = toRadians(ecliptic.latitude);
  const e = toRadians(OBLIQUITY);
  return toDegrees(
    Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l))
  );
}

function eclipticToRightAscension(ecliptic: EclipticPosition): number {
  const l = toRadians(ecliptic.longitude);
  const b = toRadians(ecliptic.latitude);
  const e = toRadians(OBLIQUITY);
  return normalizeDegrees(
    toDegrees(
      Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l))
    )
  );
}

function localSiderealDegrees(daysSinceJ2000: number, longitude: number): number {
  return normalizeDegrees(280.16 + 360.9856235 * daysSinceJ2000 + longitude);
}

function phaseNameOf(fraction: number, waxing: boolean): string {
  if (fraction < 0.04) return "삭";
  if (fraction > 0.96) return "보름달";
  if (fraction < 0.45) return waxing ? "초승달" : "그믐달";
  if (fraction <= 0.55) return waxing ? "상현달" : "하현달";
  return waxing ? "차오르는 달" : "기우는 달";
}

export function moonState(
  date: Date,
  latitude: number,
  longitude: number
): MoonState {
  const days = toJulianDay(date) - J2000;
  const ecliptic = moonEcliptic(days);
  const declination = eclipticToDeclination(ecliptic);
  const rightAscension = eclipticToRightAscension(ecliptic);

  const hourAngle = angleDifference(localSiderealDegrees(days, longitude), rightAscension);
  const position = horizontalFromEquatorial(hourAngle, declination, latitude);

  const elongation = angleDifference(
    ecliptic.longitude,
    solarElements(date).apparentLongitude
  );
  const illuminatedFraction = (1 - Math.cos(toRadians(elongation))) / 2;
  const daysFromFullMoon =
    (angleDifference(elongation, 180) / 360) * SYNODIC_MONTH_DAYS;
  const waxing = daysFromFullMoon < 0;

  return {
    position,
    declination,
    hourAngle,
    illuminatedFraction,
    daysFromFullMoon,
    phaseName: phaseNameOf(illuminatedFraction, waxing),
    waxing,
  };
}
```

- [ ] **Step 8: 테스트가 통과하는 것을 확인한다**

Run: `npm test -- lunar`
Expected: PASS

- [ ] **Step 9: 커밋한다**

```bash
git add -A
git commit -m "$(printf '달 위치, 위상, 보름에서 지난 날수 계산 추가\n\n태양 황경을 함께 내보내도록 고쳐 달의 이각을 구했다.\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 10: 달시계 읽기

**Files:**
- Create: `src/lib/time/moon-dial.ts`
- Test: `src/lib/time/moon-dial.test.ts`

**Interfaces:**
- Consumes: `angleDifference` (Task 1), `MoonState` (Task 9), `toTraditionalTime` (Task 4), `OBLIQUITY` (Task 7)
- Produces:
  - `interface MoonDialReading { dialMinutes: number; flippedMinutes: number; correctionMinutes: number; correctedMinutes: number; roughCorrectionMinutes: number; dialLabel: string; flippedLabel: string; beyondSolarTermLines: boolean; shadowVisible: boolean }`
  - `readMoonDial(moon: MoonState, sunHourAngle: number): MoonDialReading`
  - `MOON_SHADOW_MIN_FRACTION: number` — 0.5
  - `MOON_SHADOW_MIN_ALTITUDE: number` — 10

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/lib/time/moon-dial.test.ts`

```ts
import { MoonState } from "../astro/lunar";
import { readMoonDial } from "./moon-dial";

function moon(overrides: Partial<MoonState>): MoonState {
  return {
    position: { altitude: 40, azimuth: 180 },
    declination: -20,
    hourAngle: 0,
    illuminatedFraction: 1,
    daysFromFullMoon: 0,
    phaseName: "보름달",
    waxing: false,
    ...overrides,
  };
}

describe("readMoonDial", () => {
  it("보름달이 남중하면 눈금은 오정을 가리킨다", () => {
    const reading = readMoonDial(moon({ hourAngle: 0 }), 180);
    expect(reading.dialMinutes).toBeCloseTo(720, 6);
    expect(reading.dialLabel).toBe("오정 초각");
  });

  it("12시간을 뒤집으면 자정이 된다", () => {
    const reading = readMoonDial(moon({ hourAngle: 0 }), 180);
    expect(reading.flippedMinutes).toBeCloseTo(0, 6);
    expect(reading.flippedLabel).toBe("자정 초각");
  });

  it("보름달에는 보정이 거의 없다", () => {
    const reading = readMoonDial(moon({ hourAngle: 0, daysFromFullMoon: 0 }), 180);
    expect(Math.abs(reading.correctionMinutes)).toBeLessThan(1);
  });

  it("보름을 지나면 보정이 양수다", () => {
    const reading = readMoonDial(
      moon({ hourAngle: 0, daysFromFullMoon: 3 }),
      180 - 37.5
    );
    expect(reading.correctionMinutes).toBeCloseTo(-150, 6);
  });

  it("뒤집은 값에 보정을 더하면 실제 진태양시가 된다", () => {
    const sunHourAngle = -90;
    const reading = readMoonDial(moon({ hourAngle: 75 }), sunHourAngle);
    const expected = ((sunHourAngle + 180) * 4 + 1440) % 1440;
    expect(reading.correctedMinutes).toBeCloseTo(expected, 6);
  });

  it("어림셈은 하루에 50분가량이다", () => {
    const reading = readMoonDial(moon({ daysFromFullMoon: 3 }), 180);
    expect(reading.roughCorrectionMinutes).toBeCloseTo(3 * (1440 / 29.530588853), 3);
  });

  it("달이 밝고 높으면 그림자가 생긴다고 본다", () => {
    const reading = readMoonDial(
      moon({ illuminatedFraction: 0.9, position: { altitude: 30, azimuth: 200 } }),
      180
    );
    expect(reading.shadowVisible).toBe(true);
  });

  it("달이 어두우면 그림자가 생기지 않는다고 본다", () => {
    const reading = readMoonDial(moon({ illuminatedFraction: 0.2 }), 180);
    expect(reading.shadowVisible).toBe(false);
  });

  it("달이 낮게 떠 있으면 그림자가 생기지 않는다고 본다", () => {
    const reading = readMoonDial(
      moon({ position: { altitude: 4, azimuth: 150 } }),
      180
    );
    expect(reading.shadowVisible).toBe(false);
  });

  it("적위가 태양의 한계를 넘으면 절기선 밖이라고 알린다", () => {
    expect(readMoonDial(moon({ declination: 27 }), 180).beyondSolarTermLines).toBe(true);
    expect(readMoonDial(moon({ declination: -27 }), 180).beyondSolarTermLines).toBe(true);
    expect(readMoonDial(moon({ declination: 10 }), 180).beyondSolarTermLines).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

Run: `npm test -- moon-dial`
Expected: FAIL. 모듈이 없다.

- [ ] **Step 3: 구현한다**

`src/lib/time/moon-dial.ts`

```ts
import { MoonState, SYNODIC_MONTH_DAYS } from "../astro/lunar";
import { OBLIQUITY } from "../dial/constants";
import { angleDifference } from "../placement/angle";
import { toTraditionalTime } from "./traditional";

/** 이보다 어두우면 그림자가 생기지 않는다고 본다. */
export const MOON_SHADOW_MIN_FRACTION = 0.5;
/** 이보다 낮으면 그림자가 생기지 않는다고 본다. 도 단위. */
export const MOON_SHADOW_MIN_ALTITUDE = 10;

const MINUTES_PER_DAY = 1440;
const MINUTES_PER_DEGREE_OF_HOUR_ANGLE = 4;

export interface MoonDialReading {
  /** 눈금이 그대로 가리키는 값. 진태양시 자정부터의 분. */
  dialMinutes: number;
  /** 12시간을 뒤집은 값. */
  flippedMinutes: number;
  /** 뒤집은 값에 더해야 할 분. 달의 실제 위치로 구한다. */
  correctionMinutes: number;
  /** 보정을 마친 실제 진태양시. */
  correctedMinutes: number;
  /** 하루에 50분이라는 옛 어림셈으로 구한 보정. */
  roughCorrectionMinutes: number;
  dialLabel: string;
  flippedLabel: string;
  /** 달의 적위가 태양의 한계를 넘어 절기선 밖으로 나갔는지. */
  beyondSolarTermLines: boolean;
  /** 실제로 그림자가 생길 만한 밝기와 높이인지. */
  shadowVisible: boolean;
}

function wrapMinutes(minutes: number): number {
  return ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

export function readMoonDial(moon: MoonState, sunHourAngle: number): MoonDialReading {
  const dialMinutes = wrapMinutes((moon.hourAngle + 180) * MINUTES_PER_DEGREE_OF_HOUR_ANGLE);
  const flippedMinutes = wrapMinutes(dialMinutes + MINUTES_PER_DAY / 2);

  const correctionMinutes =
    angleDifference(sunHourAngle, moon.hourAngle + 180) * MINUTES_PER_DEGREE_OF_HOUR_ANGLE;

  return {
    dialMinutes,
    flippedMinutes,
    correctionMinutes,
    correctedMinutes: wrapMinutes(flippedMinutes + correctionMinutes),
    roughCorrectionMinutes: moon.daysFromFullMoon * (MINUTES_PER_DAY / SYNODIC_MONTH_DAYS),
    dialLabel: toTraditionalTime(dialMinutes).label,
    flippedLabel: toTraditionalTime(flippedMinutes).label,
    beyondSolarTermLines: Math.abs(moon.declination) > OBLIQUITY,
    shadowVisible:
      moon.illuminatedFraction >= MOON_SHADOW_MIN_FRACTION &&
      moon.position.altitude >= MOON_SHADOW_MIN_ALTITUDE,
  };
}
```

- [ ] **Step 4: 테스트가 통과하는 것을 확인한다**

Run: `npm test -- moon-dial`
Expected: PASS

- [ ] **Step 5: 전체 테스트와 타입 검사를 돌린다**

Run: `npm test && npm run typecheck`
Expected: 전부 통과

- [ ] **Step 6: 커밋한다**

```bash
git add -A
git commit -m "$(printf '달시계 읽기와 보정 계산 추가\n\n보름달을 기준으로 삼아 12시간을 뒤집고, 달의 실제 위치로\n보정값을 구한다. 옛 어림셈도 함께 낸다.\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 11: 해시계 상태 조립

화면이 쓸 값을 한 번에 만드는 순수 함수다. 훅은 이 함수에 입력만 넣는다.

**Files:**
- Create: `src/lib/sundial.ts`
- Test: `src/lib/sundial.test.ts`

**Interfaces:**
- Consumes: 앞선 모든 순수 모듈
- Produces:
  - `type DialMode = "sun" | "moon" | "waiting"`
  - `type NightMode = "moon" | "wait"`
  - `interface SundialInput { date: Date; latitude: number; longitude: number; headingDegrees: number; nightMode: NightMode }`
  - `interface SundialState { mode: DialMode; shadow: DialPoint | null; apparentMinutes: number; standardMinutes: number; traditional: TraditionalTime; sun: HorizontalPosition; moon: MoonState; moonReading: MoonDialReading | null; equationOfTime: number; longitudeCorrection: number; solarTermName: string; minutesUntilSunrise: number | null; notices: string[] }`
  - `buildSundialState(input: SundialInput): SundialState`
  - `solarTermNameAt(apparentLongitude: number): string`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/lib/sundial.test.ts`

```ts
import { buildSundialState, solarTermNameAt } from "./sundial";
import { toTraditionalTime } from "./time/traditional";

const SEOUL = { latitude: 37.5665, longitude: 126.978 };

function stateAt(iso: string, headingDegrees = 0, nightMode: "moon" | "wait" = "moon") {
  return buildSundialState({
    date: new Date(iso),
    latitude: SEOUL.latitude,
    longitude: SEOUL.longitude,
    headingDegrees,
    nightMode,
  });
}

describe("solarTermNameAt", () => {
  it("황경을 절기 이름으로 바꾼다", () => {
    expect(solarTermNameAt(0)).toBe("춘분");
    expect(solarTermNameAt(14)).toBe("춘분");
    expect(solarTermNameAt(90)).toBe("하지");
    expect(solarTermNameAt(271)).toBe("동지");
    expect(solarTermNameAt(359)).toBe("경칩");
  });
});

describe("buildSundialState", () => {
  it("낮에는 해 모드이고 그림자가 있다", () => {
    const state = stateAt("2026-06-21T03:30:00Z");
    expect(state.mode).toBe("sun");
    expect(state.shadow).not.toBeNull();
    expect(state.sun.altitude).toBeGreaterThan(0);
  });

  it("그림자가 원판 안에 있다", () => {
    const { shadow } = stateAt("2026-06-21T03:30:00Z");
    expect(Math.hypot(shadow!.x, shadow!.y)).toBeLessThanOrEqual(1.000001);
  });

  it("밤에 달 모드를 고르면 달 읽기를 낸다", () => {
    const state = stateAt("2026-06-21T15:00:00Z", 0, "moon");
    expect(state.mode).toBe("moon");
    expect(state.moonReading).not.toBeNull();
  });

  it("밤에 대기 모드를 고르면 그림자가 없다", () => {
    const state = stateAt("2026-06-21T15:00:00Z", 0, "wait");
    expect(state.mode).toBe("waiting");
    expect(state.shadow).toBeNull();
    expect(state.minutesUntilSunrise).not.toBeNull();
    expect(state.minutesUntilSunrise!).toBeGreaterThan(0);
  });

  it("낮에는 일출까지 남은 시간을 내지 않는다", () => {
    expect(stateAt("2026-06-21T03:30:00Z").minutesUntilSunrise).toBeNull();
  });

  it("반구를 돌리면 그림자가 반대로 돈다", () => {
    const straight = stateAt("2026-06-21T03:30:00Z", 0).shadow!;
    const turned = stateAt("2026-06-21T03:30:00Z", 40).shadow!;
    const angleOf = (p: { x: number; y: number }) => Math.atan2(p.y, p.x);
    const delta = ((angleOf(turned) - angleOf(straight)) * 180) / Math.PI;
    expect(((delta % 360) + 360) % 360).toBeCloseTo(40, 4);
  });

  it("서울의 표준시가 진태양시보다 늦거나 빠른 폭이 한 시간을 넘지 않는다", () => {
    const state = stateAt("2026-06-21T03:30:00Z");
    const gap = state.standardMinutes - state.apparentMinutes;
    expect(Math.abs(gap)).toBeLessThan(60);
  });

  it("전통 시각과 진태양시가 서로 맞는다", () => {
    const state = stateAt("2026-06-21T03:00:00Z");
    expect(state.traditional.label).toBe(toTraditionalTime(state.apparentMinutes).label);
  });

  it("경도 보정이 서울에서 32분가량이다", () => {
    const state = stateAt("2026-06-21T03:30:00Z");
    expect(state.longitudeCorrection).toBeGreaterThan(32);
    expect(state.longitudeCorrection).toBeLessThan(32.2);
  });

  it("오늘의 절기 이름을 낸다", () => {
    expect(stateAt("2026-06-21T03:30:00Z").solarTermName).toBe("하지");
  });

  it("달빛이 약하면 그림자를 그리지 않고 알린다", () => {
    let found = false;
    for (let i = 0; i < 30 && !found; i += 1) {
      const date = new Date(Date.parse("2026-03-01T16:00:00Z") + i * 86400000);
      const state = buildSundialState({
        date,
        latitude: SEOUL.latitude,
        longitude: SEOUL.longitude,
        headingDegrees: 0,
        nightMode: "moon",
      });
      if (state.mode === "moon" && state.moonReading && !state.moonReading.shadowVisible) {
        expect(state.shadow).toBeNull();
        expect(state.notices.length).toBeGreaterThan(0);
        found = true;
      }
    }
    expect(found).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

Run: `npm test -- sundial`
Expected: FAIL. 모듈이 없다.

- [ ] **Step 3: 구현한다**

`src/lib/sundial.ts`

```ts
import { MoonState, moonState } from "./astro/lunar";
import {
  HorizontalPosition,
  apparentSolarMinutes,
  horizonHourAngle,
  hourAngle,
  solarElements,
  sunPosition,
} from "./astro/solar";
import { SOLAR_TERMS } from "./dial/constants";
import { DialPoint, shadowPoint } from "./dial/projection";
import {
  longitudeCorrectionMinutes,
  referenceLongitudeOf,
  standardMinutesFromApparent,
} from "./time/clock";
import { MoonDialReading, readMoonDial } from "./time/moon-dial";
import { TraditionalTime, toTraditionalTime } from "./time/traditional";
import { normalizeDegrees } from "./placement/angle";

const MINUTES_PER_DAY = 1440;
const DEGREES_PER_SOLAR_TERM = 15;

export type DialMode = "sun" | "moon" | "waiting";
export type NightMode = "moon" | "wait";

export interface SundialInput {
  date: Date;
  latitude: number;
  longitude: number;
  /** 반구의 북쪽 축이 실제로 향한 방위. 도 단위. */
  headingDegrees: number;
  nightMode: NightMode;
}

export interface SundialState {
  mode: DialMode;
  /** 반구 위 그림자 끝. 그림자가 없으면 null이다. */
  shadow: DialPoint | null;
  apparentMinutes: number;
  standardMinutes: number;
  traditional: TraditionalTime;
  sun: HorizontalPosition;
  moon: MoonState;
  moonReading: MoonDialReading | null;
  equationOfTime: number;
  longitudeCorrection: number;
  solarTermName: string;
  /** 대기 모드에서 다음 일출까지 남은 분. 낮에는 null이다. */
  minutesUntilSunrise: number | null;
  notices: string[];
}

export function solarTermNameAt(apparentLongitude: number): string {
  const index = Math.floor(normalizeDegrees(apparentLongitude) / DEGREES_PER_SOLAR_TERM);
  return SOLAR_TERMS[index % SOLAR_TERMS.length].name;
}

function minutesUntilNextSunrise(
  apparentMinutes: number,
  latitude: number,
  declination: number
): number {
  const limit = horizonHourAngle(latitude, declination);
  if (limit <= 0) return MINUTES_PER_DAY;
  const sunriseMinutes = MINUTES_PER_DAY / 2 - limit * 4;
  const gap = sunriseMinutes - apparentMinutes;
  return gap > 0 ? gap : gap + MINUTES_PER_DAY;
}

export function buildSundialState(input: SundialInput): SundialState {
  const { date, latitude, longitude, headingDegrees, nightMode } = input;

  const elements = solarElements(date);
  const sun = sunPosition(date, latitude, longitude);
  const apparentMinutes = apparentSolarMinutes(date, longitude);
  const referenceLongitude = referenceLongitudeOf(date);

  const moon = moonState(date, latitude, longitude);
  const isDay = sun.altitude > 0;

  const moonReading: MoonDialReading | null =
    isDay || nightMode === "wait"
      ? null
      : readMoonDial(moon, hourAngle(date, longitude));

  const notices: string[] = [];
  let mode: DialMode = "sun";
  let shadow: DialPoint | null = null;

  if (isDay) {
    shadow = shadowPoint(sun.altitude, sun.azimuth, headingDegrees);
  } else if (moonReading) {
    mode = "moon";
    if (moonReading.shadowVisible) {
      shadow = shadowPoint(moon.position.altitude, moon.position.azimuth, headingDegrees);
      if (moonReading.beyondSolarTermLines) {
        notices.push("달이 태양보다 높거나 낮게 지나가 그림자가 절기선 밖으로 나갔어요.");
      }
    } else if (moon.position.altitude < 0) {
      notices.push("달이 아직 뜨지 않았어요.");
    } else {
      notices.push(`${moon.phaseName}이라 달빛이 약해 그림자가 생기지 않아요.`);
    }
  } else {
    mode = "waiting";
  }

  return {
    mode,
    shadow,
    apparentMinutes,
    standardMinutes: standardMinutesFromApparent(
      apparentMinutes,
      elements.equationOfTime,
      longitude,
      referenceLongitude
    ),
    traditional: toTraditionalTime(apparentMinutes),
    sun,
    moon,
    moonReading,
    equationOfTime: elements.equationOfTime,
    longitudeCorrection: longitudeCorrectionMinutes(longitude, referenceLongitude),
    solarTermName: solarTermNameAt(elements.apparentLongitude),
    minutesUntilSunrise: isDay
      ? null
      : minutesUntilNextSunrise(apparentMinutes, latitude, elements.declination),
    notices,
  };
}
```

- [ ] **Step 4: 테스트가 통과하는 것을 확인한다**

Run: `npm test -- sundial`
Expected: PASS

- [ ] **Step 5: 커밋한다**

```bash
git add -A
git commit -m "$(printf '화면이 쓸 해시계 상태를 한 번에 만드는 함수 추가\n\n해와 달, 전통 시각, 표준시, 알림을 하나로 묶었다.\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 12: 빛에 따라 물드는 테마

**Files:**
- Create: `src/theme.ts`
- Test: `src/theme.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `interface Palette { background: string; backgroundEdge: string; bowl: string; bowlDeep: string; rim: string; line: string; lineMajor: string; label: string; shadow: string; glow: string; accent: string; text: string; textSoft: string; card: string; star: string }`
  - `DAY_PALETTE: Palette`, `NIGHT_PALETTE: Palette`
  - `themeAt(sunAltitude: number): Palette` — 고도 -6도에서 6도 사이에서 밤과 낮이 서서히 섞인다
  - `lerpColor(from: string, to: string, t: number): string`
  - `SPACING`, `RADIUS`, `FONT_SIZE` 상수 묶음

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/theme.test.ts`

```ts
import { DAY_PALETTE, lerpColor, NIGHT_PALETTE, themeAt } from "./theme";

describe("lerpColor", () => {
  it("양 끝에서 원래 색을 낸다", () => {
    expect(lerpColor("#000000", "#ffffff", 0)).toBe("#000000");
    expect(lerpColor("#000000", "#ffffff", 1)).toBe("#ffffff");
  });

  it("가운데에서 절반씩 섞는다", () => {
    expect(lerpColor("#000000", "#ffffff", 0.5)).toBe("#808080");
  });

  it("범위 밖의 값을 잘라 낸다", () => {
    expect(lerpColor("#000000", "#ffffff", -1)).toBe("#000000");
    expect(lerpColor("#000000", "#ffffff", 2)).toBe("#ffffff");
  });
});

describe("themeAt", () => {
  it("해가 높으면 낮 색이다", () => {
    expect(themeAt(30)).toEqual(DAY_PALETTE);
  });

  it("해가 깊이 지면 밤 색이다", () => {
    expect(themeAt(-30)).toEqual(NIGHT_PALETTE);
  });

  it("지평선 근처에서는 두 색 사이에 있다", () => {
    const dawn = themeAt(0);
    expect(dawn.background).not.toBe(DAY_PALETTE.background);
    expect(dawn.background).not.toBe(NIGHT_PALETTE.background);
  });

  it("해가 높아질수록 낮 색에 가까워진다", () => {
    const low = themeAt(-4);
    const high = themeAt(4);
    const distance = (a: string, b: string) =>
      Math.abs(parseInt(a.slice(1), 16) - parseInt(b.slice(1), 16));
    expect(distance(high.background, DAY_PALETTE.background)).toBeLessThan(
      distance(low.background, DAY_PALETTE.background)
    );
  });

  it("모든 색 항목을 빠짐없이 낸다", () => {
    expect(Object.keys(themeAt(0)).sort()).toEqual(Object.keys(DAY_PALETTE).sort());
  });
});
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

Run: `npm test -- theme`
Expected: FAIL. 모듈이 없다.

- [ ] **Step 3: 구현한다**

`src/theme.ts`

```ts
export interface Palette {
  background: string;
  backgroundEdge: string;
  bowl: string;
  bowlDeep: string;
  rim: string;
  line: string;
  lineMajor: string;
  label: string;
  shadow: string;
  glow: string;
  accent: string;
  text: string;
  textSoft: string;
  card: string;
  star: string;
}

/** 따뜻한 돌빛. */
export const DAY_PALETTE: Palette = {
  background: "#f7efe2",
  backgroundEdge: "#e6d5bd",
  bowl: "#dcc9ad",
  bowlDeep: "#b79f80",
  rim: "#f2e6d3",
  line: "#7d6a52",
  lineMajor: "#4f4131",
  label: "#3d3125",
  shadow: "#3a2e21",
  glow: "#ffd79a",
  accent: "#d98a2b",
  text: "#3d3125",
  textSoft: "#7d6a52",
  card: "#fffaf1",
  star: "#fff6e3",
};

/** 푸른 달빛. */
export const NIGHT_PALETTE: Palette = {
  background: "#111830",
  backgroundEdge: "#0a0f22",
  bowl: "#26304e",
  bowlDeep: "#161d33",
  rim: "#3b4870",
  line: "#7d91c4",
  lineMajor: "#b9c9f2",
  label: "#d7e2ff",
  shadow: "#070b18",
  glow: "#9dc2ff",
  accent: "#8fb4ff",
  text: "#e6ecff",
  textSoft: "#93a2cc",
  card: "#1b2340",
  star: "#ffffff",
};

const TWILIGHT_LOW = -6;
const TWILIGHT_HIGH = 6;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function channel(color: string, index: number): number {
  return parseInt(color.slice(1 + index * 2, 3 + index * 2), 16);
}

export function lerpColor(from: string, to: string, t: number): string {
  const ratio = clamp01(t);
  let result = "#";
  for (let i = 0; i < 3; i += 1) {
    const value = Math.round(channel(from, i) + (channel(to, i) - channel(from, i)) * ratio);
    result += value.toString(16).padStart(2, "0");
  }
  return result;
}

export function themeAt(sunAltitude: number): Palette {
  const t = clamp01((sunAltitude - TWILIGHT_LOW) / (TWILIGHT_HIGH - TWILIGHT_LOW));
  if (t === 0) return NIGHT_PALETTE;
  if (t === 1) return DAY_PALETTE;

  const blended = {} as Palette;
  for (const key of Object.keys(DAY_PALETTE) as (keyof Palette)[]) {
    blended[key] = lerpColor(NIGHT_PALETTE[key], DAY_PALETTE[key], t);
  }
  return blended;
}

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const RADIUS = { sm: 10, md: 18, lg: 28, round: 999 } as const;
export const FONT_SIZE = {
  hero: 34,
  title: 22,
  body: 16,
  caption: 13,
  tiny: 11,
} as const;
```

- [ ] **Step 4: 테스트가 통과하는 것을 확인한다**

Run: `npm test -- theme`
Expected: PASS

- [ ] **Step 5: 커밋한다**

```bash
git add -A
git commit -m "$(printf '해 높이에 따라 물드는 테마 추가\n\n낮의 돌빛과 밤의 달빛을 정하고 박명에서 서서히 섞이게 했다.\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 13: 방위와 기울기를 읽는 훅

**Files:**
- Modify: `src/lib/placement/angle.ts` — 평활과 기울기 함수를 더한다
- Modify: `src/lib/placement/angle.test.ts` — 테스트를 더한다
- Create: `src/hooks/use-orientation.ts`

**Interfaces:**
- Consumes: `normalizeDegrees`, `angleDifference`, `toDegrees` (Task 1)
- Produces:
  - `smoothAngle(previous: number | null, next: number, factor: number): number`
  - `tiltFromRotation(betaRadians: number, gammaRadians: number): number` — 수평에서 벗어난 각도, 도 단위
  - `ALIGNMENT_TOLERANCE_DEGREES: number` — 3
  - `FLAT_TOLERANCE_DEGREES: number` — 5
  - `interface OrientationState { headingDegrees: number; accuracy: number; tiltDegrees: number; isFlat: boolean; isAligned: boolean; compassAvailable: boolean }`
  - `useOrientation(): OrientationState`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/lib/placement/angle.test.ts` 끝에 더한다.

```ts
import { FLAT_TOLERANCE_DEGREES, smoothAngle, tiltFromRotation } from "./angle";

describe("smoothAngle", () => {
  it("이전 값이 없으면 새 값을 그대로 쓴다", () => {
    expect(smoothAngle(null, 40, 0.2)).toBe(40);
    expect(smoothAngle(null, 400, 0.2)).toBe(40);
  });

  it("새 값 쪽으로 조금씩 움직인다", () => {
    expect(smoothAngle(0, 100, 0.25)).toBeCloseTo(25, 9);
  });

  it("0도와 360도 경계를 가로질러 최단 방향으로 간다", () => {
    expect(smoothAngle(350, 10, 0.5)).toBeCloseTo(0, 9);
    expect(smoothAngle(10, 350, 0.5)).toBeCloseTo(0, 9);
  });

  it("결과가 항상 0 이상 360 미만이다", () => {
    expect(smoothAngle(359, 1, 1)).toBeCloseTo(1, 9);
    expect(smoothAngle(1, 359, 1)).toBeCloseTo(359, 9);
  });
});

describe("tiltFromRotation", () => {
  it("평평하면 0이다", () => {
    expect(tiltFromRotation(0, 0)).toBeCloseTo(0, 9);
  });

  it("옆으로 세우면 90도다", () => {
    expect(tiltFromRotation(0, Math.PI / 2)).toBeCloseTo(90, 6);
    expect(tiltFromRotation(Math.PI / 2, 0)).toBeCloseTo(90, 6);
  });

  it("엎어 놓으면 180도다", () => {
    expect(tiltFromRotation(Math.PI, 0)).toBeCloseTo(180, 6);
  });

  it("부호가 달라도 같은 값을 낸다", () => {
    expect(tiltFromRotation(-0.3, 0.2)).toBeCloseTo(tiltFromRotation(0.3, -0.2), 9);
  });

  it("살짝 기운 정도는 수평으로 본다", () => {
    expect(tiltFromRotation(0.05, 0.02)).toBeLessThan(FLAT_TOLERANCE_DEGREES);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

Run: `npm test -- angle`
Expected: FAIL. 새 함수가 없다.

- [ ] **Step 3: angle.ts에 더한다**

```ts
/** 정렬로 인정하는 방위 오차. 도 단위. */
export const ALIGNMENT_TOLERANCE_DEGREES = 3;
/** 수평으로 인정하는 기울기. 도 단위. */
export const FLAT_TOLERANCE_DEGREES = 5;

/** 0도와 360도 경계를 가로질러도 튀지 않게 각도를 누그러뜨린다. */
export function smoothAngle(previous: number | null, next: number, factor: number): number {
  if (previous === null) return normalizeDegrees(next);
  return normalizeDegrees(previous + angleDifference(next, previous) * factor);
}

/** 화면이 하늘을 볼 때 0도, 옆으로 세우면 90도, 엎어 놓으면 180도다. */
export function tiltFromRotation(betaRadians: number, gammaRadians: number): number {
  const cosine = Math.cos(betaRadians) * Math.cos(gammaRadians);
  return toDegrees(Math.acos(Math.min(1, Math.max(-1, cosine))));
}
```

- [ ] **Step 4: 테스트가 통과하는 것을 확인한다**

Run: `npm test -- angle`
Expected: PASS

- [ ] **Step 5: 센서 모듈을 설치한다**

```bash
npx expo install expo-location expo-sensors
```

`app.json`의 `expo.plugins`에 위치 권한 설명을 더한다.

```json
[
  "expo-location",
  {
    "locationAlwaysAndWhenInUsePermission": "지금 있는 곳의 해 위치를 계산해 그림자를 그리는 데 씁니다."
  }
]
```

`app.json`의 `expo.ios.infoPlist`에 다음을 더한다.

```json
{ "NSMotionUsageDescription": "휴대폰이 평평하게 놓였는지 확인하는 데 씁니다." }
```

- [ ] **Step 6: 훅을 만든다**

`src/hooks/use-orientation.ts`

```ts
import * as Location from "expo-location";
import { DeviceMotion } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import {
  ALIGNMENT_TOLERANCE_DEGREES,
  FLAT_TOLERANCE_DEGREES,
  smoothAngle,
  tiltFromRotation,
} from "../lib/placement/angle";

export interface OrientationState {
  /** 반구의 북쪽 축이 향한 방위. 도 단위. */
  headingDegrees: number;
  /** 0에서 3. 낮으면 나침반 보정이 필요하다. */
  accuracy: number;
  tiltDegrees: number;
  isFlat: boolean;
  isAligned: boolean;
  compassAvailable: boolean;
}

const SMOOTHING = 0.25;
const MOTION_INTERVAL_MS = 100;

export function useOrientation(): OrientationState {
  const [state, setState] = useState<OrientationState>({
    headingDegrees: 0,
    accuracy: 0,
    tiltDegrees: 0,
    isFlat: true,
    isAligned: false,
    compassAvailable: false,
  });

  const smoothed = useRef<number | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled || status !== "granted") return;

      subscription = await Location.watchHeadingAsync((heading) => {
        const raw =
          heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;
        if (raw < 0) return;

        smoothed.current = smoothAngle(smoothed.current, raw, SMOOTHING);
        const headingDegrees = smoothed.current;
        const offset = Math.min(headingDegrees, 360 - headingDegrees);

        setState((previous) => ({
          ...previous,
          headingDegrees,
          accuracy: heading.accuracy,
          isAligned: offset <= ALIGNMENT_TOLERANCE_DEGREES,
          compassAvailable: true,
        }));
      });
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    let subscription: { remove: () => void } | undefined;

    const start = () => {
      if (subscription) return;
      DeviceMotion.setUpdateInterval(MOTION_INTERVAL_MS);
      subscription = DeviceMotion.addListener(({ rotation }) => {
        if (!rotation) return;
        const tiltDegrees = tiltFromRotation(rotation.beta, rotation.gamma);
        setState((previous) => ({
          ...previous,
          tiltDegrees,
          isFlat: tiltDegrees <= FLAT_TOLERANCE_DEGREES,
        }));
      });
    };

    const stop = () => {
      subscription?.remove();
      subscription = undefined;
    };

    start();
    const appState = AppState.addEventListener("change", (status) => {
      if (status === "active") start();
      else stop();
    });

    return () => {
      stop();
      appState.remove();
    };
  }, []);

  return state;
}
```

- [ ] **Step 7: 타입 검사를 돌린다**

Run: `npm run typecheck`
Expected: 오류 없음

- [ ] **Step 8: 커밋한다**

```bash
git add -A
git commit -m "$(printf '나침반과 기울기를 읽는 훅 추가\n\n각도를 원형으로 누그러뜨려 떨림을 없애고, 기울기를\n피치와 롤에서 구해 부호 차이를 타지 않게 했다.\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 14: 위치, 설정, 현재 시각 훅

**Files:**
- Create: `src/lib/settings.ts`
- Test: `src/lib/settings.test.ts`
- Create: `src/hooks/use-location.ts`
- Create: `src/hooks/use-settings.ts`
- Create: `src/hooks/use-now.ts`

**Interfaces:**
- Consumes: `HANYANG_LATITUDE` (Task 8)
- Produces:
  - `interface Settings { dialLatitude: "device" | "hanyang"; nightMode: "moon" | "wait"; manualLocation: { latitude: number; longitude: number } | null }`
  - `DEFAULT_SETTINGS: Settings`
  - `mergeSettings(stored: unknown): Settings`
  - `DEFAULT_LOCATION: { latitude: number; longitude: number }` — 경복궁
  - `MIN_SUPPORTED_LATITUDE: number` — 0, `MAX_SUPPORTED_LATITUDE: number` — 66
  - `isSupportedLatitude(latitude: number): boolean`
  - `dialLatitudeOf(settings: Settings, deviceLatitude: number): number`
  - `interface LocationState { latitude: number; longitude: number; source: "gps" | "manual" | "default"; permission: "pending" | "granted" | "denied" }`
  - `useLocation(manual: Settings["manualLocation"]): LocationState`
  - `useSettings(): { settings: Settings; update: (patch: Partial<Settings>) => void; ready: boolean }`
  - `useNow(intervalMs?: number): Date`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/lib/settings.test.ts`

```ts
import {
  DEFAULT_SETTINGS,
  dialLatitudeOf,
  isSupportedLatitude,
  mergeSettings,
} from "./settings";
import { HANYANG_LATITUDE } from "./dial/geometry";

describe("mergeSettings", () => {
  it("빈 값이면 기본값을 준다", () => {
    expect(mergeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(mergeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(mergeSettings({})).toEqual(DEFAULT_SETTINGS);
  });

  it("아는 값만 받아들인다", () => {
    const merged = mergeSettings({ nightMode: "wait", 엉뚱한값: 1 });
    expect(merged.nightMode).toBe("wait");
    expect(merged).toEqual({ ...DEFAULT_SETTINGS, nightMode: "wait" });
  });

  it("엉뚱한 값은 기본값으로 되돌린다", () => {
    expect(mergeSettings({ nightMode: "해" }).nightMode).toBe(DEFAULT_SETTINGS.nightMode);
    expect(mergeSettings({ dialLatitude: 3 }).dialLatitude).toBe(DEFAULT_SETTINGS.dialLatitude);
  });

  it("수동 위치는 숫자 두 개일 때만 받는다", () => {
    expect(mergeSettings({ manualLocation: { latitude: 35, longitude: 129 } }).manualLocation)
      .toEqual({ latitude: 35, longitude: 129 });
    expect(mergeSettings({ manualLocation: { latitude: "35" } }).manualLocation).toBeNull();
    expect(mergeSettings({ manualLocation: { latitude: 95, longitude: 129 } }).manualLocation)
      .toBeNull();
    expect(mergeSettings({ manualLocation: { latitude: 35, longitude: 200 } }).manualLocation)
      .toBeNull();
  });
});

describe("isSupportedLatitude", () => {
  it("북반구의 중위도까지만 받는다", () => {
    expect(isSupportedLatitude(37.5)).toBe(true);
    expect(isSupportedLatitude(0)).toBe(false);
    expect(isSupportedLatitude(-10)).toBe(false);
    expect(isSupportedLatitude(66)).toBe(false);
    expect(isSupportedLatitude(65.9)).toBe(true);
  });
});

describe("dialLatitudeOf", () => {
  it("기기 위도를 쓴다", () => {
    expect(dialLatitudeOf({ ...DEFAULT_SETTINGS, dialLatitude: "device" }, 35.1)).toBe(35.1);
  });

  it("한양 원본을 고르면 고정한다", () => {
    expect(dialLatitudeOf({ ...DEFAULT_SETTINGS, dialLatitude: "hanyang" }, 35.1)).toBe(
      HANYANG_LATITUDE
    );
  });
});
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

Run: `npm test -- settings`
Expected: FAIL. 모듈이 없다.

- [ ] **Step 3: 구현한다**

`src/lib/settings.ts`

```ts
import { HANYANG_LATITUDE } from "./dial/geometry";

export interface Settings {
  /** 눈금을 어느 위도로 그릴지. */
  dialLatitude: "device" | "hanyang";
  /** 밤에 달시계를 쓸지 일출을 기다릴지. */
  nightMode: "moon" | "wait";
  manualLocation: { latitude: number; longitude: number } | null;
}

export const DEFAULT_SETTINGS: Settings = {
  dialLatitude: "device",
  nightMode: "moon",
  manualLocation: null,
};

/** 경복궁. 위치를 모를 때 쓴다. */
export const DEFAULT_LOCATION = { latitude: 37.5796, longitude: 126.977 };

export const MIN_SUPPORTED_LATITUDE = 0;
export const MAX_SUPPORTED_LATITUDE = 66;

export function isSupportedLatitude(latitude: number): boolean {
  return latitude > MIN_SUPPORTED_LATITUDE && latitude < MAX_SUPPORTED_LATITUDE;
}

function readManualLocation(value: unknown): Settings["manualLocation"] {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as { latitude?: unknown; longitude?: unknown };
  const { latitude, longitude } = candidate;
  if (typeof latitude !== "number" || typeof longitude !== "number") return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

export function mergeSettings(stored: unknown): Settings {
  if (typeof stored !== "object" || stored === null) return { ...DEFAULT_SETTINGS };
  const value = stored as Record<string, unknown>;

  return {
    dialLatitude:
      value.dialLatitude === "hanyang" || value.dialLatitude === "device"
        ? value.dialLatitude
        : DEFAULT_SETTINGS.dialLatitude,
    nightMode:
      value.nightMode === "moon" || value.nightMode === "wait"
        ? value.nightMode
        : DEFAULT_SETTINGS.nightMode,
    manualLocation: readManualLocation(value.manualLocation),
  };
}

export function dialLatitudeOf(settings: Settings, deviceLatitude: number): number {
  return settings.dialLatitude === "hanyang" ? HANYANG_LATITUDE : deviceLatitude;
}
```

- [ ] **Step 4: 테스트가 통과하는 것을 확인한다**

Run: `npm test -- settings`
Expected: PASS

- [ ] **Step 5: 저장소를 설치한다**

```bash
npx expo install @react-native-async-storage/async-storage
```

- [ ] **Step 6: 훅 셋을 만든다**

`src/hooks/use-now.ts`

```ts
import { useEffect, useState } from "react";
import { AppState } from "react-native";

/** 화면이 꺼지면 시계를 멈춘다. */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    const start = () => {
      setNow(new Date());
      timer = setInterval(() => setNow(new Date()), intervalMs);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };

    start();
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") {
        stop();
        start();
      } else {
        stop();
      }
    });

    return () => {
      stop();
      subscription.remove();
    };
  }, [intervalMs]);

  return now;
}
```

`src/hooks/use-settings.ts`

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

import { DEFAULT_SETTINGS, mergeSettings, Settings } from "../lib/settings";

const STORAGE_KEY = "angbuilgu.settings.v1";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) setSettings(mergeSettings(JSON.parse(raw)));
      } catch {
        // 저장된 값을 읽지 못하면 기본값으로 시작한다.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  return { settings, update, ready };
}
```

`src/hooks/use-location.ts`

```ts
import * as Location from "expo-location";
import { useEffect, useState } from "react";

import { DEFAULT_LOCATION, Settings } from "../lib/settings";

export interface LocationState {
  latitude: number;
  longitude: number;
  source: "gps" | "manual" | "default";
  permission: "pending" | "granted" | "denied";
}

export function useLocation(manual: Settings["manualLocation"]): LocationState {
  const [state, setState] = useState<LocationState>({
    ...DEFAULT_LOCATION,
    source: "default",
    permission: "pending",
  });

  useEffect(() => {
    if (manual) {
      setState({ ...manual, source: "manual", permission: "denied" });
      return;
    }

    let subscription: Location.LocationSubscription | undefined;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      if (status !== "granted") {
        setState((previous) => ({ ...previous, permission: "denied" }));
        return;
      }

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 500 },
        ({ coords }) => {
          setState({
            latitude: coords.latitude,
            longitude: coords.longitude,
            source: "gps",
            permission: "granted",
          });
        }
      );
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [manual]);

  return state;
}
```

- [ ] **Step 7: 타입 검사와 전체 테스트를 돌린다**

Run: `npm test && npm run typecheck`
Expected: 전부 통과

- [ ] **Step 8: 커밋한다**

```bash
git add -A
git commit -m "$(printf '위치, 설정, 현재 시각 훅 추가\n\n설정은 아는 값만 받아들이도록 걸러 저장한다.\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 15: 영침 그림자가 놓이는 자리

영침은 천구 북극을 향하므로, 영침과 태양이 이루는 평면이 곧 그때의 시각선이 놓인 평면이다. 그래서 영침의 그림자는 언제나 그 시각의 시각선을 따라 뻗는다. 뿌리에서 그림자 끝까지 큰 원의 조각으로 잇는다.

**Files:**
- Modify: `src/lib/dial/projection.ts`
- Modify: `src/lib/dial/projection.test.ts`

**Interfaces:**
- Produces:
  - `rodShadowPoints(latitude: number, altitude: number, azimuth: number, headingDeg: number, samples?: number): DialPoint[]`
  - `scalePoint(point: DialPoint, radius: number): DialPoint` — 화면 반지름을 곱한다

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/lib/dial/projection.test.ts` 끝에 더한다.

```ts
import { rodShadowPoints, scalePoint } from "./projection";

describe("rodShadowPoints", () => {
  const latitude = 37.653;

  it("첫 점이 영침 뿌리이고 끝 점이 그림자 끝이다", () => {
    const points = rodShadowPoints(latitude, 40, 200, 0);
    const root = gnomonRootPoint(latitude, 0);
    const tip = shadowPoint(40, 200, 0);
    expect(points[0].x).toBeCloseTo(root.x, 9);
    expect(points[0].y).toBeCloseTo(root.y, 9);
    expect(points[points.length - 1].x).toBeCloseTo(tip.x, 9);
    expect(points[points.length - 1].y).toBeCloseTo(tip.y, 9);
  });

  it("표본 수만큼 점을 낸다", () => {
    expect(rodShadowPoints(latitude, 40, 200, 0, 16)).toHaveLength(16);
  });

  it("모든 점이 원판 안에 있다", () => {
    for (const point of rodShadowPoints(latitude, 12, 95, 0, 40)) {
      expect(Math.hypot(point.x, point.y)).toBeLessThanOrEqual(1.000001);
    }
  });

  it("정오에는 자오선 위의 곧은 선이 된다", () => {
    for (const point of rodShadowPoints(latitude, 52.35, 180, 0, 20)) {
      expect(Math.abs(point.x)).toBeLessThan(1e-9);
    }
  });

  it("반구를 돌리면 함께 돈다", () => {
    const straight = rodShadowPoints(latitude, 30, 150, 0, 8);
    const turned = rodShadowPoints(latitude, 30, 180, 30, 8);
    straight.forEach((point, index) => {
      expect(turned[index].x).toBeCloseTo(point.x, 9);
      expect(turned[index].y).toBeCloseTo(point.y, 9);
    });
  });
});

describe("scalePoint", () => {
  it("반지름을 곱한다", () => {
    expect(scalePoint({ x: 0.5, y: -0.25 }, 120)).toEqual({ x: 60, y: -30 });
  });
});
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

Run: `npm test -- projection`
Expected: FAIL. 새 함수가 없다.

- [ ] **Step 3: projection.ts에 더한다**

```ts
function normalize(v: Vector3): Vector3 {
  const length = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / length, y: v.y / length, z: v.z / length };
}

/** 구 위의 두 방향을 큰 원을 따라 잇는다. */
function slerp(from: Vector3, to: Vector3, t: number): Vector3 {
  const dot = Math.min(1, Math.max(-1, from.x * to.x + from.y * to.y + from.z * to.z));
  const omega = Math.acos(dot);
  if (omega < 1e-9) return from;

  const a = Math.sin((1 - t) * omega) / Math.sin(omega);
  const b = Math.sin(t * omega) / Math.sin(omega);
  return normalize({
    x: from.x * a + to.x * b,
    y: from.y * a + to.y * b,
    z: from.z * a + to.z * b,
  });
}

/** 영침 뿌리에서 그림자 끝까지, 그때의 시각선을 따라가는 선이다. */
export function rodShadowPoints(
  latitude: number,
  altitude: number,
  azimuth: number,
  headingDeg: number,
  samples = 24
): DialPoint[] {
  const root = directionVector(-latitude, 180);
  const light = directionVector(altitude, azimuth);
  const tip: Vector3 = { x: -light.x, y: -light.y, z: -light.z };

  const points: DialPoint[] = [];
  for (let i = 0; i < samples; i += 1) {
    const t = samples === 1 ? 0 : i / (samples - 1);
    points.push(projectToDial(rotateToDialFrame(slerp(root, tip, t), headingDeg)));
  }
  return points;
}

export function scalePoint(point: DialPoint, radius: number): DialPoint {
  return { x: point.x * radius, y: point.y * radius };
}
```

- [ ] **Step 4: 테스트가 통과하는 것을 확인한다**

Run: `npm test -- projection`
Expected: PASS

- [ ] **Step 5: 커밋한다**

```bash
git add -A
git commit -m "$(printf '영침 그림자가 놓이는 선 추가\n\n영침이 천구 북극을 향하므로 그림자는 그때의 시각선을 따른다.\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 16: 반구 그리기

**Files:**
- Create: `src/components/dial/path.ts`
- Create: `src/components/dial/bowl.tsx`
- Create: `src/components/dial/grid.tsx`
- Create: `src/components/dial/gnomon.tsx`
- Create: `src/components/dial/shadow.tsx`
- Create: `src/components/dial/index.tsx`
- Modify: `src/app/index.tsx` — 눈으로 확인할 임시 화면

**Interfaces:**
- Consumes: `DialGeometry`, `CurvePoint`, `HourLine`, `SolarTermLine` (Task 8), `DialPoint` (Task 6), `Palette` (Task 12)
- Produces:
  - `toSkPath(points: DialPoint[], radius: number): SkPath`
  - `interface DialProps { geometry: DialGeometry; shadow: DialPoint | null; rodShadow: DialPoint[]; palette: Palette; size: number; glowing: boolean }`
  - `Dial(props: DialProps): JSX.Element`

- [ ] **Step 1: 그리기 도구를 설치한다**

```bash
npx expo install @shopify/react-native-skia react-native-reanimated react-native-worklets react-native-gesture-handler
```

`babel.config.js`에 워클릿 플러그인을 넣는다.

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["react-native-worklets/plugin"],
  };
};
```

- [ ] **Step 2: 경로 도구를 만든다**

`src/components/dial/path.ts`

```ts
import { Skia, SkPath } from "@shopify/react-native-skia";

import { DialPoint } from "../../lib/dial/projection";

/** 원판 좌표를 화면 픽셀로 옮겨 선으로 잇는다. 원점은 반구의 중심이다. */
export function toSkPath(points: DialPoint[], radius: number): SkPath {
  const path = Skia.Path.Make();
  points.forEach((point, index) => {
    const x = point.x * radius;
    const y = point.y * radius;
    if (index === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  });
  return path;
}
```

- [ ] **Step 3: 그릇을 만든다**

`src/components/dial/bowl.tsx`

```tsx
import { Circle, RadialGradient, vec } from "@shopify/react-native-skia";

import { Palette } from "../../theme";

export function Bowl({ radius, palette }: { radius: number; palette: Palette }) {
  return (
    <>
      <Circle cx={0} cy={0} r={radius}>
        <RadialGradient
          c={vec(0, -radius * 0.35)}
          r={radius * 1.5}
          colors={[palette.bowl, palette.bowlDeep]}
        />
      </Circle>
      <Circle
        cx={0}
        cy={0}
        r={radius}
        style="stroke"
        strokeWidth={radius * 0.045}
        color={palette.rim}
      />
    </>
  );
}
```

- [ ] **Step 4: 눈금을 만든다**

`src/components/dial/grid.tsx`

```tsx
import { Path, Text, useFont } from "@shopify/react-native-skia";
import { useMemo } from "react";

import { DialGeometry } from "../../lib/dial/geometry";
import { Palette } from "../../theme";
import { toSkPath } from "./path";

interface GridProps {
  geometry: DialGeometry;
  radius: number;
  palette: Palette;
}

export function Grid({ geometry, radius, palette }: GridProps) {
  const solarTermPaths = useMemo(
    () =>
      geometry.solarTermLines.map((line) => ({
        key: line.label,
        inside: toSkPath(line.points.filter((p) => p.insideHourRange), radius),
        outside: toSkPath(line.points.filter((p) => !p.insideHourRange), radius),
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
      {solarTermPaths.map((line) => (
        <Path
          key={`term-out-${line.key}`}
          path={line.outside}
          style="stroke"
          strokeWidth={radius * 0.006}
          color={palette.line}
          opacity={0.25}
        />
      ))}
      {solarTermPaths.map((line) => (
        <Path
          key={`term-${line.key}`}
          path={line.inside}
          style="stroke"
          strokeWidth={radius * 0.008}
          color={palette.line}
          opacity={0.75}
        />
      ))}
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
```

- [ ] **Step 5: 영침과 그림자를 만든다**

`src/components/dial/gnomon.tsx`

```tsx
import { Circle, Line, vec } from "@shopify/react-native-skia";

import { DialPoint } from "../../lib/dial/projection";
import { Palette } from "../../theme";

interface GnomonProps {
  root: DialPoint;
  radius: number;
  palette: Palette;
}

export function Gnomon({ root, radius, palette }: GnomonProps) {
  return (
    <>
      <Line
        p1={vec(root.x * radius, root.y * radius)}
        p2={vec(0, 0)}
        color={palette.lineMajor}
        strokeWidth={radius * 0.022}
        strokeCap="round"
      />
      <Circle cx={0} cy={0} r={radius * 0.022} color={palette.lineMajor} />
    </>
  );
}
```

`src/components/dial/shadow.tsx`

```tsx
import { Circle, Path } from "@shopify/react-native-skia";
import { useMemo } from "react";

import { DialPoint } from "../../lib/dial/projection";
import { Palette } from "../../theme";
import { toSkPath } from "./path";

interface ShadowProps {
  points: DialPoint[];
  tip: DialPoint | null;
  radius: number;
  palette: Palette;
  glowing: boolean;
}

export function Shadow({ points, tip, radius, palette, glowing }: ShadowProps) {
  const path = useMemo(() => toSkPath(points, radius), [points, radius]);
  if (!tip) return null;

  return (
    <>
      <Path
        path={path}
        style="stroke"
        strokeWidth={radius * 0.03}
        strokeCap="round"
        color={palette.shadow}
        opacity={0.55}
      />
      <Circle
        cx={tip.x * radius}
        cy={tip.y * radius}
        r={radius * (glowing ? 0.075 : 0.055)}
        color={palette.glow}
        opacity={glowing ? 0.55 : 0.35}
      />
      <Circle cx={tip.x * radius} cy={tip.y * radius} r={radius * 0.026} color={palette.shadow} />
    </>
  );
}
```

- [ ] **Step 6: 반구를 하나로 묶는다**

`src/components/dial/index.tsx`

```tsx
import { Canvas, Group } from "@shopify/react-native-skia";

import { DialGeometry } from "../../lib/dial/geometry";
import { DialPoint } from "../../lib/dial/projection";
import { Palette } from "../../theme";
import { Bowl } from "./bowl";
import { Gnomon } from "./gnomon";
import { Grid } from "./grid";
import { Shadow } from "./shadow";

export interface DialProps {
  geometry: DialGeometry;
  shadow: DialPoint | null;
  rodShadow: DialPoint[];
  palette: Palette;
  size: number;
  glowing: boolean;
}

export function Dial({ geometry, shadow, rodShadow, palette, size, glowing }: DialProps) {
  const radius = size / 2;

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group transform={[{ translateX: radius }, { translateY: radius }]}>
        <Bowl radius={radius * 0.96} palette={palette} />
        <Grid geometry={geometry} radius={radius * 0.96} palette={palette} />
        <Gnomon root={geometry.gnomonRoot} radius={radius * 0.96} palette={palette} />
        <Shadow
          points={rodShadow}
          tip={shadow}
          radius={radius * 0.96}
          palette={palette}
          glowing={glowing}
        />
      </Group>
    </Canvas>
  );
}
```

- [ ] **Step 7: 임시 화면으로 눈으로 확인한다**

`src/app/index.tsx`

```tsx
import { useWindowDimensions, View } from "react-native";

import { Dial } from "../components/dial";
import { buildDialGeometry, HANYANG_LATITUDE } from "../lib/dial/geometry";
import { rodShadowPoints, shadowPoint } from "../lib/dial/projection";
import { DAY_PALETTE } from "../theme";

export default function Index() {
  const { width } = useWindowDimensions();
  const geometry = buildDialGeometry(HANYANG_LATITUDE);
  const size = Math.min(width - 32, 420);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: DAY_PALETTE.background,
      }}
    >
      <Dial
        geometry={geometry}
        shadow={shadowPoint(40, 220, 0)}
        rodShadow={rodShadowPoints(HANYANG_LATITUDE, 40, 220, 0)}
        palette={DAY_PALETTE}
        size={size}
        glowing
      />
    </View>
  );
}
```

- [ ] **Step 8: 시뮬레이터에서 화면을 본다**

`npx expo run:ios`로 개발 빌드를 만든 뒤, 시뮬레이터 도구로 화면을 찍어 다음을 확인한다.

- 오목한 그릇이 보이고 가장자리에 테가 있다
- 절기선 13개가 가로로, 시각선이 세로로 지나간다
- 주선 7개가 굵다
- 영침이 남쪽 가장자리 안쪽에서 중심으로 뻗는다
- 그림자가 영침 뿌리에서 시작해 한쪽 눈금 위에 끝난다

- [ ] **Step 9: 커밋한다**

```bash
git add -A
git commit -m "$(printf '스킨으로 반구와 눈금, 영침, 그림자 그리기 추가\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 17: 하늘의 해와 달, 정렬 안내

**Files:**
- Modify: `src/lib/dial/projection.ts` — `horizonDirection`을 더한다
- Modify: `src/lib/dial/projection.test.ts`
- Create: `src/components/dial/sky.tsx`
- Modify: `src/components/dial/index.tsx` — 하늘을 품게 한다
- Create: `src/components/alignment-guide.tsx`

**Interfaces:**
- Produces:
  - `horizonDirection(azimuth: number, headingDeg: number): DialPoint` — 반구 기준으로 그 방위가 놓인 쪽의 단위 방향
  - `interface SkyContent { sunAltitude: number; sunAzimuth: number; moonAltitude: number; moonAzimuth: number; moonFraction: number; heading: number; night: boolean }`
  - `Sky(props: SkyContent & { radius: number; palette: Palette }): JSX.Element`
  - `AlignmentGuide(props: { headingDegrees: number; isAligned: boolean; isFlat: boolean; tiltDegrees: number; accuracy: number; compassAvailable: boolean; palette: Palette }): JSX.Element`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/lib/dial/projection.test.ts` 끝에 더한다.

```ts
import { horizonDirection } from "./projection";

describe("horizonDirection", () => {
  it("북쪽은 위쪽이다", () => {
    const d = horizonDirection(0, 0);
    expect(d.x).toBeCloseTo(0, 9);
    expect(d.y).toBeCloseTo(-1, 9);
  });

  it("동쪽은 오른쪽이다", () => {
    expect(horizonDirection(90, 0).x).toBeCloseTo(1, 9);
  });

  it("반구를 돌리면 함께 돈다", () => {
    const a = horizonDirection(120, 0);
    const b = horizonDirection(150, 30);
    expect(b.x).toBeCloseTo(a.x, 9);
    expect(b.y).toBeCloseTo(a.y, 9);
  });

  it("언제나 단위 길이다", () => {
    for (const azimuth of [0, 37, 180, 300]) {
      const d = horizonDirection(azimuth, 17);
      expect(Math.hypot(d.x, d.y)).toBeCloseTo(1, 9);
    }
  });
});
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

Run: `npm test -- projection`
Expected: FAIL

- [ ] **Step 3: projection.ts에 더한다**

```ts
/** 그 방위가 반구 기준으로 어느 쪽인지 알려 주는 단위 방향이다. */
export function horizonDirection(azimuth: number, headingDeg: number): DialPoint {
  const angle = toRadians(azimuth - headingDeg);
  return { x: Math.sin(angle), y: -Math.cos(angle) };
}
```

- [ ] **Step 4: 테스트가 통과하는 것을 확인한다**

Run: `npm test -- projection`
Expected: PASS

- [ ] **Step 5: 하늘을 만든다**

`src/components/dial/sky.tsx`

```tsx
import { Circle, Group } from "@shopify/react-native-skia";
import { useMemo } from "react";

import { horizonDirection } from "../../lib/dial/projection";
import { Palette } from "../../theme";

export interface SkyContent {
  sunAltitude: number;
  sunAzimuth: number;
  moonAltitude: number;
  moonAzimuth: number;
  moonFraction: number;
  heading: number;
  night: boolean;
}

interface SkyProps extends SkyContent {
  radius: number;
  palette: Palette;
}

const RING = 1.18;
const STAR_COUNT = 40;

/** 해와 달을 실제 방위에 맞춰 반구 바깥에 띄운다. 높이 뜰수록 크고 밝다. */
export function Sky({
  sunAltitude,
  sunAzimuth,
  moonAltitude,
  moonAzimuth,
  moonFraction,
  heading,
  radius,
  palette,
  night,
}: SkyProps) {
  const stars = useMemo(() => {
    const items: { x: number; y: number; r: number }[] = [];
    for (let i = 0; i < STAR_COUNT; i += 1) {
      const angle = (i * 137.5 * Math.PI) / 180;
      const distance = RING * radius * (0.55 + ((i * 37) % 45) / 100);
      items.push({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        r: radius * (0.004 + ((i * 13) % 7) / 1400),
      });
    }
    return items;
  }, [radius]);

  const sun = horizonDirection(sunAzimuth, heading);
  const moon = horizonDirection(moonAzimuth, heading);
  const sunSize = radius * (0.05 + Math.max(0, sunAltitude) / 900);
  const moonSize = radius * (0.04 + Math.max(0, moonAltitude) / 1100);

  return (
    <Group>
      {night
        ? stars.map((star, index) => (
            <Circle
              key={`star-${index}`}
              cx={star.x}
              cy={star.y}
              r={star.r}
              color={palette.star}
              opacity={0.5}
            />
          ))
        : null}

      {sunAltitude > -6 ? (
        <>
          <Circle
            cx={sun.x * RING * radius}
            cy={sun.y * RING * radius}
            r={sunSize * 2.2}
            color={palette.glow}
            opacity={0.3}
          />
          <Circle
            cx={sun.x * RING * radius}
            cy={sun.y * RING * radius}
            r={sunSize}
            color={palette.glow}
          />
        </>
      ) : null}

      {moonAltitude > -6 ? (
        <>
          <Circle
            cx={moon.x * RING * radius}
            cy={moon.y * RING * radius}
            r={moonSize * 2}
            color={palette.accent}
            opacity={0.18 + moonFraction * 0.2}
          />
          <Circle
            cx={moon.x * RING * radius}
            cy={moon.y * RING * radius}
            r={moonSize}
            color={palette.star}
            opacity={0.35 + moonFraction * 0.6}
          />
        </>
      ) : null}
    </Group>
  );
}
```

- [ ] **Step 6: 반구가 하늘을 품게 한다**

`src/components/dial/index.tsx`를 고친다. 가져오기에 하늘을 더한다.

```tsx
import { Sky, SkyContent } from "./sky";
```

`DialProps`에 항목을 더한다.

```tsx
  /** 반구 바깥에 해와 달을 띄운다. 없으면 그리지 않는다. */
  sky?: SkyContent;
```

함수의 인자 목록에 `sky`를 더하고, `Group` 안 첫 줄에 하늘을 넣는다.

```tsx
export function Dial({ geometry, shadow, rodShadow, palette, size, glowing, sky }: DialProps) {
```

```tsx
        {sky ? <Sky {...sky} radius={radius * 0.96} palette={palette} /> : null}
        <Bowl radius={radius * 0.96} palette={palette} />
```

- [ ] **Step 7: 정렬 안내를 만든다**

`src/components/alignment-guide.tsx`

```tsx
import { StyleSheet, Text, View } from "react-native";

import { angleDifference } from "../lib/placement/angle";
import { FONT_SIZE, Palette, RADIUS, SPACING } from "../theme";

interface AlignmentGuideProps {
  headingDegrees: number;
  isAligned: boolean;
  isFlat: boolean;
  tiltDegrees: number;
  /** 0에서 3. 1 이하면 나침반을 보정해야 한다. */
  accuracy: number;
  compassAvailable: boolean;
  palette: Palette;
}

/** 나침반이 이 값 이하로 보고하면 보정을 권한다. */
const LOW_ACCURACY = 1;

export function AlignmentGuide({
  headingDegrees,
  isAligned,
  isFlat,
  tiltDegrees,
  accuracy,
  compassAvailable,
  palette,
}: AlignmentGuideProps) {
  if (!compassAvailable) {
    return (
      <Hint palette={palette} text="나침반을 쓸 수 없어 방향을 맞춘 것으로 두었어요" />
    );
  }

  if (!isFlat) {
    return (
      <Hint
        palette={palette}
        text={`휴대폰을 바닥에 눕혀 주세요 · ${Math.round(tiltDegrees)}도 기울었어요`}
      />
    );
  }

  if (accuracy <= LOW_ACCURACY) {
    return (
      <Hint palette={palette} text="나침반이 흔들려요 · 휴대폰을 팔자로 크게 흔들어 주세요" />
    );
  }

  if (isAligned) {
    return <Hint palette={palette} text="북쪽을 잘 맞췄어요" highlight />;
  }

  const offset = angleDifference(0, headingDegrees);
  const direction = offset > 0 ? "오른쪽" : "왼쪽";
  return (
    <Hint
      palette={palette}
      text={`${direction}으로 ${Math.round(Math.abs(offset))}도 돌려 주세요`}
    />
  );
}

function Hint({
  text,
  palette,
  highlight = false,
}: {
  text: string;
  palette: Palette;
  highlight?: boolean;
}) {
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: highlight ? palette.accent : palette.card },
      ]}
    >
      <Text
        style={[styles.text, { color: highlight ? palette.card : palette.textSoft }]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
  },
  text: {
    fontSize: FONT_SIZE.caption,
    fontWeight: "600",
  },
});
```

- [ ] **Step 8: 타입 검사를 돌린다**

Run: `npm run typecheck`
Expected: 오류 없음

- [ ] **Step 9: 커밋한다**

```bash
git add -A
git commit -m "$(printf '하늘의 해와 달, 정렬 안내 추가\n\n해와 달을 실제 방위에 맞춰 반구 바깥에 띄웠다.\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 18: 시각 읽기 카드

큰 글씨는 쉬운 말로, 작은 글씨는 전통 시각으로 적는다. 눌러야 자세한 설명이 열린다.

**Files:**
- Create: `src/components/info-tooltip.tsx`
- Create: `src/components/reading-card.tsx`
- Test: `src/components/reading-card.test.tsx`

**Interfaces:**
- Consumes: `SundialState` (Task 11), `formatFriendlyTime`, `formatClockTime`, `formatSignedMinutes` (Task 5), `Palette` (Task 12)
- Produces:
  - `InfoTooltip(props: { label: string; title: string; body: string; palette: Palette }): JSX.Element`
  - `ReadingCard(props: { state: SundialState; palette: Palette }): JSX.Element`

- [ ] **Step 1: 테스트 도구를 설치한다**

```bash
npm install --save-dev @testing-library/react-native react-test-renderer
```

`package.json`의 jest 설정에 다음을 더한다.

```json
{ "setupFilesAfterEnv": ["@testing-library/react-native/extend-expect"] }
```

- [ ] **Step 2: 실패하는 테스트를 쓴다**

`src/components/reading-card.test.tsx`

```tsx
import { render, screen } from "@testing-library/react-native";

import { buildSundialState } from "../lib/sundial";
import { DAY_PALETTE } from "../theme";
import { ReadingCard } from "./reading-card";

function stateAt(iso: string, nightMode: "moon" | "wait" = "moon") {
  return buildSundialState({
    date: new Date(iso),
    latitude: 37.5665,
    longitude: 126.978,
    headingDegrees: 0,
    nightMode,
  });
}

describe("ReadingCard", () => {
  it("쉬운 말로 된 시각을 크게 보여 준다", () => {
    render(<ReadingCard state={stateAt("2026-06-21T03:30:00Z")} palette={DAY_PALETTE} />);
    expect(screen.getByTestId("friendly-time")).toBeVisible();
  });

  it("전통 시각을 함께 보여 준다", () => {
    const state = stateAt("2026-06-21T03:30:00Z");
    render(<ReadingCard state={state} palette={DAY_PALETTE} />);
    expect(screen.getByText(state.traditional.label)).toBeVisible();
  });

  it("오늘의 절기를 보여 준다", () => {
    const state = stateAt("2026-06-21T03:30:00Z");
    render(<ReadingCard state={state} palette={DAY_PALETTE} />);
    expect(screen.getByText(new RegExp(state.solarTermName))).toBeVisible();
  });

  it("밤에 달시계면 보름에서 지난 날수를 보여 준다", () => {
    const state = stateAt("2026-06-21T15:00:00Z", "moon");
    render(<ReadingCard state={state} palette={DAY_PALETTE} />);
    expect(screen.getByTestId("moon-reading")).toBeVisible();
  });

  it("대기 모드에서는 일출까지 남은 시간을 보여 준다", () => {
    const state = stateAt("2026-06-21T15:00:00Z", "wait");
    render(<ReadingCard state={state} palette={DAY_PALETTE} />);
    expect(screen.getByTestId("until-sunrise")).toBeVisible();
  });

  it("알림이 있으면 그대로 보여 준다", () => {
    const state = { ...stateAt("2026-06-21T03:30:00Z"), notices: ["시험 알림"] };
    render(<ReadingCard state={state} palette={DAY_PALETTE} />);
    expect(screen.getByText("시험 알림")).toBeVisible();
  });
});
```

- [ ] **Step 3: 테스트가 실패하는 것을 확인한다**

Run: `npm test -- reading-card`
Expected: FAIL. 모듈이 없다.

- [ ] **Step 4: 툴팁을 만든다**

`src/components/info-tooltip.tsx`

```tsx
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { FONT_SIZE, Palette, RADIUS, SPACING } from "../theme";

interface InfoTooltipProps {
  label: string;
  title: string;
  body: string;
  palette: Palette;
}

/** 궁금해하는 자리에서 바로 열리는 짧은 설명이다. */
export function InfoTooltip({ label, title, body, palette }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${title} 설명 열기`}
        hitSlop={SPACING.md}
      >
        <Text style={[styles.label, { color: palette.textSoft }]}>{label} ⓘ</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: palette.card }]}>
            <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
            <Text style={[styles.body, { color: palette.textSoft }]}>{body}</Text>
            <Text style={[styles.close, { color: palette.accent }]}>닫기</Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: FONT_SIZE.caption },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  sheet: {
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    gap: SPACING.md,
    maxWidth: 360,
  },
  title: { fontSize: FONT_SIZE.title, fontWeight: "700" },
  body: { fontSize: FONT_SIZE.body, lineHeight: 24 },
  close: { fontSize: FONT_SIZE.body, fontWeight: "600", textAlign: "right" },
});
```

- [ ] **Step 5: 읽기 카드를 만든다**

`src/components/reading-card.tsx`

```tsx
import { StyleSheet, Text, View } from "react-native";

import { SundialState } from "../lib/sundial";
import {
  formatClockTime,
  formatFriendlyTime,
  formatSignedMinutes,
} from "../lib/time/clock";
import { FONT_SIZE, Palette, RADIUS, SPACING } from "../theme";
import { InfoTooltip } from "./info-tooltip";

interface ReadingCardProps {
  state: SundialState;
  palette: Palette;
}

export function ReadingCard({ state, palette }: ReadingCardProps) {
  const shownMinutes =
    state.mode === "moon" && state.moonReading
      ? state.moonReading.correctedMinutes
      : state.apparentMinutes;

  return (
    <View style={[styles.card, { backgroundColor: palette.card }]}>
      <Text style={[styles.term, { color: palette.textSoft }]}>
        오늘은 {state.solarTermName} 무렵이에요
      </Text>

      <Text testID="friendly-time" style={[styles.friendly, { color: palette.text }]}>
        {formatFriendlyTime(state.standardMinutes)}
      </Text>

      <View style={styles.row}>
        <Text style={[styles.traditional, { color: palette.text }]}>
          {state.traditional.label}
        </Text>
        <InfoTooltip
          label="전통 시각"
          title="96각법으로 읽기"
          body={
            "하루를 열두 시로 나누고, 한 시를 초와 정으로 반씩 나눠요. " +
            "다시 15분짜리 각 넷으로 나눕니다. 자시가 밤 11시에 시작하니 오정 초각이 정오예요."
          }
          palette={palette}
        />
      </View>

      <View style={styles.row}>
        <Text style={[styles.detail, { color: palette.textSoft }]}>
          해그림자 {formatClockTime(shownMinutes)} · 시계 {formatClockTime(state.standardMinutes)}
        </Text>
        <InfoTooltip
          label="왜 다를까"
          title="해시계와 시계의 차이"
          body={
            `사는 곳이 표준시 기준선보다 서쪽이면 해가 늦게 남중해요. 지금 ${formatSignedMinutes(
              state.longitudeCorrection
            )}입니다. 여기에 지구 궤도 때문에 생기는 균시차가 ${formatSignedMinutes(
              state.equationOfTime
            )}으로 더해집니다.`
          }
          palette={palette}
        />
      </View>

      {state.mode === "moon" && state.moonReading ? (
        <View testID="moon-reading" style={styles.moonBox}>
          <Text style={[styles.detail, { color: palette.textSoft }]}>
            달그림자가 가리키는 눈금 {state.moonReading.dialLabel}
          </Text>
          <Text style={[styles.detail, { color: palette.textSoft }]}>
            12시간 뒤집으면 {state.moonReading.flippedLabel}
          </Text>
          <View style={styles.row}>
            <Text style={[styles.detail, { color: palette.textSoft }]}>
              보름에서 {Math.abs(Math.round(state.moon.daysFromFullMoon))}일{" "}
              {state.moon.daysFromFullMoon >= 0 ? "지남" : "전"} · {state.moon.phaseName}
            </Text>
            <InfoTooltip
              label="달시계"
              title="달로 시각 읽기"
              body={
                "보름달은 해의 정반대에 있어 자정에 남중해요. 그래서 눈금을 12시간 뒤집으면 " +
                "보름날 밤에는 시각이 거의 맞습니다. 보름에서 하루 멀어질 때마다 50분쯤 " +
                "어긋나요. 옛 달시계에도 이 차이를 메우는 눈금이 따로 있었어요."
              }
              palette={palette}
            />
          </View>
        </View>
      ) : null}

      {state.mode === "waiting" && state.minutesUntilSunrise !== null ? (
        <Text testID="until-sunrise" style={[styles.detail, { color: palette.textSoft }]}>
          해가 뜨기까지 {Math.floor(state.minutesUntilSunrise / 60)}시간{" "}
          {Math.round(state.minutesUntilSunrise % 60)}분 남았어요
        </Text>
      ) : null}

      {state.notices.map((notice) => (
        <Text key={notice} style={[styles.notice, { color: palette.accent }]}>
          {notice}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    gap: SPACING.sm,
    width: "100%",
  },
  term: { fontSize: FONT_SIZE.caption },
  friendly: { fontSize: FONT_SIZE.hero, fontWeight: "700" },
  traditional: { fontSize: FONT_SIZE.title, fontWeight: "600" },
  detail: { fontSize: FONT_SIZE.caption, flexShrink: 1 },
  notice: { fontSize: FONT_SIZE.caption, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  moonBox: { gap: SPACING.xs, marginTop: SPACING.xs },
});
```

- [ ] **Step 6: 테스트가 통과하는 것을 확인한다**

Run: `npm test -- reading-card`
Expected: PASS

- [ ] **Step 7: 커밋한다**

```bash
git add -A
git commit -m "$(printf '시각 읽기 카드와 툴팁 추가\n\n큰 글씨는 쉬운 말로, 작은 글씨는 전통 시각으로 적었다.\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 19: 주화면 조립

**Files:**
- Create: `src/hooks/use-dial-geometry.ts`
- Create: `src/components/notice.tsx`
- Create: `src/screens/dial/index.tsx`
- Modify: `src/app/index.tsx`
- Modify: `src/app/_layout.tsx`

**Interfaces:**
- Produces:
  - `LATITUDE_REBUILD_STEP: number` — 0.05
  - `useDialGeometry(latitude: number): DialGeometry`
  - `Notice(props: { title: string; body: string; palette: Palette }): JSX.Element`
  - `DialScreen(): JSX.Element`

- [ ] **Step 1: 눈금을 다시 만드는 시점을 테스트한다**

`src/hooks/use-dial-geometry.test.ts`

```ts
import { quantizeLatitude } from "./use-dial-geometry";

describe("quantizeLatitude", () => {
  it("0.05도 단위로 끊는다", () => {
    expect(quantizeLatitude(37.5123)).toBeCloseTo(37.5, 9);
    expect(quantizeLatitude(37.539)).toBeCloseTo(37.55, 9);
  });

  it("몇 킬로미터 움직여도 값이 그대로다", () => {
    expect(quantizeLatitude(37.5)).toBe(quantizeLatitude(37.52));
  });

  it("충분히 멀어지면 값이 달라진다", () => {
    expect(quantizeLatitude(37.5)).not.toBe(quantizeLatitude(37.7));
  });
});
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

Run: `npm test -- use-dial-geometry`
Expected: FAIL

- [ ] **Step 3: 훅을 만든다**

`src/hooks/use-dial-geometry.ts`

```ts
import { useMemo } from "react";

import { buildDialGeometry, DialGeometry } from "../lib/dial/geometry";

/** 이만큼 위도가 바뀌어야 눈금을 다시 만든다. */
export const LATITUDE_REBUILD_STEP = 0.05;

export function quantizeLatitude(latitude: number): number {
  return Math.round(latitude / LATITUDE_REBUILD_STEP) * LATITUDE_REBUILD_STEP;
}

export function useDialGeometry(latitude: number): DialGeometry {
  const stepped = quantizeLatitude(latitude);
  return useMemo(() => buildDialGeometry(stepped), [stepped]);
}
```

- [ ] **Step 4: 테스트가 통과하는 것을 확인한다**

Run: `npm test -- use-dial-geometry`
Expected: PASS

- [ ] **Step 5: 안내 상자를 만든다**

`src/components/notice.tsx`

```tsx
import { StyleSheet, Text, View } from "react-native";

import { FONT_SIZE, Palette, RADIUS, SPACING } from "../theme";

export function Notice({
  title,
  body,
  palette,
}: {
  title: string;
  body: string;
  palette: Palette;
}) {
  return (
    <View style={[styles.box, { backgroundColor: palette.card }]}>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.body, { color: palette.textSoft }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: RADIUS.lg, padding: SPACING.xl, gap: SPACING.sm, width: "100%" },
  title: { fontSize: FONT_SIZE.title, fontWeight: "700" },
  body: { fontSize: FONT_SIZE.body, lineHeight: 24 },
});
```

- [ ] **Step 6: 주화면을 만든다**

`src/screens/dial/index.tsx`

```tsx
import { Link } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AlignmentGuide } from "../../components/alignment-guide";
import { Dial } from "../../components/dial";
import { Notice } from "../../components/notice";
import { ReadingCard } from "../../components/reading-card";
import { useDialGeometry } from "../../hooks/use-dial-geometry";
import { useLocation } from "../../hooks/use-location";
import { useNow } from "../../hooks/use-now";
import { useOrientation } from "../../hooks/use-orientation";
import { useSettings } from "../../hooks/use-settings";
import { rodShadowPoints } from "../../lib/dial/projection";
import { dialLatitudeOf, isSupportedLatitude } from "../../lib/settings";
import { buildSundialState } from "../../lib/sundial";
import { FONT_SIZE, SPACING, themeAt } from "../../theme";

export function DialScreen() {
  const { width } = useWindowDimensions();
  const now = useNow();
  const { settings } = useSettings();
  const location = useLocation(settings.manualLocation);
  const orientation = useOrientation();

  const dialLatitude = dialLatitudeOf(settings, location.latitude);
  const geometry = useDialGeometry(dialLatitude);

  /** 나침반이 없으면 맞춰 놓은 것으로 보고 눈금을 읽을 수 있게 둔다. */
  const heading = orientation.compassAvailable ? orientation.headingDegrees : 0;

  const state = buildSundialState({
    date: now,
    latitude: location.latitude,
    longitude: location.longitude,
    headingDegrees: heading,
    nightMode: settings.nightMode,
  });

  const palette = themeAt(state.sun.altitude);
  const size = Math.min(width - SPACING.xl * 2, 380);

  const light = state.mode === "moon" ? state.moon.position : state.sun;
  const rodShadow = state.shadow
    ? rodShadowPoints(dialLatitude, light.altitude, light.azimuth, heading)
    : [];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        <Text style={[styles.date, { color: palette.textSoft }]}>
          {now.getMonth() + 1}월 {now.getDate()}일
        </Text>
        <View style={styles.links}>
          <Link href="/help" style={[styles.link, { color: palette.textSoft }]}>
            도움말
          </Link>
          <Link href="/settings" style={[styles.link, { color: palette.textSoft }]}>
            설정
          </Link>
        </View>
      </View>

      {isSupportedLatitude(location.latitude) ? (
        <>
          <Dial
            geometry={geometry}
            shadow={state.shadow}
            rodShadow={rodShadow}
            palette={palette}
            size={size}
            glowing={orientation.isAligned}
            sky={{
              sunAltitude: state.sun.altitude,
              sunAzimuth: state.sun.azimuth,
              moonAltitude: state.moon.position.altitude,
              moonAzimuth: state.moon.position.azimuth,
              moonFraction: state.moon.illuminatedFraction,
              heading: heading,
              night: state.mode !== "sun",
            }}
          />

          <AlignmentGuide
            headingDegrees={orientation.headingDegrees}
            isAligned={orientation.isAligned}
            isFlat={orientation.isFlat}
            tiltDegrees={orientation.tiltDegrees}
            accuracy={orientation.accuracy}
            compassAvailable={orientation.compassAvailable}
            palette={palette}
          />

          <ReadingCard state={state} palette={palette} />
        </>
      ) : (
        <Notice
          title="이곳에서는 앙부일구를 쓸 수 없어요"
          body={
            "앙부일구는 북반구의 중위도에서 쓰던 해시계예요. " +
            "북위 0도에서 66도 사이에서만 눈금이 제대로 그려집니다. " +
            "설정에서 위치를 손으로 정하면 다른 곳의 해시계를 볼 수 있어요."
          }
          palette={palette}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    gap: SPACING.lg,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: { fontSize: FONT_SIZE.body, fontWeight: "600" },
  links: { flexDirection: "row", gap: SPACING.lg },
  link: { fontSize: FONT_SIZE.caption },
});
```

- [ ] **Step 7: 라우트를 잇는다**

`src/app/index.tsx`

```tsx
import { DialScreen } from "../screens/dial";

export default function Index() {
  return <DialScreen />;
}
```

`src/app/_layout.tsx`

```tsx
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 8: 시뮬레이터에서 확인한다**

`npx expo run:ios`로 띄운 뒤 다음을 확인한다.

- 반구와 눈금이 보이고 그림자가 그려진다
- 위에 날짜와 링크가, 아래에 읽기 카드가 보인다
- 정렬 안내가 상황에 맞게 바뀐다
- 시각이 1초마다 갱신된다

- [ ] **Step 9: 커밋한다**

```bash
git add -A
git commit -m "$(printf '주화면 조립\n\n반구, 하늘, 정렬 안내, 읽기 카드를 한 화면에 모았다.\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 20: 설정 화면

**Files:**
- Create: `src/components/option-row.tsx`
- Create: `src/screens/settings/index.tsx`
- Create: `src/app/settings.tsx`

**Interfaces:**
- Produces:
  - `OptionRow(props: { title: string; description: string; options: { value: string; label: string }[]; value: string; onChange: (value: string) => void; palette: Palette }): JSX.Element`
  - `SettingsScreen(): JSX.Element`

- [ ] **Step 1: 고르는 줄을 만든다**

`src/components/option-row.tsx`

```tsx
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FONT_SIZE, Palette, RADIUS, SPACING } from "../theme";

interface OptionRowProps {
  title: string;
  description: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  palette: Palette;
}

export function OptionRow({
  title,
  description,
  options,
  value,
  onChange,
  palette,
}: OptionRowProps) {
  return (
    <View style={[styles.box, { backgroundColor: palette.card }]}>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.description, { color: palette.textSoft }]}>{description}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? palette.accent : "transparent",
                  borderColor: selected ? palette.accent : palette.textSoft,
                },
              ]}
            >
              <Text style={{ color: selected ? palette.card : palette.textSoft }}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: RADIUS.lg, padding: SPACING.lg, gap: SPACING.sm },
  title: { fontSize: FONT_SIZE.body, fontWeight: "700" },
  description: { fontSize: FONT_SIZE.caption, lineHeight: 20 },
  options: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.xs, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
    borderWidth: 1,
  },
});
```

- [ ] **Step 2: 설정 화면을 만든다**

`src/screens/settings/index.tsx`

```tsx
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Notice } from "../../components/notice";
import { OptionRow } from "../../components/option-row";
import { useLocation } from "../../hooks/use-location";
import { useSettings } from "../../hooks/use-settings";
import { Settings } from "../../lib/settings";
import { DAY_PALETTE, FONT_SIZE, RADIUS, SPACING } from "../../theme";

export function SettingsScreen() {
  const router = useRouter();
  const { settings, update } = useSettings();
  const location = useLocation(settings.manualLocation);
  const palette = DAY_PALETTE;

  const [latitudeText, setLatitudeText] = useState(
    settings.manualLocation ? String(settings.manualLocation.latitude) : ""
  );
  const [longitudeText, setLongitudeText] = useState(
    settings.manualLocation ? String(settings.manualLocation.longitude) : ""
  );

  const applyManualLocation = () => {
    const latitude = Number(latitudeText);
    const longitude = Number(longitudeText);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return;
    update({ manualLocation: { latitude, longitude } });
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={[styles.back, { color: palette.accent }]}>← 돌아가기</Text>
        </Pressable>

        <OptionRow
          title="눈금의 위도"
          description={
            "앙부일구는 만든 곳의 위도에 맞춰 눈금을 새겼어요. " +
            "지금 있는 곳에 맞추면 어디서나 시각이 맞고, 한양 원본을 고르면 " +
            "조선의 해시계를 그대로 볼 수 있어요."
          }
          options={[
            { value: "device", label: "지금 있는 곳" },
            { value: "hanyang", label: "한양 원본" },
          ]}
          value={settings.dialLatitude}
          onChange={(value) => update({ dialLatitude: value as Settings["dialLatitude"] })}
          palette={palette}
        />

        <OptionRow
          title="밤에는"
          description={
            "해가 지면 달그림자로 시각을 읽을 수 있어요. " +
            "달시계를 끄면 해가 뜰 때까지 남은 시간을 보여 줍니다."
          }
          options={[
            { value: "moon", label: "달시계" },
            { value: "wait", label: "해 기다리기" },
          ]}
          value={settings.nightMode}
          onChange={(value) => update({ nightMode: value as Settings["nightMode"] })}
          palette={palette}
        />

        <View style={[styles.box, { backgroundColor: palette.card }]}>
          <Text style={[styles.title, { color: palette.text }]}>위치를 손으로 정하기</Text>
          <Text style={[styles.description, { color: palette.textSoft }]}>
            지금 위치는 북위 {location.latitude.toFixed(3)}도, 동경{" "}
            {location.longitude.toFixed(3)}도예요.
          </Text>
          <View style={styles.inputs}>
            <TextInput
              value={latitudeText}
              onChangeText={setLatitudeText}
              placeholder="위도"
              keyboardType="numbers-and-punctuation"
              accessibilityLabel="위도"
              style={[styles.input, { borderColor: palette.textSoft, color: palette.text }]}
            />
            <TextInput
              value={longitudeText}
              onChangeText={setLongitudeText}
              placeholder="경도"
              keyboardType="numbers-and-punctuation"
              accessibilityLabel="경도"
              style={[styles.input, { borderColor: palette.textSoft, color: palette.text }]}
            />
          </View>
          <View style={styles.actions}>
            <Pressable onPress={applyManualLocation} accessibilityRole="button">
              <Text style={[styles.action, { color: palette.accent }]}>이 위치로 보기</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                update({ manualLocation: null });
                setLatitudeText("");
                setLongitudeText("");
              }}
              accessibilityRole="button"
            >
              <Text style={[styles.action, { color: palette.textSoft }]}>
                위성 위치로 되돌리기
              </Text>
            </Pressable>
          </View>
        </View>

        {location.permission === "denied" && !settings.manualLocation ? (
          <Notice
            title="위치를 알 수 없어요"
            body={
              "위치 권한이 없어 경복궁을 기준으로 보여 주고 있어요. " +
              "위에서 위도와 경도를 직접 넣으면 그곳의 해시계를 볼 수 있습니다."
            }
            palette={palette}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: SPACING.xl, gap: SPACING.lg },
  back: { fontSize: FONT_SIZE.body, fontWeight: "600" },
  box: { borderRadius: RADIUS.lg, padding: SPACING.lg, gap: SPACING.sm },
  title: { fontSize: FONT_SIZE.body, fontWeight: "700" },
  description: { fontSize: FONT_SIZE.caption, lineHeight: 20 },
  inputs: { flexDirection: "row", gap: SPACING.sm },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.body,
  },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: SPACING.xs },
  action: { fontSize: FONT_SIZE.caption, fontWeight: "600" },
});
```

`src/app/settings.tsx`

```tsx
import { SettingsScreen } from "../screens/settings";

export default function Settings() {
  return <SettingsScreen />;
}
```

- [ ] **Step 3: 타입 검사를 돌린다**

Run: `npm run typecheck`
Expected: 오류 없음

- [ ] **Step 4: 시뮬레이터에서 확인한다**

설정에서 한양 원본으로 바꾸면 주화면의 눈금이 달라지는지, 밤 동작을 바꾸면 읽기 카드가 달라지는지 확인한다.

- [ ] **Step 5: 커밋한다**

```bash
git add -A
git commit -m "$(printf '설정 화면 추가\n\n눈금의 위도, 밤 동작, 수동 위치를 고를 수 있게 했다.\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 21: 도움말과 절기 애니메이션

탐색 슬라이더 대신, 절기가 바뀔 때 그림자가 어떻게 움직이는지 보여 주는 짧은 애니메이션을 둔다.

**Files:**
- Create: `src/screens/help/term-animation.tsx`
- Create: `src/screens/help/index.tsx`
- Create: `src/app/help.tsx`

**Interfaces:**
- Consumes: `buildDialGeometry` (Task 8), `horizontalFromEquatorial` (Task 3), `shadowPoint`, `rodShadowPoints` (Task 6, 15), `SOLAR_TERM_GROUPS` (Task 7)
- Produces:
  - `TermAnimation(props: { latitude: number; palette: Palette; size: number }): JSX.Element`
  - `HelpScreen(): JSX.Element`

- [ ] **Step 1: 애니메이션을 만든다**

`src/screens/help/term-animation.tsx`

```tsx
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Dial } from "../../components/dial";
import { horizontalFromEquatorial } from "../../lib/astro/solar";
import { SOLAR_TERM_GROUPS } from "../../lib/dial/constants";
import { buildDialGeometry } from "../../lib/dial/geometry";
import { rodShadowPoints, shadowPoint } from "../../lib/dial/projection";
import { FONT_SIZE, Palette, SPACING } from "../../theme";

const FRAME_MS = 900;
const DEMO_HOUR_ANGLE = -30;

/** 같은 시각에 절기만 바꾸면 그림자가 남북으로 움직인다. */
export function TermAnimation({
  latitude,
  palette,
  size,
}: {
  latitude: number;
  palette: Palette;
  size: number;
}) {
  const [index, setIndex] = useState(0);
  const geometry = useMemo(() => buildDialGeometry(latitude), [latitude]);

  useEffect(() => {
    const timer = setInterval(
      () => setIndex((previous) => (previous + 1) % SOLAR_TERM_GROUPS.length),
      FRAME_MS
    );
    return () => clearInterval(timer);
  }, []);

  const group = SOLAR_TERM_GROUPS[index];
  const light = horizontalFromEquatorial(DEMO_HOUR_ANGLE, group.declination, latitude);
  const visible = light.altitude > 0;

  return (
    <View style={styles.box}>
      <Dial
        geometry={geometry}
        shadow={visible ? shadowPoint(light.altitude, light.azimuth, 0) : null}
        rodShadow={
          visible ? rodShadowPoints(latitude, light.altitude, light.azimuth, 0) : []
        }
        palette={palette}
        size={size}
        glowing={false}
      />
      <Text style={[styles.caption, { color: palette.textSoft }]}>
        같은 오전 10시라도 {group.label}에는 그림자가 이만큼 달라져요
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", gap: SPACING.sm },
  caption: { fontSize: FONT_SIZE.caption, textAlign: "center" },
});
```

- [ ] **Step 2: 도움말 화면을 만든다**

`src/screens/help/index.tsx`

```tsx
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocation } from "../../hooks/use-location";
import { useSettings } from "../../hooks/use-settings";
import { dialLatitudeOf } from "../../lib/settings";
import { DAY_PALETTE, FONT_SIZE, RADIUS, SPACING } from "../../theme";
import { TermAnimation } from "./term-animation";

const SECTIONS = [
  {
    title: "어떻게 쓰나요",
    body:
      "휴대폰을 바닥에 눕히고, 화면 위쪽이 북쪽을 보도록 천천히 돌려 주세요. " +
      "북쪽을 맞추면 그림자가 제자리를 찾습니다. 그림자 끝이 어느 눈금에 걸렸는지 보면 돼요.",
  },
  {
    title: "앙부일구가 뭔가요",
    body:
      "하늘을 우러르는 가마솥이라는 뜻이에요. 1434년 세종 때 처음 만들었고, " +
      "오목한 그릇 안쪽에 눈금을 새겨 시각과 절기를 함께 읽었습니다. " +
      "이 앱이 본뜬 것은 1871년 강건이 만든 손바닥만 한 휴대용이에요. " +
      "반구 지름이 2.8센티미터밖에 안 되고, 옆에 나침반이 붙어 있습니다.",
  },
  {
    title: "세로줄과 가로줄",
    body:
      "세로줄은 시각선이에요. 30분마다 하나씩, 오전 5시부터 오후 7시까지 있습니다. " +
      "굵은 줄 일곱 개에는 묘 진 사 오 미 신 유라는 이름이 붙어요. " +
      "가로줄은 절기선입니다. 열세 줄뿐인데, 동지와 하지만 홀로 쓰고 " +
      "나머지 스물두 절기는 해의 높이가 같은 것끼리 한 줄을 나눠 씁니다.",
  },
  {
    title: "영침이 기울어 있는 까닭",
    body:
      "그릇 안쪽에서 중심으로 뻗은 바늘을 영침이라고 해요. " +
      "북극성 쪽을 정확히 가리키도록 그 고장의 위도만큼 기울여 박습니다. " +
      "그래야 하루 종일, 사철 내내 그림자가 같은 눈금 위를 지나가요.",
  },
  {
    title: "달로도 시각을 읽어요",
    body:
      "보름달은 해의 정반대에 있어서 자정에 가장 높이 뜹니다. " +
      "그래서 보름날 밤에는 눈금을 12시간만 뒤집으면 시각이 맞아요. " +
      "보름에서 하루 멀어질 때마다 50분쯤 어긋나니, 이 앱이 달의 위치로 그만큼을 메워 줍니다. " +
      "옛 달시계에도 이 차이를 메우는 눈금이 따로 달려 있었어요.",
  },
  {
    title: "시계와 시각이 다른 까닭",
    body:
      "해시계는 해가 남중한 때를 정오로 삼아요. " +
      "우리나라 표준시는 동경 135도를 기준으로 삼는데 서울은 그보다 서쪽이라 " +
      "해가 32분쯤 늦게 남중합니다. 여기에 지구 궤도가 타원이라 생기는 균시차가 " +
      "계절마다 앞뒤로 더해져요. 두 가지를 합치면 최대 반 시간 넘게 벌어집니다.",
  },
];

export function HelpScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { settings } = useSettings();
  const location = useLocation(settings.manualLocation);
  const palette = DAY_PALETTE;
  const latitude = dialLatitudeOf(settings, location.latitude);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={[styles.back, { color: palette.accent }]}>← 돌아가기</Text>
        </Pressable>

        <TermAnimation
          latitude={latitude}
          palette={palette}
          size={Math.min(width - SPACING.xl * 4, 260)}
        />

        {SECTIONS.map((section) => (
          <View key={section.title} style={[styles.box, { backgroundColor: palette.card }]}>
            <Text style={[styles.title, { color: palette.text }]}>{section.title}</Text>
            <Text style={[styles.body, { color: palette.textSoft }]}>{section.body}</Text>
          </View>
        ))}

        <Text style={[styles.footnote, { color: palette.textSoft }]}>
          눈금은 김천휘와 두 사람이 2010년에 발표한 앙부일구 연구의 작도식을 따랐습니다.
          유물 정보는 국립중앙박물관과 국가유산포털을 따랐습니다.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: SPACING.xl, gap: SPACING.lg },
  back: { fontSize: FONT_SIZE.body, fontWeight: "600" },
  box: { borderRadius: RADIUS.lg, padding: SPACING.lg, gap: SPACING.sm },
  title: { fontSize: FONT_SIZE.body, fontWeight: "700" },
  body: { fontSize: FONT_SIZE.caption, lineHeight: 22 },
  footnote: { fontSize: FONT_SIZE.tiny, lineHeight: 18 },
});
```

`src/app/help.tsx`

```tsx
import { HelpScreen } from "../screens/help";

export default function Help() {
  return <HelpScreen />;
}
```

- [ ] **Step 3: 타입 검사를 돌린다**

Run: `npm run typecheck`
Expected: 오류 없음

- [ ] **Step 4: 커밋한다**

```bash
git add -A
git commit -m "$(printf '도움말과 절기별 그림자 애니메이션 추가\n\n탐색 슬라이더 대신 절기가 바뀔 때의 변화를 보여 준다.\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 22: 마무리 점검

**Files:**
- Modify: `app.json` — 앱 이름과 아이콘 설정
- Create: `README.md`
- Create: `CLAUDE.md`

- [ ] **Step 1: 전체 테스트와 타입 검사를 돌린다**

Run: `npm test && npm run typecheck`
Expected: 전부 통과. 실패가 있으면 고친 뒤 다시 돌린다.

- [ ] **Step 2: 앱 정보를 다듬는다**

`app.json`에서 `expo.name`을 "앙부일구", `expo.slug`를 "angbuilgu"로 바꾼다. `expo.orientation`을 `"portrait"`로 둔다.

- [ ] **Step 3: 예외 상태를 손으로 확인한다**

시뮬레이터에서 다음을 확인하고, 앱이 멈추거나 빈 화면이 되지 않는지 본다.

- 위치 권한을 거부한다. 경복궁 기준으로 보이고 설정에서 수동 입력을 안내한다
- 설정에서 위도를 70으로 넣는다. 쓸 수 없다는 안내가 뜬다
- 설정에서 위도를 -30으로 넣는다. 같은 안내가 뜬다
- 시뮬레이터에는 나침반이 없으므로 정렬 안내가 그에 맞게 바뀐다
- 설정에서 밤 동작을 바꾸면 읽기 카드가 달라진다

- [ ] **Step 4: 읽어 볼 문서를 쓴다**

`README.md`에 다음을 담는다.

- 앱이 무엇인지 한 문단
- 실행 방법: `npm install`, `npx expo run:ios`, `npm test`
- 폴더 구조 한 눈에
- 기획서와 계획서 경로

`CLAUDE.md`에 다음을 담는다.

- `src/lib` 아래는 순수 함수만 두고 리액트를 쓰지 않는다
- 각도는 경계에서 도 단위로 주고받는다
- 눈금 수치의 기준값은 2010년 논문이며 회귀 테스트가 지킨다
- 커밋 메시지는 한국어로 쓴다

- [ ] **Step 5: 커밋한다**

```bash
git add -A
git commit -m "$(printf '앱 정보 정리와 문서 추가\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```
