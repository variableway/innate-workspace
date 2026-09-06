# 12 · Extensibility Boundary / 可扩展性边界

> Bilingual. Grounded in Vine v0.12 `app/api.go`, `internal/app/component.go`, and
> `internal/app/app_impl_init.go`. / 双语；事实依据为 Vine v0.12 源码。

## 1. One line / 一句话

Application Components, Modules, filters, and DI are open extension points. Vine's
`FrameworkComponent` implementations, built-in capabilities, MQ, and configuration
source are framework-controlled. / 应用级 Component、Module、filter 与 DI 可以扩展；
`FrameworkComponent`、内置能力、MQ 和配置源由框架控制。

Do not confuse Vine's public `infra/*` facade with an application's folder named
`internal/infra`, `internal/platform`, or `adapter`. Package names do not decide business
ownership. / 不要把 Vine 的 `infra/*` facade 与应用自己的目录名混为一谈；目录名不决定业务归属。

## 2. Open extension points / 开放扩展点

| Want / 想加 | Mechanism / 机制 |
| --- | --- |
| Process-wide technical dependency needed before Domains | Ordinary application Component: embed `app.BaseModule`, register in `InitComponents` |
| Domain-owned client, worker, or lifecycle behavior | Module: embed `app.BaseModule`, register in `InitModules` |
| Cross-cutting behavior | `core/ctr` filter + corresponding `*InitFilters` |
| Dependency/factory/scope | `core/di` binding |
| Custom execution pipeline | `core/ctr.NewContainer` |
| General helper | Public `util/*` packages or application-owned helper |
| Contract target language | `skelc` generator |

Although the public API exposes the name `BaseModule`, it aliases Vine's ordinary
`BaseComponent`. A type embedding it satisfies the ordinary Component contract and may
be registered through `InitComponents`. The sealed type is `FrameworkComponent`, not
every Component. / `app.BaseModule` 是普通 `BaseComponent` 的公开别名；嵌入它的类型可以通过
`InitComponents` 注册。封闭的是 `FrameworkComponent`，不是所有 Component。

## 3. Component or Module? / 选 Component 还是 Module

Use an application Component only when the capability is genuinely process-wide,
Domain-agnostic, and must start before all Modules. Examples: a shared database
connection, process logger, or metrics registry. It must not import Domain models,
records, migrations, or workflows.

Use a Module for a business capability or a client owned by one bounded context. A
Recording proxy remains part of the Recording Module even though it performs network
I/O. / 真正跨 Domain 且需要先于所有 Module 就绪的能力才是应用 Component；单个 Domain
拥有的 client、worker 或网络代理仍属于该 Domain Module。

```go title="internal/platform/database/component.go"
type Component struct {
    app.BaseModule

    DB *gorm.DB
}

func (component *Component) DIInit() {
    db, err := openDatabase()
    vpre.CheckNilError(err, "open database")
    component.DB = db
}

func (component *Component) Bind(b *di.Binder) {
    b.Bind(di.T[*gorm.DB]()).ToInstance(component.DB)
}

func (component *Component) AfterAppStop() {
    closeDatabase(component.DB)
}
```

```go title="internal/application/components.go"
func (*DemoApp) InitComponents(add app.TypeAdder) {
    add(app.T[*database.Component]())
}
```

Components start before Modules and stop after them. Within each group, lifecycle hooks
follow declaration order and shutdown reverses it. / Component 先启动、后停止；组内 hook
按声明顺序执行，停止时反序。

## 4. Binding timing / Binding 时机

Construction and binding are not the same phase:

1. Vine registers and constructs all application Components.
2. Component bindings and `Application.BindCommon` are available while Modules construct.
3. Vine registers and constructs all sibling Modules.
4. `Module.Bind()` publishes additional bindings to application/execution injectors.

Consequences / 结论：

- A sibling Module can inject another concrete Module type.
- A sibling cannot use an interface binding published only by the provider's
  `Module.Bind()` during its own construction; inject the concrete Module or use
  `Application.BindCommon`.
- `Bind()` must be deterministic and side-effect-free because Vine may apply it to
  multiple nested injectors.
- Do not bind a value created later in `BeforeAppStart`; it does not exist during
  assembly. Create construction-time dependencies in `DIInit`, or let consumers inject
  the owner and access the resource after lifecycle readiness.
- Injecting a dependency does not reorder hooks. Declare provider-before-consumer when
  hook order matters, or use a Component for a true process-wide prerequisite.

## 5. Framework-controlled extension points / 框架控制的扩展点

| Closed/framework-controlled | Practical consequence / 实际影响 |
| --- | --- |
| `FrameworkComponent` implementations | Application code cannot create a new native `infra/foo` equivalent to `rdb.Database`/`redis.Redis` |
| Event/Task MQ | NATS is built into the runtime topology; replacing it requires Vine changes |
| Rpc/Web/Event/Task capability specs | Adding a new built-in protocol/capability requires Vine changes |
| Configuration source | Hub-backed configuration is part of the runtime contract |

An application can still wrap Mongo, Kafka, ES, or S3 in an ordinary Component or
Module. What it cannot do is add a new framework-native `FrameworkComponent` family
without changing Vine itself. / 应用仍可用普通 Component 或 Module 包装 Mongo/Kafka/ES/S3；
不能在不修改 Vine 的情况下新增框架原生 `FrameworkComponent` 家族。

## 6. Decision matrix / 决策表

| Need / 需求 | Choice / 选择 |
| --- | --- |
| Shared DB/client used by multiple Domains and ignorant of their models | Application Component |
| DB records, migration, proxy, filesystem behavior used by one Domain | Domain-owned adapter + Module lifecycle |
| Client only needed by one Domain | Domain Module |
| Request/Rpc/Event/Task cross-cutting logic | Filter |
| Interface/factory visible during Module construction | Component binding or `Application.BindCommon` |
| Interface visible only to handlers/executions | Owning Module's `Bind()` if justified |
| Native DAO/component family, new MQ, new capability, new config source | Change Vine |

Prefer the simplest owner that preserves lifecycle and dependency direction. / 选择能保持
生命周期和依赖方向的最简单 owner。
