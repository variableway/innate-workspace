# 06 · Application Composition / 应用组合

> Bilingual. Code is shared. / 双语，代码共享。

## Bundle multiple apps in one process / 一个进程组合多个应用

`standalone.NewBundled` / `linked.NewBundled` 让多个业务应用共享一个进程内运行时
（standalone：共享内嵌 Hub/Portal/Link；linked：共享一个连外部 Hub 的 inproc Link）。
bundle 内的每个应用不能再带自己的 `standalone.Option` / `linked.Option`。

`standalone.NewBundled` / `linked.NewBundled` share one in-process runtime across
multiple business apps (standalone: embedded Hub/Portal/Link; linked: one inproc Link
to an external Hub). Each bundled app can't carry its own `standalone.Option`/`linked.Option`.

```go title="cmd/platform/main.go"
func main() {
    standalone.NewBundledWithOption(
        standalone.Option{SQLiteFile: "./vine.sqlite"},
        app.New[*UserApp](),
        app.New[*OrderApp](),
        app.New[*BillingApp](),
    ).StartAndWait()
}
```

启动顺序 / startup order:

| Mode | Startup | Shutdown |
| --- | --- | --- |
| `linked.NewBundled` | Link，然后业务应用按声明序 | 业务应用逆序，然后 Link |
| `standalone.NewBundled` | Hub、Portal、Link，然后业务应用按声明序 | 业务应用逆序，然后 Link、Portal、Hub |

关停时**先停业务应用再停 Link** 是关键：注销与 drain 路径必须保持可用，直到每个业务应用
完成关停。/ Stopping business apps before their in-process Link is essential - the
unregister/drain path must remain available until each app finishes shutdown.

## When to bundle vs split / 何时 bundle、何时拆

| Scenario / 场景 | Choose / 选择 |
| --- | --- |
| 几个应用强耦合、同发布、同扩缩容，想省进程 | bundle（standalone/linked） |
| 需要独立发布节奏、独立扩缩容、故障隔离 | separated，各自进程 + 独立 Link |
| 本地联调多应用，想共享一个 Hub | linked bundle 或多个 linked app 连同一 Hub |
| 单进程测试多应用协作 | standalone bundle + testkit |

bundle 是**部署组装**选择，不是业务边界选择。应用之间的契约（Rpc/Event/Task）仍然按
`.skel` 定义，与是否同进程无关。/ Bundling is a deployment-assembly choice, not a
business-boundary choice. Cross-app contracts stay defined in `.skel` regardless of process.

## App name rules & consumer groups / 应用名与消费组

- 应用名必须匹配 `^[a-z]+(?:\.[a-z]+)*$`（如 `demo.checkout`）。
- 同进程不同 App 必须不同名；**同一逻辑应用的副本用同名**。
- 同名副本作为**同一个 Event 消费组**竞争（每个 App 名一份投递，组内实例竞争）。
- 不同 App 名各自收到自己的 Event 副本。
- 应用类型与应用名在进程内都**只能构造一次**，即使停止后也不能重建（应用一次性、不可重启）。

## Inter-app communication patterns / 跨应用通信模式

### Same app / 同应用内

两个组件属于同一应用且不需要网络契约：**注入 Go 依赖**，不要造 Rpc 服务。

```go
type OrderService struct {
    di.SingletonScoped
    Users *UserDao `inject:""` // 同应用 DAO，直接注入 / same-app DAO, inject directly
}
```

### Cross app: Rpc / 跨应用同步

调用另一个应用并拿结果。经 Link 发现与转发；standalone 选 inproc 端点。生成 client 注入
到执行会继承当前 trace/initiator/actor。/ Call another app and get a result. Link discovers
and forwards; standalone uses inproc. A client injected into an execution inherits its
trace/initiator/actor. 详见 / see [05-microservice-dev](./05-microservice-dev.md).

### Cross app: Event / 跨应用异步事件

发布"已发生的事实"。Vine 用「Event 的 Skel 名 + 监听 App 名」组成消费身份：

