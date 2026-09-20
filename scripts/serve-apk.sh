#!/usr/bin/env bash
# 같은 와이파이에 있는 휴대폰이 APK를 바로 받아 갈 수 있게 잠깐 열어 둔다.
#
#   ./scripts/serve-apk.sh
#
# 휴대폰 브라우저에서 아래에 뜨는 주소를 열면 내려받아 설치할 수 있다.
# 끝내려면 Ctrl+C를 누른다.

set -euo pipefail

APK="${1:-$(ls -t "$(dirname "$0")/../android/app/build/outputs/apk/release/"*.apk 2>/dev/null | head -1)}"
PORT="${PORT:-8000}"

if [ -z "${APK:-}" ] || [ ! -f "$APK" ]; then
  echo "APK를 찾지 못했습니다. 먼저 빌드하세요:"
  echo "  cd android && ./gradlew assembleRelease"
  exit 1
fi

DIR=$(mktemp -d)
cp "$APK" "$DIR/angbuilgu.apk"

IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")
if [ -z "$IP" ]; then
  echo "와이파이 주소를 찾지 못했습니다. 유선이나 다른 연결을 쓰고 있는지 확인하세요."
  exit 1
fi

SIZE=$(du -h "$DIR/angbuilgu.apk" | cut -f1)
echo
echo "휴대폰 브라우저에서 아래 주소를 여세요. (같은 와이파이여야 합니다)"
echo
echo "    http://$IP:$PORT/angbuilgu.apk      ($SIZE)"
echo
echo "끝내려면 Ctrl+C."
echo

cd "$DIR" && python3 -m http.server "$PORT" --bind 0.0.0.0
