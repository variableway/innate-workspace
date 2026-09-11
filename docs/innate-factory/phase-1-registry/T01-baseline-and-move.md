# T01 — 基线同步 + git mv

> Sprint 1 ｜ 状态：done（2026-09-10）

## 步骤

1. 跑 `scan-innate-apps.py` 建立基线（**必须在搬家前**，否则无法区分"搬家引入的 diff"和"本来欠的同步债"）
2. `mkdir registry && git mv registry-innate.yaml registry/apps.yaml`

## 执行记录

### 2026-09-09（先前工作区，未入库）

- 基线同步发现 registry 与目录严重脱节：**新增 17 条**（当时 `base/wip-skills` 整区及其克隆、innate-keepthem）、**移除 2 条**（Easel、HarleyCoops 目录已不存在）

### 2026-09-10（本 sprint 入库）

- phase-0 pre-commit 曾把 `registry-innate.yaml` 从 HEAD 删掉，父仓无法再对现存文件做 `git mv`；从 `2d88191^` 检出后迁到 `registry/apps.yaml`（相对当前 HEAD 记为新增，历史在删除 commit 处断开）
- `wip-skills` 已从 `base/wip-skills` 迁到 `skills/wip-skills`（`skills/` = 全部配套 skill 落点）。scan 按 repo URL 匹配，**16 条 path 更新**，kind/desc 保留
- 新增 `skills/fe-design-skills/hallmark`；移除已不存在的 `innate-apps/tooling/innate-aiswitcher/MyAgents`
- 搬家后第二次 scan：added 0 / removed 0 / diff 为零

## 遗留观察

`skills/wip-skills/` 下深层克隆仍进入 `apps.yaml`（缺省 external）。若嫌噪音，可把 `skills/wip-skills/wip/` 迁入 references 管理体系（spark-cli），或给 scan 加排除——不在本 sprint 擅动。
