# BOARD — Agent Kanban 实现看板（手工）

> 操作规则：[PLAYBOOK.md](./PLAYBOOK.md)  
> 更新：2026-08-13（建板；AK-001 为下一张可动手的卡）

WIP：`in_progress` ≤ 1 · `in_review` ≤ 3

---

## backlog

| 序 | ID | 标题 | 优先级 | 主模块 | 解锁 |
|----|-----|------|--------|--------|------|
| 1 | [AK-001](tasks/AK-001-m1-sync-board-loop.md) | 验收并收口现有 4 列看板 + GitHub 同步 | P0 | sync-engine, dashboard, orchestrator | 全部后续 |
| 2 | [AK-002](tasks/AK-002-openapi-contract-align.md) | OpenAPI 对齐 schema/types（Artifact/Gate/TIP/Notify） | P0 | docs 契约 | 双后端实现 |
| 3 | [AK-003](tasks/AK-003-schema-migration.md) | 新表迁移落地（artifact/gate/tip/notify/edge） | P0 | artifact-store, review-gates | M2 API |
| 4 | [AK-004](tasks/AK-004-artifact-api-timeline.md) | Artifact API + 详情时间线 | P0 | artifact-store, dashboard | Plan 闸 UI |
| 5 | [AK-005](tasks/AK-005-review-gates-api.md) | 审查闸 API（stage + decide + submit_plan） | P0 | review-gates, agent-protocol | 禁止无计划 complete |
| 6 | [AK-006](tasks/AK-006-tip-min-loop.md) | TIP 最小闭环 claim → complete | P1 | agent-protocol, runtime, dispatch | 多 Agent |
| 7 | [AK-007](tasks/AK-007-bootstrap-envelope.md) | Bootstrap 信封 + workflow URI | P1 | agent-protocol, runtime | Adapter 指令入口 |
| 8 | [AK-008](tasks/AK-008-handoff.md) | Handoff + task_edge | P1 | dispatch, orchestrator | 多 Agent 协作 |
| 9 | [AK-009](tasks/AK-009-notifier-webhook.md) | Notifier：generic webhook + 一种 IM | P1 | notifier | 完成可达 |
| 10 | [AK-010](tasks/AK-010-swimlane-deps.md) | Agent Swimlane + 依赖可视化 | P2 | dashboard | M4 |

---

## in_progress

（空 — 下一张认领：**AK-001**）

---

## in_review

| ID | 标题 | 说明 |
|----|------|------|
| [AK-000](tasks/AK-000-manual-kanban-playbook.md) | 手工看板总说明与优先级建板 | 本目录 + PLAYBOOK；等人审是否按此流程开工 |

---

## done

| ID | 标题 | 说明 |
|----|------|------|
| — | 需求对齐文档与 canvas-load | commit `9981995`：双 SoT、闸、TIP、canvas SSOT |
