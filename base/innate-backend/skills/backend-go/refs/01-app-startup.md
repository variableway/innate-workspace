# 01 · Application Startup / 应用启动

> Bilingual. Code is shared. / 双语，代码共享。

## Application spec / 应用规范

一个 Vine App 是运行时启动、注册、停止的单位。嵌入 `app.Application` 拿到默认实现，
只覆写需要的方法。`Name()` 必须匹配 `^[a-z]+(?:\.[a-z]+)*$`（如 `demo.checkout`）；
不同 App 同进程必须不同名，同一逻辑应用的副本用同名（它们会作为同一个 Event 消费组竞争）。

A Vine App is the unit the runtime starts, registers, and stops. Embed
`app.Application` for defaults and override only what you need. `Name()` must match
`^[a-z]+(?:\.[a-z]+)*$` (e.g. `demo.checkout`); different apps in one process need
different names, replicas of one logical app share the name (they compete as one
Event consumer group).

```go title="internal/application/app.go"
type CheckoutApp struct {
    app.Application
    app.ServicerEnabled   // Rpc / 启用 Rpc
    app.WebberEnabled     // Web / 启用 Web
    app.EventerEnabled    // Event / 启用 Event
    app.TaskerEnabled     // Task / 启用 Task
}

func (*CheckoutApp) Name() string { return "demo.checkout" }
```

## What an app can declare / 应用可声明的内容

| Entry point / 入口 | Purpose / 用途 |
| --- | --- |
| `InitComponents(add)` | 基础设施组件：数据库、Redis。Infrastructure: databases, Redis. |
| `InitModules(add)` | 业务模块（随应用启停）。Business modules. |
| `BindCommon(b *di.Binder)` | 所有执行上下文共享的依赖。App-wide DI bindings. |
| `ServicerInitHandlers(add)` | Rpc 服务实现。Rpc service implementations. |
| `WebberInitHandlers(add)` | Web 路由实现。Web route handlers. |
| `EventerInitListeners(add)` | Event 监听器（可带 timeout/concurrency/noRetry）。Event listeners. |
| `TaskerInitRunners(add)` | Task runner（可带 timeout/concurrency/noRetry/cron）。Task runners. |

只声明实际需要的能力；Vine 据此创建端点并通过 Link 注册。/ Declare only what you
need; Vine creates endpoints and registers them through Link.

```go
func (*CheckoutApp) InitComponents(add app.TypeAdder) {
    add(app.T[*MainDatabase]())
    add(app.T[*MainRedis]())
}

func (*CheckoutApp) InitModules(add app.TypeAdder) {
    add(app.T[*CheckoutModule]())
}

func (*CheckoutApp) BindCommon(b *di.Binder) {
    b.Bind(di.T[UserRepo]()).ToImplementation(di.T[*PostgresUserRepo]()).In(di.SingletonScope)
}
```

## Three startup modes / 三种启动模式

业务代码不变，只换 `main` 里的构造器。/ Business code unchanged; only the constructor in `main` differs.

```go title="cmd/checkout/main.go"
package main

import (
    "go.yorun.ai/vine/app"
    "go.yorun.ai/vine/app/standalone"
    "go.yorun.ai/vine/app/linked"

    "example.com/checkout/internal/application"
)

// 1) standalone：Hub + Portal + Link + 业务应用同进程（本地开发/测试）
func standaloneMain() {
    standalone.NewWithOption[*application.CheckoutApp](standalone.Option{
        SQLiteFile: "./vine.sqlite",
    }).StartAndWait()
}

// 2) linked：Hub/Portal 独立，Link 随业务应用同进程
func linkedMain() {
    linked.NewWithOption[*application.CheckoutApp](linked.Option{
        HubEndpoint:   "http://127.0.0.1:7071",
        IngressListen: "127.0.0.1:7082",
    }).StartAndWait()
}

// 3) separated：Hub/Portal/Link 全独立，业务应用直连 Link
func separatedMain() {
    app.NewWithOption[*application.CheckoutApp](app.Option{
        LinkEndpoint: "http://127.0.0.1:7079",
    }).StartAndWait()
}
```

