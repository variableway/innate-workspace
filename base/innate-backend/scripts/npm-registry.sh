#!/usr/bin/env bash
# npm-registry.sh — manage the Innate private npm registry (Verdaccio).
#
# Subcommands:
#   config   Render the runtime config from templates/verdaccio-config.yaml
#   login    Pre-provision an htpasswd user and print a client .npmrc snippet
#   start    Render config (if needed) and start Verdaccio in the background
#   stop     Stop the running Verdaccio (by pid file)
#   status   Report whether Verdaccio is running
#   publish  Publish an @innate package to the private registry
#   help     Show this help
#
# Environment:
#   INNATE_REGISTRY_HOME   Runtime dir (default ~/.innate/verdaccio)
#   INNATE_REGISTRY_PORT   Listen port (default 4873)
#   VERDACCIO_BIN          Verdaccio binary (auto-resolved by default)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/../skills/npm-registry" && pwd)"
TEMPLATE="$SKILL_DIR/templates/verdaccio-config.yaml"

HOME_DIR="${INNATE_REGISTRY_HOME:-$HOME/.innate/verdaccio}"
PORT="${INNATE_REGISTRY_PORT:-4873}"
REGISTRY_URL="http://localhost:$PORT/"

CONFIG="$HOME_DIR/config.yaml"
STORAGE="$HOME_DIR/storage"
HTPASSWD="$HOME_DIR/htpasswd"
PIDFILE="$HOME_DIR/verdaccio.pid"
LOGFILE="$HOME_DIR/verdaccio.log"
CLIENT_NPMRC="$HOME_DIR/client.npmrc"

resolve_verdaccio() {
  if [ -n "${VERDACCIO_BIN:-}" ]; then
    echo "$VERDACCIO_BIN"
  elif [ -x /usr/local/bin/verdaccio ]; then
    echo /usr/local/bin/verdaccio
  else
    command -v verdaccio
  fi
}

render_config() {
  mkdir -p "$HOME_DIR" "$STORAGE"
  sed \
    -e "s|{{STORAGE}}|$STORAGE|g" \
    -e "s|{{HTPASSWD}}|$HTPASSWD|g" \
    -e "s|127.0.0.1:4873|127.0.0.1:$PORT|g" \
    "$TEMPLATE" > "$CONFIG"
  echo "wrote $CONFIG"
}

# hash user:password in Verdaccio's {SHA} htpasswd format using Node stdlib.
sha1_hash() {
  local pass="$1"
  node -e 'process.stdout.write(require("crypto").createHash("sha1").update(process.argv[1], "utf8").digest("base64"))' "$pass"
}

cmd_config() {
  render_config
}

cmd_login() {
  local user="innate"
  local password="innate"
  while [ $# -gt 0 ]; do
    case "$1" in
      --user) user="${2:-}"; shift 2 ;;
      --password) password="${2:-}"; shift 2 ;;
      *) echo "unknown login option: $1" >&2; return 1 ;;
    esac
  done
  mkdir -p "$HOME_DIR"

  local hash
  hash="$(sha1_hash "$password")"
  printf '%s:{SHA}%s\n' "$user" "$hash" > "$HTPASSWD"
  echo "wrote $HTPASSWD (user: $user)"

  local auth
  auth="$(printf '%s:%s' "$user" "$password" | base64)"
  cat > "$CLIENT_NPMRC" <<EOF
registry=$REGISTRY_URL
//localhost:$PORT/:_auth=$auth
always-auth=true
EOF
  echo "wrote $CLIENT_NPMRC"
  echo
  echo "Client .npmrc snippet (for consumers, scoped to @innate only):"
  echo "  @innate:registry=$REGISTRY_URL"
  echo "  //localhost:$PORT/:_auth=$auth"
}

cmd_start() {
  local verdaccio
  verdaccio="$(resolve_verdaccio)"

  if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    echo "already running (pid $(cat "$PIDFILE")) at $REGISTRY_URL"
    return 0
  fi

  if [ ! -f "$CONFIG" ]; then
    render_config
  fi

  nohup "$verdaccio" -c "$CONFIG" > "$LOGFILE" 2>&1 &
  echo $! > "$PIDFILE"

  # Give it a moment to bind; surface startup failures.
  for _ in $(seq 1 10); do
    if curl -fsS "http://localhost:$PORT/-/ping" >/dev/null 2>&1; then
      echo "started (pid $(cat "$PIDFILE")) at $REGISTRY_URL"
      return 0
    fi
    if ! kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
      echo "verdaccio exited during startup; see $LOGFILE" >&2
      cat "$LOGFILE" >&2
      return 1
    fi
    sleep 0.5
  done
  echo "started (pid $(cat "$PIDFILE")) but not yet responding; see $LOGFILE" >&2
  return 1
}

cmd_stop() {
  if [ ! -f "$PIDFILE" ]; then
    echo "not running (no pid file)"
    return 0
  fi
  local pid
  pid="$(cat "$PIDFILE")"
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    echo "stopped (pid $pid)"
  else
    echo "not running (stale pid $pid)"
  fi
  rm -f "$PIDFILE"
}

cmd_status() {
  if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    echo "running (pid $(cat "$PIDFILE")) at $REGISTRY_URL"
  else
    echo "stopped"
  fi
}

cmd_publish() {
  local package=""
  local dir="${PWD}"
  while [ $# -gt 0 ]; do
    case "$1" in
      --package) package="${2:-}"; shift 2 ;;
      --dir) dir="${2:-}"; shift 2 ;;
      *) echo "unknown publish option: $1" >&2; return 1 ;;
    esac
  done
  [ -z "$package" ] && { echo "usage: npm-registry.sh publish --package <name> [--dir <path>]" >&2; return 1; }
  [ -f "$CLIENT_NPMRC" ] || { echo "run 'npm-registry.sh login' first" >&2; return 1; }
  (cd "$dir" && npm publish --userconfig "$CLIENT_NPMRC" --registry "$REGISTRY_URL")
}

usage() {
  sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
}

main() {
  local cmd="${1:-help}"
  shift || true
  case "$cmd" in
    config) cmd_config ;;
    login) cmd_login "$@" ;;
    start) cmd_start ;;
    stop) cmd_stop ;;
    status) cmd_status ;;
    publish) cmd_publish "$@" ;;
    help|-h|--help) usage ;;
    *) echo "unknown command: $cmd" >&2; usage; return 1 ;;
  esac
}

main "$@"
