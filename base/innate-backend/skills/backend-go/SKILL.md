---
name: backend-go
description: |
  Innate backend-go skill：Go + Vine 后端开发（源自 vine-skill）。何时使用：用 Vine 构建 Go 应用、写
  组件/模块/Rpc/Web/Event/Task 处理器、选择 standalone/linked/separated 部署
  模式、用 GORM DAO 或 Redis cache/locker、写 .skel 契约并用 skelc 生成代码、
  组合多个应用、设计按 Domain/业务能力组织的 package、精简过度分层的
  model/service/impl/repository/runtime/adapter 布局、做兼容性重构、排查生命周期/DI/执行作用域问题。
  Vine framework development guide (go.yorun.ai/vine). Use when building Go
  applications on Vine, writing components/modules/Rpc/Web/Event/Task handlers,
  choosing standalone/linked/separated deployment modes, using GORM DAOs or Redis
  cache/locker, authoring .skel contracts and generating code with skelc,
  composing multiple applications, designing Domain-oriented package layouts,
  simplifying over-layered repository/adapter structures, preserving contracts during
  refactors, or diagnosing lifecycle/DI/execution-scope issues.
---

# backend-go — Innate Go Backend (Vine)

> **Innate 落点**: `base/innate-backend/skills/backend-go`  
> 样例项目: `base/innate-backend/innate-go/samples/vine-rest`（Vine REST）、`base/innate-backend/innate-go`（通用 meta CRUD）  
> 上游参考仍保留: `base/references/backend/golang-backend/vine-skill`

# Vine Development / Vine 开发指南

> **Source of truth / 事实来源**: framework source at `../vine` (or `go.yorun.ai/vine`),
> public docs at `../vine-site/docs`. This skill distills them; when they disagree,
> the source and the current `next` docs win. / 本 skill 是对源码与官方文档的提炼；
> 二者有冲突时以源码与当前 `next` 文档为准。
>
> Vine is pre-1.0 (`v0.9.0+`). Minor releases may break public APIs; pin exact Vine +
> skelc revisions for releases. / Vine 1.0 前 API 仍在稳定，次版本可能有破坏性变更，
> 生产构建需固定 Vine + skelc 的精确 revision。

## When to use this skill / 何时使用

- 你在写一个基于 Vine 的 Go 应用（`go.yorun.ai/vine`）。
  / You are writing a Go application on Vine.
- 你要决定：用 standalone / linked / separated 哪种部署模式、要不要拆 Hub/Link/Portal。
  / You are choosing a deployment topology.
- 你在写组件（数据库/Redis）、模块、Rpc/Web/Event/Task 处理器，或在组合多个应用。
  / You are writing components, modules, handlers, or composing applications.
- 你在写 `.skel` 契约、跑 `skelc` 生成代码、或排查生成代码与运行时不一致。
  / You are authoring Skel contracts or regenerating code.
- 你在排查生命周期顺序、依赖注入作用域、context 传播、Event/Task 幂等性问题。
  / You are diagnosing lifecycle, DI scope, context propagation, or Event/Task idempotency.

**Do not use for / 不适用于**: Skel 语言与 `skelc` 命令的权威参考（见
`https://skel.yorun.ai/docs/`）；Vine 框架内部 `internal/` 包的实现细节（应用代码
不应导入）。/ Skel language and skelc reference (see Skel site); Vine `internal/`
package internals (application code must not import them).

---

## 1. Mental model / 心智模型

Vine 把「生命周期、依赖注入、配置、Rpc、Web、Event、Task、Redis、RDB」收进一套 Go
应用模型。四个角色可以同进程，也可以拆成多进程，**业务代码不变，只换启动入口**。

Vine unifies lifecycle, DI, configuration, Rpc, Web, Event, Task, Redis, and RDB
under one Go application model. Four roles can run in one process or split across
processes — **business code stays the same; only the startup entry point changes**.

