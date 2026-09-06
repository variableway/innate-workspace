# 09 · Testing / 测试范式

> Bilingual. Code is shared. / 双语，代码共享。

Vine 测试聚焦**可观测行为**：返回值、状态变化、配置覆盖、错误码。用 `app/testkit` 起一个受控
standalone 运行时，覆盖 DI、Rpc handler、Event listener、Task runner。只在需要真实租约/断网/TLS
时才单独起 Hub/Link/Portal 进程。

Vine tests focus on **observable behavior**. Use `app/testkit` to start a controlled
standalone runtime covering DI, Rpc handlers, Event listeners, Task runners. Start
separate Hub/Link/Portal processes only for real lease/network/TLS tests.

## testkit API

| Symbol | Purpose |
| --- | --- |
| `testkit.StartStandalone[S](t, option, appliers...) *Runtime` | 起一个进程级 standalone 运行时，自动 `t.Cleanup`。Start one process-wide runtime; auto-cleans. |
| `testkit.Option{SeedYAMLFile, ConfigOverrides}` | 基础 seed + 配置覆盖。Base seed + config overrides. |
| `testkit.OverrideConfig[C](value C)` | 按注册类型覆盖配置。Override by registered config type. |
| `testkit.OverrideConfigByName(name, value)` | 按全限定 Skel 名覆盖。Override by fully-qualified Skel name. |
| `testkit.ConfigOverride{Name, Value}` | 覆盖项。An override entry. |
| `runtime.NewExecution(option) *Execution` | 创建一次调用执行上下文。Create a call execution. |
| `testkit.ExecutionOption{Context, Trace, Initiator, Actor}` | 执行元数据；nil 用 absent actor + 新 trace。Execution metadata; nil -> absent actor + new trace. |
| `testkit.NewClient[C](*Execution) C` | 生成普通 Rpc client 绑定到该执行。Generated ordinary Rpc client bound to the execution. |
| `testkit.NewClientER[C](*Execution) C` | 生成 error-returning Rpc client。Generated error-returning Rpc client. |

## A handler test / handler 测试

```go title="greeting_test.go"
func TestGreeting(t *testing.T) {
    runtime := testkit.StartStandalone[*GreetingApp](t, testkit.Option{})

    execution := runtime.NewExecution(testkit.ExecutionOption{
        Actor: meta.NewAnonymousActor(), // 模拟一个未认证调用者 / simulate unauthenticated caller
    })
    client := testkit.NewClient[skeled.GreetingServiceClient](execution)

    got := client.Hello("Vine")
    require.Equal(t, "Hello, Vine", got.Message)
}
```

`NewExecution` 的执行是一次性的：filter chain 返回后 Vine 完成并释放，之后不能再从该 injector 解析。
/ An execution is single-use; after its filter chain returns, Vine completes it.

## Override configuration / 覆盖配置

```go title="checkout_test.go"
func TestCheckout(t *testing.T) {
    runtime := testkit.StartStandalone[*CheckoutApp](t, testkit.Option{
        ConfigOverrides: []testkit.ConfigOverride{
            testkit.OverrideConfig(&skeled.CheckoutConfig{TimeoutMs: 3000, Currency: "CNY"}),
            testkit.OverrideConfigByName("demo.checkout.FeatureFlagsConfig",
                &skeled.FeatureFlagsConfig{NewCheckout: true}),
        },
    })
    // ... 用 runtime.NewExecution(...) 调用 ...
}
```

覆盖会合并进 seed YAML（testkit 内部生成临时 seed 文件并清理）。/ Overrides merge into a
temporary seed YAML (testkit generates and cleans it up).

## Test rules / 测试规矩

- **Vine App 在测试进程内是 singleton**：每个测试包只起**一个** standalone runtime；多用例用
  `t.Run(...)` 子测试共享，**不要**在多个顶层 test 里重复建 App。/ One runtime per package;
  share via `t.Run` subtests; don't rebuild the App across tests.

```go title="account_test.go"
func TestAccount(t *testing.T) {
    runtime := testkit.StartStandalone[*AccountApp](t, testkit.Option{})

    t.Run("create", func(t *testing.T) { /* 用 runtime.NewExecution(...) */ })
    t.Run("rename", func(t *testing.T) { /* ... */ })
    t.Run("delete", func(t *testing.T) { /* ... */ })
}
```

