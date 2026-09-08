#!/usr/bin/env bash
# Install Go toolchain (if needed) + Vine CLI tools (vine + skelc) for 02-be-base.
#
# Usage:
#   ./scripts/install-vine.sh              # install CLIs (clone Vine/skelc if needed)
#   ./scripts/install-vine.sh --check      # check only
#   ./scripts/install-vine.sh --with-go    # also ensure Go >= MIN_GO_VER under INNATE_TOOLS_DIR
#
# Env:
#   INNATE_TOOLS_DIR       global tools root (default ~/.tools; see setup-global-tools.sh)
#   VINE_REF / SKELC_REF   git ref (tag/branch/commit), default v0.12.0
#   VINE_SRC / SKELC_SRC   existing local checkouts (skip clone)
#   GOROOT                 optional; otherwise uses INNATE_TOOLS_DIR/go1.26.5 when --with-go
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "${ROOT}/../../../.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../../scripts/_tools-root.sh
source "${SCRIPT_DIR}/../../scripts/_tools-root.sh"
TOOLS="$(resolve_innate_tools_dir "${REPO_ROOT}")"
MIN_GO_VER="1.26.5"
VINE_REF="${VINE_REF:-v0.12.0}"
SKELC_REF="${SKELC_REF:-v0.12.0}"
VINE_SRC="${VINE_SRC:-}"
SKELC_SRC="${SKELC_SRC:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[vine-install]${NC} $*"; }
warn() { echo -e "${YELLOW}[vine-install]${NC} $*"; }
err()  { echo -e "${RED}[vine-install]${NC} $*"; }

ensure_path_bin() {
  local gopath_bin
  gopath_bin="$(go env GOPATH)/bin"
  if [[ ":${PATH}:" != *":${gopath_bin}:"* ]]; then
    export PATH="${gopath_bin}:${PATH}"
    warn "Added ${gopath_bin} to PATH for this shell."
  fi
}

go_ver_num() {
  go env GOVERSION | sed 's/^go//'
}

need_go_upgrade() {
  ! printf '%s\n%s\n' "${MIN_GO_VER}" "$(go_ver_num)" | sort -V -C 2>/dev/null
}

install_go_toolchain() {
  local dest="${TOOLS}/go${MIN_GO_VER}"
  local arch os tarball url
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"
  case "${arch}" in
    x86_64|amd64) arch="amd64" ;;
    arm64|aarch64) arch="arm64" ;;
    *) err "Unsupported arch: ${arch}"; exit 1 ;;
  esac
  tarball="go${MIN_GO_VER}.${os}-${arch}.tar.gz"
  # go.dev/dl may 403 in some networks; dl.google.com is the CDN mirror.
  url="https://dl.google.com/go/${tarball}"

  if [[ -x "${dest}/bin/go" ]]; then
    log "Go ${MIN_GO_VER} already at ${dest}"
  else
    log "Downloading Go ${MIN_GO_VER} -> ${dest}"
    mkdir -p "${TOOLS}"
    local tmp
    tmp="$(mktemp -d)"
    curl -fsSL -o "${tmp}/${tarball}" "${url}"
    rm -rf "${dest}"
    mkdir -p "${dest}"
    tar -C "${dest}" --strip-components=1 -xzf "${tmp}/${tarball}"
    rm -rf "${tmp}"
  fi
  export GOROOT="${dest}"
  export PATH="${GOROOT}/bin:${PATH}"
  log "Using $(go version)"
}

check_go() {
  if ! command -v go &>/dev/null; then
    err "Go not found. Re-run with --with-go or install Go ${MIN_GO_VER}+ from https://go.dev/dl/"
    exit 1
  fi
  log "Go version: $(go_ver_num)"
  if need_go_upgrade; then
    warn "Vine needs Go ${MIN_GO_VER}+ (have $(go_ver_num))."
    if [[ "${WITH_GO:-0}" == "1" ]]; then
      install_go_toolchain
    else
      err "Re-run: $0 --with-go   (or upgrade system Go)"
      exit 1
    fi
  fi
}

check_bin() {
  local name="$1"
  if command -v "${name}" &>/dev/null; then
    log "${name}: $(${name} version 2>/dev/null | head -1 || echo found)"
    return 0
  fi
  warn "${name} not on PATH"
  return 1
}

resolve_src() {
  # $1=name $2=github repo $3=ref $4=optional env path
  local name="$1" repo="$2" ref="$3" hint="${4:-}"
  local cache="${TOOLS}/src/${name}"
  if [[ -n "${hint}" && -d "${hint}" ]]; then
    echo "${hint}"
    return
  fi
  # Common sibling checkout
  if [[ -d "${HOME}/workspace/yorun-ai/${name}/.git" ]]; then
    echo "${HOME}/workspace/yorun-ai/${name}"
    return
  fi
  if [[ -d "/Users/patrick/workspace/yorun-ai/${name}/.git" ]]; then
    echo "/Users/patrick/workspace/yorun-ai/${name}"
    return
  fi
  if [[ -d "${cache}/.git" ]]; then
    git -C "${cache}" fetch --tags --quiet || true
    git -C "${cache}" checkout --quiet "${ref}" || git -C "${cache}" checkout --quiet -B "pin-${ref}" "${ref}"
    echo "${cache}"
    return
  fi
  log "Cloning ${repo}@${ref} -> ${cache}"
  mkdir -p "$(dirname "${cache}")"
  git clone --depth 1 --branch "${ref}" "https://github.com/yorun-ai/${name}.git" "${cache}" 2>/dev/null \
    || git clone "https://github.com/yorun-ai/${name}.git" "${cache}"
  git -C "${cache}" checkout --quiet "${ref}" || true
  echo "${cache}"
}

install_from_src() {
  local src="$1" pkg="$2"
  log "go install from ${src} (${pkg})"
  (cd "${src}" && go install "${pkg}")
}

main() {
  local mode="install"
  WITH_GO=0
  for arg in "$@"; do
    case "${arg}" in
      --check) mode="check" ;;
      --with-go) WITH_GO=1 ;;
      -h|--help)
        sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'
        exit 0
        ;;
    esac
  done

  log "innate-be-base Vine installer"
  log "vine@${VINE_REF}  skelc@${SKELC_REF}"

  if [[ "${WITH_GO}" == "1" ]]; then
    if ! command -v go &>/dev/null || need_go_upgrade 2>/dev/null; then
      install_go_toolchain
    fi
  fi
  check_go
  ensure_path_bin

  # go.yorun.ai vanity URL may return 403; build from GitHub / local source.
  if [[ "${mode}" == "check" ]]; then
    check_bin vine || true
    check_bin skelc || true
    log "Check complete."
    exit 0
  fi

  local vine_src skelc_src
  vine_src="$(resolve_src vine vine "${VINE_REF}" "${VINE_SRC}")"
  skelc_src="$(resolve_src skelc skelc "${SKELC_REF}" "${SKELC_SRC}")"
  log "VINE_SRC=${vine_src}"
  log "SKELC_SRC=${skelc_src}"

  install_from_src "${vine_src}" "./cmd/vine"
  install_from_src "${skelc_src}" "./cmd/skelc"

  ensure_path_bin
  if check_bin vine && check_bin skelc; then
    log "Done. Next: cd ${ROOT} && make gen && make run"
  else
    err "Binaries installed under $(go env GOPATH)/bin but not on PATH."
    exit 1
  fi
}

main "$@"
