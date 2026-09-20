# 앙부일구 앱

조선의 휴대용 앙부일구를 되살린 리액트 네이티브 엑스포 앱이다.
배경과 결정은 `docs/superpowers/specs/2026-09-18-angbuilgu-app-design.md`에 있다.

## 지켜야 할 것

- `src/lib` 아래는 순수 함수만 둔다. 리액트, 리액트 네이티브, 엑스포를 import 하지 않는다.
- 각도는 함수 경계에서 항상 도 단위로 주고받는다. 라디안은 함수 안에서만 쓴다.
- 방위각은 북쪽이 0도이고 동쪽으로 증가한다.
- 세상 좌표는 x가 동쪽, y가 북쪽, z가 천정이다.
- 화면 좌표는 중심이 원점이고 반지름이 1인 원판이다. 화면 위쪽이 반구의 북쪽이다.
- 테스트 파일은 대상 파일 옆에 둔다.
- 커밋 메시지는 한국어로 쓴다.

## 건드리면 안 되는 수치

`src/lib/dial/geometry.test.ts`의 세 기준값은 2010년 논문의 실측 도면에서 왔다.
영침 뿌리 0.1045, 하지선 0.6227, 동지선 0.9376이다. 이 값이 깨지면 눈금이
실물과 달라진 것이므로, 테스트를 고치지 말고 코드를 의심해야 한다.

## 두 가지 보기

- `src/lib/dial/flat.ts`가 기본인 펼친 원반, `src/lib/dial/geometry.ts`가
  원래의 오목한 반구다. 둘은 같은 값을 다르게 옮긴 것이다.
- 펼친 원반에서 각도는 시간각이고 반지름은 적위다. 눈금의 자리는 위도와
  무관하다. 위도가 바꾸는 것은 또렷하게 그은 구간의 길이, 곧 낮의 길이뿐이다.
- 달은 적위가 태양보다 넓어 눈금을 벗어난다. `radiusFor`가 안팎 끝으로
  붙이지 않으면 바늘 끝이 가운데로 파고들어 보이지 않는다.

## 알아 둘 것

- 반구는 휴대폰에 붙어 있다. 화면에서 돌지 않는다. 움직이는 것은 그림자뿐이다.
- 영침도 반구에 박혀 있다. 휴대폰을 돌려도 반구 기준으로 뿌리는 제자리다.
- 영침은 천구 북극을 향하므로 그림자는 언제나 그때의 시각선을 따라 뻗는다.
- 웹에서는 스킨의 그리기 모듈이 그래픽 엔진보다 먼저 읽히면 아무것도 그리지 못한다.
  `canvas-host.web.tsx`가 이 순서를 지킨다.

## 그림

- 아이콘과 스플래시는 `scripts/render_art.py`가 그린다. `assets`의 png를 직접
  고치지 말고 스크립트를 고친 뒤 `npm run render-art`로 다시 뽑는다.
- 안드로이드 12 이후의 시스템 첫 화면은 가운데 그림 하나뿐이다. 세로로 긴
  그림은 `src/components/opening.tsx`가 앱 안에서 띄운다.

## 안드로이드 빌드

`/usr/libexec/java_home`은 홈브루로 깐 자바를 찾지 못한다. 경로를 직접 준다.

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
```

`android` 폴더는 저장소에 없다. `prebuild` 뒤에 `gradle.properties`의
`reactNativeArchitectures`를 `arm64-v8a`로 고쳐야 APK가 54MB로 나온다.
그대로 두면 144MB가 된다. 자세한 것은 README에 있다.

## 자주 쓰는 명령

```bash
npm test
npm run typecheck
npx expo start --web
npm run render-art
./scripts/setup-emulator.sh install
```

에뮬레이터는 안드로이드 36 arm64 이미지를 쓴다. 가상 기기 이름은
`angbuilgu_tall`이고 21대 9로 맞춰 두었다.
