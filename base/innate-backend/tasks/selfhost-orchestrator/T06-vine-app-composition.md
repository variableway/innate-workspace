# T06：Vine 应用组合与运行模式

- **目标**：把 self-host 控制面组织成 Vine Domain Module，保留 standalone → linked → separated 的升级路径。
- **依赖**：T01-META、T02、T04

## 实现

1. 新增 `SelfhostApp` standalone 入口，默认本地开发单进程。
2. selfhost orchestrator、memory、runner、BaaS probe 分别作为 Domain Module；Postgres/Redis 连接作为真正跨域 Component。
3. 有多应用联调需求时提供 linked 配置；不在 MVP 引入 Hub/Link/Portal 全套部署。
4. 后续需要独立扩缩容时再生成 `.skel` Rpc/Web/Event/Task contract，不手写跨进程协议。
5. 先将 standalone 配置为本地 REST smoke，实测启动时间、内存、监听地址和优雅退出；只有通过后才把它作为默认 sidecar。

## 验收

- standalone 可启动、关闭时资源按逆序释放。
- Module 不捕获 request context；下游调用保留 `meta.Context`、trace 和 deadline。
- linked 仅改变启动入口，不改变 Domain contract。
- standalone REST 与普通 sidecar（若保留）共享同一 Meta Domain contract。
