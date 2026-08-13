---
id: AK-000
title: 手工看板总说明与优先级建板
status: in_review
priority: P0
labels: [docs, process]
assignee: human
module: dashboard, review-gates, task-orchestrator
gate:
  spec: approved
  plan: approved
---

## Spec

把「用系统自己的看板方法做系统」写成可执行手册：步骤、目的、模块映射、任务卡格式，并排出可先做的实现卡。

非目标：本卡不实现后端 API。

## Acceptance Criteria

- [x] PLAYBOOK 覆盖步骤 0–10，每步有目的 / 手工 / 模块 / 自动化后
- [x] BOARD 四列 + WIP + AK-001…010 优先级
- [x] 任务卡字段能映射到 Task / Assignment / Gate / Artifact
- [x] 明确下一张动手的卡是 AK-001

## Plan

新增 `backlog/PLAYBOOK.md`、`BOARD.md`、`tasks/AK-000`～`AK-010`；根 README 链到手册。不改运行时代码。

## Notes

- 文档提交已在 `9981995` 完成，作为 done 列的前置产物。
- 实现卡默认 `gate.plan=pending`，认领后先写 Plan 再改代码。

## Summary

手工 Kanban 已建板。请审 PLAYBOOK 与优先级；批准后认领 AK-001。
