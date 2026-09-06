# Shared desktop Cargo env. Usage:
#   source /path/to/base/desktop-cargo/env.sh
#   cargo build --manifest-path ...
#
# Does not override CARGO_TARGET_DIR if it is already set.

_desktop_cargo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-${_desktop_cargo_root}/target}"
mkdir -p "$CARGO_TARGET_DIR"

if [ "$(uname -s)" = "Darwin" ]; then
  export MACOSX_DEPLOYMENT_TARGET="${MACOSX_DEPLOYMENT_TARGET:-10.13}"
fi

unset _desktop_cargo_root
