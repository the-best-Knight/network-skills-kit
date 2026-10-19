#!/bin/sh
# Browser tests in headless Firefox, a fresh profile for each test file.
#   sh tests/run.sh            run every tests/browser/*.test.mjs
#   sh tests/run.sh hub-keys   run one (the name without .test.mjs)
# Needs Firefox. Set FIREFOX=/path/to/firefox if it is not found, or KIT=file:///.../index.html to test another build.
cd "$(dirname "$0")/browser" || exit 1
FIREFOX="${FIREFOX:-}"
if [ -z "$FIREFOX" ]; then
  for c in /Applications/Firefox.app/Contents/MacOS/firefox "$(command -v firefox)"; do
    if [ -n "$c" ] && [ -x "$c" ]; then FIREFOX="$c"; break; fi
  done
fi
[ -x "$FIREFOX" ] || { echo "Firefox not found. Set FIREFOX=/path/to/firefox"; exit 2; }
PORT=9333; failed=0; total=0
for t in ${1:-*}.test.mjs; do
  [ -f "$t" ] || continue
  pkill -f "remote-debugging-port $PORT" 2>/dev/null; sleep 1
  PROF="$(mktemp -d)"
  # downloads land in $KIT_DL, which the tests read
  mkdir -p "$PROF/dl"; export KIT_DL="$PROF/dl"
  cat > "$PROF/user.js" <<UJS
user_pref("browser.download.folderList", 2);
user_pref("browser.download.dir", "$PROF/dl");
user_pref("browser.download.useDownloadDir", true);
user_pref("browser.helperApps.neverAsk.saveToDisk", "text/plain,application/json,application/xml,image/png,image/svg+xml,application/octet-stream,text/html,text/csv,application/zip");
user_pref("browser.download.alwaysOpenPanel", false);
UJS
  # a test file named *.light.test.mjs runs in a light browser, *.dark.test.mjs in a dark one
  case "$t" in
    *.light.test.mjs) echo 'user_pref("layout.css.prefers-color-scheme.content-override", 1);' >> "$PROF/user.js" ;;
    *.dark.test.mjs) echo 'user_pref("layout.css.prefers-color-scheme.content-override", 0);' >> "$PROF/user.js" ;;
  esac
  "$FIREFOX" --headless --no-remote --profile "$PROF" --remote-debugging-port $PORT about:blank > "$PROF/ff.log" 2>&1 &
  ready=0
  for i in $(seq 1 30); do grep -q "WebDriver BiDi listening" "$PROF/ff.log" 2>/dev/null && { ready=1; break; }; sleep 1; done
  if [ "$ready" -ne 1 ]; then echo "== $t"; echo "   Firefox did not start (see $PROF/ff.log)"; failed=$((failed + 1)); total=$((total + 1)); pkill -f "remote-debugging-port $PORT" 2>/dev/null; continue; fi
  echo "== $t"; total=$((total + 1))
  node "$t" || { failed=$((failed + 1)); echo "   FAILED: $t"; }
  pkill -f "remote-debugging-port $PORT" 2>/dev/null; sleep 1
  rm -rf "${PROF:?}"
done
echo; echo "$((total - failed))/$total test files passed"
[ "$failed" -eq 0 ]
