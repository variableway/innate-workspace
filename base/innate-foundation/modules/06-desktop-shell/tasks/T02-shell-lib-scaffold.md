# 任务：搭建 Tauri shell / packaging lib

- **状态**：pending
- **模块**：06-desktop-shell
- **优先级**：P0
- **依赖**：T01

## 目标

落地可被其它 app 依赖的最小 shell 库（窗口生命周期、基础 IPC 约定、构建辅助）。

## 执行步骤

1. 初始化 lib 工程（Rust crate 和/或 JS 构建工具）
2. 实现盘点中标记为 Y 的最小集合
3. 提供版本与 feature 开关策略说明

## 产出

- shell lib 源码
- 模块 README 简介

## 验收标准

- [ ] 库可被独立编译/打包
- [ ] 不包含 Flock 业务实体

## 如何执行

```text
请执行 base/innate-foundation/modules/06-desktop-shell/tasks/T02-shell-lib-scaffold.md，使用 Local Workflow。
```
