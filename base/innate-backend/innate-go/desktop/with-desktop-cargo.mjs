#!/usr/bin/env node
import { spawn } from "node:child_process";
import { CARGO_TARGET_DIR, withDesktopCargoEnv } from "./env.mjs";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("usage: with-desktop-cargo.mjs <command> [args...]");
  console.error(`CARGO_TARGET_DIR=${CARGO_TARGET_DIR}`);
  process.exit(2);
}

const env = withDesktopCargoEnv();
console.error(`[desktop-cargo] CARGO_TARGET_DIR=${env.CARGO_TARGET_DIR}`);

const [command, ...commandArgs] = args;
const child = spawn(command, commandArgs, {
  env,
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
