---
id: AK-003
title: 新表迁移落地（artifact / gate / tip / notify / edge）
status: backlog
priority: P0
labels: [area:data, status:backlog]
assignee: unassigned
module: artifact-store, review-gates, notifier
gate:
  spec: approved
  plan: pending
blocked_by: [AK-002]
unlocks: [AK-004, AK-005]
---

## Spec

把 `docs/schema.sql` 扩展表应用到 Go migrate 与 Node bootstrap，空库可建、旧库可升，进程能启动。本卡不暴露完整业务 API。

## Acceptance Criteria

- [ ] Go `migrations/` 有 up/down，覆盖新表与 `assignment.stage`
- [ ] Node 启动 `db.exec` 与 schema 一致（或同等 migrate）
- [ ] 空库启动成功；已有 dev.db 有升级路径说明
- [ ] 不在本卡实现 TIP handler

## Plan

（认领后写。）

## Notes

## Summary