端点也能用环境变量，避免写进代码：/ Endpoints can come from env vars:

- `VINE_HUB_ENDPOINT`, `VINE_INGRESS_LISTEN` (linked)
- `VINE_LINK_ENDPOINT` (separated / `app.NewWithOption`)
- `VINE_API_LISTEN`, `VINE_REDIS_LISTEN`, etc. (runtime services)

### Constructor options / 构造器选项

| Constructor / 构造器 | Option fields / 选项字段 |
| --- | --- |
| `standalone.NewWithOption` | `SeedYAMLFile`, `SQLiteFile`, `PostgresURL`, `DashboardURL` |
| `linked.NewWithOption` | `HubEndpoint`, `IngressListen` |
| `app.NewWithOption` | `LinkEndpoint` |
| `standalone.NewBundled` / `linked.NewBundled` | 多个 `app.App` 共享一个进程内运行时；bundle 内的 app 不能再带自己的 Option |

## Flags, With, DIInit

运行期输入应在构造时提供，**不要**在 `BindCommon` 里改（那时 `ListenAddr` 已被捕获）。
若应用必须自带默认值，在 spec 上实现 `DIInit()`（它在 `New` 期间、`AppFlag` 注入后运行）。

Supply runtime inputs at construction. `BindCommon` runs too late to change the
already-captured listen address. If the app must own a default, implement `DIInit()`
on the spec (runs during `New`, after `AppFlag` injection).

```go
type CheckoutApp struct {
    app.Application
    app.ServicerEnabled
}

func (a *CheckoutApp) DIInit() {
    if a.AppFlag.ListenAddr == "" {
        a.AppFlag.ListenAddr = ":18080" // app-owned default / 应用自带默认
    }
}

// Custom flag / 自定义 flag
type RegionFlag struct {
    app.FlagModel
    Region string
}

type CheckoutApp2 struct {
    app.Application
    Flag *RegionFlag `inject:""`
}

// Supply at construction / 构造时提供
// app.New[*CheckoutApp2](app.With(&RegionFlag{Region: "cn"}))
```

`With(flag)` constraints / 约束: `flag` 非 nil、必须是指向 struct 的指针、每种 flag 只能传一次。

## Start / StartAndWait / StopGracefully

```go
instance := app.New[*CheckoutApp](
    app.With(&app.RunFlag{ListenAddr: "127.0.0.1:18080", Context: rootCtx}),
)
instance.Start()           // 不阻塞 / non-blocking
// ... later ...
instance.StopGracefully()  // 阻塞到完全停止 / blocks until fully stopped
```

- `Start()`: 启动但不阻塞。
- `StopGracefully()`: 优雅关停，阻塞到完成。
- `StartAndWait()`: 启动后等 `SIGINT`/`SIGTERM`，再优雅关停。
- 生命周期方法**一次性**：重复 `Start`、关停前 `StopGracefully`、重复 `StopGracefully`、
  关停后再 `Start` 都会 panic。

## Lifecycle order / 生命周期顺序

启动 `Start()` 大致顺序 / startup order:

1. 连接 Link、初始化配置读取。
2. 初始化 injector。
3. **构造组件**（含框架 minder 初始化，如 RDB 开库）。
4. **构造模块**。
5. 初始化 console / Servicer / Webber / Eventer / Tasker。
6. 组件 `BeforeAppStart()`（声明序）。
7. 模块 `BeforeAppStart()`（声明序）。
8. 启动 HTTP / inproc server。
9. 启动 Servicer / Eventer / Tasker。
10. 向 Link 注册能力。
11. 组件 `AfterAppStart()`。
12. 模块 `AfterAppStart()`。

关停 `StopGracefully()` 大致顺序 / shutdown order:

1. 模块 `BeforeAppStop()`（声明逆序）。
2. 组件 `BeforeAppStop()`（声明逆序）。
3. 通过 Link 注销（含传播 + drain）。
4. 关停 HTTP / inproc server。
5. 取消运行时 context。
6. 模块 `AfterAppStop()`（声明逆序）。
7. 组件 `AfterAppStop()`（声明逆序）。

