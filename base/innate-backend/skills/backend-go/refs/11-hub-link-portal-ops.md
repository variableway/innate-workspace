# 11 · Hub / Link / Portal Operations / 运行时运维

> Bilingual. Code is shared. / 双语，代码共享。
>
> Read after [05-microservice-dev](./05-microservice-dev.md). This file covers operating the
> three runtime processes and how an external API gateway (e.g. Kong) fits. / 在 05 之后阅读。
> 本文件覆盖三个运行时进程的运维，以及外部 API 网关（如 Kong）如何接入。

---

## 1. Start with standalone / 先用 standalone（多数场景够用）

**大部分情况下 standalone 就够了。** standalone 把 Hub、Portal、Link、业务应用装进**一个进程**，
用进程内 Redis 与 inproc 端点，无需预先启动任何运行时服务，也无需配置跨进程网络。最适合本地开发、
集成测试、中小型单体部署。

**In most cases standalone is enough.** It assembles Hub, Portal, Link, and the app in **one
process** with in-process Redis and inproc endpoints - no runtime services to start, no
cross-process network to configure. Best for local dev, integration tests, and small-to-medium
monoliths.

```go title="main.go"
standalone.NewWithOption[*CheckoutApp](standalone.Option{
    SQLiteFile:   "./vine.sqlite",  // Hub 数据库 / Hub DB
    SeedYAMLFile: "./seed.yaml",    // 可选：配置种子 / optional seed
}).StartAndWait()
```

standalone **保留**了哪些边界：能力注册/注销、服务与 Web 选择、本地/远程式转发决策、请求校验与值克隆
（in-process Rpc 值仍走 JSON/CBOR 表示）、Portal 站点/准入逻辑（配置后）。/ What standalone preserves:
registration, service/Web selection, local/remote forwarding decisions, request validation and
value cloning (in-proc Rpc still goes through JSON/CBOR), Portal site/admission when configured.

standalone **不**模拟哪些（需要 linked/separated 独立进程）：独立进程崩溃、网络分区/不可达端口、心跳
失败与 lease 过期、外部 Link ingress 与传输安全、真实 TLS 监听与证书可达性。standalone 也不发心跳、
不跑 lease sweeper（注册在应用停止时显式移除）。/ What it doesn't reproduce: independent crashes,
network partitions, heartbeat/lease failure, external ingress/transport security, real TLS.
No heartbeats/sweeper either.

**何时升 linked/separated**：需要共享配置/服务发现/外部入口（linked）；需要独立扩缩容、独立发布、
真实故障隔离（separated）。/ Move to linked/separated only when you need shared config/discovery/
external entry (linked) or independent scaling/release/failure isolation (separated).

## 2. The four roles / 四个角色

| Runtime | Owns / 拥有 | Does not own / 不拥有 |
| --- | --- | --- |
| **App** | handler 实现、应用身份、能力声明 | 跨应用发现、公网网关策略 |
| **Hub** | 注册真相源、网络模式下的 lease、分发快照 | 逐请求转发 |
| **Link** | 本地 App 归属、配置/发现快照、实例选择与转发 | 公网站点、TLS、外部准入策略 |
| **Portal** | 公网 HTTP/HTTPS 入口、站点匹配、认证/授权、外部端点选择 | 应用注册、心跳 |

Hub **不在业务请求路径上**：Portal 处理外部请求，Link 在应用间发现并转发。/ Hub is **not** on the
business request path - Portal handles external requests, Link discovers/forwards between apps.

## 3. Hub operations / Hub 运维

Hub 是控制面：存配置与注册数据，向 Link/Portal 分发运行时快照与变更事件。/ Hub is the control plane:
stores config/registration, distributes snapshots and change events.

```bash
vine hub serve \
  --api-listen 127.0.0.1:7071 \
  --redis-listen 127.0.0.1:7073 \
  --mq-embedded-nats \
  --db-sqlite-file ./hub.sqlite \
  --seed-yaml-file ./seed.yaml \
  --dashboard-url http://:7099/
```

- **恰好一个** DB：`--db-sqlite-file` **或** `--db-postgres-url`。/ Exactly one DB.
- **恰好一个** MQ：`--mq-embedded-nats` **或** `--mq-external-nats-url`（外部 NATS 需开 JetStream）。
  / Exactly one MQ.
- 默认 API `127.0.0.1:7071`、内嵌 Redis `127.0.0.1:7073`、Dashboard `http://:7099/`。
- `--seed-yaml-file` 导入初始配置/Portal 规则/证书；导入后**数据库是真相源**，seed 不是持续备份。
  / Seed imports initial state; the DB remains source of truth afterward.
