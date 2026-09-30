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

## 밤에는 달시계다

- 시각선 하나에 이름이 둘이다. 해로 읽는 이름과, 열두 시간 떨어진 달로 읽는
  이름이다. 보름달이 해의 정반대에 있어서 같은 선이 두 시각을 가리킨다.
  밤에는 달 이름이 앞으로 나온다. 이렇게 해야 열두 지지가 모두 자리를 얻는다.
- 밤에는 오늘의 절기선 대신 달이 지나는 동심원 하나를 밝히고, 달이 떠 있는
  동안의 시각선만 또렷하게 긋는다. `buildMoonPath`와 `buildMoonLine`이 그것이다.
- 달그림자는 언제나 해그림자와 같은 쪽에 떨어진다. 달이 떠 있어야 그림자가
  지기 때문이다. 원반 아래쪽 절반은 해도 달도 닿지 않아 흐리게 둔다.
- 밤에는 그림자가 둘이다. 달이 실제로 드리운 그림자는 뒤에 흐리게 깔고,
  달이 보름달 자리(해의 정반대)에 있었다면 드리웠을 그림자를 앞에 또렷하게
  세운다. 뒤엣것이 `correctedShadow`/`correctedFlatTip`이고 실제 시각을
  가리킨다. 보름달 자리가 아직 지평선 아래면 반구에서는 `rodShadowToRim`으로
  그 시각선이 테두리에 닿는 데까지만 그린다.

## 알아 둘 것

- 반구는 휴대폰에 붙어 있다. 화면에서 돌지 않는다. 움직이는 것은 그림자뿐이다.
- 영침도 반구에 박혀 있다. 휴대폰을 돌려도 반구 기준으로 뿌리는 제자리다.
- 영침은 천구 북극을 향하므로 그림자는 언제나 그때의 시각선을 따라 뻗는다.
- 웹에서는 스킨의 그리기 모듈이 그래픽 엔진보다 먼저 읽히면 아무것도 그리지 못한다.
  `canvas-host.web.tsx`가 이 순서를 지킨다.
- 북쪽을 맞췄는지는 `trackAlignment`가 판정한다. 각도의 여유에 더해 잠깐
  머물러야 넘어간다. 맞춘 정도는 화면에서 `lit`(0~1) 숫자 하나로 흘러
  바탕색, 하늘의 빛무리와 별, 눈금판 테두리, 읽기 카드가 함께 옮겨 간다.
  전환 때 한 번 번쩍이는 연출은 두지 않는다. 맞춰 둔 동안 내내 달라야 한다.
- 12지 이름은 점이 아니라 구간이다. 펼친 원반은 이름이 앉는 바깥 고리를 시가
  갈리는 자리마다 끊어 열두 토막으로 그리고, 그림자가 걸린 토막을 밝힌다.
  반구는 두 경계선 사이 구역을 옅게 칠한다. 어느 시인지는 `dialMinutesOf`와
  `flatMinutesAt`이 그림자 자리에서 되읽는다. 방위가 어긋나면 진짜 시각과 다르다.
- 앱의 글은 "~다"로 끝나는 짧은 문장으로 쓴다. "~예요", "~습니다"를 쓰지 않는다.
- 설명은 줄글로 쓰지 않는다. `InfoBlock`(요약·목록·표·그림)으로 나눠 적고,
  그림은 `figures.tsx`의 도식을 쓴다. 한 토막은 한 가지만 말한다.

## 여백과 빛깔

- 여백은 빈 화면이 아니라 책장처럼 보여야 한다. 바탕에는 종이 결과 가장자리
  그늘(`backdrop`), 눈금판 상자 구석에는 잔가지(`lib/art/ornament.ts`), 해와 달
  고리 바깥에는 점 테와 北東南西, 눈금판과 카드 사이에는 장식 줄(`flourish`)이
  있다. 모두 옅고 가늘다. 더 보태고 싶으면 먼저 하나를 빼라.
- 밤빛과 낮빛 사이는 노을빛(`DUSK_PALETTE`)을 지난다. 곧장 섞으면 잿빛이 된다.

## 위젯과 대기화면

