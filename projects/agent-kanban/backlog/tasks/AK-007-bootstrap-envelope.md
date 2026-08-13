---
id: AK-007
title: Bootstrap 信封 + workflow URI
status: backlog
priority: P1
labels: [area:tip, area:runtime, status:backlog]
assignee: unassigned
module: agent-protocol, agent-runtime
gate:
  spec: approved
  plan: pending
blocked_by: [AK-006]
unlocks: []
---

## Spec

指令入口（AGENTS.md / MCP）由 Adapter 维护；本卡提供机器信封 `GET /assignments/{id}/bootstrap` 与 `kanban://workflow/*`（或 REST 等价），含 `required_first_tip` 与 `forbidden_until_plan_approved`。

非目标：不批量改各 IDE 的 AGENTS.md 全文工作流。

## Acceptance Criteria

- [ ] bootstrap JSON 符合 `BootstrapEnvelope`
- [ ] overview/spec/plan/implement/finalize 文档可拉取
- [ ] CLI 或 README 给出入口文件「短指针」示例
- [ ] Push webhook body 可附带同一 bootstrap

## Plan

（认领后写。）

## Notes

## Summary
