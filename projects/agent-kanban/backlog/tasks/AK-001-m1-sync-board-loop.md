---
id: AK-001
title: 验收并收口现有 4 列看板与 GitHub 同步
status: backlog
priority: P0
labels: [area:sync, area:dashboard, status:backlog]
assignee: unassigned
module: sync-engine, dashboard, task-orchestrator
gate:
  spec: approved
  plan: pending
blocked_by: []
unlocks: [AK-002, AK-003]
---

## Spec

当前 Node/Go 与前端已有四列与同步设计，但「Issue 变更 ↔ 看板一致、拖拽回写 label」必须先被验证并修漏洞。这是整板地基：上层 Artifact/TIP 都假设 Task 状态可靠。

非目标：不实现 Artifact / TIP / IM。

## Acceptance Criteria

- [ ] 本地 `task dev:node` + 前端可展示四列：backlog / in_progress / in_review / done
- [ ] 有 `GITHUB_TOKEN` 时：改 Issue `status:*` 或 close → 看板列在可接受延迟内一致（webhook 或一次轮询）
- [ ] 看板 PATCH 列成功后写回 `status:*`；无 token 时跳过且进程不崩
- [ ] WIP：in_progress≤5、in_review≤3，超限 409
- [ ] Agent complete 路径若已存在：进入 **in_review** 而非直接 done
- [ ] 已知缺口记入 Notes，不在本卡顺手做 M2

## Plan

（认领后填写：测哪些路径、改哪些文件、不改哪些文件。）

## Notes

## Summary
