# T02：Docker Compose 生命周期

- **目标**：Go 管理开发 Compose，而不是复制 shell 编排逻辑。
- **依赖**：T01

## 实现

1. 新增 `compose` adapter，执行 `docker compose --env-file ... -f ...`。
2. 只允许 manifest 声明的 compose 文件和 profile；命令参数使用 `exec.CommandContext`，不拼接 shell 字符串。
3. 实现 up/down/status/logs，支持 context deadline 和取消。
4. 解析 `docker compose ps --format json`，映射到 `ServiceState`。
5. 保留 `scripts/deploy.sh` 作为兼容入口，内部文档改为调用 `innate-go selfhost`。

## 验收

- `validate` 不需要 Docker 也能运行。
- 有 Docker 时 `selfhost up --profile dev` 可启动 pgvector Compose。
- `status --json` 能区分未安装 Docker、未启动、healthy、unhealthy。
