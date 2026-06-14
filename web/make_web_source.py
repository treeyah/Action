#!/usr/bin/env python3
"""Generate a browser-only copy of Action.cpp.

Action.cpp stays a plain terminal program. For the website we compile a COPY
where input()'s getline() is swapped for an inline read in the output area
(ASYNCIFY lets the C++ pause until you type). Action.cpp itself is never edited.

Usage: make_web_source.py <Action.cpp> <output.cpp>
"""
import sys

src_path, out_path = sys.argv[1], sys.argv[2]
src = open(src_path).read()

# 1. Add an inline-read helper right after the namespace line.
anchor = "using namespace std;\n"
helper = anchor + """
#include <emscripten.h>
// Web only: read a line from the inline field shown in the output area.
EM_ASYNC_JS(char *, web_read_line, (), {
    const answer = await Module.readLine();
    return stringToNewUTF8(answer);
});
"""
assert anchor in src, "make_web_source: could not find 'using namespace std;'"
src = src.replace(anchor, helper, 1)

# 2. Swap input()'s stdin getline for the inline read.
old = '''                else if (line == "input()") {
                    string value;
                    getline(cin, value);

                    vars["input"] = value;
                }'''
new = '''                else if (line == "input()") {
                    cout.flush();
                    char *web_p = web_read_line();
                    string value = web_p;
                    free(web_p);

                    vars["input"] = value;
                }'''
assert old in src, "make_web_source: could not find the input() block to patch"
src = src.replace(old, new, 1)

open(out_path, "w").write(src)
