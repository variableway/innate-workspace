# 任务：Linked 模式样例

- **状态**：pending
- **模块**：02-be-base
- **优先级**：P1（低于 standalone REST / CLI；高于 separated）
- **依赖**：T01、T03；建议 `03-infra` compose 或本地可跑 `vine hub serve`
- **参考**：vine-skill `refs/05-microservice-dev.md`（linked 段）

## 背景

同一业务 App **不改业务代码**，仅换启动构造器为 `linked.NewWithOption`：Hub（及按需 Portal）独立进程，Link 与业务同进程。用于本地多服务联调与「可部署的中间态」。

## 目标

文档 + 可运行入口：演示如何用 linked 拉起 T01 的 REST（或同源）应用，并对外暴露/调用至少一条路径。

## 执行步骤

1. 增加 `cmd/...` linked 入口（或 build tag / 子命令说明），`HubEndpoint` / `IngressListen` 可来自 flag/env
2. README：先 `vine hub serve`（及可选 portal），再启动业务二进制的步骤
3. 验证：经 linked 拓扑访问 REST（或 Rpc）成功
4. 明确与 standalone 的差异（租约/心跳等），指向 vine-skill

## 产出

- linked 启动入口或脚本
- README 联调步骤

## 验收标准

- [ ] 按 README 可完成 linked 启动
- [ ] 至少一条 HTTP/Rpc 调用在 linked 下成功
- [ ] 说明业务代码与 standalone 共用

## 如何执行

```text
请执行 base/innate-foundation/modules/02-be-base/tasks/T04-linked-mode.md，使用 Local Workflow。
```
