# 구글 플레이 출시 계획

작성일: 2026-09-30. 정책은 이날 구글의 공식 문서에서 확인했다. 출처는 맨 아래에 있다.

**목표:** 앙부일구 1.0.0을 구글 플레이에 올린다.

**가장 오래 걸리는 것:** 개인 개발자 계정은 테스터 12명이 14일 동안 이어서 참여한
비공개 테스트를 마쳐야 공개 출시를 신청할 수 있다. 빨라야 3~4주다. 테스터 모으기를
먼저 시작한다.

## 1. 지금 상태

2026-09-30의 릴리스 APK를 뜯어 확인했다.

| 항목 | 플레이의 요구 | 지금 | 할 일 |
| --- | --- | --- | --- |
| 대상 API | 2026-08-31부터 36 이상 | 36 | 없음 |
| 16KB 페이지 | 네이티브 코드가 16KB 정렬 | `zipalign -P 16` 통과, `.so` 22개 모두 통과 | 없음 |
| 64비트 | arm64 포함 | arm64뿐 | 3.4 |
| 올리는 형식 | AAB | APK만 만든다 | 3.4 |
| 서명 | 업로드 키 | 디버그 키로 서명한다 | 3.2 |
| 버전 코드 | 올릴 때마다 증가 | 1로 고정 | 3.3 |
| 권한 | 쓰는 것만 | 안 쓰는 것이 다섯 | 3.1 |
| 개인정보처리방침 | 콘솔과 앱 안 양쪽에 | 없다 | 3.5 |

## 2. 직접 해야 하는 일

계정과 돈, 신원이 걸려 있어 대신 할 수 없다.

1. **개발자 계정을 만든다.** play.google.com/console 에서 개인 계정으로 등록한다.
   등록비는 한 번 25달러다. 법적 이름의 신분증과 카드가 필요하다.
2. **기기를 확인한다.** 새 개인 계정은 휴대폰의 Play Console 앱으로 안드로이드 기기를
   갖고 있음을 확인해야 한다.
3. **테스터 12명을 모은다.** 구글 계정의 이메일 주소가 필요하다. 14일 동안 빠지면 안
   되므로 넉넉히 15명쯤 모은다.
4. **개인정보처리방침을 올릴 주소를 정한다.** 누구나 열 수 있는 웹 주소여야 하고 PDF는
   안 된다. 앱 저장소가 비공개라 깃허브 페이지를 쓰려면 공개 저장소를 하나 따로 둔다.
5. **스토어에 보일 연락처 이메일을 정한다.**
6. **업로드 키의 비밀번호를 정하고 보관한다.** 키 파일과 비밀번호는 저장소에 넣지 않는다.

## 3. 코드에서 할 일

### 3.1 안 쓰는 권한을 뺀다

지금 APK에 든 권한과 그 쓰임이다.

| 권한 | 어디서 왔나 | 쓰나 |
| --- | --- | --- |
| `ACCESS_COARSE_LOCATION` | expo-location | 쓴다. 해 위치를 셈한다 |
| `ACCESS_FINE_LOCATION` | expo-location | 없어도 된다. 대략의 위치로도 시각 오차가 몇 초다 |
| `INTERNET` | 리액트 네이티브 | 개발 때만 쓴다. 남겨 둔다 |
| `ACTIVITY_RECOGNITION` | expo-sensors의 만보계 | 안 쓴다. 신체 활동 권한이라 검수에서 물을 수 있다 |
| `SYSTEM_ALERT_WINDOW` | 개발용 | 안 쓴다 |
| `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` | 템플릿 | 안 쓴다 |
| `VIBRATE` | 템플릿 | 안 쓴다 |

`app.json`의 `android`에 더한다.

```json
"blockedPermissions": [
  "android.permission.ACTIVITY_RECOGNITION",
  "android.permission.SYSTEM_ALERT_WINDOW",
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  "android.permission.VIBRATE",
  "android.permission.ACCESS_FINE_LOCATION"
]
```

