# 任务：实现 Runtime MVP（session + tool loop + stream）

- **状态**：pending
- **模块**：05-agent-runtime
- **优先级**：P0
- **依赖**：T02；04-agent-provider T03

## 目标

按 ADR 落地可运行 MVP：能完成一轮带工具调用（可 mock tool）的对话循环，并流式输出。

## 执行步骤

1. 初始化项目骨架
2. 实现 API 子集：session、message、stream、可选 tool approval
3. 提供 CLI 或集成测试演示
4. README 写运行方式

## 产出

- runtime 源码 + demo/smoke
- README

## 验收标准

- [ ] 无 Desktop/Tauri 依赖即可运行 demo
- [ ] 能观察到流式事件
- [ ] 工具调用路径可演示（真实或 mock）

## 如何执行

```text
请执行 base/innate-foundation/modules/05-agent-runtime/tasks/T03-mvp-loop.md，使用 Local Workflow。
```