| Role / 角色 | Responsibility / 职责 |
| --- | --- |
| **App** | 业务代码：组件、模块、Rpc/Web/Event/Task 能力。Owns business code, components, modules, capabilities. |
| **Hub** | 控制面：配置、注册、运行时状态；内嵌 Redis 分发。Control plane: config, registration, runtime state; embedded Redis. |
| **Link** | 应用侧接入层：注册、发现、转发、配置读取、异步交付。App-side access layer: registration, discovery, forwarding, async delivery. |
| **Portal** | 外部 HTTP/HTTPS/Rpc/Web 网关。External gateway. |

**Capability entry points / 能力入口** (declare only what you need / 只声明需要的):

| Capability / 能力 | Declare via / 声明方式 | Mount / 挂载点 |
| --- | --- | --- |
| Rpc | `app.ServicerEnabled` + `ServicerInitHandlers` | `/rpc/invoke` |
| Web | `app.WebberEnabled` + `WebberInitHandlers` | `/web/access/default@<appName>` |
| Event | `app.EventerEnabled` + `EventerInitListeners` | `/event` |
| Task | `app.TaskerEnabled` + `TaskerInitRunners` | `/task` |
| RDB | `InitComponents` + `rdb.Database` | (DI: DAOs) |
| Redis | `InitComponents` + `redis.Redis` | (DI: caches, lockers) |
| Config | `.skel` `config ... eternal/instant` | (DI: typed config) |

---

## 2. Scenario index / 场景索引（decision tree）

> The user explicitly asked for "不同场景的 index mapping". Pick the row that matches
> your goal, then follow the link. / 按你的目标选行，再点进对应参考。

### 2a. Deployment mode / 部署模式选择

| Scenario / 场景 | Mode / 模式 | Constructor / 构造器 | Ref |
| --- | --- | --- | --- |
| 学习框架、跑第一个应用、单进程本地开发、集成测试 | **standalone** | `standalone.NewWithOption[*App](standalone.Option{SQLiteFile: ...})` | [04-standalone-dev](./refs/04-standalone-dev.md) |
| 本地多应用联调、需要共享配置/发现/外部入口，但不想单独跑 Link | **linked** | `linked.NewWithOption[*App](linked.Option{HubEndpoint: ...})` | [05-microservice-dev](./refs/05-microservice-dev.md) |
| 生产、独立扩缩容、独立发布、真实故障隔离 | **separated** | `vine hub/link/portal serve` + `app.NewWithOption[*App](app.Option{LinkEndpoint: ...})` | [05-microservice-dev](./refs/05-microservice-dev.md) |
| 一个进程里跑多个业务应用（共享 Hub/Link/Portal） | **bundled** | `standalone.NewBundled(...)` / `linked.NewBundled(...)` | [06-app-composition](./refs/06-app-composition.md) |

**Rule of thumb / 经验法则**: start standalone → move to linked when you need shared
config/discovery/external entry → go separated when you need independent scaling or
failure isolation. / 先 standalone → 需要共享配置/发现/外部入口时升 linked →
需要独立扩缩容或故障隔离时升 separated。

### 2b. "How do I…" task routing / 任务路由

