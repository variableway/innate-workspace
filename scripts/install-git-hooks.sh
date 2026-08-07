#!/usr/bin/env bash
# Install local git hooks for innate-works (registry auto-sync on commit).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOK_SRC="$ROOT/scripts/git-hooks/pre-commit"
HOOK_DST="$ROOT/.git/hooks/pre-commit"

if [[ ! -d "$ROOT/.git" ]]; then
  echo "[ERROR] $ROOT is not a git repository root" >&2
  exit 1
fi

if [[ ! -f "$HOOK_SRC" ]]; then
  echo "[ERROR] missing hook source: $HOOK_SRC" >&2
  exit 1
fi

mkdir -p "$(dirname "$HOOK_DST")"
cp "$HOOK_SRC" "$HOOK_DST"
chmod +x "$HOOK_DST" "$HOOK_SRC"

echo "==> installed $HOOK_DST"
echo "    commits will run: python3 scripts/sync-registry.py"
echo "    and stage registry.yaml if it changed"
