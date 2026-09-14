# T00：Vine/skelc 版本门禁与工程边界

- **目标**：在写 self-host 业务前，消除当前 sample 的旧版本和目录职责歧义，并审查 Meta Domain/standalone sidecar 判断。
- **依赖**：无

## 实现

1. 以当前 Vine 源码的 `skel.MinSkelcVersion()` 为准安装 skelc，不使用旧版本。
2. 已将 `samples/vine-rest` 升级到当前已验证的 Vine v0.15.7，删除 `/Users/...` 绝对路径 `replace`。
3. 已使用 skelc v0.19.0 重新执行 `skelc check`、`skelc gen go`，确认 generated `CompilerVersion` 满足运行时门禁。
4. 后续每次 Vine 发布都重复本任务，不把 v0.15.7/v0.19.0 当永久版本。
5. 在 README 中标清：`innate-go` 是普通 Go CLI/sidecar；Vine sample 是框架 smoke test；未来 self-host App 是独立 Vine 领域。
6. 增加 CI 检查：无绝对路径 replace、生成代码可重建、主 module 与 sample module 分别测试。

## 验收

- `go test ./...`、`go vet ./...` 在主工程通过。
- `go test ./...` 在 sample module 通过，不再因 checksum、绝对路径或 compiler version 失败。
- 生成代码 diff 干净；`skelc` 版本不少于 Vine `MinSkelcVersion()`。

## 判断审查（必须记录结果）

- Meta CRUD 迁移为 Domain：可行，需先抽出 use case/port，再接 Vine Web/Rpc；不得让 handler 直接操作 DAO。
- standalone 替代 sidecar：功能上可行，但默认会启动 Hub/Portal/Link，且入口未必是 loopback 动态端口；先做 smoke 和启动资源实测，再决定是否删除普通 sidecar。
