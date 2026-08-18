# backend-go / Innate Go Backend Skill

产品化自 `base/references/backend/golang-backend/vine-skill`，落点：

```text
base/innate-backend/skills/backend-go/
```

Skill 名：`backend-go`（见 `SKILL.md` frontmatter）。

## 样例

- Vine REST：`base/innate-backend/innate-go/samples/vine-rest`
- Meta CRUD（无 Vine）：`base/innate-backend/innate-go`

## Install

```bash
# 全部 Agent（Codex / Claude Code / Workbuddy / Cursor / OpenCode）
../../scripts/install-backend-go-skill.sh all

# 或手动 symlink（单 Agent）
ln -s "$(pwd)" ~/.claude/skills/backend-go
```

见 [`../../scripts/install-backend-go-skill.sh`](../../scripts/install-backend-go-skill.sh) 的 `help` / `list`。