- 两个不同 App 名各收一份副本。
- 同名副本竞争那一份。
- 重试可能落在同名另一实例。
- 并发与重试意味着 handler 不能依赖全局顺序。
- Event **不是**可重放的审计日志；不要假设后出现的监听者能收到它出现前发布的事实。

Publish a fact that already happened. Vine forms a consumer identity from the Event's
Skel name + listener App name. Distinct App names each get a copy; same-name replicas
compete for one copy. Retries may land on another same-name instance. Events are **not**
a replayable audit log.

```skel title="skel/async.skel"
domain demo.async

pub event UserCreatedEvent {
    payload {
        eventId: uuid   // 幂等键 / idempotency key
        userId: uuid
    }
}
```

```go title="internal/account/event.go"
type UserCreatedListener struct {
    skeled.DefaultUserCreatedEventListener
}

func (*UserCreatedListener) OnUserCreated(event *skeled.UserCreatedEvent) {
    // 用 event.EventId 做幂等后再施加副作用 / dedupe by eventId before side effects
}

func (*DemoApp) EventerInitListeners(add app.ListenerTypeAdder) {
    add(
        app.T[*UserCreatedListener](),
        app.WithListenerTimeout(20*time.Second),
        app.WithListenerConcurrency(4),
        // app.WithListenerNoRetry(), // 终止确认、不重试（不进 DLQ）/ terminal ack, no retry
    )
}
```

### Cross app: Task / 跨应用异步任务

请求"一个 runner 执行工作"。Vine 用 Task 的 Skel 名组成**一个全局消费身份**：所有 Link、
所有注册该 Task 的 App 实例在**同一个逻辑工作队列**里竞争。一条消息只分发给一个选中 runner；
发起方不选目标 App/实例；一个 Link 内本地实例 round-robin；重试可能落在另一个 App/Link/实例；
Task 执行**没有**回传给发起方的同步结果通道。

Request work for one runner. Vine forms one global consumer identity from the Task's
Skel name; all Links and all registered instances compete in **one** logical work queue.
One message -> one selected runner. Launcher doesn't choose target. No synchronous
result channel back.

```skel title="skel/async.skel"
task RebuildIndexTask {
    trigger manually { input { jobId: uuid } } // 可手动触发 / manually launchable
    trigger nightly {}                           // 可被 Cron 调度 / cron-schedulable (no input)
}
```

```go title="internal/indexer/task.go"
type RebuildIndexRunner struct {
    skeled.DefaultRebuildIndexTaskRunner
}

func (*RebuildIndexRunner) RunManually(jobId skel.UUID) {
    // 用 jobId 做幂等 / dedupe by jobId
}

func (*RebuildIndexRunner) RunNightly() {
    // 用稳定业务键 / use a stable business key
}

func (*DemoApp) TaskerInitRunners(add app.RunnerTypeAdder) {
    add(
        app.T[*RebuildIndexRunner](),
        app.WithRunnerTimeout(10*time.Minute),
        app.WithRunnerConcurrency(2),
        app.WithRunnerCronScheduler("nightly", "0 2 * * *"), // trigger 的 Skel 名 + 标准 5 字段 cron
    )
}
```

Cron 边界 / Cron boundaries:
- 触发器必须**无入参**（`nightly` 可调度，`manually` 不行）。
- 选项里传的是 trigger 的 **Skel 名**（如 `"nightly"`），不是生成的方法名。
- 同名副本的等价声明被 Hub 去重；不同 App 名即使 cron 相同也各建独立计划，但都进同一全局 Task 队列。
- 调度用 Hub 进程时钟与默认本地时区；**不保证** Hub/scheduler/消息运行时不可用期间错过的计划会补跑。

## Delivery defaults & idempotency / 投递默认值与幂等

