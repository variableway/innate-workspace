# T05：Bun/Deno Agent runner

- **目标**：Go 管理脚本运行生命周期，Bun/Deno 只负责动态脚本和 Playwright。
- **依赖**：T01、T02

## 实现

1. runner 接口接收 script path、capabilities、timeout、workspace scope。
2. 默认调用 `bun` 或 `deno run --no-prompt`；权限参数由 Go 根据 allowlist 生成，禁止脚本自行扩权。
3. stdout/stderr、exit code、timeout、cancel 都写入 `agent_runs`。
4. 路径必须位于 sandbox 根目录；第三方代码不允许在宿主直接执行，P1 先标记为 trusted-dev-only。
5. 保留 `services/agent-runtime` 的 Bun/Deno demo，后续可改为被 Go runner 调用。

## 验收

- 成功、失败、超时、取消各有测试。
- 未声明的 net/read/write/run 权限在启动前拒绝。
- 不把 token、环境变量和原始 secret 写入日志。
