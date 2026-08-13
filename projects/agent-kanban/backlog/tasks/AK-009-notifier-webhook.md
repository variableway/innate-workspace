---
id: AK-009
title: Notifier：generic webhook + 一种 IM
status: backlog
priority: P1
labels: [area:notify, status:backlog]
assignee: unassigned
module: notifier
gate:
  spec: approved
  plan: pending
blocked_by: [AK-006]
unlocks: []
---

## Spec

完成/失败/待审可出站。无渠道时主流程不失败。至少 generic webhook + 一种 IM（飞书或 Slack）能收到 completed。密钥不进列表明文。

## Acceptance Criteria

- [ ] notify_channel CRUD（掩码 secret）
- [ ] 订阅过滤 events
- [ ] delivery_log 可查；失败重试最多 3 次
- [ ] 无渠道时 complete 仍 200

## Plan

（认领后写。）

## Notes

## Summary