- 注册与 lease：网络模式下 Link 写带 TTL 的注册、靠心跳续约；Hub sweeper 发现过期 lease 时主动注销
  并发删除事件。inproc 模式不用 TTL/心跳/sweeper。/ Network mode: TTL leases + heartbeats + sweeper.
  Inproc: none of these.
- 环境变量：`VINE_API_LISTEN`/`VINE_REDIS_LISTEN`/`VINE_MQ_*`/`VINE_DB_*`/`VINE_SEED_YAML_FILE`/`VINE_DASHBOARD_URL`。

## 4. Link operations / Link 运维

Link 是应用侧接入层：注册本地应用、维护配置/发现快照、提供 Rpc/Web/Event/Task 统一运行时能力。
/ Link is the app-side access layer: registers local apps, maintains config/discovery snapshots,
provides unified Rpc/Web/Event/Task runtime.

```bash
vine link serve \
  --api-listen 127.0.0.1:7079 \
  --ingress-listen 127.0.0.1:7082 \
  --hub-endpoint http://127.0.0.1:7071
```

- API 默认 `127.0.0.1:7079`；ingress 默认 `0.0.0.0:0`（OS 分配端口，Link 把结果注册给 Hub）。防火墙
  需要稳定端口时显式设 `--ingress-listen`。/ API default 7079; ingress default 0.0.0.0:0 (random).
- 请求路径：Rpc 进 `rpcproxy`（round-robin 选注册，本地直调、远程经目标 Link 转发）；Web 进
  `webproxy`（只索引本 Link 拥有的 handler，Portal 拥有分布式 Web 快照与选择）；Event/Task 由
  `event`/`task` 模块按本地声明建 NATS 消费者。/ Paths: rpcproxy (round-robin), webproxy (local
  handlers only; Portal owns distributed Web selection), event/task (NATS consumers).
- `linked.New` 让 Link 与业务应用同进程（Hub 仍外部）；inproc App 与 Link 生命周期耦合，独立应用健康
  检查被禁用。/ `linked.New`: Link + app in one process (Hub external); app health check disabled.
- 环境变量：`VINE_API_LISTEN`/`VINE_INGRESS_LISTEN`/`VINE_HUB_ENDPOINT`。

## 5. Portal operations / Portal 运维

Portal 是北向入口：从 Hub Redis 读 entry/site/cert/schema/endpoint，把外部 HTTP/HTTPS/Rpc/Web
路由到目标应用的 Link endpoint。/ Portal is the northbound entry: reads entry/site/cert/schema/
endpoint from Hub Redis, routes external HTTP/HTTPS/Rpc/Web to the target app's Link.

```bash
vine portal serve --hub-endpoint http://127.0.0.1:7071
```

- Portal 的 HTTP/HTTPS 监听地址**不是**固定 flag，由 Hub 里的 Portal entry/rule 配置决定。/ Portal
  listen addresses come from Hub config, not fixed flags.
- 订阅 Hub Redis：`portal:rule:*`（scheme/port/site）、`portal:site:*`（Rpc/Web 站点与路由）、端点注册、
  actor/service/resource schema（Rpc 鉴权）、TLS 证书（SNI）。多数网关变更**免重启**热生效。
  / Watches Hub Redis; most changes hot-reload without restart.
- Portal rpcgw 行为：校验站点允许目标服务 -> 鉴权/权限检查 -> 服务发现转发；外部客户端**不要**伪造
  `vrpc-actor`/`vrpc-initiator`；给无 span 的 `vrpc-trace` 加 entry span；返回 `portal-trace-id`；
  从转发错误里移除内部 `detail`；>4KiB 响应按 `accept-encoding` 选 zstd/gzip（偏好 zstd）；按站点配 CORS，
  `OPTIONS` 预检成功返回 204。/ rpcgw: site check -> auth -> discovery/forward; don't forge
  vrpc-actor/initiator; entry span; portal-trace-id; strip detail; zstd/gzip >4KiB; CORS.

## 6. Registration & routing / 注册与路由

**注册是路由边界**：监听是本地进程状态；"可路由"意味着调用方 Link/Portal 已观察到注册。`Start` 在返回
前完成本地注册，但 Vine 不提供让所有其它 Link/Portal 同时收敛的全局屏障。/ Registration is the routing
boundary. `Start` completes local registration before returning, but there's no global convergence
barrier for all other Links/Portals.

- 实例选择：调用方 Link/Portal 各自维护游标，**round-robin**；无 affinity、无权重、无延迟感知、无优先级、
  无内置熔断；选中端点失败就返回失败，**不会**自动换实例重试。/ Round-robin per caller; no affinity/
  weights/latency/priority/circuit-breaker; no automatic same-request failover.
