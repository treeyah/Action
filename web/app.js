"use strict";

// ---------- DOM ----------
const menu = document.getElementById("menu");
const editorView = document.getElementById("editor-view");
const galleryView = document.getElementById("gallery-view");
const programList = document.getElementById("program-list");
const noPrograms = document.getElementById("no-programs");
const codeEl = document.getElementById("code");
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
function showMenu() {
  editorView.hidden = true;
  galleryView.hidden = true;
  menu.hidden = false;
  renderProgramList();
}

function showCommands() {
  menu.hidden = true;
  editorView.hidden = true;
  galleryView.hidden = false;
}

function showEditor(name, code) {
  currentName = name;
  programNameEl.textContent = name;
  codeEl.value = code || "";
  outputEl.textContent = "";
  menu.hidden = true;
  editorView.hidden = false;
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

// ---------- Commands reference actions ----------
document.getElementById("gallery-back-btn").addEventListener("click", showMenu);

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
// Action.cpp is an interactive stdin loop. We feed the editor's lines, then
// run() to execute, then exit() to terminate the loop, and capture stdout.
async function runProgram() {
  outputEl.textContent = "Running...\n";

  const lines = codeEl.value
    .split("\n")
    .filter((l) => l.trim() !== "" && l.trim() !== "run()" && l.trim() !== "exit()");

  const input = lines.join("\n") + "\nrun()\nexit()\n";
  const bytes = new TextEncoder().encode(input);
  let pos = 0;

  const out = [];

  try {
    await createActionModule({
      // stdin: return next byte or null at EOF
      stdin: () => (pos < bytes.length ? bytes[pos++] : null),
      print: (text) => out.push(text),
      printErr: (text) => out.push(text),
    });
  } catch (err) {
    // Emscripten throws an ExitStatus on exit(0); that's expected/clean.
    if (!(err && err.name === "ExitStatus")) {
      out.push("[runtime error] " + (err && err.message ? err.message : err));
    }
  }

  // Drop the trailing "Program finished." banner-less newline noise but keep
  // the interpreter's own messages.
  outputEl.textContent = out.join("\n").replace(/^\n+/, "");
}

// ---------- Init ----------
showMenu();
