# 任务：Separated 模式样例

- **状态**：pending
- **模块**：02-be-base
- **优先级**：P2（低于 linked）
- **依赖**：T04
- **参考**：vine-skill `refs/05-microservice-dev.md`（separated 段）、`refs/11-hub-link-portal-ops.md`

## 背景

生产向拓扑：Hub / Portal / Link / 业务 App 分进程。`app.NewWithOption` + `LinkEndpoint`。优先级低于 linked，但模块内仍需可跟做的样例与文档。

## 目标

给出 separated 最小启动顺序与业务入口，证明与 standalone/linked **共用业务代码**。

## 执行步骤

1. 增加 separated 入口（`app.NewWithOption` + `VINE_LINK_ENDPOINT`）
2. README：`vine hub serve` → `portal` → `link` → 业务 App 的顺序与端口表
3. 可选：两个 App + 一次跨应用 Rpc（若时间紧可只做单 App + Portal HTTP）
4. 安全边界摘要（pre-1.0：内网/回环），指向 vine-skill

## 产出

- separated 启动入口或脚本
- README 生产向最小拓扑说明

## 验收标准

- [ ] 按 README 可完成 separated 启动
- [ ] 至少一条对外或跨组件调用成功
- [ ] 与 T01/T04 共用业务包，无分叉实现

## 如何执行

```text
请执行 base/innate-foundation/modules/02-be-base/tasks/T05-separated-mode.md，使用 Local Workflow。
```
