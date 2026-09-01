# 任务：确认 innate-fe-base 为前端唯一入口

- **状态**：pending
- **模块**：01-fe-base
- **优先级**：P0
- **依赖**：无（建议先完成 G01）

## 背景

前端代码已在 `base/innate-fe-base`，但 base 总览与 foundation 模块之间缺少「唯一入口」声明。

## 目标

让任何人从 `base/` 或 foundation 都能跳到正确前端仓，且不会再建平行模板仓。

## 执行步骤

1. 在 `modules/01-fe-base/README.md` 与 `base/README.md`（若 G01 已改）确认指向 `innate-fe-base`
2. 在 `innate-fe-base/README.md` 顶部增加「本仓是 innate-works/base 前端基础唯一入口」说明，并链回 `innate-foundation`
3. 检查 `registry.yaml` 中 `innate-fe-base` 描述是否准确；如需微调只改描述字段

## 产出

- 文档交叉引用更新（base / foundation / innate-fe-base）

## 验收标准

- [ ] 三处文档互相可抵达
- [ ] 无第二套「前端模板」目录被建议新建

## 如何执行

```text
请执行 base/innate-foundation/modules/01-fe-base/tasks/T01-canonical-entry.md，使用 Local Workflow。
```
