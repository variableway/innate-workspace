# 任务：定义与 innate-fe-base 的分层关系

- **状态**：pending
- **模块**：07-desktop-components
- **优先级**：P0
- **依赖**：T01；建议 01-fe-base T03

## 目标

避免 Desktop 与 Web 两套完全割裂：约定 token / 原始组件复用策略。

## 执行步骤

1. 对比 `@innate/ui` 与桌面需求
2. 写 `docs/layering-with-fe-base.md`：复用什么、桌面独有什么、禁止什么
3. 若短期无法 npm 依赖 fe-base，写明过渡方案（复制 token / 子路径 / 延后）

## 产出

- `docs/layering-with-fe-base.md`

## 验收标准

- [ ] 有清晰分层图或表格
- [ ] T03 实现时不会「从零再造 Button」而无说明

## 如何执行

```text
请执行 base/innate-foundation/modules/07-desktop-components/tasks/T02-fe-desktop-layering.md，使用 Local Workflow。
```
