#!/usr/bin/env node
/**
 * canvas-load — sync repo canvases/ ↔ Cursor IDE canvases dir
 *
 * Commands:
 *   list                 List *.canvas.tsx in repo
 *   status               Diff repo vs Cursor target
 *   sync [name...]       Copy repo → Cursor (all or named, without .canvas.tsx)
 *   load [name]          sync + print absolute path / file URI (default: first)
 *   path                 Print resolved Cursor canvases directory
 *
 * Env:
 *   CURSOR_CANVASES_DIR     Override target directory
 *   CURSOR_PROJECTS_ROOT    Default ~/.cursor/projects
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const REPO_CANVASES = path.join(REPO_ROOT, "canvases");

function workspaceIdFromAbs(absPath) {
  // /Users/foo/bar → Users-foo-bar
  const normalized = path.resolve(absPath).replace(/\\/g, "/");
  return normalized.replace(/^\/+/, "").replace(/\//g, "-");
}

function resolveCursorCanvasesDir() {
  if (process.env.CURSOR_CANVASES_DIR) {
    return path.resolve(process.env.CURSOR_CANVASES_DIR);
  }
  const projectsRoot =
    process.env.CURSOR_PROJECTS_ROOT ||
    path.join(os.homedir(), ".cursor", "projects");
  const id = workspaceIdFromAbs(REPO_ROOT);
  return path.join(projectsRoot, id, "canvases");
}

function listCanvasFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".canvas.tsx"))
    .sort();
}

function stem(filename) {
  return filename.replace(/\.canvas\.tsx$/, "");
}

function resolveNames(args) {
  const all = listCanvasFiles(REPO_CANVASES);
  if (args.length === 0) return all;
  return args.map((name) => {
    const file = name.endsWith(".canvas.tsx")
      ? name
      : `${name}.canvas.tsx`;
    if (!all.includes(file)) {
      throw new Error(
        `Canvas not found in repo: ${file}\nAvailable: ${all.join(", ") || "(none)"}`,
      );
    }
    return file;
  });
}

function cmdList() {
  const files = listCanvasFiles(REPO_CANVASES);
  if (files.length === 0) {
    console.log("(no canvases in canvases/)");
    return;
  }
  for (const f of files) {
    console.log(`${stem(f)}\t${path.join(REPO_CANVASES, f)}`);
  }
}

function cmdPath() {
  console.log(resolveCursorCanvasesDir());
}

function fileDigest(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buf = fs.readFileSync(filePath);
  // cheap content fingerprint (size + first/last bytes hash-ish)
  let h = buf.length;
  for (let i = 0; i < buf.length; i += 97) h = (h * 33 + buf[i]) >>> 0;
  return `${buf.length}:${h.toString(16)}`;
}

function cmdStatus() {
  const target = resolveCursorCanvasesDir();
  const repoFiles = listCanvasFiles(REPO_CANVASES);
  const cursorFiles = listCanvasFiles(target);
  console.log(`repo:   ${REPO_CANVASES}`);
  console.log(`cursor: ${target}`);
  console.log("");

  const names = new Set([
    ...repoFiles.map(stem),
    ...cursorFiles.map(stem),
  ]);

  let drift = 0;
  for (const name of [...names].sort()) {
    const repoFile = path.join(REPO_CANVASES, `${name}.canvas.tsx`);
    const curFile = path.join(target, `${name}.canvas.tsx`);
    const inRepo = fs.existsSync(repoFile);
    const inCur = fs.existsSync(curFile);
    if (inRepo && inCur) {
      const same = fileDigest(repoFile) === fileDigest(curFile);
      console.log(same ? `ok\t${name}` : `drift\t${name} (repo ≠ cursor)`);
      if (!same) drift++;
    } else if (inRepo) {
      console.log(`missing-in-cursor\t${name}`);
      drift++;
    } else {
      console.log(`cursor-only\t${name}`);
      drift++;
    }
  }

  if (repoFiles.length === 0 && cursorFiles.length === 0) {
    console.log("(empty on both sides)");
  }
  process.exitCode = drift > 0 ? 1 : 0;
}

function cmdSync(args) {
  const files = resolveNames(args);
  const target = resolveCursorCanvasesDir();
  fs.mkdirSync(target, { recursive: true });
  for (const file of files) {
    const src = path.join(REPO_CANVASES, file);
    const dest = path.join(target, file);
    fs.copyFileSync(src, dest);
    console.log(`synced\t${stem(file)}\t→\t${dest}`);
  }
  console.log(`target\t${target}`);
}

function cmdLoad(args) {
  const files = resolveNames(args.length ? args : []);
  if (files.length === 0) {
    throw new Error("No canvases to load. Add *.canvas.tsx under canvases/");
  }
  // sync all requested (or all if none named — load first after sync all)
  const toSync = args.length ? files : listCanvasFiles(REPO_CANVASES);
  cmdSync(toSync.map(stem));
  const pick = files[0];
  const target = path.join(resolveCursorCanvasesDir(), pick);
  const uri = `file://${target}`;
  console.log("");
  console.log(`loaded\t${stem(pick)}`);
  console.log(`path\t${target}`);
  console.log(`uri\t${uri}`);
  console.log("");
  console.log(
    "Open beside chat: click the path in Cursor, or Agent: open_resource with the uri above.",
  );
}

function usage() {
  console.log(`Usage: node tools/canvas-load/cli.mjs <command> [names...]

Commands:
  list              List repo canvases
  path              Print Cursor canvases directory
  status            Compare repo vs Cursor (exit 1 if drift)
  sync [name...]    Copy repo → Cursor
  load [name]       Sync then print path/uri (default: all sync, open first)

Examples:
  node tools/canvas-load/cli.mjs load requirements-gap-analysis
  CURSOR_CANVASES_DIR=/tmp/c node tools/canvas-load/cli.mjs sync
`);
}

function main() {
  const [cmd, ...args] = process.argv.slice(2);
  try {
    switch (cmd) {
      case "list":
        cmdList();
        break;
      case "path":
        cmdPath();
        break;
      case "status":
        cmdStatus();
        break;
      case "sync":
        cmdSync(args);
        break;
      case "load":
        cmdLoad(args);
        break;
      case "help":
      case "--help":
      case "-h":
      case undefined:
        usage();
        break;
      default:
        console.error(`Unknown command: ${cmd}`);
        usage();
        process.exitCode = 2;
    }
  } catch (err) {
    console.error(String(err?.message || err));
    process.exitCode = 1;
  }
}

main();
