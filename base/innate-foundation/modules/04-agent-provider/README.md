# 04-agent-provider — AI Agent Provider Configuration Lib

## 范围

多 Provider / Profile / API Key / 模型列表 / 兼容层的**可复用配置库**（非切换代理服务）。

## 代码落点

- 本目录实现库代码（语言由 T01 决定）
- 参考：`base/flock`（flock-core providers）、`projects/tooling/innate-aiswitcher`

## 依赖

- G02（flock 定位）
- 被 `05-agent-runtime`、桌面模块消费

## 任务索引

| 任务 | 说明 | 优先级 |
|------|------|--------|
| [T01-config-contract.md](tasks/T01-config-contract.md) | 配置契约 / schema | P0 |
| [T02-capability-inventory.md](tasks/T02-capability-inventory.md) | flock + aiswitcher 能力盘点 | P0 |
| [T03-lib-mvp.md](tasks/T03-lib-mvp.md) | 实现库 MVP | P0 |
| [T04-aiswitcher-boundary.md](tasks/T04-aiswitcher-boundary.md) | 与 aiswitcher 边界文档 | P1 |
