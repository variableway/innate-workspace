# 任务：达升格门槛并准备 registry 登记

- **状态**：pending
- **模块**：02-be-base
- **优先级**：P2
- **依赖**：T04、G03

## 目标

确认模块达到独立仓门槛；若用户要求再执行真正的 GitHub/registry 登记（默认只准备材料，不擅自建远程仓）。

## 执行步骤

1. 对照 `docs/registry-checklist.md` 自检
2. 补齐 README / AGENTS.md / 最小测试或 smoke 脚本
3. 写 `docs/registry-ready.md`：是否 ready、剩余缺口
4. **不要**在用户未明确要求时创建远程仓或改父仓 registry

## 产出

- `docs/registry-ready.md`
- AGENTS.md（若缺失）

## 验收标准

- [ ] checklist 每一项有 pass/fail
- [ ] fail 项有明确跟进任务或说明

## 如何执行

```text
请执行 base/innate-foundation/modules/02-be-base/tasks/T05-prepare-registry.md，使用 Local Workflow。
```
