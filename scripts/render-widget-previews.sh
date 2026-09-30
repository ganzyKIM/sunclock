#!/usr/bin/env bash
# 위젯과 대기화면을 에뮬레이터에서 그려 그림 파일로 받아 온다.
#
#   ./scripts/render-widget-previews.sh              지금 시각으로 그려 widget-preview/에 둔다
#   ./scripts/render-widget-previews.sh bundle       위젯 고르는 화면에 뜰 그림까지 갈아 끼운다
#   TIME=1790000000000 TAG=night ./scripts/render-widget-previews.sh    시각을 정해 그린다
#
# 앱이 깔린 에뮬레이터가 떠 있어야 한다. 그리는 도구는 밖에서 부를 수 없게
# 닫혀 있어서 관리자 권한으로 부른다. 실제 기기에서는 되지 않는다.

set -euo pipefail

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$ANDROID_HOME/platform-tools:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PACKAGE="com.dobedub.angbuilgu"
RECEIVER="$PACKAGE/$PACKAGE.widget.PreviewReceiver"
REMOTE="/sdcard/Android/data/$PACKAGE/files/previews"
OUT="${OUT:-$ROOT/widget-preview}"
TAG="${TAG:-now}"

adb root >/dev/null
adb wait-for-device

EXTRAS=(--es tag "$TAG")
[ -n "${TIME:-}" ] && EXTRAS+=(--es time "$TIME")
[ -n "${LAT:-}" ] && EXTRAS+=(--es lat "$LAT")
[ -n "${LON:-}" ] && EXTRAS+=(--es lon "$LON")

adb shell rm -rf "$REMOTE"
adb shell am broadcast -n "$RECEIVER" "${EXTRAS[@]}" >/dev/null

# 그리는 데 잠깐 걸린다. 마지막 그림이 나올 때까지 기다린다.
for _ in $(seq 1 20); do
  adb shell ls "$REMOTE/standby-portrait-$TAG.png" >/dev/null 2>&1 && break
  sleep 0.5
done

mkdir -p "$OUT"
adb pull "$REMOTE/." "$OUT" >/dev/null
echo "그림을 받아 왔습니다: $OUT"
ls "$OUT" | sed 's/^/  /'

if [ "${1:-}" = "bundle" ]; then
  RES="$ROOT/modules/angbuilgu-widget/android/src/main/res/drawable-nodpi"
  mkdir -p "$RES"
  cp "$OUT/small-$TAG.png" "$RES/angbuilgu_widget_preview_small.png"
  cp "$OUT/wide-$TAG.png" "$RES/angbuilgu_widget_preview_wide.png"
  cp "$OUT/standby-landscape-$TAG.png" "$RES/angbuilgu_standby_preview.png"
  # 화면 보호기 고르는 화면에는 작게 뜬다. 제 크기로 담으면 앱만 무거워진다.
  sips -Z 1050 "$RES/angbuilgu_standby_preview.png" >/dev/null
  echo "위젯 고르는 화면의 그림을 갈아 끼웠습니다. 다시 빌드해야 앱에 담깁니다."
fi
