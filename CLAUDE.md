# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Action is a tiny interpreted toy programming language implemented as a single C++ file (`Action.cpp`). It runs as an interactive REPL: typed lines are buffered into a program, and meta-commands like `run()` execute the buffer.

## Build & Run

There is no build system — compile the single source file directly:

```sh
g++ -o action Action.cpp
./action
```

## Architecture

Everything lives in `main()` in `Action.cpp`. The design is a two-phase REPL, not a parser/AST:

- **Input loop** (`while (true)` reading `getline`): any line that is *not* a meta-command (`exit()`, `clear()`, `list()`, `run()`) is pushed verbatim onto the `program` vector. So `write(...)`, `add(...)`, `set(...)`, etc. are stored as raw strings, never validated at entry time.
- **Execution** happens only on `run()`, which iterates `program` and dispatches by prefix-matching each line with `line.find("cmd(") == 0`.
- **Argument parsing** is positional and brittle by design: `substr` with hardcoded offsets (e.g. `substr(6, size-7)` strips `write(` and `)`), and `sscanf` with fixed format strings (e.g. `"add(%d+%d)"`). This is why the README requires no spaces and integer-only math.
- **State**: `vars` (a `map<string,string>`) holds variables across `set`/`get`; `repeatCount` is a single counter that a preceding `repeat(n)` sets and the next executed command consumes (then resets to 1).

When adding a new language command, the pattern is: add an `else if (line.find("newcmd(") == 0)` branch in the `run()` dispatch, parse its arguments with `substr`/`sscanf`, and honor/reset `repeatCount` if it should be repeatable. Update `README.md`'s syntax section to match.