| Hook | Good for / 适合做 | Avoid / 避免 |
| --- | --- | --- |
| `BeforeAppStart` | 连接、预热、就绪校验（端点尚未发布） | 假设失败会自动回滚的不可逆操作 |
| `AfterAppStart` | 起后台循环（注册已完成，请求可能已到） | 阻塞、放就绪关键工作 |
| `BeforeAppStop` | 停生产者、取消并 join worker | 无 deadline 的等待 |
| `AfterAppStop` | 释放资源、本地清理 | 新的 Rpc/Event/Task 或依赖 context 的工作 |

`BeforeAppStart` 返回 error 会被转成 **panic**，且不会自动回滚已构造资源。注册在
`AfterAppStart` 之前就开始，所以不要把就绪工作放 `AfterAppStart`。/ `BeforeAppStart`
errors become panics with no automatic rollback. Registration begins before
`AfterAppStart`, so don't put readiness work there.

## Web

`.skel` 声明 Web 名与允许的 Actor；Go handler 在 `Routes` 里注册路由。

```go title="internal/account/web.go"
type UserPortal struct {
    skeled.DefaultUserPortalWebServer
    Context *gin.Context `inject:""`
}

func (h *UserPortal) Routes(router *web.Router) {
    router.GET("/health", h.Health)
}

func (h *UserPortal) Health() {
    h.Context.JSON(200, map[string]string{"status": "ok"})
}
```

```go
func (*CheckoutApp) WebberInitHandlers(add app.TypeAdder) {
    add(app.T[*UserPortal]())
}
```

Vine 把 Web 能力注册给 Link，Portal 从站点规则发现端点并转发外部请求。standalone 用
相同匹配/转发，只是端点是 inproc。/ Vine registers Web with Link; Portal discovers and
forwards. Standalone uses the same matching via inproc.

## Config

在 `.skel` 里声明 `config ... eternal|instant`，`skelc gen go` 生成类型后像普通依赖一样注入。
**不要**手工注册生成的配置类型。

```skel title="skel/config.skel"
domain demo.checkout

config CheckoutConfig eternal {   // 本实例首次读取后固化 / snapshot fixed at first read
    timeoutMs: int
    currency: string
}

config FeatureFlagsConfig instant { // Link 订阅更新；新执行解析到新值 / watched; new execs see new value
    newCheckout: bool
}
```

```go title="internal/checkout/service.go"
type CheckoutService struct {
    Config *skeled.CheckoutConfig `inject:""`
}
```

| Lifecycle | Link 保留 | 代码观察到 | 适合 |
| --- | --- | --- | --- |
| `eternal` | 本实例首次读取的快照 | 本实例余下生命周期同一快照 | 连接设置、启动策略 |
| `instant` | 订阅的快照，随 Hub 更新 | 后续 DI 解析得到新解码值 | feature flag、可变阈值 |

关键：`instant` 更新**不会修改已注入的指针**。module/组件是应用级 singleton，若把
instant config 存进字段，那个指针停留在构造时。要让长生命对象响应更新，把敏感逻辑放
到新创建的执行依赖里。/ Instant updates don't mutate already-injected pointers. A
module storing an instant config in a field keeps the construction-time value.

配置解析是**严格**的：生成类型必须已注册、Hub/Link 必须有非空值、JSON 必须能解码进
生成类型，否则失败而非返回零值。/ Config resolution is strict - missing value or
decode failure fails rather than returning a zero value.

## Routing model / 路由模型

进程挂载的内建前缀：`/console`、`/rpc/invoke`、`/event`、`/task`、`/web/access/...`。
匹配前缀后框架剥掉前缀，把剩余路径交给对应 handler；无匹配返回 404。例如
`/rpc/invoke/demo.user.UserService/getUser` 传给 Rpc handler 的是
`/demo.user.UserService/getUser`。

默认启动 HTTP server（h2c）；`ListenAddr == ""` 时监听随机端口。inproc 模式注册所有
Rpc 路由和所有 `/web/access/...` 路由，但不是顶层 `app` 包的公开创建入口。/ Built-in
prefixes are stripped before dispatch. Default HTTP server uses h2c; empty ListenAddr
binds a random port.
