# 02 · Modules & Composition / 模块与组合

> Bilingual. Code is shared. / 双语，代码共享。

## Module vs component vs DI binding / 模块、组件、DI 绑定的取舍

| Unit / 单位 | When / 何时用 |
| --- | --- |
| **Module** (`app.BaseModule`) | 业务能力：领域服务、后台工作、需要随应用启停的资源。Business capabilities with lifecycle. |
| **Infrastructure component** (`rdb.Database` / `redis.Redis`) | 数据库、Redis 等基础设施。声明具体类型，提供连接/DAO/锁/缓存。Databases, Redis. |
| **DI binding** (`BindCommon` / `Bind`) | 接口到实现、工厂构造、显式生命周期；不占生命周期 hook。Interface→impl, factories, lifetimes. |

组件在模块**之前**启动，关停时在模块**之后**停止——所以业务模块启动时数据库/Redis 已就绪，
关停时模块还能在连接释放前清理。/ Components start before modules; shutdown reverses
so modules finish while component resources are still present.

## Defining a module / 定义模块

```go title="internal/account/module.go"
type UserModule struct {
    app.BaseModule
    Users *UserDao `inject:""` // DAO 由 rdb 组件暴露进 DI / DAO exposed by rdb component
}

func (m *UserModule) BeforeAppStart() error {
    // 建连接、预热、校验依赖（端点尚未发布）
    // Establish connections, warm data, verify deps (endpoint not published yet)
    return nil
}

func (m *UserModule) AfterAppStart() {
    // 注册已完成、请求可能已到；起后台循环要自带 cancel + join
    // Registration done; start background loops with explicit cancel + join
}

func (m *UserModule) BeforeAppStop() {
    // 停生产者、取消并 join worker（server 与 root context 仍活跃）
    // Stop producers, cancel + join workers (server + root ctx still active)
}

func (m *UserModule) AfterAppStop() {
    // 释放资源、本地清理（root context 已取消）
    // Release resources (root ctx already cancelled)
}
```

```go title="internal/application/modules.go"
func (*DemoApp) InitModules(add app.TypeAdder) {
    add(app.T[*UserModule]())
    add(app.T[*OrderModule]()) // 声明序决定 hook 顺序 / declaration order = hook order
}
```

不要重复声明同一 module/component 类型。共享依赖用 `BindCommon` 或对象自己的 `Bind`。
请求级 context 依赖留给执行作用域。/ Don't declare the same type twice. Share deps via
`BindCommon` or the object's own `Bind`. Leave per-request deps to the execution scope.

## Composing modules / 组合模块

模块之间通过**依赖注入**组合，而不是在 `main` 里手工拼装。把依赖声明为 `inject:""` 字段，
DI 容器按类型解析。同应用内两个组件要通信，**直接注入 Go 依赖**，不要为此造 Rpc 服务
（Rpc 是跨应用/跨进程契约）。

Modules compose through DI, not manual wiring in `main`. Declare deps as `inject:""`
fields. For two components in the **same** app to communicate, inject a Go dependency
directly - do **not** create an Rpc service for it (Rpc is a cross-app contract).

### Sibling module construction / 兄弟 Module 构造期依赖

Vine registers every concrete Module type before constructing Module instances. A
sibling can therefore inject another concrete Module, and every Module can consume
component bindings or `Application.BindCommon` bindings during construction/`DIInit`.

Vine 会先注册所有具体 Module 类型，再构造实例。因此兄弟 Module 可以直接注入另一个具体
Module；组件 bindings 与 `Application.BindCommon` bindings 也能用于 Module 构造和 `DIInit`。

`Module.Bind()` is different: Vine calls it only after all sibling Modules have been
constructed, when publishing dependencies to application/execution injectors. Do not
expect a binding declared by one Module to satisfy another sibling's constructor. If a
sibling needs an abstraction during construction, inject the concrete provider Module or
publish a deterministic factory from `Application.BindCommon`.

`Module.Bind()` 会在兄弟 Module 全部构造完成后才用于应用/执行容器发布依赖，不能满足另一个
兄弟 Module 的构造期依赖。构造期需要抽象时，直接注入具体 provider Module，或在
`Application.BindCommon` 中发布无副作用的工厂。

Dependency injection does not reorder lifecycle hooks. Hooks still follow declaration
order, with shutdown reversed. Put providers before consumers when hook readiness matters,
or promote a truly process-wide technical provider to an application Component.
/ 注入关系不会重排生命周期 hook；hook 仍按声明顺序执行、停止时反序。若就绪顺序重要，provider
应声明在 consumer 前；真正进程级的技术能力可提升为应用 Component。

```go title="internal/checkout/service.go"
type CheckoutService struct {
    di.SingletonScoped

    Users  *UserDao              `inject:""` // 来自 rdb 组件 / from rdb component
    Events skeled.OrderEventEmitter `inject:""` // 生成的 emitter / generated
    Cfg    *skeled.CheckoutConfig `inject:""`
}

func (s *CheckoutService) Place(order Order) {
    user := s.Users.First(order.UserID)
    // ... 业务逻辑 ...
    s.Events.EmitOrderCreated(&skeled.OrderEvent{OrderId: order.ID})
}
```

### BindCommon vs Bind / 两种绑定范围

- `BindCommon(b)`: 应用级共享依赖（所有执行上下文可见）。
- 组件/模块的 `Bind(b)`: 仅该对象范围内的依赖。

`BindCommon`、组件 `Bind`、模块 `Bind` 是**依赖声明**，不是生命周期回调；框架可能把它们
应用到多个容器，所以要保持确定性、无副作用。/ These `Bind*` methods are dependency
declarations, not lifecycle callbacks; keep them deterministic and side-effect-free.

