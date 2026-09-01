# 任务：提炼 Desktop 基础组件清单

- **状态**：pending
- **模块**：07-desktop-components
- **优先级**：P0
- **依赖**：G02

## 目标

从 Flock 等桌面交互中提炼**跨产品**组件清单（非产品页面）。

## 执行步骤

1. 列出候选：ChatTranscript、ToolApproval、ProviderSettings、WorkspaceShell、StatusBar 等
2. 写 `docs/component-inventory.md`：优先级 P0/P1、是否依赖 Tauri
3. 标明明确不做的产品专属页

## 产出

- `docs/component-inventory.md`

## 验收标准

- [ ] ≥5 个 P0 组件有一句话职责
- [ ] 每个组件标注 Tauri 依赖：none / optional / required

## 如何执行

```text
请执行 base/innate-foundation/modules/07-desktop-components/tasks/T01-component-inventory.md，使用 Local Workflow。
```
