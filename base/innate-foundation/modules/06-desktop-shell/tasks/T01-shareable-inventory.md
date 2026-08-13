# 任务：盘点 Tauri 层可共享能力

- **状态**：pending
- **模块**：06-desktop-shell
- **优先级**：P0
- **依赖**：G02

## 目标

从 `flock-ui/src-tauri` 列出可抽成共享 lib 的能力 vs 必须留在产品的能力。

## 执行步骤

1. 浏览 commands、窗口配置、构建脚本、updater 等
2. 写 `docs/shareable-inventory.md`

## 产出

- `docs/shareable-inventory.md`

## 验收标准

- [ ] 表格含：能力、路径、共享 Y/N、理由
- [ ] 明确「Agent 业务 command」不进 shell lib

## 如何执行

```text
请执行 base/innate-foundation/modules/06-desktop-shell/tasks/T01-shareable-inventory.md，使用 Local Workflow。
```
