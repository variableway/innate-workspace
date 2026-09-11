#!/usr/bin/env bash
# Pre-commit hook: keep the innate registry in sync with the actual repos.
#
# Before every commit:
#   1. Runs the innate scanner (innate-apps/ + base/ + skills/) so
#      registry/apps.yaml always reflects the latest innate projects.
#   2. Stages the updated registry/apps.yaml so the change is part of the commit.
#
# Install (from the repo root):
#   ln -sf ../../scripts/pre-commit.sh .git/hooks/pre-commit
set -euo pipefail

# Resolve the real location of this script even when it is invoked through a
# symlink (the installed hook at .git/hooks/pre-commit). Without this, the
# script would resolve its parent dir to .git/hooks/.. instead of the repo root.
SOURCE="${BASH_SOURCE[0]}"
while [ -L "$SOURCE" ]; do
    DIR="$(cd -P "$(dirname "$SOURCE")" >/dev/null 2>&1 && pwd)"
    SOURCE="$(readlink "$SOURCE")"
    [[ "$SOURCE" != /* ]] && SOURCE="$DIR/$SOURCE"
done
SCRIPT_DIR="$(cd -P "$(dirname "$SOURCE")" >/dev/null 2>&1 && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

echo "[pre-commit] scanning innate-apps/ + base/ + skills/ -> registry/apps.yaml"
python3 scripts/scan-innate-apps.py

if git diff --quiet -- registry/apps.yaml; then
    echo "[pre-commit] registry/apps.yaml is up to date"
else
    git add -- registry/apps.yaml
    echo "[pre-commit] registry/apps.yaml updated and staged (latest innate projects)"
fi
