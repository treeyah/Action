"use strict";

// ---------- DOM ----------
const menu = document.getElementById("menu");
const editorView = document.getElementById("editor-view");
const galleryView = document.getElementById("gallery-view");
const examplesView = document.getElementById("examples-view");
const examplesList = document.getElementById("examples-list");
const programList = document.getElementById("program-list");
const noPrograms = document.getElementById("no-programs");
const codeEl = document.getElementById("code");
const highlightEl = document.getElementById("highlight");
const gutterEl = document.getElementById("gutter");
const outputEl = document.getElementById("output");
const programNameEl = document.getElementById("program-name");

let currentName = null; // name of the program currently open in the editor

// ---------- Storage (localStorage: { name: codeText }) ----------
const STORE_KEY = "action_programs";

function loadPrograms() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
  } catch {
    return {};
  }
}

function savePrograms(programs) {
  localStorage.setItem(STORE_KEY, JSON.stringify(programs));
}

// ---------- View switching ----------
function hideAllViews() {
  menu.hidden = true;
  editorView.hidden = true;
  galleryView.hidden = true;
  examplesView.hidden = true;
}

function showMenu() {
  hideAllViews();
  menu.hidden = false;
  renderProgramList();
}

function showCommands() {
  hideAllViews();
  galleryView.hidden = false;
}

function showExamples() {
  hideAllViews();
  examplesView.hidden = false;
  renderExamples();
}

function showEditor(name, code) {
  currentName = name;
  programNameEl.textContent = name;
  codeEl.value = code || "";
  outputEl.textContent = "";
  hideAllViews();
  editorView.hidden = false;
  refreshEditor();
  codeEl.focus();
}

function renderProgramList() {
  const programs = loadPrograms();
  const names = Object.keys(programs).sort();
  programList.innerHTML = "";
  noPrograms.hidden = names.length > 0;

  for (const name of names) {
    const li = document.createElement("li");

    const open = document.createElement("button");
    open.className = "open-name";
    open.textContent = name;
    open.addEventListener("click", () => showEditor(name, programs[name]));

    const del = document.createElement("button");
    del.className = "delete-btn";
    del.title = "Delete";
    del.textContent = "×"; // ×
    del.addEventListener("click", () => {
      if (confirm(`Delete "${name}"?`)) {
        const p = loadPrograms();
        delete p[name];
        savePrograms(p);
        renderProgramList();
      }
    });

    li.appendChild(open);
    li.appendChild(del);
    programList.appendChild(li);
  }
}

// ---------- Menu actions ----------
document.getElementById("new-btn").addEventListener("click", () => {
  const name = prompt("Name your new program:");
  if (!name) return;
  const programs = loadPrograms();
  if (programs[name] && !confirm(`"${name}" already exists. Overwrite?`)) return;
  programs[name] = "";
  savePrograms(programs);
  showEditor(name, "");
});

document.getElementById("show-all-btn").addEventListener("click", showCommands);
document.getElementById("examples-btn").addEventListener("click", showExamples);

// ---------- Commands reference actions ----------
document.getElementById("gallery-back-btn").addEventListener("click", showMenu);

// ---------- Examples ----------
const EXAMPLES = [
  {
    name: "Greeting",
    desc: "Ask for your name, then say hello.",
    code: [
      "write(What is your name?)",
      "newline()",
      "input()",
      "write(Hello, )",
      "get(input)",
      "write(!)",
    ].join("\n"),
  },
  {
    name: "Dice roller",
    desc: "Roll a dice and show the result.",
    code: [
      "write(You rolled:)",
      "newline()",
      "random(1,6)",
    ].join("\n"),
  },
  {
    name: "Maths fun",
    desc: "Show a few calculations.",
    code: [
      "write(10 + 5 = )",
      "add(10+5)",
      "newline()",
      "write(6 x 7 = )",
      "times(6*7)",
      "newline()",
      "write(20 / 4 = )",
      "divide(20/4)",
    ].join("\n"),
  },
  {
    name: "Repeat fun",
    desc: "Print the same thing several times.",
    code: ["repeat(5)", "write(Action! )"].join("\n"),
  },
  {
    name: "Ask and answer",
    desc: "Ask a question and react to the answer.",
    code: [
      "write(What is your favourite animal?)",
      "newline()",
      "input()",
      "write(Wow, the )",
      "get(input)",
      "write( is a great animal!)",
    ].join("\n"),
  },
];

