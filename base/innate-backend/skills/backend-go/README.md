# backend-go / Innate Go Backend Skill

产品化自 `base/references/backend/golang-backend/vine-skill`，落点：

```text
base/innate-backend/skills/backend-go/
```

Skill 名：`backend-go`（见 `SKILL.md` frontmatter）。

**基线**：始终用最新 Vine（`@latest`）。Go / skelc 跟该 Vine 的 `go.mod` 与 `skel.MinSkelcVersion()`，不要在文档里写死次版本号。当前 API 见 `SKILL.md` §2d。

## 样例与脚手架

| 用途 | 路径 | 说明 |
|------|------|------|
| 跑 / 改 Innate 后端基础工程 | `base/innate-backend/innate-go` | meta CRUD + CLI；**已合并**旧 `innate-meta-api` |
| 完整 Vine REST demo | `innate-go/samples/vine-rest` | **已合并**旧 `innate-vine-rest`；当参考实现读 |
| 新建 Vine standalone | [`templates/vine-standalone/`](./templates/vine-standalone/) | skill 内脚手架，拷贝后 `go get go.yorun.ai/vine@latest` |

目录约定见 [`templates/README.md`](./templates/README.md)。不要在 `templates/` 再放一份 innate-go 业务代码。

## Install

```bash
# 全部 Agent（Codex / Claude Code / Workbuddy / Cursor / OpenCode）
../../scripts/install-backend-go-skill.sh all

# 或手动 symlink（单 Agent）
ln -s "$(pwd)" ~/.claude/skills/backend-go
```

见 [`../../scripts/install-backend-go-skill.sh`](../../scripts/install-backend-go-skill.sh) 的 `help` / `list`。
