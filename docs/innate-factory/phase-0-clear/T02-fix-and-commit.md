# T02 — 修复规则并分批 commit

> Sprint 0 ｜ 状态：done（2026-09-10） ｜ 依赖：T01

## 步骤

1. 删除锁文件忽略规则（`bun.lock` / `pnpm-lock.yaml` / `package-lock.json` / `yarn.lock`）
2. `.agents/` 改为两行：`**/.agents/*` + `!**/.agents/skills/`（gitignore 语义：父目录整目录排除时无法反向包含，必须用 `*` 排除条目而非目录；中间带 `/` 的模式只匹配仓库根，故加 `**/` 覆盖嵌套 `.agents`）
3. 二进制通配区末尾追加 `!factory/templates/**`（为 phase-3 预铺，当前无实际影响）
4. `git add` 新解放的文件：`base/innate-fe-base/bun.lock`、各 `.agents/skills/**`
5. 两个 commit 分离关注点：
   - commit 1：`.gitignore` 修复 + 新入库文件
   - commit 2：`base/` 既有脏修改（innate-backend 的 M 文件）

## 验收

- `git status` 干净
- `git ls-files | grep -E 'bun\.lock|\.agents/skills'` 有输出
- 纯 clone 后 `bun install`（fe-base 内）按锁文件成功

## 风险

- base/ 脏修改与 ignore 修复混入同一 commit → 严格按步骤 5 分批

## 执行记录（2026-09-10）

1. 已删除锁文件忽略规则；`git check-ignore -q bun.lock` 退出码 1（不再忽略）。
2. `.agents/` 收窄为 `**/.agents/*` + `!**/.agents/skills/`。字面 T02 的 `.agents/*` 因 gitignore 中间斜杠只匹配仓库根，无法解放 `base/wip-skills/.agents/skills`；加 `**/` 后：skill 退出码 1，`.agents/cache` 退出码 0。
3. 已追加 `!factory/templates/**`。模板 png/bun.lock/skill 退出码 1；模板外 png 仍忽略。
4. 新解放文件：父仓无法 `git add base/innate-fe-base/bun.lock`（submodule pathspec）。fe-base 子仓 HEAD 已跟踪 `bun.lock` 与 `.agents/skills/**`。`base/wip-skills` 为嵌套 git 仓，未把其 skill 文件收进父仓 index。
5. 两个 commit：① `.gitignore` + phase-0 文档；② `base/innate-backend` 既有 M 文件。未把 phase-1+ 未提交改动塞进本 sprint。
