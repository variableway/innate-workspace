# innate-go 与 backend-go/Vine Skill 对照审计

审计日期：2026-09-11  
范围：`base/innate-backend/innate-go`、`samples/vine-rest`、`skills/backend-go`  
结论：当前代码不是“整体按 Vine Skill 生成”的单一工程，而是三个不同层次的产物混在同一目录。Skill 本身方向基本匹配，但样例和主工程需要明确边界并升级。

## 总体判断

| 区域 | 与 Skill 的匹配度 | 判断 |
|---|---:|---|
| `skills/backend-go` 文档与模板 | 高 | 已覆盖当前 Vine 的 standalone/linked/separated、DI、RDB/Redis、Skel、测试和观测约定 |
| `innate-go/internal/cli` | 中 | 是普通 Go 工具链 CLI；不是 Vine Application，不应强行套用 Vine 生命周期 |
| `innate-go/internal/metaapi` + `internal/store` | 中（sidecar adapter） | 裸 `net/http` 仅作为严格 loopback sidecar；CRUD 已委托 `internal/meta` Domain，Vine standalone 则由 `internal/metaapp` 提供 Web contract |
| `samples/vine-rest` | 中低 | 使用 standalone/Webber/Skel，但生成代码和依赖明显落后，业务仍是内存 map demo |
| 新 self-host 总控 | 尚未实现 | 应以独立 Vine App/Module 设计，不要继续扩张现有 metaapi |

## 已确认的硬不匹配

### 1. Vine 与 skelc 版本不一致（P0，已处理）

证据：

- 初始审计发现 Vine/skelc 与生成代码均为旧版本；当前已升级并重新生成。

影响（已修复）：此前样例不可复现，且生成代码可能无法通过新运行时的 compiler version 校验。

处理：

1. 固定“升级时一起升级”的流程，并记录本次已验证的 Vine v0.15.7 / skelc v0.19.0。
2. 使用当前 Vine 要求的 `skelc`，重新执行 `skelc check`、`skelc gen go`。
3. 删除绝对路径 `replace`，改用发布版本；本地联调通过显式环境变量或临时 workspace replace，不提交本机路径。
4. 将生成代码视为构建产物，加入 CI 生成一致性检查。

### 2. 主工程不是 Vine 工程（P0，属于边界问题）

`innate-go/go.mod` 没有 Vine 依赖。现有 `cmd/innate-go`、`internal/cli`、`internal/metaapi` 是普通 Go CLI/HTTP 服务，使用 `net/http`、`encoding/json`、`os/exec` 和外部 `sqlite3`。

这不是代码错误，但不能把它描述成“已按 backend-go Skill 实现的 Vine 后端”。建议保留它作为工具链/sidecar 核心，并新增独立 Vine App module（或明确的 app package）承载：

- self-host orchestrator Domain Module
- Postgres/pgvector Component
- MemoryStore / RunStore
- InsForge/Supabase adapter
- 后续 Web/Rpc/Event/Task contract

### 3. Meta CRUD 没有使用 Vine contract（P1）

当前 `internal/metaapi`：

- 使用标准库 `http.NewServeMux`；
- 使用 `encoding/json` v1；
- 数据层通过 shell 调用 `sqlite3`；
- 表名白名单和 JSON 字段是手写协议；
- 没有 `.skel` service/web/data/config/actor；
- 没有 `app.ServicerEnabled`、`WebberEnabled`、RDB DAO 或 `app/testkit`。

如果目标是桌面 sidecar，这种实现可以保留；如果目标是 Vine 节点，应迁移到 Skill 定义的 Application/Web/Rpc/RDB 结构。不要让同一业务同时维护两套 REST 实现。

### 4. Vine sample 是“最小展示”，不是 self-host 基座（P1）

`samples/vine-rest` 使用 `standalone.NewWithOption`、Webber、Skel 和 Portal seed，这些与 Skill 匹配；但：

- 只有内存 map，重启丢数据；
- 无 Service/Rpc、Module Bind、Auth、Permission、Event、Task；
- generated code 已升级到当前验证版本；后续发布仍需重新生成；
- `task run:vine` 通过外部 Task/Make 编排，不是总控 App；
- 目录下独立 `go.mod` 与主工程没有共享依赖治理。

应把它定位成可删除的 Vine API smoke sample；self-host 使用新的业务 App，不在其上继续堆功能。

## Skill 本身需要的优化

Skill 的架构原则基本正确，但应增加三条明确声明：

1. **适用边界**：普通 CLI、sidecar、Docker orchestrator 不自动变成 Vine App；只有需要 Vine 生命周期、DI、Rpc/Web/Event/Task 时才使用 Vine。
2. **版本门禁**：文档和模板不能出现已知旧的 `v0.11.x/v0.12.x` 生成结果；安装脚本应检查 `skelc >= skel.MinSkelcVersion()`。
3. **双轨测试**：普通 Go CLI 用 `go test ./...`；Vine App 额外使用 `app/testkit.StartStandalone` 和生成 client。两者不能用同一验收标准。

## 建议的目标结构

