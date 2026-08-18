# 任务：对齐并验证 backend-go Skill

- **状态**：pending
- **模块**：02-be-base
- **优先级**：P1
- **依赖**：T03（建议样例项目可跑）
- **落点**：`base/innate-backend/skills/backend-go`（已由 vine-skill 迁入）

## 目标

确认 `backend-go` 可被 Agent 加载；对照 FE skill sync 模式补安装说明；用样例项目做一次小改动验收。

## 执行步骤

1. 阅读 `base/innate-backend/README.md` 与 `skills/backend-go/SKILL.md`
2. 运行 `base/innate-backend/scripts/install-backend-go-skill.sh all`（或 `list` 验证）
3. 在 `innate-backend/innate-go (meta server)` 或 `vine-rest sample` 上按 skill 加一条小改动并验证
4. 若缺触发词/禁止事项/路径表，补进 `SKILL.md` 或模块 README

## 产出

- 安装验证说明（可写在 innate-backend README）
- 一次可复现的 skill 驱动改动记录（tracing）

## 验收标准

- [ ] Skill 名 `backend-go` 可被发现
- [ ] 明确指向两个样例项目路径
- [ ] Agent 能按 skill 落地一个小改动

## 如何执行

```text
请执行 base/innate-foundation/modules/02-be-base/tasks/T06-be-starter-skill.md，使用 Local Workflow。
```
