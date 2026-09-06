# 10 · Observability & Logging / 可观测性与日志

> Bilingual. Code is shared. / 双语，代码共享。

Vine 的可观测性由四个公共包支撑：`core/logger`（结构化日志）、`core/meta`（trace/initiator/actor
身份）、`core/redact`（敏感数据脱敏）、外加 Portal 的 `vrpc-*`/`portal-trace-id` 链路头。`meta.Trace`
不是完整 OTel span--它只创建并传播 trace id / span id / parent span，span 名/属性/状态/导出由日志或
OTel 层负责。

Vine observability rests on four public packages: `core/logger` (structured logging),
`core/meta` (trace/initiator/actor identity), `core/redact` (sensitive-data masking), plus
Portal's `vrpc-*`/`portal-trace-id` headers. `meta.Trace` is not a full OTel span - it only
creates/propagates trace/span/parent ids; span names/attrs/status/export belong to the log
or OTel layer.

## Structured logging / 结构化日志

包级默认 logger 名为 `vine:default`，直接用 / use the package default directly:

```go title="service.go"
logger.Info("user created", "userId", user.ID)
logger.Error("payment failed", "orderId", order.ID, "error", err)
```

需要区分来源时建命名 logger。`New` 的多参数用 `:` 连接，参数本身也可含 `:`；`Child` 在父名后追加
段并继承选项与属性。/ Create a named logger to distinguish sources. `New` joins args with `:`;
`Child` appends segments, inheriting options and attributes.

```go title="service.go"
appLog := logger.New("app", "demo.user")        // logger=app:demo.user
rpcLog := appLog.Child("rpc", "server")         // logger=app:demo.user:rpc:server
rpcLog.Info("request completed", "method", "GetUser", "elapsedMs", 12)

tenantLog := appLog.With(slog.String("tenantId", tenantID)) // 固定属性 / fixed attrs
tenantLog.Info("tenant initialized")
```

`logger` 是保留字段名，不能作为顶层日志属性。/ `logger` is reserved; not a top-level attr.

## Levels by name / 按名配级别

无显式级别的 logger 用 `LevelAuto`：动态解析进程级名称规则，无匹配时回退全局级别。auto-level
logger 会立即观察后续规则与全局级别变更。/ A logger without explicit level uses `LevelAuto`,
which dynamically resolves process-wide name rules and falls back to the global level.

```go title="main.go"
logger.SetGlobalLevel(logger.LevelInfo)
logger.SetLevel("app:**", logger.LevelWarn)
logger.SetLevel("app:*:rpc", logger.LevelError)
logger.SetLevel("app:demo.user:rpc:server", logger.LevelDebug)
```

规则与 logger 名按 `:` 分段：字面段只匹配同文本；`*` 匹配**恰好一段**；`**` 匹配**零或多个连续段**；
规则也匹配后代名。`*`/`**` 不能单独成规则；段内通配（`rpc*`/`*rpc`/`***`）不支持。匹配优先级：从左
到右逐段比较，字面 > `*` > `**`；首个不同匹配类型的段决定优先级；短规则每段与长规则对应段同类型时，
长规则赢。/ Rules and names split on `:`; literal matches text, `*` matches one segment, `**`
matches zero-or-more; rules also match descendants. Priority: literal > `*` > `**`, left-to-right;
longer rule wins on ties.

框架稳定名：`vine:core:link`、`vine:core:rpc`、`vine:core:redact`、`vine:infra:rdb`，标准库 log 桥接
到 `vine:stdlog`。/ Framework names: `vine:core:*`, `vine:infra:rdb`, `vine:stdlog`.

## Format & output / 格式与输出

```go title="main.go"
logger.SetGlobalFormat(logger.FormatJSON)        // JSON Lines；k8s 环境默认 JSON，其它默认 text
logger.SetGlobalLevel(logger.LevelInfo)
logger.SetGlobalOutputPath("/var/log/demo/app.log")
```

日志**总是写 stderr**；非空 output path 还会追加到该文件并自动建父目录，传空回到仅 stderr。个别 logger
可用 `WithOption` 固定 Format/Level/OutputPath（空字段仍跟随全局）。/ Logs always go to stderr; a
non-empty path also appends to that file. `WithOption` fixes per-logger Format/Level/OutputPath.

## Sensitive data / 敏感数据脱敏（`core/redact`）

Skel 字段可标 `@sensitive`，skelc 给对应 Go 字段加 `skel:"sensitive"`，Rpc/Event/Task payload 日志经
`core/redact` 替换为 `<redacted>`。**字段名本身不会触发隐式脱敏**；动态 map/JSON 里要显式用
`RootSensitive` 或 `Sanitizer`。/ `@sensitive` marks fields; payload logging masks them via
`core/redact`. Field names alone don't trigger masking - use `RootSensitive`/`Sanitizer` for dynamic data.

```skel title="skel/login.skel"
data LoginRequest {
    username: string
    @sensitive password: string
}
```

