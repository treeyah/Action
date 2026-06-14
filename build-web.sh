#!/usr/bin/env bash
# Compile the Action interpreter (Action.cpp) to WebAssembly for the web REPL.
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

emcc Action.cpp -O2 -o web/action.js \
  -sMODULARIZE=1 \
  -sEXPORT_NAME=createActionModule \
  -sENVIRONMENT=web \
  -sASYNCIFY \
  -sEXPORTED_RUNTIME_METHODS=stringToNewUTF8

echo "Built web/action.js + web/action.wasm"