function renderExamples() {
  examplesList.replaceChildren();
  for (const ex of EXAMPLES) {
    const card = document.createElement("div");
    card.className = "example-card";

    const header = document.createElement("div");
    header.className = "example-card-header";
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = ex.name;
    const open = document.createElement("button");
    open.textContent = "Try it";
    open.addEventListener("click", () => showEditor(ex.name, ex.code));
    header.append(name, open);

    const desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent = ex.desc;

    const pre = document.createElement("pre");
    pre.textContent = ex.code;

    card.append(header, desc, pre);
    examplesList.appendChild(card);
  }
}

document.getElementById("examples-back-btn").addEventListener("click", showMenu);

// ---------- Editor actions ----------
document.getElementById("back-btn").addEventListener("click", showMenu);

document.getElementById("save-btn").addEventListener("click", () => {
  const programs = loadPrograms();
  programs[currentName] = codeEl.value;
  savePrograms(programs);
  programNameEl.textContent = currentName + " ✓";
  setTimeout(() => (programNameEl.textContent = currentName), 1200);
});

document.getElementById("clear-output-btn").addEventListener("click", () => {
  outputEl.textContent = "";
});

document.getElementById("run-btn").addEventListener("click", runProgram);

// ---------- Run via the WASM interpreter ----------
// We feed the editor's lines, then run() to execute, then exit() to terminate.
// Output streams live into the output area as the program prints.
//
// input() reads inline: the web build pauses the program and calls
// Module.readLine(), which shows a text field in the output and resolves with
// what you type — so you answer right in the output, terminal-style.
// A line the interpreter understands: a known command followed by (...).
const RECOGNISED = /^(write|add|minus|times|divide|set|get|random|repeat|newline|input|run|list|clear|exit)\(.*\)$/;

// How many single-character edits turn a into b (for "did you mean?").
function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[a.length][b.length];
}

// The closest command to a typed word, if it's a near miss.
function closestCommand(word) {
  let best = null;
  let bestDist = 3; // only suggest if it's reasonably close
  for (const cmd of KEYWORDS) {
    const dist = editDistance(word, cmd);
    if (dist < bestDist) {
      bestDist = dist;
      best = cmd;
    }
  }
  return best;
}

// Check the values inside a recognised command (e.g. whole-numbers-only math).
function checkArgs(line) {
  const m = line.match(/^([a-z]+)\((.*)\)$/);
  if (!m) return null;
  const cmd = m[1];
  const arg = m[2];

  if (["add", "minus", "times", "divide"].includes(cmd)) {
    const op = { add: "+", minus: "-", times: "*", divide: "/" }[cmd];
    if (arg.includes(".")) return "whole numbers only (no decimals)";
    const re = new RegExp("^-?\\d+\\" + op + "-?\\d+$");
    if (!re.test(arg)) return `whole numbers only — try ${cmd}(2${op}3)`;
  } else if (cmd === "random") {
    if (arg.includes(".")) return "whole numbers only — try random(1,6)";
    if (!/^-?\d+,-?\d+$/.test(arg)) return "random needs two whole numbers, like random(1,6)";
  } else if (cmd === "repeat") {
    if (!/^\d+$/.test(arg)) return "repeat needs a whole number, like repeat(3)";
  }
  return null;
}

