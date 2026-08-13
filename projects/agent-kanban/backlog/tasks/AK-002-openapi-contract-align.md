---
id: AK-002
title: OpenAPI 对齐 schema/types（Artifact / Gate / TIP / Notify）
status: backlog
priority: P0
labels: [area:contract, status:backlog]
assignee: unassigned
module: docs（契约 SSOT）
gate:
  spec: approved
  plan: pending
blocked_by: [AK-001]
unlocks: [AK-003, AK-004, AK-005, AK-006, AK-009]
---

## Spec

`docs/schema.sql` 与 `types.ts` 已含新实体，但 `openapi.yaml` 仍是旧表面。双后端实现必须以 OpenAPI 为路径 SSOT。本卡只补契约与 contract-tests 条目，不写业务逻辑。

## Acceptance Criteria

- [ ] openapi 含 Artifact CRUD、Gate decide、TIP POST、Bootstrap GET、Notify channel 的 path/schema
- [ ] 与 `types.ts` / `schema.sql` 字段同名同枚举（含 `spec` kind、`submit_plan`、`stage`）
- [ ] `contract-tests.yaml` 增加：无 summary complete→400、无 plan 闸 complete→400（可先标 pending 实现）
- [ ] `docs/README.md` 路径表已指向新 path

## Plan

（认领后写：先改哪些 path 块、如何与现有 /tasks 兼容。）

## Notes

## Summary
