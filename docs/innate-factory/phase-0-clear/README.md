# Sprint 0 — 清障

> 状态：done（2026-09-10）｜ 前置：无 ｜ 设计依据：innate-factory.md §10 Phase 0

## 总体目标

手术从干净树开始，且 `.gitignore` 与 factory 机制的冲突在 commit 之前修掉（顺序反了，被旧规则压住的文件不会进 commit）。

## 任务表

| ID | 任务 | 状态 | 依赖 |
|----|------|------|------|
| [T01](./T01-audit-gitignore.md) | .gitignore 审计：找出与 factory 冲突的规则 | done | none |
| [T02](./T02-fix-and-commit.md) | 修复规则 + 解放文件入库 + 分两个 commit | done | T01 |

## 已知冲突（2026-09-09 审计结论）

| 规则 | 冲突 | 修复方向 |
|------|------|----------|
| `bun.lock` / `pnpm-lock.yaml` 等锁文件被忽略 | fe-base 的 bun.lock 未入库 → 发布不可复现 | 删规则，锁文件入库 |
| `.agents/` 整目录忽略 | 仓库级 skill 永不入库（fe-base / wip-skills 已中招） | 收窄为 `**/.agents/*` + `!**/.agents/skills/` |
| `*.png` `*.woff` 等二进制通配 | phase-3 模板资产会被忽略 | 预铺 `!factory/templates/**` |

## 验收

- `git status` 干净；`git ls-files` 可见 `bun.lock` 与 `.agents/skills/` 内容
- 纯 clone 后 fe-base 可按锁文件复现安装

## 执行记录（2026-09-10）

规则已按 T01 清单修复并分两个 commit 入库（gitignore+文档 / innate-backend 既有 M 文件）。

父仓验收的字面条件需对照仓库形态：

- `base/innate-fe-base` 是 gitlink，父仓 `git ls-files` 不会列出其 `bun.lock` / `.agents/skills`；子仓内两者均已跟踪（`git -C base/innate-fe-base ls-files bun.lock .agents/skills`）。
- `factory/` 尚未落地，本 sprint 无新解放的模板文件可 `git add`。
- 工作区仍有后续 sprint 改动（phase-1 registry 等），**未**并入本 sprint 的两个 commit，故父仓 `git status` 不会因本任务而完全干净。
