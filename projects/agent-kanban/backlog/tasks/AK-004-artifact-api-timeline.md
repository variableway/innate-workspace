---
id: AK-004
title: Artifact API + 任务详情时间线
status: backlog
priority: P0
labels: [area:artifact, area:dashboard, status:backlog]
assignee: unassigned
module: artifact-store, dashboard
gate:
  spec: approved
  plan: pending
blocked_by: [AK-003]
unlocks: [AK-005]
---

## Spec

执行过程可存可看：plan/note/summary（及 spec）挂在 task/assignment 上；详情面板按时间线展示。完成闸：complete 前无 summary 则 400（若 complete 已存在）。

## Acceptance Criteria

- [ ] CRUD + `GET /tasks/{id}/artifacts` 按时间排序
- [ ] kind / version 约束有契约测试
- [ ] 前端详情可区分 spec / plan / note / summary
- [ ] Issue 不双写长日志（若回写则仅短评 + 链接）

## Plan

（认领后写。）

## Notes

## Summary
