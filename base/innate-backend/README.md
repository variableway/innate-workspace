# innate-backend — Go 后端 Skill 与工程

对齐 `innate-fe-base`：后端 Skill 与可执行 Go 工程同属本目录。

## 内容

| 路径 | 说明 |
|------|------|
| [`innate-go/`](innate-go/) | Go 基础工程（CLI `innate-go`、meta CRUD、Vine REST sample、desktop Cargo helpers） |
| [`skills/backend-go/`](skills/backend-go/) | Go + Vine 开发 Skill |
| [`scripts/install-vine.sh`](scripts/install-vine.sh) | 安装 `vine` / `skelc` |

上游参考：`base/references/backend/golang-backend/vine-skill`。

## Skill 安装

将 `backend-go` 安装到本机各 Agent（Codex、Claude Code、Workbuddy、Cursor、OpenCode）：

```bash
# 在 innate-backend 目录下
./scripts/install-backend-go-skill.sh all

# 仅安装到指定 Agent
./scripts/install-backend-go-skill.sh cursor claude

# 项目级（当前仓库 .cursor/skills 等）
./scripts/install-backend-go-skill.sh all --scope project --project-root /path/to/innate-works

# 查看已安装状态
./scripts/install-backend-go-skill.sh list

# 卸载
./scripts/install-backend-go-skill.sh uninstall all
```

| Agent | 全局目录 |
|-------|----------|
| Codex | `~/.codex/skills/backend-go` |
| Claude Code | `~/.claude/skills/backend-go` |
| Workbuddy | `~/.workbuddy/skills/backend-go` |
| Cursor | `~/.cursor/skills/backend-go` |
| OpenCode | `~/.config/opencode/skills/backend-go` |

默认使用 **symlink** 指向 `skills/backend-go/`；离线/打包场景加 `--copy`。

## 可执行工程

```bash
cd innate-go
task build
./bin/innate-go desktop-app config   # Tauri 共享 Cargo
./bin/innate-go server               # meta CRUD REST
task run:vine                        # Vine REST sample (:18081)
```

Foundation 任务索引：[`innate-foundation/modules/02-be-base`](../innate-foundation/modules/02-be-base/)。