// Friendly checks before running, so mistakes don't fail silently.
function findProblems(rawLines) {
  const problems = [];
  rawLines.forEach((raw, i) => {
    const line = raw.trim();
    if (line === "") return;

    const at = `Line ${i + 1}`;
    const nameMatch = line.match(/^[A-Za-z]+/);
    const name = nameMatch ? nameMatch[0] : "";
    const lower = name.toLowerCase();

    // Capital letters in a command name (commands are all lowercase).
    if (name && lower !== name && KEYWORDS.has(lower)) {
      problems.push(`${at}: no capital letters — try ${lower}(...)`);
      return;
    }

    // Structurally fine — just check the values inside.
    if (RECOGNISED.test(line)) {
      const argMsg = checkArgs(line);
      if (argMsg) problems.push(`${at}: ${argMsg}`);
      return;
    }

    if (name && KEYWORDS.has(lower)) {
      problems.push(`${at}: "${lower}" needs round brackets — try ${lower}(...)`);
    } else if (name) {
      const guess = closestCommand(lower);
      const hint = guess
        ? ` Did you mean ${guess}()?`
        : ` Tap "Commands" to see what you can use.`;
      problems.push(`${at}: "${name}" isn't a command I know.${hint}`);
    } else {
      problems.push(`${at}: I couldn't read "${line}". Commands look like name(...)`);
    }
  });
  return problems;
}

async function runProgram() {
  const rawLines = codeEl.value.split("\n");
  const lines = rawLines
    .map((l) => l.trim())
    .filter((l) => l !== "" && l !== "run()" && l !== "exit()");

  outputEl.replaceChildren(); // clear previous output

  // Show any friendly warnings first, then run what we can.
  for (const p of findProblems(rawLines)) {
    const warn = document.createElement("span");
    warn.className = "warn";
    warn.textContent = "⚠ " + p + "\n";
    outputEl.appendChild(warn);
  }

  const feed = lines.concat("run()", "exit()").join("\n") + "\n";
  const bytes = new TextEncoder().encode(feed);
  let pos = 0;

  const appendRaw = (text) => {
    outputEl.appendChild(document.createTextNode(text));
    outputEl.scrollTop = outputEl.scrollHeight;
  };

  // stdout/stderr deliver one byte at a time; decode (UTF-8 stream-safe).
  const decoder = new TextDecoder();
  const writeByte = (code) => {
    if (code === null || code === undefined) return;
    const text = decoder.decode(new Uint8Array([code]), { stream: true });
    if (text) appendRaw(text);
  };

  // Inline input: show a text field where the cursor is and resolve on Enter.
  const readLine = () =>
    new Promise((resolve) => {
      const field = document.createElement("input");
      field.type = "text";
      field.className = "inline-input";
      field.setAttribute("aria-label", "Program input");
      outputEl.appendChild(field);
      field.focus();
      outputEl.scrollTop = outputEl.scrollHeight;
      field.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const val = field.value;
          field.replaceWith(document.createTextNode(val + "\n"));
          resolve(val);
        }
      });
    });

  try {
    await createActionModule({
      stdin: () => (pos < bytes.length ? bytes[pos++] : null),
      stdout: writeByte,
      stderr: writeByte,
      readLine,
    });
  } catch (err) {
    // Emscripten throws an ExitStatus on exit(0); that's expected/clean.
    if (!(err && err.name === "ExitStatus")) {
      appendRaw("\n[runtime error] " + (err && err.message ? err.message : err));
    }
  }
}