```text
innate-go/                         # 工具链主 module
  cmd/innate-go                    # CLI：selfhost、desktop-app、sidecar
  internal/cli                     # 参数解析和进程编排
  internal/sidecar                 # 裸 HTTP sidecar（可保留）
  internal/compose                 # docker compose adapter
  internal/config                  # manifest/config 解析

apps/innate-selfhost/              # 独立 Vine module（建议）
  cmd/selfhost                     # standalone/linked 入口
  skel/                            # domain/service/web/config/actor
  internal/application             # SelfhostApp
  internal/selfhost                 # Domain Modules
  skeled/                          # skelc 生成产物
```

如果暂时不想增加第二个 module，也可以先在 `innate-go` 内新增 Vine package，但必须让 `go.mod`、Vine 版本、skelc 生成和主 CLI 的普通 Go 依赖一起通过 CI；第二个 module 的边界更清晰。

## 优化优先级

| 优先级 | 优化 | 原因 |
|---|---|---|
| P0 | 升级 Vine/skelc，移除绝对路径 replace，重新生成 skeled | 先恢复可复现构建 |
| P0 | 把“普通 CLI/sidecar”和“Vine App”写进目录与 README 边界 | 避免错误套用 Skill |
| P1 | 建立独立 `apps/innate-selfhost` Vine App | 为 Go 总控提供正确落点 |
| P1 | 将 Postgres/pgvector、MemoryStore、BaaS adapter 做成 Domain-owned Module/Component | 与 self-host 目标一致 |
| P1 | 增加 `app/testkit`、mock BaaS、Compose contract tests | 验证生命周期和兼容性 |
| P2 | sidecar/Compose/Bun-Deno runner 统一由 Go CLI 管理 | 消除脚本分散和隐式状态 |
| P3 | linked/separated、Event/Task、Go worker、WASM | 只有出现真实边界或性能证据再做 |

## 本次验证

- 主工程 `go test ./...`：通过。
- 主工程 `go vet ./...`：通过。
- Vine sample `go test ./...`：失败，原因是 `github.com/glebarez/sqlite` checksum mismatch；同时存在旧 Vine/旧 skelc/绝对路径 replace 问题。
- 当前工具版本：Go `1.26.1`、skelc `v0.11.1`；本机 Vine checkout `v0.15.0`、最低 skelc `v0.14.0`。

## 结论

当前最需要优化的不是“把所有代码改成 Vine”，而是先建立清晰分层：

- `innate-go` 普通 Go CLI 管理进程、Compose 和 sidecar；
- 独立 Vine App 管理 self-host 领域能力；
- Bun/Deno 只做动态执行；
- Skill 作为 Vine App 的实现规范；
- sample 升级后只承担框架 smoke test，不作为生产基座。

在完成 P0 版本门禁和工程边界前，不建议开始实现 self-host orchestrator 业务代码。

## 本轮复审（2026-09-11）

已验证远端最新 tag 为 Vine **v0.15.7**、skelc **v0.19.0**；当前 Vine 的最低 skelc 为 v0.14.0。`samples/vine-rest` 已升级到 Vine v0.15.7、移除绝对路径 `replace`，并用 skelc v0.19.0 重新生成 `skeled/`。仓库安装脚本默认值也已更新，但每次发布仍需重新检查 latest。

### Meta CRUD 迁移为 Domain

这个判断合理。Meta CRUD 的表白名单、JSON 校验、审计、scope 和 authorization 属于 Domain；HTTP、Vine Web、Vine Rpc 和 sidecar 都应是入口 adapter。建议顺序是：抽出 `TableCRUD`/`MetaStore` use case → 用 Skel 声明 `MetaRecord`、`MetaStoreService`、`MetaCrudWeb`、`ClientActor` 和 config → Web/Rpc handler 注入 Domain port → 保留 SQLite 实现 → 增加 Postgres/pgvector adapter。旧 `internal/metaapi` 最终只作为兼容 adapter，避免两套 CRUD 漂移。

### standalone 是否能完全替代 sidecar

**功能上可以，运行形态上有条件。** `standalone.NewWithOption` 能启动 Hub、Portal、Link 和业务 App；App 通过 `WebberEnabled` 暴露 REST/HTTP，Portal seed 决定外部路径，因此 Meta CRUD 可以完全按 Vine Web 实现。

但 standalone 会启动 Hub/Portal/Link，资源和启动时间高于裸 HTTP；当前 Portal entry 默认监听 `0.0.0.0:<matchPort>`，不是天然的 `127.0.0.1:0`；其 Hub DB（`SQLiteFile`/`PostgresURL`）也是运行时控制面数据库，不等于业务 Meta 数据库。桌面 sidecar 需要固定 loopback 入口、额外配置或 Vine API 支持后再采用。

因此保留两种模式，但共享同一个 Domain 和 Skel contract：Vine REST sidecar 用 standalone + `MetaCrudWeb`；极简桌面 sidecar 用普通 Go HTTP adapter。默认 self-host 开发先实测 standalone，若 loopback、启动时间或资源不满足，再保留普通 sidecar。

### 任务审查结论

- T00 必须先完成 Vine/skelc 版本、生成代码和 sample 可复现。
- Meta Domain 迁移插入 P1：先 Domain，再 Vine Web/Rpc，再 Postgres adapter。
- Sidecar 先做 standalone REST smoke，再依据实测决定是否保留普通 HTTP sidecar。
- 其他 audit 结论继续有效：InsForge/Supabase 为 adapter 二选一，memory 使用统一 contract，Bun/Deno 只做动态执行，Go 负责总控。