| Behavior | Event listener | Task runner |
| --- | --- | --- |
| 尝试超时 | 30s | 30s |
| 并发 | 每注册实例 10 | 每注册实例 10 |
| 成功 | handler 成功返回后 ack | runner 成功返回后 ack |
| 默认失败 | nack 并重试 | nack 并重试 |
| 重试上限 | 流存在期间无 delivery-count 上限 | 同 / same |
| `NoRetry` | 终止确认、不重试（不进 DLQ） | 同 / same |
| 死信队列 | 无 | 无 |
| 消息存储 | 内存流 | 内存流 |

**至少一次投递**：同一条业务消息可能因 handler 错误、超时、ack 丢失、重连/消费者重分配而执行
多次。Vine 不在生成 payload 里加投递 ID--在契约里放稳定业务 ID（`eventId`/`jobId`），把副作用
做幂等（DB 唯一约束、原子"记录已处理+状态迁移"、幂等 upsert、外部 API 的 idempotency-key）。
不要把非幂等操作标 `NoRetry` 来规避重复--那只是把重复风险换成首次失败后的静默丢失。

At-least-once delivery: the same message can execute multiple times. Vine doesn't add a
delivery ID - put a stable business ID in the contract and make side effects idempotent.
Don't mark a non-idempotent op `NoRetry` just to avoid duplicates.

> 超时**不代表执行停止**。注册超时只约束 Link 等一次尝试多久；listener/runner 收到带该 deadline
> 的 context，应在取消时停手。否则 Link 可能超时、标记失败并重投，而原 handler 仍在跑--两次
> 尝试可能重叠。长循环和不可逆操作前都要检查注入的 context。/ Timeout doesn't stop execution.
> Check the injected context during long loops and before irreversible work.

## Config sharing via Hub / 通过 Hub 共享配置

每个配置由全限定 Skel 名标识（如 `demo.checkout.CheckoutConfig`），Hub 存 JSON、Link 读取并
解码成生成类型。`eternal` 本实例固化；`instant` 新执行看新值。多个应用可各自声明自己的 config；
共享值在 Hub seed/数据库里统一管理。/ Config is identified by fully-qualified Skel name; Hub
stores JSON, Link reads and decodes. Multiple apps declare their own configs; values are
managed centrally in Hub.

```yaml title="seed.yaml"
appConfigs:
  - name: demo.checkout.CheckoutConfig
    value: '{"timeoutMs":3000,"currency":"CNY"}'
  - name: demo.checkout.FeatureFlagsConfig
    value: '{"newCheckout":true}'
```

## Topology decision summary / 拓扑决策小结

| Requirement / 需求 | Recommended / 推荐 |
| --- | --- |
| 学框架或测单应用 | standalone |
| 本地多应用联调，不想单独跑 Link | linked（可 bundle） |
| 容器化部署、多实例、独立发布、真实故障演练 | separated |
| 几个强耦合应用同发布同扩缩 | bundle（standalone/linked） |
| 两个逻辑消费者都要观察同一事件 | 两个不同 App 名各注册 listener |
| 水平扩缩同一逻辑消费者 | 同名副本 |
| 全局只有一个 worker 执行某工作 | Task（一个全局队列） |

## Event/Task metadata propagation / 元数据传播

Event/Task 消息**不携带**完整同步请求 context:

| Metadata | Event | Task |
| --- | --- | --- |
| Trace id/span | 传播 | 传播 |
| 发送方 App 身份 | `Emitter()` | `Launcher()` |
| 发布时间 | `EmittedAt()` | `LaunchedAt()` |
| Actor | 不传播（listener 看到 absent Actor） | 不传播 |
| Initiator | 不传播 | 不传播 |
| 发送方 deadline/cancellation | 不传播 | 不传播 |

每次投递从 listener/runner 注册拿**新的 deadline**。若异步工作需要授权或租户身份，把**最小
不可变**身份数据放进契约，消费方再次校验，不要把凭据/密钥拷进 payload。/ Each delivery gets a
fresh deadline. If async work needs auth/tenant identity, put minimal immutable identity
in the contract and re-validate; don't copy credentials into the payload.
