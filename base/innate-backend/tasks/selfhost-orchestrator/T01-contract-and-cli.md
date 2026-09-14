# T01：Self-host 控制面 contract 与 CLI 骨架

- **目标**：在 `innate-go` 增加 `selfhost` 子命令，但不改变现有 `server`、`desktop-app` 行为。
- **依赖**：无
- **改动范围**：`internal/cli`、`internal/selfhost/domain`、CLI tests、Taskfile/README

## 实现

1. 定义 `ServiceManifest`：name、compose file、profiles、dependsOn、health URL、data volumes、optional。
2. 定义 `ServiceState`：unknown、stopped、starting、healthy、unhealthy、failed。
3. 增加命令：`innate-go selfhost validate|up|down|status|logs`。
4. 配置来源顺序：显式 `-config` → `SELFHOST_CONFIG` → `base/innate-selfhost/infra` 默认路径；禁止隐式读取生产 secret。
5. 输出默认人类可读，增加 `--json` 给 CI/Agent 使用；错误使用稳定 code/message。

## 验收

- `innate-go selfhost --help` 有完整用法。
- manifest 缺字段、重复服务、路径越界能被 validate 拒绝。
- 现有 `go test ./...` 全绿。
