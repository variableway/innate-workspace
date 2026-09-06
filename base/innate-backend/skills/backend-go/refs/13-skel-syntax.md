# 13 · Skel Contract Cheat Sheet / Skel 契约语法速查

> Bilingual. Code is shared. / 双语，代码共享。
>
> ⚠️ **Ownership / 归属**: the Skel language and `skelc` are owned by the Skel site at
> **https://skel.yorun.ai/docs/**. This is a **quick reference** of constructs actually
> used in Vine's own `.skel` files and docs - not a language spec. For authoritative
> syntax, actors, permissions, and the generator, see the Skel site. / Skel 语言与 skelc
> 的权威参考在 **https://skel.yorun.ai/docs/**。本页是从 Vine 自身 `.skel` 与文档里
> 提炼的**速查**，非语言规范；权威语法以 Skel 站点为准。

## Workflow / 工作流

```bash
skelc check  --skel-in ./skel                    # 校验契约 / validate
skelc symbol list --skel-in ./skel               # 查看识别出的符号 / list symbols
skelc gen go --skel-in ./skel --go-out ./skeled  # 生成 Go / generate Go
skelc gen ts --skel-in ./skel --ts-out ./skeled  # 生成 TypeScript / generate TS
```

生成代码是构建产物--改 `.skel` 后重新生成，**不要手改** `skeled/`。生成 schema 记录 skelc
版本，Vine 运行时拒绝低于 `MinSkelcVersion()`（当前 `v0.9.0`）的 schema。/ Generated code is
build output; regenerate, never hand-edit. Schemas record the skelc version; the runtime
rejects schemas below `MinSkelcVersion()` (currently `v0.9.0`).

## File skeleton / 文件骨架

```skel title="skel/domain.skel"
@desc("Greeting example")     // 描述注解，可标在声明和字段上 / description annotation
domain demo.greeting           // 每个文件声明所属 domain / declare domain per file
```

```skel title="skel/greeting.skel"
domain demo.greeting

pub data Greeting {            // pub = 公开契约 / public contract
    message: string
}
```

## Types / 类型

| Type | Note |
| --- | --- |
| `string` `int` `bool` | 基础类型 / primitives |
| `uuid` | UUID / UUID |
| `timestamp` | 时间戳 / timestamp |
| `bytes` | 二进制（触发 CBOR）/ binary (triggers CBOR) |
| `T?` | 可选 / optional |
| `list<T>` | 列表 / list |

```skel
data Example {
    name: string
    nick: string?              // 可选 / optional
    tags: list<string>         // 列表 / list
    schema: AppConfigSchema?   // 引用其它 data / reference another data
}
```

字段也可加 `@desc("...")` 和 `@sensitive`（脱敏）。/ Fields can take `@desc("...")` and
`@sensitive` (redaction).

## Declarations / 声明

### data

```skel
@desc("User")
pub data User {
    userId: uuid
    name: string
    @sensitive password: string
}
```

### service (Rpc)

```skel
domain demo.greeting

pub service GreetingService {
    noauth                      // 免鉴权 / no auth
    method hello {
        input { name: string }
        output Greeting
    }
}
```

带 Actor 鉴权的服务（来自 vine 自身 `.skel`）/ with Actor auth (from vine's own `.skel`):

```skel
service AppConfigService {
    for AdminActor              // 绑定 Actor / bind Actor
    noauth
    @desc("List configuration items")
    method list {
        @desc("Configuration item list")
        output list<AppConfigItem>
    }
    method update {
        input {
            @desc("Configuration ID")
            id: int
            update: AppConfigUpdate
        }
        @desc("Configuration items")
        output AppConfigItem
    }
}
```

> 生成的 server 接口带**包私有 seal 方法**，外部包必须嵌入 `DefaultXxxServer`，不能从零实现。
> / The generated server interface carries a package-private seal; embed
> `DefaultXxxServer`, don't implement from scratch.

### event

```skel
domain demo.async

pub event UserCreatedEvent {
    payload {                   // payload 块 / payload block
        eventId: uuid           // 幂等键 / idempotency key
        userId: uuid
    }
}
```

`@sensitive` 可标整个 `payload` 块。生成 emitter/listener 对。/ `@sensitive` can mark the whole
`payload` block. Generates an emitter/listener pair.

### task

```skel
task RebuildIndexTask {
    trigger manually {          // 有入参，可手动触发，不可被 Cron 调度 / has input, manually launched
        input { jobId: uuid }
    }
    trigger nightly {}          // 无入参，可被 Cron 调度 / no input, cron-schedulable
}
```

Cron 只能调度**无入参**的 trigger；`WithRunnerCronScheduler("nightly", "0 2 * * *")` 传的是
trigger 的 **Skel 名**。生成 launcher/runner 对。/ Cron only schedules no-input triggers;
`WithRunnerCronScheduler` takes the trigger's Skel name. Generates a launcher/runner pair.

### web

```skel
web UserPortalWeb {
    for ClientActor             // 允许的 Actor / allowed Actor
}
```

Go 侧实现 `Routes(*web.Router)` 注册 Gin 路由。/ Implement `Routes(*web.Router)` for Gin routes.

### config

```skel
domain demo.checkout

config CheckoutConfig eternal {   // 本实例首次读取后固化 / snapshot fixed at first read
    timeoutMs: int
    currency: string
}

config FeatureFlagsConfig instant { // 订阅更新，新执行看新值 / watched; new execs see new value
    newCheckout: bool
}
```

生成类型自动注册 Skel 名/Go 类型/生命周期；**不要手工注册**。/ Generated types auto-register;
don't register by hand.

### actor

```skel
domain demo.portal

pub actor AdminActor {
    via client {}                // via 通道 / via channel
}
```

Actor 的 `info`/`credential` 块可标 `@sensitive`；`auth` 容器与 Event 声明本身不能标。生成后用
`meta.NewAuthenticatedActor(&skeled.XxxActorInfo{...})` 构造，`meta.GetActorInfo[T](actor)` 读。
/ Actor `info`/`credential` blocks can be `@sensitive`; `auth` containers and Event declarations
cannot. Construct via `meta.NewAuthenticatedActor`, read via `meta.GetActorInfo[T]`.

## What goes where / 放哪里

```text
demo/
├── skel/        # 手工维护的 .skel 源 / hand-maintained sources
│   ├── domain.skel
│   ├── greeting.skel
│   └── async.skel
└── skeled/      # skelc 生成（不手改）/ generated (don't edit)
```

契约位置由 skelc 配置与团队约定决定，Vine 不强制放在业务域下。/ Contract location is up to skelc
config and team convention; Vine doesn't require it under a business domain.

## Do / Don't

**Do** - `skelc check` 先校验再生成；契约里放稳定业务 ID（`eventId`/`jobId`）做幂等；敏感字段标
`@sensitive`；改 `.skel` 后重新生成并提交 `skeled/`；固定 skelc 版本。
**Don't** - 手改 `skeled/`；从零实现生成 server 接口（要嵌 `DefaultXxxServer`）；把非幂等操作标
`NoRetry` 当幂等；用 `@latest` skelc 进生产流水线。
