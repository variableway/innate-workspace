# 任务：写清组件包消费方式

- **状态**：pending
- **模块**：07-desktop-components
- **优先级**：P1
- **依赖**：T03

## 目标

文档说明 Desktop 应用如何安装/引用本组件包，以及与 shell lib、runtime 的组装顺序。

## 执行步骤

1. 写 `docs/consume.md`
2. 给出最小组装示例（可伪代码）
3. 更新模块 README Quick Start

## 产出

- `docs/consume.md`
- README 更新

## 验收标准

- [ ] 新应用按文档能理解依赖顺序：shell → components → runtime/provider
- [ ] 说明 peer deps（React / Tauri API 等）

## 如何执行

```text
请执行 base/innate-foundation/modules/07-desktop-components/tasks/T04-consume-story.md，使用 Local Workflow。
```