- 应用级重试需显式 deadline + 幂等决策：读可重试；支付/邮件/状态迁移要幂等键或"先查后重试"。
  / App-level retry needs explicit deadline + idempotency.
- 滚动发布期间调用方可能短暂看到"已配置服务但无可用端点"或快照里仍有 departing 端点；把可用性错误当
  预期分布式边界，仅在操作可安全重复时重试。/ During rollout, treat availability errors as expected.

## 7. Readiness & shutdown / 就绪与关停

**就绪**：进程在监听 ≠ 可路由。部署就绪要经**生产调用方同款 Portal/Link 路径**探测到目标能力，而非仅
进程探活。Vine 不在业务应用挂通用 `/healthz`；平台需要 HTTP 探活就加**应用自有**、语义匹配其依赖的路由，
并保留端到端请求检查。/ Listening ≠ routable. Probe through the real Portal/Link path. No generic
`/healthz`; add an app-owned probe if needed.

**跨进程关停顺序**（保留注销/drain 所需依赖）：/ Cross-process shutdown order:

1. 停止发新外部流量（或让就绪探针失败）。/ Stop new external traffic.
2. 优雅停业务应用（其 Link 仍可用）。/ Gracefully stop apps.
3. 应用完成注销与 drain 后，停其 Link。/ Stop Link after its apps.
4. 外部流量排空后停 Portal。/ Stop Portal after external traffic drains.
5. 最后停 Hub。/ Stop Hub last.

`linked`/`standalone` wrapper 自动按"业务应用先于 in-process Link"停；separated 部署要在进程监督里
保持该顺序。/ linked/standalone wrappers order app-before-Link automatically; separated deployments
must preserve it in the supervisor.

## 8. External API gateway (e.g. Kong) / 外部 API 网关接入（如 Kong）

> Vine 自带 Portal 作为北向网关（外部 HTTP/HTTPS、站点路由、actor/resource 鉴权、TLS/SNI、CORS、压缩、
> vRPC 映射）。**多数场景不需要再加 Kong**。加 Kong 是为了 Portal 不具备的能力：插件生态、高级限流/WAF、
> 多后端聚合、既有 Kong 投入、或边缘 TLS/WAF 卸载。/ Vine already ships Portal as its northbound
> gateway. **Most setups don't need Kong.** Add Kong for capabilities Portal lacks: plugin ecosystem,
> advanced rate limiting/WAF, multi-backend aggregation, existing Kong investment, or edge TLS/WAF offload.

### 推荐拓扑：Kong 在 Portal 之前 / Recommended: Kong in front of Portal

```text
Client -> Kong (edge TLS / rate-limit / WAF / plugins) -> Portal (site + auth/admission + vRPC) -> Link -> App
```

Kong 做边缘关注点，Portal 仍做 Vine 准入（actor/service/resource schema）、站点路由与 vRPC 协议映射--
这样 Vine 的 trace/actor/准入语义保持完整。/ Kong handles edge concerns; Portal still does Vine
admission, site routing, and vRPC mapping - preserving trace/actor/admission semantics.

### 不要直接打到 App / Don't bypass Portal to the App

把 Kong 直接路由到业务应用的 `/rpc/invoke` 或内部 Web 端点**不推荐**：绕过 Portal 策略与准入，且 App/Link
端点是运行时**内部协议端点**，期望普通 HTTP 工具不具备的内部 `vrpc-*` 元数据；外部浏览器直接访问 App 的
内部 Web 端点也不是受支持的公开入口。/ Routing Kong directly to the app's `/rpc/invoke` or internal Web
endpoint is **not recommended**: it bypasses Portal policy/admission, and App/Link endpoints are
runtime-internal protocol endpoints requiring internal `vrpc-*` metadata.

### vRPC over HTTP（给 Kong 配置用）/ vRPC over HTTP for Kong config

Portal Rpc 站点提供 `/invoke`，外部完整路径由 Portal entry/site 配置决定。每次调用是一个 HTTP `POST`：

```text
POST <portal-base>/invoke/<service-skel-name>/<method-skel-name>
```

Kong 必须保留这些头（不要剥）/ Kong must preserve these headers:

| Header | Required | Note |
| --- | --- | --- |
| `accept` | yes | `application/vrpc+json`（含二进制字段时 `application/vrpc+cbor`） |
| `content-type` | yes | `application/vrpc+json` 或 `application/vrpc+cbor` |
| `vrpc-trace` | yes | `id=<32 hex>,span=<16 hex>`（Portal 允许只发 `id`，会补 entry span） |
| `vrpc-client` | yes | `name=demo.client,version=1.2.3,instanceId=<uuid>` |
| `vrpc-options` | no | `timeout=10s`（缺省 Portal 用 30s，>120s 拒绝） |
| `vrpc-actor` | no | base64url Actor JSON，**仅由可信入口层**创建/转发；**不要让 Kong 伪造** |
| `vrpc-initiator` | no | base64url 原始调用方信息，由 Vine 运行时传播 |
| `accept-encoding` | no | Portal 外部响应支持 `zstd`、`gzip`（>4KiB，偏好 zstd） |

