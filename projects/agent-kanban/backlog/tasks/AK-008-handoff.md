---
id: AK-008
title: Handoff + 任务依赖边
status: backlog
priority: P1
labels: [area:dispatch, status:backlog]
assignee: unassigned
module: dispatch-scheduler, task-orchestrator, agent-protocol
gate:
  spec: approved
  plan: pending
blocked_by: [AK-006]
unlocks: []
---

## Spec

多 Agent 协作：`handoff` 结束旧 Assignment、创建新 Assignment，`context_ref` 指向 artifact。`task_edge` 表达 parent_of / blocks，看板可展示简单依赖。

## Acceptance Criteria

- [ ] handoff 后原 assignment 不可 progress
- [ ] 新 assignment pending 且 instruction/bootstrap 含 context_ref
- [ ] 至少一种依赖在详情或板上可见
- [ ] 两异构角色串行交接同一父任务有测例或手工脚本

## Plan

（认领后写。）

## Notes

## Summary