확인: 다시 빌드한 뒤 아래 명령에 위치(대략)와 인터넷만 남는지 본다. 에뮬레이터에서
위치를 허락했을 때 그림자가 그대로 맞는지도 본다.

```bash
$ANDROID_HOME/build-tools/36.0.0/aapt2 dump permissions android/app/build/outputs/apk/release/app-release.apk
```

### 3.2 업로드 키로 서명한다

키를 만든다. 한 번만 한다. 묻는 비밀번호는 2.6에서 정한 것이다.

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore ~/.android/angbuilgu-upload.jks \
  -alias angbuilgu -keyalg RSA -keysize 2048 -validity 10000
```

`~/.gradle/gradle.properties`에 적는다. 이 파일은 저장소 밖에 있다.

```
ANGBUILGU_UPLOAD_STORE_FILE=/Users/dobedub/.android/angbuilgu-upload.jks
ANGBUILGU_UPLOAD_KEY_ALIAS=angbuilgu
ANGBUILGU_UPLOAD_STORE_PASSWORD=...
ANGBUILGU_UPLOAD_KEY_PASSWORD=...
```

`android` 폴더는 `prebuild` 때마다 새로 생기므로 서명 설정을 손으로 고치면 사라진다.
`plugins/with-release-signing.js`를 만들어 `app.json`의 `plugins`에 넣는다.

```js
const { withAppBuildGradle } = require("expo/config-plugins");

