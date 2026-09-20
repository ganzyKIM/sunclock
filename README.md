# 앙부일구

조선의 휴대용 앙부일구를 휴대폰에서 실제로 작동하는 해시계로 되살린 앱이다.
휴대폰을 바닥에 눕히고 남북을 맞추면, 화면 속 오목한 반구에 그림자가 떨어진다.
그림자 끝이 걸린 눈금을 읽으면 그때의 시각과 절기를 알 수 있다.

기준으로 삼은 유물은 보물 852호다. 1871년 강건이 만든 손바닥만 한 석재 해시계로,
반구 지름이 2.8센티미터이고 옆에 나침반이 붙어 있다. 국립중앙박물관에 있다.

## 눈금을 어떻게 보여 주나

기본은 **펼친 원반**이다. 영침이 천구 북극을 향하므로, 그 축에서 내려다보면
영침은 한가운데 점이 되고 시각선이 사방으로 뻗는다. 절기선은 동심원이 된다.
오목한 반구는 아래쪽 절반이 늘 비고 입체감 때문에 눈금이 서로 가렸는데,
펼치면 눈금이 고르게 퍼져 한눈에 들어온다. 같은 값을 다르게 옮긴 것이라
읽는 시각은 똑같다.

열두 시를 모두 새겨 원을 한 바퀴 두르고, 해가 떠 있을 수 있는 구간만
또렷하게 긋는다. 그래서 동그란 줄의 또렷한 길이가 그날 낮의 길이다.
밤에는 달그림자가 아래쪽 절반을 쓴다.

실제 유물의 오목한 모습은 설정에서 볼 수 있다.

## 만든 것

- 위치와 시각으로 태양 위치를 구해 그림자를 실시간으로 그린다
- 나침반으로 남북을 맞추는 물리적 정렬. 방향이 틀리면 그림자도 틀린 눈금을 가리킨다
- 사용자 위도에 맞춰 눈금을 다시 만든다. 설정에서 한양 원본 눈금으로 바꿀 수 있다
- 전통 시각(96각법), 진태양시, 표준시를 함께 보여 준다
- 밤에는 달그림자로 시각을 읽는다. 보름달을 기준으로 12시간을 뒤집고 달의 나이만큼 보정한다
- 눈금과 용어를 누르면 설명이 열린다

## 실행

```bash
npm install
npx expo start          # 개발 서버
npx expo run:ios        # 아이폰 시뮬레이터 (Xcode 필요)
npm test                # 단위 테스트
npm run typecheck       # 타입 검사
npm run render-dial     # 눈금을 SVG로 뽑아 눈으로 확인
npm run render-art      # 아이콘과 스플래시를 다시 그린다
```

안드로이드 APK를 만들려면 안드로이드 SDK와 자바 17이 필요하다.

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
npx expo prebuild --platform android --clean

# 요즘 기기는 arm64뿐이다. 네 계열을 다 담으면 144MB, arm64만 담으면 54MB가 된다.
# android 폴더는 저장소에 없으므로 prebuild 뒤에 매번 고쳐야 한다.
sed -i '' 's/^reactNativeArchitectures=.*/reactNativeArchitectures=arm64-v8a/' android/gradle.properties

cd android && ./gradlew assembleRelease
```

만든 APK를 휴대폰으로 옮기려면, 같은 와이파이에서 잠깐 열어 두면 된다.

```bash
./scripts/serve-apk.sh
```

실제 기기가 없을 때는 에뮬레이터로 확인한다. 처음 실행하면 가상 기기를
만들고 띄운다. `install`을 붙이면 APK까지 넣고 앱을 실행한다.

```bash
./scripts/setup-emulator.sh install
```

가상 기기는 21대 9로 맞춰 두었다. 시험 기기인 엑스페리아 1 마크5와 같은
비율이다. 갤럭시 비율로 보려면 `AVD` 이름을 바꿔 한 대 더 만든다.

```bash
AVD=angbuilgu_galaxy ./scripts/setup-emulator.sh
```

웹으로 보려면 `npx expo start --web`을 쓴다. 웹에서는 스킨이 쓰는 그래픽 엔진을
`public/canvaskit.wasm`에서 내려받는다.

## 아이콘과 스플래시

`scripts/render_art.py`가 그린다. 눈금 좌표는 앱의 계산 코드에서 뽑은 것을
그대로 쓰므로, 아이콘의 눈금은 화면에 뜨는 눈금과 같은 곡선이다.
디자인 방향은 `docs/design/2026-09-20-quiet-instrument.md`에 적었다.

안드로이드 12부터 시스템 첫 화면은 가운데 그림 하나만 보여 준다.
그래서 시스템에는 정사각 그림을 주고, 세로로 긴 그림은 앱이 직접 띄운 뒤
천천히 걷어 낸다.

## 폴더

```
src/
  app/          라우트만 둔다
  screens/      화면 본체 (주화면, 설정, 도움말)
  components/   반구, 읽기 카드, 정렬 안내, 툴팁
  hooks/        센서, 위치, 설정, 시계
  lib/          순수 계산. 리액트를 쓰지 않고 테스트로 전부 덮는다
    astro/      율리우스일, 태양, 달
    dial/       24절기 상수, 투영, 눈금 기하
    time/       96각법, 표준시, 달시계 읽기
    placement/  각도와 평활
  theme.ts      해 높이에 따라 물드는 색
```

## 눈금이 맞는지

한양 위도로 계산한 값이 2010년 논문의 실측 도면 수치와 맞는다. 회귀 테스트가 이를 지킨다.

| 항목 | 계산값 | 논문값 |
| --- | --- | --- |
| 남쪽 가장자리에서 영침 뿌리까지 | 지름의 0.1041 | 0.104 |
| 남쪽 가장자리에서 하지선까지 | 지름의 0.6228 | 0.623 |
| 남쪽 가장자리에서 동지선까지 | 지름의 0.9377 | 0.938 |

태양 위치는 astronomy-engine을 기준으로 0.15도 안에서 맞고, 달은 0.5도 안에서 맞는다.

## 문서

- 기획서: `docs/superpowers/specs/2026-09-18-angbuilgu-app-design.md`
- 구현 계획: `docs/superpowers/plans/2026-09-18-angbuilgu-app.md`

## 참고

- 국립중앙박물관, 국가유산포털의 보물 852호 소장품 정보
- 김천휘 외, 2010, 한국우주과학회지 27권 2호 161쪽. 절기선과 시각선 작도식
- 민병희 외, 2025, Journal of Astronomical History and Heritage 28권 2호 439쪽
