#!/usr/bin/env bash
# Unity batchmode → Xcode → iOS Simulator → screenshot.
# macOS, Xcode, and Unity 6000.3.26f1 are required. Other machines stop here.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UNITY_VERSION="6000.3.26f1"
PROJECT="$ROOT/unity"
UNITY="${UNITY_PATH:-/Applications/Unity/Hub/Editor/${UNITY_VERSION}/Unity.app/Contents/MacOS/Unity}"
BUNDLE_ID="com.silibah.catjumpshot"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "iOS 빌드는 macOS에서만 실행됩니다. 이 환경은 $(uname -s) 입니다." >&2
  echo "필요한 것: Unity ${UNITY_VERSION}, Xcode, iOS 시뮬레이터." >&2
  exit 2
fi

if [[ ! -x "$UNITY" ]]; then
  echo "Unity ${UNITY_VERSION} 을 찾지 못했습니다: $UNITY" >&2
  exit 2
fi

if ! xcode-select -p >/dev/null 2>&1; then
  echo "Xcode 가 설치되어 있지 않습니다." >&2
  exit 2
fi

mkdir -p "$PROJECT/Logs" "$PROJECT/Builds"
"$UNITY" -batchmode -nographics -quit \
  -projectPath "$PROJECT" \
  -executeMethod CatJumpShot.EditorTools.IosBatch.Build \
  -logFile "$PROJECT/Logs/ios-build.log"

XCODE_PROJECT="$PROJECT/Builds/iOS/Unity-iPhone.xcodeproj"
DERIVED="$PROJECT/Builds/DerivedData"
xcodebuild \
  -project "$XCODE_PROJECT" \
  -scheme Unity-iPhone \
  -configuration Debug \
  -destination "generic/platform=iOS Simulator" \
  -derivedDataPath "$DERIVED" \
  build

APP="$(find "$DERIVED" -type d -name '*.app' -path '*iphonesimulator*' | head -n 1)"
if [[ -z "$APP" ]]; then
  echo "시뮬레이터 앱을 찾지 못했습니다." >&2
  exit 1
fi

DEVICE="${SIM_DEVICE:-iPhone 16}"
xcrun simctl boot "$DEVICE" >/dev/null 2>&1 || true
xcrun simctl bootstatus "$DEVICE" -b
xcrun simctl install "$DEVICE" "$APP"
xcrun simctl launch "$DEVICE" "$BUNDLE_ID" -catjump-autoplay
sleep 8
mkdir -p "$ROOT/Builds"
xcrun simctl io "$DEVICE" screenshot "$ROOT/Builds/simulator-title.png"
echo "스크린샷: $ROOT/Builds/simulator-title.png"
