# 任务：定义 Agent Runtime 最小 API

- **状态**：pending
- **模块**：05-agent-runtime
- **优先级**：P0
- **依赖**：04-agent-provider T01

## 目标

书面定义 Runtime 对外接口，使 Desktop/CLI/Server 可共用同一抽象。

## 执行步骤

1. 定义接口：创建 session、发消息、订阅 stream 事件、工具审批、停止、加载 skill
2. 写 `docs/runtime-api.md`（可含序列图）
3. 事件命名与 flock IPC 对照表（仅对照，不要求兼容）

## 产出

- `docs/runtime-api.md`

## 验收标准

- [ ] API 覆盖 session / stream / tool approval / stop
- [ ] 明确「无 UI 依赖」
- [ ] 注明如何注入 Provider 配置（依赖 04 契约）

## 如何执行

```text
请执行 base/innate-foundation/modules/05-agent-runtime/tasks/T01-runtime-api.md，使用 Local Workflow。
```
