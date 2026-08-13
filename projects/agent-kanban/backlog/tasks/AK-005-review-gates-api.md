---
id: AK-005
title: 审查闸 API（stage + decide + submit_plan）
status: backlog
priority: P0
labels: [area:gates, status:backlog]
assignee: unassigned
module: review-gates, agent-protocol, dashboard
gate:
  spec: approved
  plan: pending
blocked_by: [AK-004]
unlocks: [AK-006]
---

## Spec

落实 Spec/Plan 闸的服务端强制：`assignment.stage`、`kanban_gate`、人工 `decide`。plan.required 时未批准不能走成功 complete。Dashboard 能批准/驳回 plan。

## Acceptance Criteria

- [ ] `submit_plan` 后 stage=`wait_plan`
- [ ] wait_plan 时 `progress(implement)` 或无闸 `complete` → 400
- [ ] `POST /gates/{id}/decide` approved → stage=`implement`；rejected → 回到 plan 且要求新 version
- [ ] 详情展示闸状态；skip_labels 策略至少有测例或配置位

## Plan

（认领后写。）

## Notes

## Summary
