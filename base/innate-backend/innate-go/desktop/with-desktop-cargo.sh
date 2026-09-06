#!/usr/bin/env bash
set -euo pipefail
_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${_root}/env.sh"
echo "[innate-go desktop] CARGO_TARGET_DIR=${CARGO_TARGET_DIR}" >&2
exec "$@"
