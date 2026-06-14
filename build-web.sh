#!/usr/bin/env bash
# Compile the Action interpreter to WebAssembly for the web REPL.
#
# Action.cpp is left untouched — it stays a plain terminal program. For the web
# we generate a temporary copy whose input() reads from an inline field in the
# output area (ASYNCIFY lets it pause until you type), and compile that copy.
#
# Requires the Emscripten SDK. If `emcc` is not on your PATH, activate it first:
#   source ~/emsdk/emsdk_env.sh
#
# Usage: bash build-web.sh
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v emcc >/dev/null 2>&1; then
  echo "emcc not found. Run: source ~/emsdk/emsdk_env.sh" >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
GEN="$TMP/action_web.cpp"
python3 web/make_web_source.py Action.cpp "$GEN"

emcc "$GEN" -O2 -o web/action.js \
  -sMODULARIZE=1 \
  -sEXPORT_NAME=createActionModule \
  -sENVIRONMENT=web \
  -sASYNCIFY \
  -sEXPORTED_RUNTIME_METHODS=stringToNewUTF8

echo "Built web/action.js + web/action.wasm"
