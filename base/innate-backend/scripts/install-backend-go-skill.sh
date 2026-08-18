#!/usr/bin/env bash
#
# install-backend-go-skill.sh — 将 backend-go skill 安装到多个 AI Agent
#
# 支持 Agent：Codex · Claude Code · Workbuddy · Cursor · OpenCode
#
#   平台        全局目录                      项目级目录
#   codex       ~/.codex/skills               .codex/skills
#   claude      ~/.claude/skills              .claude/skills
#   workbuddy   ~/.workbuddy/skills           .workbuddy/skills
#   cursor      ~/.cursor/skills              .cursor/skills
#   opencode    ~/.config/opencode/skills     .config/opencode/skills
#
# 用法：
#   install-backend-go-skill.sh [install] <platform|all> [--scope global|project] [选项]
#   install-backend-go-skill.sh uninstall <platform|all> [--scope global|project]
#   install-backend-go-skill.sh list
#   install-backend-go-skill.sh help
#
# 选项：
#   --scope global|project   安装范围（默认 global）
#   --copy                   复制目录而非 symlink（便于打包/离线）
#   --project-root <dir>       项目级安装根目录（默认 $PWD）
#   -h, --help                 帮助
#
# 环境变量：
#   BACKEND_GO_SKILL_SOURCE    覆盖 skill 源目录（默认自动探测）
#   BACKEND_GO_SKILL_NAME      skill 目录名（默认 backend-go）

set -euo pipefail

SKILL_NAME="${BACKEND_GO_SKILL_NAME:-backend-go}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_SKILL_SOURCE="$(cd "$SCRIPT_DIR/../skills/backend-go" && pwd)"

platforms_table() {
  cat <<EOF
codex|$HOME/.codex/skills|.codex/skills
claude|$HOME/.claude/skills|.claude/skills
workbuddy|$HOME/.workbuddy/skills|.workbuddy/skills
cursor|$HOME/.cursor/skills|.cursor/skills
opencode|$HOME/.config/opencode/skills|.config/opencode/skills
EOF
}

platform_ids() { platforms_table | cut -d'|' -f1; }

usage() {
  cat <<USAGE
backend-go skill installer — Go + Vine 后端开发 skill

源目录（默认）: $DEFAULT_SKILL_SOURCE

用法:
  $(basename "$0") [install] <platform|all> [--scope global|project] [--copy]
  $(basename "$0") uninstall <platform|all> [--scope global|project]
  $(basename "$0") list
  $(basename "$0") help

平台: $(platform_ids | tr '\n' ' ') all

示例:
  $(basename "$0") all                           # 全局安装到全部 Agent
  $(basename "$0") cursor claude --scope project # 当前项目下安装
  $(basename "$0") uninstall codex --scope global
USAGE
}

resolve_platform() {
  local id="$1" row
  row="$(platforms_table | awk -F'|' -v id="$id" '$1==id {print; exit}')"
  if [[ -z "$row" ]]; then
    printf '未知平台: %s\n支持: %s all\n' "$id" "$(platform_ids | tr '\n' ' ')" >&2
    exit 1
  fi
  printf '%s\n' "$row"
}

resolve_skill_source() {
  local src="${BACKEND_GO_SKILL_SOURCE:-$DEFAULT_SKILL_SOURCE}"
  if [[ ! -f "$src/SKILL.md" ]]; then
    printf '找不到 skill 源: %s/SKILL.md\n' "$src" >&2
    exit 1
  fi
  printf '%s\n' "$(cd "$src" && pwd)"
}

resolve_target() {
  local id="$1" scope="$2" project_root="$3"
  local row global_dir project_rel
  row="$(resolve_platform "$id")"
  global_dir="$(printf '%s\n' "$row" | cut -d'|' -f2)"
  project_rel="$(printf '%s\n' "$row" | cut -d'|' -f3)"
  if [[ "$scope" == "global" ]]; then
    printf '%s\n' "$global_dir"
  else
    printf '%s\n' "$project_root/$project_rel"
  fi
}

copy_tree() {
  local src="$1" dest="$2"
  mkdir -p "$(dirname "$dest")"
  rm -rf "$dest"
  mkdir -p "$dest"
  # cp -a preserves symlinks inside refs/ if any
  cp -a "$src/." "$dest/"
}

install_skill() {
  local target_root="$1" mode="$2" source="$3"
  local dest="$target_root/$SKILL_NAME"
  mkdir -p "$target_root"
  case "$mode" in
    link)
      ln -sfn "$source" "$dest"
      printf '  ✓ link %s → %s\n' "$dest" "$source"
      ;;
    copy)
      copy_tree "$source" "$dest"
      write_installed_readme "$dest" "$source"
      printf '  ✓ copy %s\n' "$dest"
      ;;
    *)
      printf '未知安装模式: %s\n' "$mode" >&2
      exit 1
      ;;
  esac
}

