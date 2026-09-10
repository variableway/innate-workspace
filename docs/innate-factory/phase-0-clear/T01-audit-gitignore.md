# T01 — .gitignore 审计

> Sprint 0 ｜ 状态：done（2026-09-10）

## 背景

innate-workspace 的 `.gitignore` 是多轮叠加的产物（自定义 + OS + Go + Python + Node + Rust + 二进制 + local toolchains），其中三条规则与 factory 机制冲突，两条已造成实际损害（bun.lock 未入库、`.agents/skills/` 未入库）。

## 步骤

1. `git status --ignored --porcelain` 找出"被忽略但可能该入库"的文件，重点 `base/` 与 `factory/`
2. `git check-ignore -v <路径>` 定位每条命中规则的行号
3. 核对三类冲突（锁文件 / `.agents/` / 二进制通配）的实际影响面
4. 产出修复清单（进 T02）

## 验收

修复清单覆盖三类冲突，且每条有对应的命中文件证据。

## 风险

- `.agents/` 解除忽略后可能带出 agent 会话垃圾 → 用 `.agents/*` + `!.agents/skills/` 收窄，不整目录放行

## 执行记录（2026-09-10）

`git status --ignored --porcelain` + `git check-ignore -v` 复核三类冲突，修复清单如下（进 T02）。

| 规则（修复前行号） | 命中证据 | 影响 | T02 修复 |
|--------------------|----------|------|----------|
| L181–184 `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml` / `bun.lock` | `git check-ignore -v` 命中 `factory/templates/app-content/bun.lock`、selfhost 调研仓 `app/package-lock.json` | Phase 3 模板锁文件无法入库；父仓无法索引锁文件 | 删除四条锁文件规则 |
| L192 `.agents/` | 命中 `base/wip-skills/.agents/skills/understand`、`factory/templates/app-content/.agents/skills/foo/SKILL.md` | 仓库级 skill 与模板起步 skill 无法入库 | 改为 `**/.agents/*` + `!**/.agents/skills/`（字面 `.agents/*` 因中间斜杠只匹配仓库根，嵌套路径无效） |
| L80 `*.png`（及同区 `*.woff` 等） | 命中 `factory/templates/app-content/icon.png`、selfhost 调研 png | Phase 3 模板图标/字体被忽略 | 追加 `!factory/templates/**` |

补充事实（与「损害已发生」表述对齐、但落点在 submodule 而非父仓 index）：

- `base/innate-fe-base` 是 gitlink（`160000`），父仓 `git add` 无法收录其内部文件。子仓 HEAD 已跟踪 `bun.lock` 与 `.agents/skills/**`；父仓 `.gitignore` 挡住的是**将来写进父树的路径**（`factory/templates/`、若把 wip-skills 以普通目录纳入时的 skill）。
- `base/wip-skills` 自身是嵌套 git 仓，当前仅以未跟踪目录出现；父仓 `git ls-files` 在本 sprint 不会列出其 `.agents/skills`。
- 有意保持忽略：`innate-apps/`、`references/`、`data/`、`projects/`、`.tools/` 等。