响应里 Kong 应回传 / Kong should pass through response headers: `content-type`、`vrpc-status`（如
`OK`/`INVALID_REQUEST`/`NOT_FOUND`）、`vrpc-server`、`portal-trace-id`。Portal rpcgw 把 `vrpc-status`
映射成常规 HTTP 状态（`OK`->200、`INVALID_REQUEST`->400、`UNAUTHORIZED`->401、`NOT_FOUND`->404、
`SERVICE_UNAVAILABLE`->503、`GATEWAY_TIMEOUT`->504 等）；App 内部 vRPC handler **始终用 HTTP 200**，
业务结果由 `vrpc-status` 携带。客户端要同时看 HTTP 状态、`vrpc-status`、`portal-trace-id`，不能只看
HTTP reason phrase。/ Client must read HTTP status + `vrpc-status` + `portal-trace-id` together.

### curl 直调 Portal（Kong 透传同样的请求）/ Direct Portal call (Kong forwards the same)

```bash
curl 'https://api.example.com/invoke/demo.greeting.GreetingService/hello' \
  --request POST \
  --header 'accept: application/vrpc+json' \
  --header 'content-type: application/vrpc+json' \
  --header 'vrpc-trace: id=123e4567e89b12d3a456426614174000,span=1234567890abcdef' \
  --header 'vrpc-client: name=demo.client,version=1.2.3,instanceId=123e4567-e89b-12d3-a456-426614174001' \
  --header 'vrpc-options: timeout=10s' \
  --data '{"params":{"name":"Vine"}}'
```

### 身份与安全边界 / Identity & security boundary

- **鉴权分工**：Kong 在边缘做认证/限流；Vine 的 actor/resource 鉴权仍在 Portal 内做。Web 路径下
  webgw **不信任**客户端提供的 `vweb-actor`/`vweb-initiator`（由 webgw 为后端写）。Rpc 的 `vrpc-actor`
  声称"由可信入口层创建或转发"--若让 Kong 注入身份，需明确纳入 Vine 信任模型，目前 pre-1.0 没有组件
  间认证，**更安全的是让 Portal 自有 auth/check 处理身份**，Kong 只透传 `vrpc-trace`/`vrpc-client`。
  / Auth split: Kong at edge, Vine actor/resource in Portal. webgw doesn't trust client-supplied
  vweb-actor. Safer to let Portal's own auth/check handle identity; Kong just forwards trace/client.
- **安全边界（pre-1.0 必读）**：Vine 组件间认证与加密传输仍是 TODO，内嵌 Hub Redis 无密码只读并分发配置
  （含 Portal TLS 私钥）。Kong 在边缘做 TLS/WAF 是好的，但 Hub API、Hub Redis、Link API、Link ingress、
  应用监听端口、内嵌 NATS **仍只能**绑回环或可信私网，用防火墙/网络策略强制，不要暴露给不可信网络。
  / Security boundary: Kong at edge is fine, but all internal Vine endpoints stay on loopback/
  trusted private network.
- **TLS**：可在 Kong 终止 TLS（推荐，配合 Portal 的 HTTPS entry），或让 Portal 做 TLS（Portal 从 Hub
  读证书并按 SNI 匹配）。二者选其一，避免重复终止。/ Terminate TLS at Kong (recommended) or at Portal
  (SNI from Hub certs) - not both.

### 何时加 Kong / When to add Kong

| 场景 / scenario | 加 Kong? |
| --- | --- |
| 单体/少量服务，Portal 够用 | 不加 / no |
| 需要插件生态/高级限流/WAF | 加 / yes |
| 多后端聚合（Vine + 非 Vine 服务） | 加 / yes |
| 已有 Kong 投入，统一边缘 | 加 / yes |
| 边缘 TLS/WAF 卸载 | 加 / yes |
| 只为"有个网关" | 不加（Portal 已是）/ no, Portal already is one |

## 9. Do / Don't

**Do** - 先 standalone；经真实 Portal/Link 路径探就绪；保持跨进程关停顺序；Kong 在 Portal 之前并保留
`vrpc-*` 头；内部端点只绑回环/私网。
**Don't** - 把 standalone 通过当生产分布式就绪；Kong 直连 App 内部端点；让 Kong 伪造 `vrpc-actor`；
把 Hub Redis/Link ingress 暴露给不可信网络；依赖 lease 过期作为正常发布注销机制。