write_installed_readme() {
  local dest="$1" source="$2"
  cat >"$dest/README.md" <<EOF
# backend-go (installed)

Do not edit this copy. Source: $source

Reinstall: \`base/innate-backend/scripts/install-backend-go-skill.sh all\`
EOF
}

remove_skill() {
  local target_root="$1"
  local dest="$target_root/$SKILL_NAME"
  [[ -e "$dest" || -L "$dest" ]] || return 0
  rm -rf "$dest"
  printf '  ✓ removed %s\n' "$dest"
}

skill_installed() {
  local target_root="$1" source="$2"
  local dest="$target_root/$SKILL_NAME"
  if [[ -L "$dest" ]]; then
    [[ "$(readlink "$dest")" == "$source" ]] && return 0
    return 1
  fi
  [[ -f "$dest/SKILL.md" ]]
}

print_tips() {
  local id="$1"
  printf '\n✓ backend-go 已安装到 %s\n' "$id"
  printf '  重启 CLI / IDE 后生效。\n'
  case "$id" in
    codex)
      printf '  Codex: skill 位于 ~/.codex/skills/%s\n' "$SKILL_NAME"
      ;;
    cursor)
      printf '  Cursor: 也可在项目 .cursor/skills/ 下安装（--scope project）。\n'
      ;;
    workbuddy)
      printf '  Workbuddy: 设置中重新加载 skills，或重启应用。\n'
      ;;
    opencode)
      printf '  OpenCode: 全局 ~/.config/opencode/skills/%s\n' "$SKILL_NAME"
      ;;
  esac
}

cmd_install_one() {
  local id="$1" scope="$2" mode="$3" project_root="$4" source
  source="$(resolve_skill_source)"
  local target
  target="$(resolve_target "$id" "$scope" "$project_root")"
  printf '→ %s (%s) → %s\n' "$id" "$scope" "$target"
  install_skill "$target" "$mode" "$source"
  print_tips "$id"
}

cmd_uninstall_one() {
  local id="$1" scope="$2" project_root="$3"
  local target
  target="$(resolve_target "$id" "$scope" "$project_root")"
  printf '→ uninstall %s (%s) → %s\n' "$id" "$scope" "$target"
  remove_skill "$target"
}

cmd_list() {
  local source
  source="$(resolve_skill_source)"
  printf '%-10s %-34s %-28s %s\n' '平台' '全局' '项目级(当前目录)' '状态'
  local id global_dir project_rel status
  while IFS='|' read -r id global_dir project_rel; do
    status=""
    if skill_installed "$global_dir" "$source"; then
      status="global"
    fi
    if skill_installed "$PWD/$project_rel" "$source"; then
      status="${status:+$status/}project"
    elif [[ -f "$PWD/$project_rel/$SKILL_NAME/SKILL.md" ]]; then
      status="${status:+$status/}project(copy?)"
    fi
    printf '%-10s %-34s %-28s %s\n' "$id" "$global_dir" "$PWD/$project_rel" "${status:--}"
  done < <(platforms_table)
  printf '\n源: %s\n' "$source"
}

cmd_install() {
  local platform="$1" scope="$2" mode="$3" project_root="$4"
  if [[ "$scope" != "global" && "$scope" != "project" ]]; then
    printf '无效 scope: %s\n' "$scope" >&2
    exit 1
  fi
  if [[ "$platform" == "all" ]]; then
    local id
    for id in $(platform_ids); do
      cmd_install_one "$id" "$scope" "$mode" "$project_root"
      printf '\n'
    done
    return 0
  fi
  cmd_install_one "$platform" "$scope" "$mode" "$project_root"
}

cmd_uninstall() {
  local platform="$1" scope="$2" project_root="$3"
  if [[ "$scope" != "global" && "$scope" != "project" ]]; then
    printf '无效 scope: %s\n' "$scope" >&2
    exit 1
  fi
  if [[ "$platform" == "all" ]]; then
    local id
    for id in $(platform_ids); do
      cmd_uninstall_one "$id" "$scope" "$project_root"
    done
    return 0
  fi
  cmd_uninstall_one "$platform" "$scope" "$project_root"
}

main() {
  local cmd="${1:-install}"
  shift || true

  case "$cmd" in
    -h|--help|help)
      usage
      exit 0
      ;;
    list)
      cmd_list
      exit 0
      ;;
    uninstall)
      ;;
    install|"")
      cmd="install"
      ;;
    codex|claude|workbuddy|cursor|opencode|all)
      set -- "$cmd" "$@"
      cmd="install"
      ;;
    *)
      printf '未知命令: %s\n\n' "$cmd" >&2
      usage >&2
      exit 1
      ;;
  esac

  local platform="${1:-all}"
  shift || true

  local scope="global"
  local mode="link"
  local project_root="$PWD"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --scope)
        scope="${2:-}"
        shift 2
        ;;
      --copy)
        mode="copy"
        shift
        ;;
      --project-root)
        project_root="${2:-}"
        shift 2
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        printf '未知选项: %s\n' "$1" >&2
        usage >&2
        exit 1
        ;;
    esac
  done

  project_root="$(cd "$project_root" && pwd)"

  case "$cmd" in
    install)
      cmd_install "$platform" "$scope" "$mode" "$project_root"
      ;;
    uninstall)
      cmd_uninstall "$platform" "$scope" "$project_root"
      ;;
  esac
}

main "$@"
