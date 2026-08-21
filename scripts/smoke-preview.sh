#!/usr/bin/env bash
set -euo pipefail

./node_modules/.bin/vite preview --host 127.0.0.1 --port 4173 >/tmp/ridy-vite-preview.log 2>&1 &
preview_pid=$!
trap 'kill "$preview_pid" 2>/dev/null || true' EXIT

root_url="http://127.0.0.1:4173/ridy3Dmodel"
curl --retry 8 --retry-connrefused --retry-delay 1 --fail --silent --show-error \
  "$root_url/" >/tmp/ridy-index.html

grep -q '<title>ridy</title>' /tmp/ridy-index.html
curl --fail --silent --show-error "$root_url/manifest.webmanifest" >/tmp/ridy-manifest.json
curl --fail --silent --show-error --range 0-19 "$root_url/models/ridy-rabbit-v1.glb" >/tmp/ridy-model-header.bin
curl --fail --silent --show-error "$root_url/sw.js" >/tmp/ridy-sw.js

test "$(wc -c </tmp/ridy-model-header.bin)" -ge 20
test "$(head -c 4 /tmp/ridy-model-header.bin)" = "glTF"
grep -q '"name": "ridy"' /tmp/ridy-manifest.json
grep -q 'ridy-shell-v1' /tmp/ridy-sw.js

echo "preview ok: app, manifest, service worker, and GLB are reachable under /ridy3Dmodel/"