`@sensitive` 也可标整个 data/config 声明、Event `payload` 块、Actor `credential`/`info` 块（`auth` 容器
与 Event 声明本身不能标）。框架 Rpc/Event/Task 日志记录 payload 时**总是**调 `core/redact`，没有全局
开关能关掉脱敏。`core/redact` 还会限制遍历深度、节点数、集合大小、字符串长度与最终 JSON 大小，
`Result.Truncated` 为 true 表示有截断。/ `@sensitive` can mark whole types/blocks; framework payload
logs always call `core/redact` (no global off switch). It also bounds depth/nodes/size/length.

```go title="diagnostic.go"
rendered, err := redact.Render(value)
if err != nil {
    return err // Render 失败会经 vine:core:redact 发 ERROR，只含 failureKind，不含原始敏感 err
}
logger.Info("diagnostic value", "value", rendered.JSON, "redacted", rendered.Redacted)

// 已知整个值敏感 / known fully sensitive:
redact.Render(value, redact.Option{RootSensitive: true})

// 紧控临时诊断才用 / tightly controlled diagnostics only:
redact.Render(value, redact.Option{RevealSensitive: true}) // 不影响二进制值（始终换成字节长度）
```

## Trace & identity / 链路与身份（`core/meta`）

业务代码一般只从执行 context **读** `meta.Context`（trace/initiator/actor），不自己生成或解析传输字段。
Vine 在请求边界创建并传播这些对象。/ Business code normally only **reads** `meta.Context` from the
execution context; Vine creates and propagates it at request boundaries.

```go title="meta usage"
type Context interface {
    context.Context
    Trace() Trace
    Initiator() Initiator
    Actor() Actor
}

anonymous := meta.NewAnonymousActor()                          // 未认证 / unauthenticated
authenticated := meta.NewAuthenticatedActor(&skeled.UserActorInfo{UserId: "user-1"})
info, _ := meta.GetActorInfo[skeled.UserActorInfo](actor)      // 类型安全读身份 / type-safe identity
trace := meta.InitialTrace()                                    // 新根 trace / new root trace
child := trace.NewChildTrace()                                  // 同 trace id，新 span / new span
```

Trace id = 16 字节小写 hex（32 字符）；span id = 8 字节小写 hex（16 字符）；全零非法。`meta.NewId()`/
`meta.NewSpan()`/`meta.IsValidId(...)`/`meta.IsValidSpan(...)`。/ Trace id = 16 bytes hex (32 chars);
span id = 8 bytes hex (16 chars); all-zero invalid.

## Trace & timeout propagation / 链路与超时传播

跨 Portal/Link/Rpc 的链路靠 header（业务代码一般不用手解析，**保留注入的 context** 即可）：

| Header | Sender | Purpose |
| --- | --- | --- |
| `vrpc-trace` | Rpc client | 传播 Rpc 调用链（`id=...,span=...`） |
| `vweb-trace` | Web client | 传播 Web 调用链 |
| `vrpc-options` | Rpc client | 调用选项，目前只有 `timeout` |
| `vweb-options` | Web client | 调用选项，目前只有 `timeout` |
| `portal-trace-id` | Portal response | 返回本次请求 trace id，便于排查 |

超时从**入口**算起，每次转发前换算成**剩余时间**。只要 handler 用注入的 context 调下游，Rpc client 会
读 context deadline 并把剩余时间写进 `vrpc-options`--不要用 `context.Background()` 替换活跃请求 context
（会丢掉剩余超时与 trace）。Portal Rpc/Web 默认 30s、上限 120s；SSE/WebSocket 无显式超时不限总时长，
60s 无流量才关。/ Timeout starts at entry and is recomputed to remaining time before each forward.
Keep the injected context; never replace it with `context.Background()`.

```go
// 对 / correct
result := h.SomeClient.DoSomething(...) // 用注入的 client/context / uses injected client/context
// 错 / breaks propagation
ctx := context.Background() // 丢了剩余超时与 trace / loses remaining timeout + trace
```

## What you see in an OTel backend / OTel 后端看到的

Rpc 请求（带 auth/check）大致形成 / an Rpc request with auth/check roughly forms:

```text
incoming trace
  -> rpcgw gateway
      -> auth client -> auth server
      -> check client -> check server
      -> target forward -> target rpc server
```

Web 请求 / a Web request:

```text
incoming trace
  -> webgw gateway
      -> auth rpc client -> auth rpc server
      -> web forward -> backend web handler
```

`meta.Trace` 不是完整 OTel span：只创建/传播 trace id、当前 span id、本地 parent span id。span 名、
属性、状态、事件、finish/export 由日志或 OTel 层负责--这把业务传播模型与具体观测后端解耦。
/ `meta.Trace` isn't a full OTel span: it only creates/propagates trace/span/parent ids. Span names,
attrs, status, events, finish/export belong to the log or OTel layer - keeping the business
propagation model separate from the concrete observability backend.

## Do / Don't

**Do** - 用命名 logger 区分来源；按 `app:**`/`vine:core:*` 配级别；payload 含敏感字段标 `@sensitive`；
保留注入 context 传播 trace/超时；记录 `portal-trace-id` 便于排查。
**Don't** - 用 `context.Background()` 替换活跃请求 context；把敏感数据写进日志属性而不脱敏；把 `logger`
当属性名；期望 `meta.Trace` 自带 OTel span 名/属性/导出（那归日志/OTel 层）。
