#!/usr/bin/env bash
# One-time: use ~/.tools globally instead of per-repo innate-works/.tools
#
# Usage:
#   ./scripts/setup-global-tools.sh              # configure ~/.zshrc + migrate repo .tools
#   ./scripts/setup-global-tools.sh --check      # show resolved paths only
#   ./scripts/setup-global-tools.sh --no-migrate # skip copying repo .tools → ~/.tools
#
# Env:
#   INNATE_TOOLS_DIR   target directory (default ~/.tools)
#   SHELL_RC           profile file (default ~/.zshrc on zsh, else ~/.bashrc)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${BACKEND_ROOT}/../.." && pwd)"
ENV_SCRIPT="${SCRIPT_DIR}/tools-env.sh"
MARKER="# innate-backend global tools (INNATE_TOOLS_DIR)"
TOOLS_DIR="${INNATE_TOOLS_DIR:-${HOME}/.tools}"
SHELL_RC="${SHELL_RC:-}"
DO_MIGRATE=1

for arg in "$@"; do
  case "${arg}" in
    --check) MODE=check ;;
    --no-migrate) DO_MIGRATE=0 ;;
    -h|--help)
      sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
  esac
done

pick_shell_rc() {
  if [[ -n "${SHELL_RC}" ]]; then
    printf '%s\n' "${SHELL_RC}"
    return
  fi
  case "${SHELL:-}" in
    *zsh*) printf '%s\n' "${HOME}/.zshrc" ;;
    *bash*) printf '%s\n' "${HOME}/.bashrc" ;;
    *)
      if [[ -f "${HOME}/.zshrc" ]]; then
        printf '%s\n' "${HOME}/.zshrc"
      else
        printf '%s\n' "${HOME}/.bashrc"
      fi
      ;;
  esac
}

source_line() {
  printf 'export INNATE_TOOLS_DIR="%s"\nsource "%s"' "${TOOLS_DIR}" "${ENV_SCRIPT}"
}

cmd_check() {
  # shellcheck source=./_tools-root.sh
  source "${SCRIPT_DIR}/_tools-root.sh"
  local resolved
  resolved="$(resolve_innate_tools_dir "${REPO_ROOT}")"
  echo "INNATE_TOOLS_DIR (effective): ${resolved}"
  echo "GOMODCACHE (default):         ${resolved}/gomodcache"
  echo "Repo legacy .tools:           ${REPO_ROOT}/.tools"
  echo "Env script:                   ${ENV_SCRIPT}"
  echo "Shell RC (would edit):        $(pick_shell_rc)"
  if compgen -G "${resolved}/go*/bin/go" >/dev/null 2>&1; then
    echo "Go toolchain:                 found under ${resolved}"
  else
    echo "Go toolchain:                 not installed yet (run install-vine.sh --with-go)"
  fi
}

migrate_repo_tools() {
  local legacy="${REPO_ROOT}/.tools"
  [[ "${DO_MIGRATE}" == "1" ]] || return 0
  [[ -d "${legacy}" ]] || return 0
  if [[ "${legacy}" == "${TOOLS_DIR}" ]]; then
    return 0
  fi
  echo "→ Migrating ${legacy} → ${TOOLS_DIR}"
  mkdir -p "${TOOLS_DIR}"
  # merge: do not delete legacy; user can remove after verify
  if command -v rsync &>/dev/null; then
    rsync -a "${legacy}/" "${TOOLS_DIR}/"
  else
    cp -a "${legacy}/." "${TOOLS_DIR}/"
  fi
  echo "  ✓ copied (legacy ${legacy} kept; remove manually when done)"
}

install_shell_hook() {
  local rc hook
  rc="$(pick_shell_rc)"
  hook="$(source_line)"
  mkdir -p "$(dirname "${rc}")"
  touch "${rc}"
  if grep -Fq "${MARKER}" "${rc}" 2>/dev/null; then
    echo "→ Shell hook already in ${rc}"
    return 0
  fi
  {
    echo ""
    echo "${MARKER}"
    echo "${hook}"
  } >>"${rc}"
  echo "→ Appended to ${rc}:"
  echo "    ${hook}"
}

main() {
  if [[ "${MODE:-}" == "check" ]]; then
    cmd_check
    exit 0
  fi

  echo "innate-backend — global .tools setup"
  echo "Target: ${TOOLS_DIR}"
  mkdir -p "${TOOLS_DIR}" "${TOOLS_DIR}/gomodcache" "${TOOLS_DIR}/src"
  migrate_repo_tools
  install_shell_hook
  echo ""
  echo "Done. Open a new terminal or run:"
  echo "  source \"${ENV_SCRIPT}\""
  echo ""
  echo "Then install toolchain + vine:"
  echo "  cd ${BACKEND_ROOT} && ./scripts/install-vine.sh --with-go"
}

main "$@"