- **测试与源码同目录**：`service.go` ↔ `service_test.go`；共享 setup 放 `test_helper_test.go`，
  不要把无关测试都堆那里。/ Tests beside source; shared setup in `test_helper_test.go`.
- **还原全局**：改过的全局变量/注册表/环境变量/inproc 端点/后台资源用 `t.Cleanup` 还原。
  / Restore globals with `t.Cleanup`.
- **不要 `t.Parallel()`**：在共享全局注册表/全局 logger 设置/应用 singleton/inproc 端点注册表的
  包里，除非已明确证明隔离。/ No `t.Parallel()` where global registries/loggers/singletons are shared.
- **不要为测试给生产代码加 `*_fortest.go` hook**：优先用测试本地 fake 和依赖注入。/ Prefer
  test-local fakes and DI over production-compiled `*_fortest.go` hooks.

## Testing Event/Task / 测试 Event/Task

Event/Task 是**至少一次**投递，要测：强制失败、超时、重复投递、优雅关停。handler 必须幂等
（用契约里的 `eventId`/`jobId` 去重）。/ Event/Task are at-least-once; test forced failure,
timeout, duplicate delivery, and graceful shutdown. Handlers must be idempotent.

```go title="userevent_test.go"
func TestUserCreatedListener(t *testing.T) {
    runtime := testkit.StartStandalone[*AccountApp](t, testkit.Option{})
    exec := runtime.NewExecution(testkit.ExecutionOption{Actor: meta.NewAnonymousActor()})
    emitter := testkit.NewClient[skeled.UserCreatedEventEmitter](exec)

    emitter.EmitUserCreated(&skeled.UserCreatedEvent{EventId: id1, UserId: uid})

    // 断言副作用（读模型/DB 状态），而不是"消息已处理"
    // assert observable side effects (read model / DB state), not "message processed"
    require.Eventually(t, func() bool {
        return projectionExists(uid)
    }, 2*time.Second, 50*time.Millisecond)
}
```

> 超时**不代表执行停止**：Link 可能在原 handler 还在跑时重投，两次尝试可能重叠。测试里要让 handler
> 响应 context 取消。/ Timeout doesn't stop execution; two attempts can overlap. Make handlers
> respect context cancellation.

## Standalone vs separate processes / 单进程 vs 独立进程

| 要测 / to test | 用 / use |
| --- | --- |
| 业务装配、DI、handler 逻辑、配置覆盖 | standalone + testkit |
| 真实租约/心跳/lease 过期 | linked 或 separated 独立进程 |
| 网络分区/断连/TLS 入口 | separated 独立进程 |
| 独立进程崩溃/重启 | separated 独立进程 |

standalone 保留了注册/快照/路由/round-robin/序列化/克隆边界，但**不**模拟独立进程崩溃、网络分区、
心跳失败、lease 过期。standalone 通过 ≠ 分布式就绪。/ Standalone preserves routing/serialization
boundaries but not crashes/partitions/lease expiry. Passing standalone ≠ distributed-ready.

## Validation scripts / 校验脚本

Vine 仓库用 `test/test.sh` 和 `test/race.sh`（都设 `GOWORK=off`，防止 workspace 替换已发布依赖）：

```bash
# 仓库级全量测试 / repo-wide
bash test/test.sh                 # = GOWORK=off go test ./...

# 竞态测试 / race suite
bash test/race.sh                            # targeted（并发相关包）
VINE_RACE_SCOPE=all bash test/race.sh        # 全量 release race 套件

# 单包/单测迭代 / iterate on one package
go test ./path/to/package -run TestName
go test -race ./path/to/package
```

改完代码常规校验 / routine checks:

```bash
gofmt -w .
git diff --check
go vet ./...          # 改公共 API/并发/反射/运行时接线后跑 / after API/concurrency/reflection changes
go test ./...
```

## Do / Don't

**Do** - 一个包一个 runtime、子测试共享、测可观测行为、`t.Cleanup` 还原、handler 幂等、测失败/超时/重复。
**Don't** - 多个顶层 test 各起 App、`t.Parallel()` 撞全局、为测试加生产 hook、用子进程替代 standalone 测业务逻辑、
断言"消息已处理"而非副作用。
