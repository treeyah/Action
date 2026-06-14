# Action Language

```
   ___   ___   ___   ___   ___   ___
  / _ \ / _ \ / _ \ / _ \ / _ \ / _ \
 | A | | C | | T | | I | | O | | N |
  \___/ \___/ \___/ \___/ \___/ \___/
```

Action is a simple programming language written in C++ for learning and experimentation.
You can run it in the terminal, or in your browser via the **Web REPL**.

---

## Run in the terminal

There is no build system — compile the single source file directly:

```sh
g++ -o action Action.cpp
./action
```

Type commands at the prompt, then `run()` to execute (see [Commands](#commands)).

---

## Run in the browser (Web REPL)

The interpreter is compiled to WebAssembly and driven from a small static site in
[`web/`](web/). It opens on a menu where you can start a new program, browse the
commands reference, or continue a saved program (saved in your browser).

```sh
# 1. Build the WASM (requires Emscripten; once per change to Action.cpp)
source ~/emsdk/emsdk_env.sh
bash build-web.sh                       # -> web/action.js + web/action.wasm

# 2. Serve it (WASM must be served over HTTP, not file://)
python3 -m http.server 8000 --directory web
```

Then open http://localhost:8000. See [`web/README.md`](web/README.md) for details.

---

## Features

* Print text
* Basic math operations
* Variables
* Repeat commands
* Program execution system

---

## Syntax

### Output


write(text)
newline()


Output stays on the same line; use `newline()` to move to the next line.


### Math


add(a+b)
minus(a-b)
times(a*b)
divide(a/b)


### Variables

set(name=value)
get(name)
input()


`input()` reads a value while the program runs and stores it as `input` (read it
back with `get(input)`). In the terminal you type it after `run()`; on the website
a box pops up for your answer.


### Repeat


repeat(n)


---

## Commands

* `run()` → Execute program
* `list()` → Show stored code
* `clear()` → Clear program
* `exit()` → Quit interpreter

---

## Example

write(Hello)
newline()
set(user=Ben)
get(user)
newline()
add(10+5)
newline()
repeat(2)
write(Hi)
run()


### Output


Hello
Ben
15
HiHi


---

## Notes

* Integer math only
* No spaces in expressions
* Variables stored as strings
