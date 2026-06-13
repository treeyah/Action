# Action — Web REPL

A browser-based REPL for the Action language. The interpreter is `Action.cpp` compiled to
WebAssembly; the page drives it by feeding your code + `run()` + `exit()` to its stdin and
showing stdout.

## Build

From the repo root, with Emscripten activated (`source ~/emsdk/emsdk_env.sh`):

```sh
bash build-web.sh   # produces web/action.js + web/action.wasm
```

## Run locally

WebAssembly must be served over HTTP (not opened as a `file://`):

```sh
python3 -m http.server 8000 --directory web
```

Then open http://localhost:8000.

## Logo

Drop your logo image at `web/logo.png`. If it's missing, the menu shows the text "ACTION"
as a fallback.

## Saving

Programs are saved by name in your browser's `localStorage` (key `action_programs`).
"Start a new code" creates a named program; "Continue a code" lists saved programs to reopen.