<a id="filters"></a>

## Filters / 过滤器（`core/ctr`）

Rpc/Web/Event/Task 处理器都经过执行容器：每次调用创建一个执行、准备依赖与 context、
按序跑 filter、最后调用目标方法。业务 handler 自动走这套；只有自定义执行入口或加共享
filter 时才直接用 `core/ctr`。

Every handler runs through an execution container: create execution → seed context →
run filters in order → invoke target. Business handlers use this automatically; reach
for `core/ctr` only for custom entry points or shared filters.

```go title="internal/platform/trace_filter.go"
type TraceFilter struct {
    di.ExecutionScoped

    Logger  *logger.Logger `inject:""`
    Context *ctr.Context   `inject:""`
}

func (f *TraceFilter) Filter(next ctr.FilterNext) {
    started := time.Now()
    f.Logger.Info("before", "method", f.Context.TargetMethodName())
    next() // 洋葱模型：调用下一层 / onion model: call next layer
    f.Logger.Info("after", "method", f.Context.TargetMethodName(), "elapsed", time.Since(started))
}
```

Filter 按 `FilterTypes` 顺序形成洋葱：`A(before) → B(before) → invoke → B(after) → A(after)`。
filter 可以在 `next()` 前改 target/arguments，在 `next()` 后只能改 `Results`。短路是协议
决定——Rpc/Event/Task 执行器期望合法结果形状，短路必须 set 兼容结果，否则执行失败。

注册 filter：实现 `ServicerInitFilters` / `WebberInitFilters` / `EventerInitFilters` /
`TaskerInitFilters`。/ Register filters via the corresponding `*InitFilters` method.

## Worker module pattern / Worker 模块范式

后台循环必须在 `AfterAppStart` 起、`BeforeAppStop` 停，并自带 cancel 与 done 信号。
**不要**依赖 `AfterAppStop` 来及时观测取消。

```go title="internal/indexer/worker.go"
type WorkerModule struct {
    app.BaseModule
    Context context.Context `inject:""` // 应用根 context / app root context

    cancel context.CancelFunc
    done   chan struct{}
}

func (m *WorkerModule) AfterAppStart() {
    workerCtx, cancel := context.WithCancel(m.Context)
    m.cancel = cancel
    m.done = make(chan struct{})

    go func() {
        defer close(m.done)
        runWorker(workerCtx) // 必须响应 ctx 取消 / must respect ctx cancellation
    }()
}

func (m *WorkerModule) BeforeAppStop() {
    if m.cancel == nil {
        return
    }
    m.cancel()
    select {
    case <-m.done:
    case <-time.After(5 * time.Second): // 必须有 deadline / must be bounded
        // 记录超时后继续关停 / record timeout, continue shutdown
    }
}
```

<a id="errors"></a>

## Errors / 错误模型（`core/ex`）

用 `core/ex` 跨 Rpc/Web/Event/Task 与业务代码携带稳定错误码。调用方按 `Code` 分支，
日志保留 message/reason/detail/cause。

```go title="internal/account/service.go"
func FindUser(id string) (*User, ex.Error) {
    if id == "" {
        return nil, ex.New(ex.ValidationFailed, "empty id")
    }
    user := repo.Find(id)
    if user == nil {
        return nil, ex.New(ex.NotFound, "user not found")
    }
    return user, nil
}

// panic / recover 风格 / panic-recover style
func MustFindUser(id string) *User {
    if id == "" {
        ex.PanicNew(ex.ValidationFailed, "empty id")
    }
    user := repo.Find(id)
    if user == nil {
        ex.PanicNew(ex.NotFound, "user not found")
    }
    return user
}

func Handle() (err ex.Error) {
    defer func() { err = ex.Recover(recover()) }()
    _ = MustFindUser("u-1")
    return nil
}
```

要点 / rules:
- 业务失败用 `ApplicationError`（`NotFound`/`ValidationFailed`/`OperationFailed` 等）。
- `Internal`/`Unknown` 是兜底，不要当业务语义直接抛。
- 保留原始 error 链用 `ex.WithCause(cause)`（`errors.Is` 仍生效，cause 不跨进程序列化）。
- 边界只捕业务异常用 `RecoverApplication`（系统错误会 rethrow）。
- 传未知 `Code` 给 `New` 会 panic；不要手造未注册的 `Code` 字符串。

## Cross-execution safety / 跨执行安全（关键）

这是**不安全**的 / This is unsafe:

```go
var cachedDAO *OrderDao

func (h *OrderHandler) Handle() {
    cachedDAO = h.OrderDAO // 请求结束后，这个 DAO 的 context 已结束 / ctx ended after request
}
```

生成的 client、DAO、cache、locker、config 指针、handler、filter 都同理——不要挪出当前执行。
正确做法：依赖留在 handler 上只在本次调用用；要后台工作就让 module 持有**应用 context**
的独立 client，或把纯数据丢进队列。/ Never move execution-scoped deps (clients, DAOs,
caches, lockers, config pointers, handlers, filters) out of their execution. Keep them on
the handler for the call, or let a module own an app-context client for background work.

## Dependency safety checks / 依赖图校验

Vine 在服务前校验依赖图：拒绝循环依赖；声明的 singleton 不能依赖 execution-scoped 类型；
execution-scoped 类型不能从 plain injector 解析；隐式构造只支持 struct 指针；注入字段必须导出。
这些检查防止请求对象被悄悄捕获进长生命 singleton，但不能替代生命周期设计。/ Vine validates
the graph before serving: no cycles, singletons can't depend on execution-scoped types,
execution-scoped can't resolve from a plain injector, injected fields must be exported.
