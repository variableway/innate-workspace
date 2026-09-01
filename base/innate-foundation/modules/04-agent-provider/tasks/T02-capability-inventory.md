# 任务：盘点 flock 与 aiswitcher 的 Provider 能力

- **状态**：pending
- **模块**：04-agent-provider
- **优先级**：P0
- **依赖**：T01、G02

## 目标

对照参考实现，列出可抽离 vs 应留在产品/服务中的能力，避免重复造轮或错误耦合。

## 执行步骤

1. 阅读 `flock/crates/flock-core` 中 providers / model_factory / config
2. 阅读 `projects/tooling/innate-aiswitcher` 的职责（切换/代理）
3. 写 `docs/capability-inventory.md`：表格列出能力、来源、是否进入本库

## 产出

- `docs/capability-inventory.md`

## 验收标准

- [ ] 每条能力有：来源路径、纳入本库 Y/N、理由
- [ ] 明确「配置库不做代理转发」

## 如何执行

```text
请执行 base/innate-foundation/modules/04-agent-provider/tasks/T02-capability-inventory.md，使用 Local Workflow。
```