- 안드로이드에만 있다. `modules/angbuilgu-widget`의 코틀린이 셈하고 그린다. JS를
  깨우지 않는다. 설계는 `docs/superpowers/specs/2026-09-30-widget-standby-design.md`에 있다.
- 셈이 두 벌이다. 기준은 `src/lib/widget/moment.ts`고, 코틀린의 `Almanac`과
  `DialPalette`는 따라 적은 것이다. `src/lib`의 계산이나 `theme.ts`의 색을 고치면
  `vectors.test.ts`가 깨진다. 그때 기준값을 다시 뽑고 코틀린을 맞춘 뒤 코틀린 시험을 돌린다.
- 위젯은 언제나 북쪽을 맞춘 모습이다. 밤에는 실제 달이 아니라 보름달 자리의 그림자를
  세운다. 시계는 달이 졌다고 멈출 수 없다.
- 위젯은 위치를 묻지 않는다. 앱이 `useWidgetPlace`로 건넨 마지막 자리를 쓴다.
- 작을수록 덜 그린다. 모양은 `WidgetRenderer.shapeFor`가, 눈금의 자세함은
  `DialPainter.detailFor`가 정한다.
- 런처가 알려 주는 높이는 실제보다 크다. `HEIGHT_TRUST`만큼만 믿는다. 그대로 믿으면
  맞는 크기가 없다고 보고 엉뚱한 쪽의 모양을 고른다.
- 눈금판 옆에 글이 놓이는 모양은 눈금판을 그려 준 크기 그대로 둔다. 높이에 맞춰
  키우면 글이 밀려나 잘린다.
- 대기화면은 바탕이 언제나 어둡다. 눈금판 밖의 고리와 이름은 `OutsideInk`로 밝게 쓴다.
- 위젯 고르는 화면의 그림은 `./scripts/render-widget-previews.sh bundle`이 뽑는다.
  `drawable-nodpi`의 png를 손으로 고치지 않는다.
- 스토어에 올리는 차례는 `docs/superpowers/plans/2026-09-30-play-store-release.md`에 있다.

## 그림

- 아이콘과 스플래시는 `scripts/render_art.py`가 그린다. `assets`의 png를 직접
  고치지 말고 스크립트를 고친 뒤 `npm run render-art`로 다시 뽑는다.
- 안드로이드 12 이후의 시스템 첫 화면은 가운데 그림 하나뿐이다. 세로로 긴
  그림은 `src/components/opening.tsx`가 앱 안에서 띄운다.
- 12지 짐승은 코드로 그리지 않는다. 제미나이의 나노 바나나로 그린 원본이
  `art/zodiac/<짐승>.png`에 있고, `scripts/crop_zodiac.py`가 빛나는 원반 둘레만
  잘라 `assets/zodiac/<짐승>.jpg`로 뽑는다. jpg를 손으로 고치지 말고 스크립트를
  고친 뒤 다시 뽑는다. 쓴 프롬프트는 `art/zodiac/PROMPTS.md`에 있다.
- 열둘은 한 채팅에서 "같은 스타일, 같은 구도"로 이어 그려야 한 벌로 보인다.
  뼈대는 디모풍 그림책 일러스트, 연필과 수채 결, 둥근 단순한 형태, 작은 점 눈,
  왼쪽을 보는 옆모습, 이끼 둔덕, 꽃잎, 둘레는 평평한 #F3EBDD다. 사실적인 털과
  사진 같은 음영은 금지한다고 적어야 한다. 처음 것은 그렇게 적지 않아 사진처럼
  나왔다.

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

# 위젯의 코틀린 셈이 앱과 같은지 본다. 자바와 SDK 경로를 먼저 준다.
cd android && ./gradlew :angbuilgu-widget:testDebugUnitTest
# 앱의 계산을 고친 뒤 기준값을 다시 뽑는다.
UPDATE_WIDGET_VECTORS=1 npx jest src/lib/widget
# 위젯과 대기화면을 에뮬레이터에서 그려 widget-preview/에 받는다.
./scripts/render-widget-previews.sh
```

에뮬레이터는 안드로이드 36 arm64 이미지를 쓴다. 가상 기기 이름은
`angbuilgu_tall`이고 21대 9로 맞춰 두었다.