| You need to… / 你需要… | Use / 用 | Ref |
| --- | --- | --- |
| 让应用可启动、配好组件/模块 | `app.Application` + `InitComponents`/`InitModules` | [01-app-startup](./refs/01-app-startup.md) |
| 把业务逻辑挂到生命周期上 | `app.BaseModule` + `BeforeAppStart`/`AfterAppStart`/`BeforeAppStop`/`AfterAppStop` | [02-modules](./refs/02-modules.md) |
| 持久化关系模型 | `rdb.Database` + `rdb.Dao[*M]`（ORM = GORM） | [03-database](./refs/03-database.md) |
| 缓存 / 分布式锁 | `redis.Redis` + `redis.Cache[T]` / `redis.Locker` | [03-database](./refs/03-database.md#redis) |
| 调另一个应用并拿结果 | `.skel` `service` + skelc 生成 client，`app.ServicerEnabled` | [05-microservice-dev](./refs/05-microservice-dev.md) |
| 暴露 HTTP 路由 | `.skel` `web` + `app.WebberEnabled` + `Routes` | [01-app-startup](./refs/01-app-startup.md#web) |
| 发布"已发生的事实" | `.skel` `event` + `EventerEnabled` + listener | [06-app-composition](./refs/06-app-composition.md) |
| 让一个 worker 执行工作 / Cron 定时 | `.skel` `task` + `TaskerEnabled` + runner + `WithRunnerCronScheduler` | [06-app-composition](./refs/06-app-composition.md) |
| 读取托管配置 | `.skel` `config eternal/instant` + 注入生成类型 | [01-app-startup](./refs/01-app-startup.md#config) |
| 同应用内两个组件通信 | 直接 Go 依赖注入，**不要**造 Rpc 服务 | [02-modules](./refs/02-modules.md) |
| 加跨切面逻辑（鉴权/日志/埋点） | `core/ctr` filter / `ServicerInitFilters` 等 | [02-modules](./refs/02-modules.md#filters) |
| 返回稳定错误码 | `core/ex`（`ex.New(ex.NotFound, ...)` / panic-recover） | [02-modules](./refs/02-modules.md#errors) |
| 构造期断言不变量 / 前置条件 | `util/vpre`（`Check*` / `Must*`，panic fail-fast） | [07-code-style](./refs/07-code-style.md) |
| 集成测试 | `app/testkit.StartStandalone` + `NewClient` | [04-standalone-dev](./refs/04-standalone-dev.md#testkit) |
| 给 vine 应用加 flag / env / 子命令 | 构造器内置 `appcli.Handle` + `app.With(&MyFlag{})` | [08-cli-application](./refs/08-cli-application.md) |
| 覆盖 handler/Event/Task + 配置覆盖 | `app/testkit`（一包一 runtime、子测试共享） | [09-testing](./refs/09-testing.md) |
| 日志 / 脱敏 / trace / 超时 | `core/logger` + `core/redact` + `core/meta` | [10-observability](./refs/10-observability.md) |
| 运维 Hub/Link/Portal 或接 Kong | `vine hub/link/portal serve`；Kong 在 Portal 前 | [11-hub-link-portal-ops](./refs/11-hub-link-portal-ops.md) |
| 加新中间件 / 判断能否扩展 | module 包客户端；infra/MQ/能力/配置源封闭 | [12-extensibility](./refs/12-extensibility.md) |
| 设计 Domain/package 布局或精简过度分层 | 最小可行 Domain + 必要叶子 adapters；接口按需 | [16-pragmatic-domain-layout](./refs/16-pragmatic-domain-layout.md) |
| 写 / 改 `.skel` 契约 | `domain/data/service/event/task/web/config/actor` 速查 | [13-skel-syntax](./refs/13-skel-syntax.md) |
| 写 seed YAML / Portal 规则 | `appConfigs`/`portalRules`/`portalSites`/`portalCerts` | [14-seed-portal-yaml](./refs/14-seed-portal-yaml.md) |
| TS 客户端调 Vine | `skelc gen ts` + `@yorun-ai/vrpc` + 生成 client | [15-typescript-collaboration](./refs/15-typescript-collaboration.md) |

### 2c. DI scope decision / 依赖注入作用域选择

| Question / 问题 | Choose / 选择 |
| --- | --- |
| 请求内多消费者要共享同一对象？ | 不显式声明 scope，或 `ExecutionScope` |
| 每次解析都要全新无状态对象？ | `TransientScope` |
| 整个应用生命周期不可变、有明确关闭owner？ | `SingletonScope` |
| 捕获了请求 context / 身份 / logger / 事务 / 可变配置？ | 执行作用域（不要做成 singleton） |
| 打开了需要关闭的资源？ | 给它一个 owner + 生命周期 hook（光靠 scope 不够） |

> Critical rule / 关键规则: an **unscoped** binding is transient in a plain injector
> but **execution-scoped** in an execution injector. That's why a generated Rpc client
> or DAO injected into a handler follows the current request, but the same type injected
> into a module captures the **app root** context. Never move an execution-scoped
> dependency out of the handler that received it. / 不显式声明 scope 的绑定：在 plain
> injector 里是 transient，在 execution injector 里是 execution-scoped。所以注入到
> handler 的 Rpc client/DAO 跟随当前请求，注入到 module 的则绑定应用根 context。
> 不要把执行作用域依赖挪出它所在的 handler。

---

## 3. Code style essentials / 代码风格要点

> Distilled from `../vine/AGENTS.md`. Apply when writing Vine application code.
> / 提炼自 vine 框架 AGENTS.md。

- **Go 1.26 syntax.** Prefer `new(SomeStruct{Field: "value"})` for pointer creation.
  / 指针创建优先用 `new(复合字面量)`。
- **Naming**: use `kind` when `type` would shadow; `Rpc` not `RPC` in identifiers.
  / `type` 会遮蔽时用 `kind`；标识符里用 `Rpc` 而非 `RPC`。
- **Unexported production types** are prefixed with `_` (e.g. `_App`, `_Config`).
  Only types; not constants/vars/funcs/methods. Test fixtures may use `testApp`,
  `configRepoSpy`. / 包内非导出**生产类型**加 `_` 前缀（仅类型）。
- **Don't add needless defensive checks.** Vine is a framework — most args come from
  in-project code. No nil/empty checks that aren't part of the contract; no
  test-only defensive behavior in production. / 框架内调用为主，不要加无谓的
  nil/空值检查，不要为迁就测试给生产代码加防御。检查应放在边界：构造期不变量用 `util/vpre`（panic fail-fast），业务/协议失败用 `core/ex` 返回 `ex.Error`。详见 / see [07-code-style](./refs/07-code-style.md)。
- **Preserve `meta.Context`** — trace, actor, initiator, cancellation, deadline — when
  forwarding/deriving work. **Never** replace an active request context with
  `context.Background()`. / 转发或派生工作时保留 `meta.Context`（trace/actor/initiator/
  取消/deadline），不要用 `context.Background()` 替换活跃请求 context。
- **Lifecycle ordering**: components start before modules (declaration order);
  shutdown reverses. Don't reorder unless the task explicitly changes the contract.
  / 组件先于模块启动（声明序）；关停反向。非任务明确要求不要改顺序。
- **Generated code is build output**: edit `.skel`, regenerate with `skelc`; never
  hand-edit `skeled/`. / 生成代码是构建产物，改 `.skel` 后重新生成，不要手改。
- **Public API boundary**: app code uses `app`, `core/*`, `infra/*`, `util/*` facades;
  never import `internal/`. Add GoDoc to every newly exported public symbol. / 应用
  代码只用 facade 包，不要导入 `internal/`；新增导出符号要写 GoDoc。
- **Protocol boundaries**: Rpc/Web headers, Redis key formats, serialized JSON/CBOR,
  Skel schemas, generated contracts — changing one means updating all producers,
  consumers, tests, docs together. / 协议边界变更要同步所有生产者/消费者/测试/文档。
- **Tests**: beside source (`reader_test.go` next to `reader.go`); restore globals
  with `t.Cleanup`; no `t.Parallel()` where global registries/loggers/singletons are
  shared; one standalone runtime per test package shared via subtests. / 测试与源码
  同目录；用 `t.Cleanup` 还原全局；共享全局注册表时不要 `t.Parallel()`；每个测试包
  只起一个 standalone runtime，用子测试共享。
- **Validate**: `gofmt` + `git diff --check`; `go vet ./...` after public API/concurrency
  changes; `go test ./...`. / 改动后跑 gofmt、go vet、go test。
- **Spend complexity deliberately**: organize by business capability; do not create
  `model`/`impl`/`repository`/`runtime`/`adapter` packages mechanically. Define
  interfaces where consumers need a seam, return concrete implementations, and split
  files before packages. / 按业务能力组织；不要机械地为架构名词建 package。接口由消费方按需
  定义，构造器优先返回具体类型，先拆文件再拆 package。详见
  [16-pragmatic-domain-layout](./refs/16-pragmatic-domain-layout.md)。

---

## 4. Key technology map / 关键技术地图

| Concern / 关注点 | Technology / 技术 | Vine package / 包 |
| --- | --- | --- |
| ORM / 关系数据库 | **GORM** (`gorm.io/gorm`) + `gorm.io/driver/postgres` + `glebarez/sqlite` | `infra/rdb`（`rdb.Database`、`rdb.Dao[*M]`、`rdb.Model`） |
| Redis 客户端 / 缓存 / 锁 | **go-redis** (`redis/go-redis/v9`) | `infra/redis`（`redis.Cache[T]`、`redis.Locker`） |
| Web / HTTP | **Gin** (`gin-gonic/gin`) + h2c | `core/web` |
| 消息 / Event / Task 流 | **NATS JetStream** (`nats-io/nats.go`) | `core/event`、`core/task` |
| 序列化 | **CBOR** (`fxamacker/cbor/v2`) + JSON + YAML | `util/vcode` |
| 契约 / 代码生成 | **Skel** 语言 + **skelc** 编译器（生成 Go / TypeScript） | `core/skel` |
| 依赖注入 | Vine 自带类型级 DI（`inject:""`、scopes、factories） | `core/di` |
| 执行管线 / 过滤器 | 洋葱模型 filter chain | `core/ctr` |
| 上下文 / 链路 / 身份 | `meta.Context`（trace/initiator/actor） | `core/meta` |
| 错误模型 | `ex.Error`（Code/Type/Category） | `core/ex` |
| 配置 | Hub 托管，`eternal`/`instant` 两种生命周期 | `core/conf` |
| CLI | `urfave/cli/v3` | `cmd/vine` |
| Cron 调度 | `robfig/cron/v3`（标准 5 字段） | `core/task` |
| 校验 / decimal | `go-playground/validator`、`shopspring/decimal` | (indirect) |
| 工具库 | `util/vcode` `vfile` `vmap` `vmath` `vnet` `vpre` `vslice` `vstring` | `util/*` |

**Deployment processes / 部署进程**: `vine hub serve` / `vine link serve` /
`vine portal serve` (from `cmd/vine`). Hub needs exactly one DB (SQLite **or**
PostgreSQL) and exactly one MQ (embedded NATS **or** external NATS URL).

---

## 5. Reference modules / 参考模块

Read these on demand (each is bilingual, code is shared): / 按需阅读（均为双语，代码共享）:

- [refs/01-app-startup.md](./refs/01-app-startup.md) — 应用规范、能力声明、三种构造器、生命周期。
  App spec, capability declarations, three constructors, lifecycle.
- [refs/02-modules.md](./refs/02-modules.md) — 模块 vs 组件 vs DI、组合、过滤器、worker 模式。
  Module vs component vs DI, composition, filters, worker pattern.
- [refs/03-database.md](./refs/03-database.md) — RDB/GORM DAO 写法 + Redis cache/locker。
  RDB/GORM DAO usage + Redis cache/locker.
- [refs/04-standalone-dev.md](./refs/04-standalone-dev.md) — standalone 单进程开发 + testkit。
  Standalone single-process dev + testkit.
- [refs/05-microservice-dev.md](./refs/05-microservice-dev.md) — linked / separated 微服务开发。
  Linked / separated microservice development.
- [refs/06-app-composition.md](./refs/06-app-composition.md) — 组合多应用、跨应用通信、Event/Task 拓扑。
  Composing multiple apps, inter-app communication, Event/Task topology.
- [refs/07-code-style.md](./refs/07-code-style.md) - 防御性检查的 Vine 立场（vpre / ex / 信任契约）+ Go 惯用法。
  Defensive-check stance in Vine terms (vpre / ex / trust-the-contract) + Go idiom.
- [refs/08-cli-application.md](./refs/08-cli-application.md) - vine 应用的 CLI：内置 flag/env、自定义 flag、独立 CLI 工具范式（参考 vine 自身）。
  Vine app CLI: built-in flags/env, custom flags, standalone CLI tool pattern (referencing vine's own).
- [refs/09-testing.md](./refs/09-testing.md) - testkit API、配置覆盖、Event/Task 幂等测试、测试规矩与脚本。
  testkit API, config overrides, Event/Task idempotency tests, test rules and scripts.
- [refs/10-observability.md](./refs/10-observability.md) - 结构化日志、按名配级别、脱敏、trace/身份/超时传播。
  Structured logging, named levels, redaction, trace/identity/timeout propagation.
- [refs/11-hub-link-portal-ops.md](./refs/11-hub-link-portal-ops.md) - Hub/Link/Portal 运维（standalone 优先）+ Kong 接入。
  Hub/Link/Portal ops (standalone first) + Kong integration.
- [refs/12-extensibility.md](./refs/12-extensibility.md) - 可扩展性边界：开放（module/filter/DI）vs 封闭（infra/MQ/能力/配置源）+ 加新中间件范式。
  Extensibility boundary: open (module/filter/DI) vs closed (infra/MQ/capability/config) + adding-middleware pattern.
- [refs/13-skel-syntax.md](./refs/13-skel-syntax.md) - Skel 契约语法速查（非规范，权威见 skel.yorun.ai）。
  Skel contract syntax cheat sheet (not a spec; authoritative at skel.yorun.ai).
- [refs/14-seed-portal-yaml.md](./refs/14-seed-portal-yaml.md) - seed YAML（appConfigs/portalRules/portalSites/portalCerts）schema 与枚举。
  Seed YAML schema and enums.
- [refs/15-typescript-collaboration.md](./refs/15-typescript-collaboration.md) - skelc 生成 TS client + `@yorun-ai/vrpc` + vRPC 线协议协作。
  Generated TS client + vRPC wire protocol collaboration.
- [refs/16-pragmatic-domain-layout.md](./refs/16-pragmatic-domain-layout.md) - Domain ownership、复杂度预算、按需接口与过度分层精简。
  Domain ownership, complexity budget, interface gates, and over-layering simplification.

## 6. Golden rules / 黄金法则

1. **Business code declares capabilities, not service locations.** Same spec runs
   standalone or separated. / 业务代码声明能力而非服务位置；同一 spec 能跑 standalone 也能 separated。
2. **Put business behavior in modules/handlers, not `main`.** `main` only picks a
   constructor and starts. / 业务逻辑放模块/处理器，`main` 只选构造器并启动。
3. **`BeforeAppStart`** for readiness that must finish before discovery;
   **`AfterAppStart`** runs after serving begins (requests may already arrive).
   / `BeforeAppStart` 做就绪；`AfterAppStart` 已开始服务，不要放就绪工作。
4. **Keep the injected context** for downstream calls — it carries trace + remaining
   timeout. / 调下游时保留注入的 context（带 trace 与剩余超时）。
5. **Event/Task are at-least-once** — put a stable business ID in the contract and
   make side effects idempotent. / Event/Task 至少一次投递，契约里放稳定业务 ID，副作用做幂等。
6. **Don't move execution-scoped deps across executions** (clients, DAOs, caches,
   lockers, config pointers). / 不要把执行作用域依赖挪出当前执行。
7. **Internal endpoints stay on loopback / trusted private network** — auth and
   transport encryption are still TODO pre-1.0. / 内部端点只绑回环或可信私网。
8. **Pin Go + Vine + skelc together**; regenerate contracts on upgrade. / 三者一起固定，升级时重新生成契约。
9. **Every abstraction must justify its complexity cost.** DDD is ownership and
   dependency direction, not a target number of layers. / 每个抽象都要证明其复杂度成本；
   DDD 是业务归属和依赖方向，不是目录层数目标。