/** prebuild가 android 폴더를 새로 만들 때마다 릴리스 서명을 업로드 키로 바꿔 끼운다. */
module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    let gradle = mod.modResults.contents;
    if (gradle.includes("ANGBUILGU_UPLOAD_STORE_FILE")) return mod;

    gradle = gradle.replace(
      "signingConfigs {",
      `signingConfigs {
        release {
            if (project.hasProperty('ANGBUILGU_UPLOAD_STORE_FILE')) {
                storeFile file(ANGBUILGU_UPLOAD_STORE_FILE)
                storePassword ANGBUILGU_UPLOAD_STORE_PASSWORD
                keyAlias ANGBUILGU_UPLOAD_KEY_ALIAS
                keyPassword ANGBUILGU_UPLOAD_KEY_PASSWORD
            }
        }`
    );
    // 키가 없는 기기에서는 지금처럼 디버그 키로 서명해 시험용 APK를 만든다.
    gradle = gradle.replace(
      /(release \{[^}]*?)signingConfig signingConfigs\.debug/,
      "$1signingConfig project.hasProperty('ANGBUILGU_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug"
    );

    mod.modResults.contents = gradle;
    return mod;
  });
};
```

확인: 번들을 만든 뒤 서명한 이가 디버그 키가 아닌지 본다.

```bash
keytool -printcert -jarfile android/app/build/outputs/bundle/release/app-release.aab | grep Owner
```

플레이 앱 서명은 기본으로 켜져 있다. 구글이 배포용 키를 쥐고, 우리는 업로드 키만
쥔다. 업로드 키를 잃어도 다시 받을 수 있다.

### 3.3 버전을 올린다

`app.json`에 `"android": { "versionCode": 1 }`을 적고, 플레이에 올릴 때마다 1씩 올린다.
같은 번호는 두 번 올릴 수 없다. `version`은 사람에게 보이는 이름이고 1.0.0으로 시작한다.

### 3.4 AAB를 만든다

플레이는 기기에 맞는 조각만 내려 주므로 번들에는 32비트도 함께 담는다. 받는 크기는
늘지 않는다. 시험용 APK는 지금처럼 arm64만 담는다.

```bash
npx expo prebuild --platform android --clean
sed -i '' 's/^reactNativeArchitectures=.*/reactNativeArchitectures=arm64-v8a,armeabi-v7a/' android/gradle.properties
cd android && ./gradlew bundleRelease
# 나오는 곳: android/app/build/outputs/bundle/release/app-release.aab
```

확인: 16KB 정렬이 번들에서도 맞는지 본다.

```bash
bundletool dump config --bundle=android/app/build/outputs/bundle/release/app-release.aab | grep -i alignment
```

EAS로 빌드하고 올리는 길도 있다. 서명과 버전 코드를 대신 맡아 주지만 계정이 하나 더
필요하고 빌드가 클라우드에서 돈다. 지금은 이 맥에서 빌드가 되므로 위의 길로 간다.
올리는 것까지 자동으로 하고 싶어지면 그때 옮긴다.

### 3.5 개인정보처리방침

플레이는 모든 앱에 요구한다. 콘솔에 주소를 적고, 앱 안에서도 열 수 있어야 한다.

적을 내용이다.

- 앱 이름과 만든 이, 문의할 이메일
- 위치를 읽는다. 해와 달의 위치를 셈하는 데만 쓴다
- 위치는 기기 밖으로 나가지 않는다. 서버가 없다
- 위젯을 위해 마지막 위치를 기기 안에 적어 둔다. 앱을 지우면 함께 지워진다
- 나침반과 기울기 센서를 읽는다. 저장하지 않는다
- 광고도, 분석 도구도, 계정도 없다

앱에서는 설정 화면 맨 아래에 "개인정보처리방침" 줄을 두고 그 주소를 연다.

### 3.6 스토어에 올릴 그림

| 그림 | 규격 | 만드는 법 |
| --- | --- | --- |
| 앱 아이콘 | 512 × 512 PNG | `scripts/render_art.py`에 크기를 하나 더한다 |
| 그래픽 이미지 | 1024 × 500 | `scripts/render_art.py`에 더한다. 쪽빛 바탕에 눈금판과 이름 |
| 휴대폰 스크린샷 | 2~8장, 긴 변이 짧은 변의 두 배 이하 | 에뮬레이터에서 찍는다 |

스크린샷은 다섯 장을 찍는다. 낮의 눈금판, 북쪽을 맞춘 밤의 달시계, 12지 설명, 홈 화면의
위젯, 대기화면이다. 지금 에뮬레이터는 21대 9라 비율이 규격을 넘는다. 갤럭시 비율의
가상 기기(`AVD=angbuilgu_galaxy`)로 찍는다.

### 3.7 스토어에 올릴 글

| 칸 | 한도 | 초안 |
| --- | --- | --- |
| 앱 이름 | 30자 | 앙부일구 - 해시계와 달시계 |
| 간단한 설명 | 80자 | 휴대폰을 눕히고 북쪽을 맞추면 그림자가 시각을 가리킨다. 조선의 해시계를 되살렸다. |
| 자세한 설명 | 4000자 | README의 첫 세 단락과 "만든 것"을 옮기고 위젯과 대기화면을 더한다 |

언어는 한국어 하나로 올린다. 분류는 도구다.

## 4. 올리기 전 시험

### 4.1 자동으로 도는 것

```bash
npm test && npm run typecheck
cd android && ./gradlew :angbuilgu-widget:testDebugUnitTest
```

### 4.2 실제 기기에서 볼 것

- [ ] 위치를 허락했을 때와 거절했을 때 둘 다 눈금판이 뜬다
- [ ] 북쪽을 맞추면 읽기 카드에 시각이 뜬다. 나침반이 떨지 않는다
- [ ] 밤에 달시계로 바뀌고 그림자가 둘 선다
- [ ] 설정에서 작은 위젯과 넓은 위젯이 놓인다
- [ ] 위젯을 가장 작게 줄여도 글이 잘리지 않는다. 가장 크게 늘이면 열두 이름이 뜬다
- [ ] 위젯의 시계 숫자가 분마다 넘어간다. 눈금판이 5분 안에 따라온다
- [ ] 기기를 껐다 켠 뒤에도 위젯이 뜨고 갱신된다
- [ ] 화면 보호기에서 앙부일구를 골라 충전기에 꽂으면 대기화면이 뜬다. 가로로 눕혀도 맞다
- [ ] 글자 크기를 가장 크게 해도 읽기 카드와 위젯이 깨지지 않는다
- [ ] 비행기 모드에서도 다 된다

삼성 기기가 있으면 거기서도 위젯을 본다. 런처마다 알려 주는 크기가 다르다.

### 4.3 플레이가 해 주는 것

내부 테스트에 올리면 사전 출시 보고서가 나온다. 여러 기기에서 앱을 띄워 보고 충돌과
접근성 문제를 알려 준다. 공개 전에 꼭 읽는다.

## 5. 플레이 콘솔에서 할 일

차례대로 한다.

1. **앱을 만든다.** 이름, 기본 언어 한국어, 앱, 무료.
2. **내부 테스트에 AAB를 올린다.** 검수 없이 바로 깔린다. 내 기기로 먼저 본다.
3. **앱 콘텐츠를 채운다.**

   | 물음 | 답 |
   | --- | --- |
   | 개인정보처리방침 | 3.5의 주소 |
   | 광고 | 없음 |
   | 앱 액세스 | 제한 없음. 로그인이 없다 |
   | 콘텐츠 등급 | 설문에 답한다. 폭력도 대화도 구매도 없다 |
   | 타겟 연령 | 13세 이상. 어린이를 겨냥하지 않는다 |
   | 데이터 보안 | 수집하지 않음, 공유하지 않음 |
   | 정부·금융·건강 앱 | 아님 |

   데이터 보안에서 "수집"은 기기 밖으로 보내는 것을 뜻한다. 위치를 기기 안에서만
   쓰므로 수집이 아니다.
4. **스토어 등록정보를 채운다.** 3.6의 그림과 3.7의 글.
5. **비공개 테스트를 연다.** 테스터 이메일을 목록에 넣고 참여 링크를 보낸다.
   12명이 참여한 날부터 14일을 센다.
6. **공개 출시를 신청한다.** 테스트를 어떻게 했고 무엇을 고쳤는지 묻는다. 검토는
   대개 7일 안에 끝난다.
7. **단계적으로 연다.** 20퍼센트로 시작해 충돌이 없으면 100퍼센트로 넓힌다.

## 6. 일정

| 주 | 하는 일 |
| --- | --- |
| 첫 주 | 계정 등록과 확인, 3장의 코드 준비, 내부 테스트, 비공개 테스트 시작 |
| 둘째·셋째 주 | 비공개 테스트 14일. 테스터의 말을 듣고 고친다 |
| 넷째 주 | 공개 출시 신청과 검토, 앱 검수, 출시 |

## 7. 걸릴 만한 것

- **테스터가 빠진다.** 12명 아래로 내려가면 날짜를 다시 센다. 15명으로 시작한다.
- **위젯이 멈춘다.** 삼성과 샤오미는 배터리를 아끼느라 뒤의 알람을 늦춘다. 시계 숫자는
  그래도 맞고, 눈금판은 시스템의 30분 갱신이 받쳐 준다. 테스터에게 물어본다.
- **위치 권한을 묻는다.** 검수에서 왜 필요한지 물으면 해 위치 계산이라고 답한다.
  앞에서만 쓰고 뒤에서는 쓰지 않으므로 따로 신고할 것은 없다.
- **업로드 키를 잃는다.** 플레이 앱 서명을 쓰므로 콘솔에서 다시 받을 수 있다.

## 출처

- 개인 계정의 테스트 요건: https://support.google.com/googleplay/android-developer/answer/14151465
- 대상 API 수준: https://support.google.com/googleplay/android-developer/answer/11926878
- 16KB 페이지: https://developer.android.com/guide/practices/page-sizes
- 사용자 데이터 정책: https://support.google.com/googleplay/android-developer/answer/10144311
- 데이터 보안 양식: https://support.google.com/googleplay/android-developer/answer/10787469
- 개발자 계정: https://support.google.com/googleplay/android-developer/answer/6112435
- 잠금 화면 위젯: https://android-developers.googleblog.com/2025/03/widgets-on-lock-screen-faq.html
