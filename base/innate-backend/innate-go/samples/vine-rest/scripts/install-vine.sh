#!/usr/bin/env bash
# Install Go (optional) + vine/skelc for 02-be-base.
# Usage:
#   ./scripts/install-vine.sh           # install CLIs from local/GitHub source
#   ./scripts/install-vine.sh --check   # check only
#   ./scripts/install-vine.sh --with-go # also ensure Go >= 1.26.5 under repo .tools/
# Env: VINE_REF SKELC_REF VINE_SRC SKELC_SRC
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "${ROOT}/../../../.." && pwd)"
TOOLS="${REPO_ROOT}/.tools"
MIN_GO_VER="1.26.5"
VINE_REF="${VINE_REF:-v0.12.0}"
SKELC_REF="${SKELC_REF:-v0.12.0}"
VINE_SRC="${VINE_SRC:-}"
SKELC_SRC="${SKELC_SRC:-}"
WITH_GO=0
MODE=install

log(){ echo "[vine-install] $*"; }
warn(){ echo "[vine-install] WARN: $*"; }
err(){ echo "[vine-install] ERROR: $*"; }

for a in "$@"; do
  case "$a" in
    --check) MODE=check ;;
    --with-go) WITH_GO=1 ;;
    -h|--help) sed -n "2,12p" "$0" | sed "s/^# \{0,1\}//"; exit 0 ;;
  esac
done

go_ver(){ go env GOVERSION | sed "s/^go//"; }

need_go(){ ! printf "%s\n%s\n" "$MIN_GO_VER" "$(go_ver)" | sort -V -C 2>/dev/null; }

install_go(){
  local dest="${TOOLS}/go${MIN_GO_VER}" os arch tarball url tmp
  os="$(uname -s | tr "[:upper:]" "[:lower:]")"
  arch="$(uname -m)"; case "$arch" in x86_64|amd64) arch=amd64;; arm64|aarch64) arch=arm64;; *) err "arch $arch"; exit 1;; esac
  tarball="go${MIN_GO_VER}.${os}-${arch}.tar.gz"
  url="https://dl.google.com/go/${tarball}"
  if [[ ! -x "${dest}/bin/go" ]]; then
    log "Downloading Go ${MIN_GO_VER}"
    mkdir -p "$TOOLS"; tmp="$(mktemp -d)"
    curl -fsSL -o "${tmp}/${tarball}" "$url"
    rm -rf "$dest"; mkdir -p "$dest"
    tar -C "$dest" --strip-components=1 -xzf "${tmp}/${tarball}"
    rm -rf "$tmp"
  fi
  export GOROOT="$dest"; export PATH="${GOROOT}/bin:${PATH}"
  log "Using $(go version)"
}

ensure_go(){
  if ! command -v go >/dev/null; then
    [[ "$WITH_GO" == 1 ]] || { err "Go missing; re-run with --with-go"; exit 1; }
    install_go
  elif need_go; then
    warn "Go $(go_ver) < ${MIN_GO_VER}"
    [[ "$WITH_GO" == 1 ]] || { err "Re-run with --with-go"; exit 1; }
    install_go
  else
    log "Go $(go_ver)"
  fi
  local gb; gb="$(go env GOPATH)/bin"
  [[ ":$PATH:" == *":$gb:"* ]] || export PATH="$gb:$PATH"
}

resolve_src(){
  local name="$1" ref="$2" hint="${3:-}" cache="${TOOLS}/src/${name}"
  if [[ -n "$hint" && -d "$hint" ]]; then echo "$hint"; return; fi
  for p in "$HOME/workspace/yorun-ai/${name}" "/Users/patrick/workspace/yorun-ai/${name}"; do
    [[ -d "$p/.git" || -f "$p/go.mod" ]] && { echo "$p"; return; }
  done
  if [[ -d "$cache/.git" ]]; then
    git -C "$cache" fetch --tags --quiet || true
    git -C "$cache" checkout --quiet "$ref" || true
    echo "$cache"; return
  fi
  log "Cloning yorun-ai/${name}@${ref}"
  mkdir -p "$(dirname "$cache")"
  if ! git clone --depth 1 --branch "$ref" "https://github.com/yorun-ai/${name}.git" "$cache" 2>/dev/null; then
    git clone "https://github.com/yorun-ai/${name}.git" "$cache"
    git -C "$cache" checkout --quiet "$ref" || true
  fi
  echo "$cache"
}

ensure_go
if [[ "$MODE" == check ]]; then
  command -v vine >/dev/null && log "vine ok" || warn "vine missing"
  command -v skelc >/dev/null && log "skelc ok" || warn "skelc missing"
  exit 0
fi

if command -v vine >/dev/null && command -v skelc >/dev/null; then
  log "vine/skelc already on PATH — skipping rebuild"
  vine version | head -3
  skelc version | head -3
  exit 0
fi

vs="$(resolve_src vine "$VINE_REF" "$VINE_SRC")"
ss="$(resolve_src skelc "$SKELC_REF" "$SKELC_SRC")"
log "Building vine from $vs"
(cd "$vs" && go install ./cmd/vine)
log "Building skelc from $ss"
(cd "$ss" && go install ./cmd/skelc)
log "Installed to $(go env GOPATH)/bin"
vine version | head -3
skelc version | head -3