// ---------- Syntax highlighting + line numbers ----------
// Each command is coloured by category (see the matching CSS classes).
const TOKEN_CLASS = {
  write: "tok-write",
  add: "tok-math", minus: "tok-math", times: "tok-math", divide: "tok-math",
  set: "tok-var", get: "tok-var",
  random: "tok-random",
  repeat: "tok-repeat",
  newline: "tok-newline",
  input: "tok-input",
  run: "tok-meta", list: "tok-meta", clear: "tok-meta", exit: "tok-meta",
};
const KEYWORDS = new Set(Object.keys(TOKEN_CLASS));

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Colour the whole line VSCode-style: command name by category, the brackets,
// and everything inside them (text, numbers, operators).
function highlightCode(src) {
  let out = "";
  let depth = 0; // how many brackets deep we are
  const re = /([A-Za-z]+)|([0-9]+)|(\n)|([^A-Za-z0-9\n])/g;
  let m;
  while ((m = re.exec(src))) {
    if (m[1] !== undefined) {
      const w = m[1];
      if (KEYWORDS.has(w)) {
        // A command word always keeps its category colour, anywhere it appears.
        out += `<span class="${TOKEN_CLASS[w]}">${escapeHtml(w)}</span>`;
      } else if (depth > 0) {
        // Other text inside brackets is plain cream.
        out += `<span class="tok-arg">${escapeHtml(w)}</span>`;
      } else {
        out += escapeHtml(w);
      }
    } else if (m[2] !== undefined) {
      out += `<span class="tok-num">${m[2]}</span>`;
    } else if (m[3] !== undefined) {
      out += "\n";
    } else {
      const ch = m[4];
      if (ch === "(") {
        depth++;
        out += `<span class="tok-punc">(</span>`;
      } else if (ch === ")") {
        if (depth > 0) depth--;
        out += `<span class="tok-punc">)</span>`;
      } else if ("+-*/=,".includes(ch)) {
        out += `<span class="tok-punc">${escapeHtml(ch)}</span>`;
      } else {
        out += escapeHtml(ch);
      }
    }
  }
  return out;
}

function syncScroll() {
  highlightEl.scrollTop = codeEl.scrollTop;
  highlightEl.scrollLeft = codeEl.scrollLeft;
  gutterEl.scrollTop = codeEl.scrollTop;
}

function refreshEditor() {
  highlightEl.innerHTML = highlightCode(codeEl.value) + "\n";
  const count = codeEl.value.split("\n").length;
  let nums = "";
  for (let i = 1; i <= count; i++) nums += i + "\n";
  gutterEl.textContent = nums;
  syncScroll();
}

// ---------- Autocomplete (VSCode-style command suggestions) ----------
const acEl = document.getElementById("autocomplete");

// Each command: the word, what to insert, where to put the cursor in the
// inserted text (caret), and a short description.
const COMMANDS = [
  { word: "write",   insert: "write()",    caret: 6, desc: "Print text" },
  { word: "add",     insert: "add()",      caret: 4, desc: "a + b" },
  { word: "minus",   insert: "minus()",    caret: 6, desc: "a - b" },
  { word: "times",   insert: "times()",    caret: 6, desc: "a * b" },
  { word: "divide",  insert: "divide()",   caret: 7, desc: "a / b" },
  { word: "set",     insert: "set()",      caret: 4, desc: "Store a variable (name=value)" },
  { word: "get",     insert: "get()",      caret: 4, desc: "Print a variable" },
  { word: "get",     insert: "get(input)", caret: 10, desc: "Print the input variable" },
  { word: "random",  insert: "random()",   caret: 7, desc: "Random number (min,max)" },
  { word: "repeat",  insert: "repeat()",   caret: 7, desc: "Repeat the next command" },
  { word: "newline", insert: "newline()",  caret: 9, desc: "Start a new line" },
  { word: "input",   insert: "input()",    caret: 7, desc: "Ask for a value" },
];

let acMatches = [];
let acActive = 0;
let acWordStart = 0; // index in textarea where the typed word begins

function hideAutocomplete() {
  acEl.hidden = true;
  acMatches = [];
}

// Measure the pixel position of the caret inside the textarea via a mirror div.
function caretCoords() {
  const pos = codeEl.selectionStart;
  const mirror = document.createElement("div");
  const cs = getComputedStyle(codeEl);
  for (const p of [
    "boxSizing", "width", "paddingTop", "paddingRight", "paddingBottom",
    "paddingLeft", "borderWidth", "fontFamily", "fontSize", "fontWeight",
    "lineHeight", "letterSpacing", "whiteSpace", "wordWrap", "tabSize",
  ]) {
    mirror.style[p] = cs[p];
  }
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";
  mirror.textContent = codeEl.value.slice(0, pos);
  const marker = document.createElement("span");
  marker.textContent = "​";
  mirror.appendChild(marker);
  codeEl.parentElement.appendChild(mirror);
  const top = marker.offsetTop - codeEl.scrollTop + marker.offsetHeight;
  const left = marker.offsetLeft - codeEl.scrollLeft;
  mirror.remove();
  return { top, left };
}

