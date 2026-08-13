# 任务：新建模块的 registry / submodule 登记流程

- **状态**：pending
- **模块**：governance
- **优先级**：P1
- **依赖**：G01

## 背景

父仓用 `registry.yaml` + `scripts/clone.py` 管理子项目。新模块升格为独立仓时需要统一登记步骤。

## 目标

沉淀一份可复制的登记 checklist，供 be/infra/agent/desktop 模块完成 MVP 后使用。

## 执行步骤

1. 阅读父仓 `registry.yaml`、`.gitmodules`、`scripts/clone.py` 用法
2. 写 `base/innate-foundation/docs/registry-checklist.md`：创建 GitHub 空仓 → 推送 → 追加 registry → 追加 submodule → `clone.py` 验证
3. 列出各模块「何时可以登记」的最低门槛（README、可构建、至少 1 个可运行示例）

## 产出

- `docs/registry-checklist.md`

## 验收标准

- [ ] checklist 步骤可独立照做完成一次登记
- [ ] 每个待建模块都有「升格门槛」一行说明

## 如何执行

```text
请执行 base/innate-foundation/tasks/G03-registry-bootstrap.md，使用 Local Workflow。
```
