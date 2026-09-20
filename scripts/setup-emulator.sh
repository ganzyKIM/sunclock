#!/usr/bin/env bash
# 안드로이드 에뮬레이터를 세우고 앙부일구를 띄운다.
#
#   ./scripts/setup-emulator.sh            가상 기기를 만들고 띄운다
#   ./scripts/setup-emulator.sh install    띄운 뒤 APK까지 설치한다
#
# 시험 기기가 엑스페리아 1 마크5라 21대 9로 맞춰 둔다.
# 갤럭시 비율로 보려면 AVD 이름을 바꿔 두 대를 만들어 쓴다.

set -euo pipefail

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

AVD="${AVD:-angbuilgu_tall}"
IMAGE="${IMAGE:-system-images;android-36;google_apis;arm64-v8a}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# 내려받다 만 이미지는 폴더만 있고 알맹이가 없다. 폴더 존재만 보면 속는다.
IMAGE_DIR="$ANDROID_HOME/system-images/${IMAGE//;//}"
if [ ! -f "$IMAGE_DIR/system.img" ] && [ ! -f "$IMAGE_DIR/userdata.img" ]; then
  echo "시스템 이미지가 없습니다. 먼저 받으세요:"
  echo "  sdkmanager --sdk_root=\"$ANDROID_HOME\" \"$IMAGE\""
  exit 1
fi

if ! avdmanager list avd 2>/dev/null | grep -q "Name: $AVD"; then
  echo "가상 기기를 만듭니다: $AVD"
  echo "no" | avdmanager create avd --name "$AVD" --package "$IMAGE" --device "pixel_7" --force >/dev/null

  CONFIG="$HOME/.android/avd/$AVD.avd/config.ini"
  # 엑스페리아 1 마크5와 같은 21대 9. 실제 화소는 1644x3840이지만
  # 에뮬레이터에서는 절반으로 줄여도 비율과 밀도 관계가 같다.
  {
    echo "hw.lcd.width=822"
    echo "hw.lcd.height=1920"
    echo "hw.lcd.density=420"
    echo "hw.keyboard=yes"
    echo "hw.gpu.enabled=yes"
    echo "hw.gpu.mode=auto"
    echo "disk.dataPartition.size=4096M"
  } >> "$CONFIG"
else
  echo "가상 기기가 이미 있습니다: $AVD"
fi

if ! adb devices | grep -q "emulator-.*device"; then
  echo "에뮬레이터를 띄웁니다..."
  nohup emulator -avd "$AVD" -no-snapshot-load -gpu auto >/tmp/angbuilgu-emulator.log 2>&1 &
  adb wait-for-device
  until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do sleep 2; done
  echo "부팅이 끝났습니다."
fi

if [ "${1:-}" = "install" ]; then
  APK="$ROOT/android/app/build/outputs/apk/release/app-release.apk"
  [ -f "$APK" ] || { echo "APK가 없습니다. 먼저 빌드하세요."; exit 1; }
  echo "설치합니다..."
  adb install -r "$APK"
  adb shell monkey -p com.dobedub.angbuilgu -c android.intent.category.LAUNCHER 1 >/dev/null
  echo "앙부일구를 띄웠습니다."
fi