function renderAutocomplete() {
  acEl.replaceChildren();
  acMatches.forEach((cmd, i) => {
    const li = document.createElement("li");
    if (i === acActive) li.className = "active";
    const name = document.createElement("span");
    name.className = "ac-name";
    name.textContent = cmd.insert;
    const desc = document.createElement("span");
    desc.className = "ac-desc";
    desc.textContent = cmd.desc;
    li.append(name, desc);
    li.addEventListener("mousedown", (e) => {
      e.preventDefault(); // keep textarea focus
      applyAutocomplete(cmd);
    });
    acEl.appendChild(li);
  });
  const { top, left } = caretCoords();
  acEl.style.top = top + "px";
  acEl.style.left = left + "px";
  acEl.hidden = false;
}

function applyAutocomplete(cmd) {
  const value = codeEl.value;
  const before = value.slice(0, acWordStart);
  const after = value.slice(codeEl.selectionStart);
  codeEl.value = before + cmd.insert + after;
  const caret = before.length + cmd.caret;
  codeEl.setSelectionRange(caret, caret);
  hideAutocomplete();
  refreshEditor();
  codeEl.focus();
}

function updateAutocomplete() {
  const pos = codeEl.selectionStart;
  const upto = codeEl.value.slice(0, pos);

  // Don't suggest commands while typing inside brackets — there you type
  // literal text or values (e.g. write(Hello), set(name=value)), not commands.
  const lineUpto = upto.slice(upto.lastIndexOf("\n") + 1);
  const opens = (lineUpto.match(/\(/g) || []).length;
  const closes = (lineUpto.match(/\)/g) || []).length;
  if (opens > closes) return hideAutocomplete();

  // The word being typed: letters immediately before the caret.
  const m = upto.match(/[a-zA-Z]+$/);
  if (!m) return hideAutocomplete();
  const word = m[0].toLowerCase();
  acWordStart = pos - m[0].length;
  acMatches = COMMANDS.filter((c) => c.word.startsWith(word) && c.insert !== word);
  if (acMatches.length === 0) return renderNoMatch();
  acActive = 0;
  renderAutocomplete();
}

function renderNoMatch() {
  acMatches = [];
  acEl.replaceChildren();
  const li = document.createElement("li");
  li.className = "ac-empty";
  li.textContent = "No code found";
  acEl.appendChild(li);
  const { top, left } = caretCoords();
  acEl.style.top = top + "px";
  acEl.style.left = left + "px";
  acEl.hidden = false;
}

codeEl.addEventListener("input", () => {
  refreshEditor();
  updateAutocomplete();
});
codeEl.addEventListener("keydown", (e) => {
  // Run shortcut: Ctrl/Cmd+Enter runs the program from anywhere in the editor.
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    hideAutocomplete();
    runProgram();
    return;
  }
  if (acEl.hidden) return;
  // "No code found" is showing — nothing to select, just allow normal typing.
  if (acMatches.length === 0) {
    if (e.key === "Escape") hideAutocomplete();
    return;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    acActive = (acActive + 1) % acMatches.length;
    renderAutocomplete();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    acActive = (acActive - 1 + acMatches.length) % acMatches.length;
    renderAutocomplete();
  } else if (e.key === "Enter" || e.key === "Tab") {
    e.preventDefault();
    applyAutocomplete(acMatches[acActive]);
  } else if (e.key === "Escape") {
    hideAutocomplete();
  }
});
codeEl.addEventListener("blur", () => setTimeout(hideAutocomplete, 100));
codeEl.addEventListener("scroll", () => {
  syncScroll();
  hideAutocomplete();
});

// ---------- Init ----------
showMenu();
