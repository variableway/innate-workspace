#!/usr/bin/env bash
# Global shell env for innate Go/Vine toolchain under INNATE_TOOLS_DIR.
#
# Usage (interactive shell):
#   source /path/to/base/innate-backend/scripts/tools-env.sh
#
# Set once in ~/.zshrc / ~/.bashrc via setup-global-tools.sh

# Global tools root (override before sourcing if needed)
export INNATE_TOOLS_DIR="${INNATE_TOOLS_DIR:-${HOME}/.tools}"

# Global Go directories under INNATE_TOOLS_DIR (force fixed global paths)
export GOPATH="${INNATE_TOOLS_DIR}/gopath"
export GOBIN="${GOPATH}/bin"

# Dedicated caches under INNATE_TOOLS_DIR
export GOMODCACHE="${INNATE_TOOLS_DIR}/gomodcache"
export GOCACHE="${INNATE_TOOLS_DIR}/gocache"

# Prefer the newest toolchain under INNATE_TOOLS_DIR when present
_innate_go_root=""
if compgen -G "${INNATE_TOOLS_DIR}/go*/bin/go" >/dev/null 2>&1; then
  _innate_go_root="$(printf '%s\n' "${INNATE_TOOLS_DIR}"/go*/ | sed 's:/*$::' | sort -V | tail -1)"
  [[ -x "${_innate_go_root}/bin/go" ]] || _innate_go_root=""
fi

if [[ -n "${_innate_go_root}" ]]; then
  export GOROOT="${_innate_go_root}"
  case ":${PATH}:" in
    *":${GOROOT}/bin:"*) ;;
    *) export PATH="${GOROOT}/bin:${PATH}" ;;
  esac
  export GOTOOLCHAIN="${GOTOOLCHAIN:-local}"
fi
unset _innate_go_root

# vine / skelc from go install
_gopath_bin="${GOBIN}"
case ":${PATH}:" in
  *":${_gopath_bin}:"*) ;;
  *) export PATH="${_gopath_bin}:${PATH}" ;;
esac
unset _gopath_bin

mkdir -p "${INNATE_TOOLS_DIR}" "${GOPATH}" "${GOBIN}" "${GOMODCACHE}" "${GOCACHE}" 2>/dev/null || true
