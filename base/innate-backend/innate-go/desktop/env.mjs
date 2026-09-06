import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/** Directory that owns this helper (`base/innate-go/desktop`). */
export const DESKTOP_CARGO_ROOT = here;

/**
 * Shared Cargo artifact directory for all desktop / Tauri apps in this workspace.
 * Override with `CARGO_TARGET_DIR` when you need an isolated build.
 */
export const CARGO_TARGET_DIR = process.env.CARGO_TARGET_DIR || join(here, "target");

export const MACOSX_DEPLOYMENT_TARGET_DEFAULT = "10.13";

/**
 * Merge shared desktop Cargo env into an existing env object.
 * Does not replace the caller's `CARGO_TARGET_DIR` if it is already set.
 */
export function withDesktopCargoEnv(env = process.env) {
  mkdirSync(env.CARGO_TARGET_DIR || CARGO_TARGET_DIR, { recursive: true });

  const next = { ...env, CARGO_TARGET_DIR: env.CARGO_TARGET_DIR || CARGO_TARGET_DIR };

  if (process.platform === "darwin") {
    next.MACOSX_DEPLOYMENT_TARGET =
      env.MACOSX_DEPLOYMENT_TARGET || MACOSX_DEPLOYMENT_TARGET_DEFAULT;
  }

  return next;
}
