#!/usr/bin/env bash
# Resolve innate tools directory (Go toolchain, vine/skelc clones, gomodcache).
#
# Priority:
#   1. INNATE_TOOLS_DIR (explicit — set in shell profile for global use)
#   2. <repo>/.tools        (legacy per-repo, if directory exists)
#   3. ~/.tools             (default global)
#
# Usage (after optional REPO_ROOT is set):
#   source "$(dirname "$0")/_tools-root.sh"
#   TOOLS="$(resolve_innate_tools_dir "${REPO_ROOT:-}")"

resolve_innate_tools_dir() {
  local repo_root="${1:-}"
  if [[ -n "${INNATE_TOOLS_DIR:-}" ]]; then
    printf '%s\n' "${INNATE_TOOLS_DIR}"
    return 0
  fi
  if [[ -n "${repo_root}" && -d "${repo_root}/.tools" ]]; then
    printf '%s\n' "${repo_root}/.tools"
    return 0
  fi
  printf '%s\n' "${HOME}/.tools"
}

default_innate_tools_dir() {
  printf '%s\n' "${HOME}/.tools"
}
