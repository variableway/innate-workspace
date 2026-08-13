---
id: AK-006
title: TIP 最小闭环 claim → complete
status: backlog
priority: P1
labels: [area:tip, status:backlog]
assignee: unassigned
module: agent-protocol, agent-runtime, dispatch-scheduler
gate:
  spec: approved
  plan: pending
blocked_by: [AK-005]
unlocks: [AK-007, AK-008]
---

## Spec

异构 Agent 不直写 DB：`POST /tip` 支持 claim / heartbeat / progress / complete / fail（及已有闸动词）。并发 claim 仅一成功；complete → in_review + summary。

## Acceptance Criteria

- [ ] message_id 幂等
- [ ] 两并发 claim 仅一个 running
- [ ] complete 无 summary 400；成功 task=`in_review`
- [ ] lease 超时 → failed 并释放槽
- [ ] Polling 或 Push 至少一种 Adapter 跑通

## Plan

（认领后写。）

## Notes

## Summary
