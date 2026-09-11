# 15 · TypeScript Generated Code / TypeScript 生成代码协作

> Bilingual. Code is shared. Grounded in Vine's own Hub dashboard TS client
> (`internal/daemon/hub/src/dashboard/src/config/vrpc-client.ts`) and the vRPC-over-HTTP
> wire protocol. / 双语，代码共享。依据 Vine 自身 Hub dashboard 的 TS 客户端与 vRPC-over-HTTP 线协议。

## The model / 模型

同一个 `.skel` 契约，`skelc` 既能生成 Go server，也能生成 TypeScript client。TS client 通过
**vRPC over HTTP** 经 Portal 调用后端--和任何外部 vRPC 客户端走同一条线协议。Vine 自身的 Hub
Dashboard 就是这么做的：一个浏览器 TS 应用，用生成的 client 调 Hub 的 Rpc 服务。/ One `.skel`
contract generates both a Go server (via `skelc gen go`) and a TypeScript client (via
`skelc gen ts`). The TS client calls the backend over **vRPC over HTTP** through Portal - the same
wire protocol as any external vRPC client. Vine's own Hub Dashboard works this way: a browser TS
app that calls Hub Rpc services with a generated client.

```text
.skel  --skelc gen go-->  Go server (embed DefaultXxxServer)  --> mounted in a Vine App
      --skelc gen ts-->  TS client (skeled/*.ts)               --> calls via Portal /invoke
```

## Generate TypeScript / 生成 TS

```bash
skelc gen ts --skel-in ./skel --ts-out ./skeled
```

生成三类产物（与 Go 侧对应）/ generates three artifacts (mirroring the Go side):

| File | Contains / 内容 |
| --- | --- |
| `skeled/spec.ts` | 各服务的 `*Spec` 常量（服务/方法元数据）/ per-service `*Spec` constants |
| `skeled/service.ts` | 服务 client 类（绑定到 vrpc client）/ service client classes |
| `skeled/data.ts` | data 类型（请求/响应模型）/ data types (request/response models) |

## The vRPC runtime (`@yorun-ai/vrpc`) / vRPC 运行时

TS 侧需要一个运行时包 `@yorun-ai/vrpc`（提供 `createVrpcClient`、`VrpcInvokeError`、
`getClientInstanceId` 等）。生成的 client 依赖它，不自己实现 HTTP 细节。/ The TS side needs the
`@yorun-ai/vrpc` runtime package (`createVrpcClient`, `VrpcInvokeError`, `getClientInstanceId`).
Generated clients depend on it; they don't reimplement HTTP.

```ts title="src/config/vrpc-client.ts"
import {
  VrpcInvokeError,
  createVrpcClient,
  getClientInstanceId,
} from '@yorun-ai/vrpc/client'

export const vrpcClient = createVrpcClient({
  prefixUrl: '/api/invoke',          // Portal 的 vRPC invoke 端点 / Portal vRPC invoke endpoint
  clientInfo: {
    clientName: 'demo.web',          // 调用方应用名（lowercase.dot）/ caller app name
    clientVersion: '1.2.3',          // 语义版本 / semver
    clientInstanceId: getClientInstanceId(),  // 实例 UUID / instance UUID
  },
})

vrpcClient.use({
  onError: (error) => {
    if (error instanceof VrpcInvokeError) {
      if (error.status === 401) {
        // 未授权处理 / handle unauthorized
      } else {
        console.error(error.message)
      }
    }
  },
})
```

`clientInfo` 对应线协议的 `vrpc-client` 头（`name`/`version`/`instanceId`）。`prefixUrl` 指向 Portal
的 invoke 端点（浏览器同源时用相对路径如 `/api/invoke`；跨域/Node 直连时用 Portal 完整 URL）。
/ `clientInfo` maps to the `vrpc-client` header. `prefixUrl` is Portal's invoke endpoint (relative
when same-origin in a browser; full Portal URL for cross-origin/Node).

## Call a service / 调用服务

生成的 service client 绑定到 `vrpcClient`，方法签名对应 `.skel` 的 method。/ Generated service
clients bind to `vrpcClient`; method signatures mirror the `.skel` methods.

```ts title="src/api/greeting.ts"
import { vrpcClient } from '../config/vrpc-client'
import { GreetingService } from '../skeled/service'

const greeting = new GreetingService(vrpcClient)

const result = await greeting.hello({ name: 'Vine' })
// result.message === 'Hello, Vine'
```

请求体是 `{ params: { ... } }` 信封，`params` 字段由 `.skel` method 的 input 定义；无入参方法发
`{ params: {} }`。响应是 `{ result, error }`：成功 `error` 为 null，失败 `result` 为 null 且
`error` 带 `code`/`message`/`reason`/`detail`。/ The request body is a `{ params: {...} }` envelope;
response is `{ result, error }` - on success `error` is null, on failure `result` is null and
`error` carries `code`/`message`/`reason`/`detail`.

## Errors / 错误处理

`VrpcInvokeError` 暴露 HTTP `.status`（Portal 把 `vrpc-status` 映射成 HTTP 状态）与 `.message`。
要判断业务结果看 `vrpc-status` / `error.code`，**不要只看 HTTP reason phrase**。/
`VrpcInvokeError` exposes HTTP `.status` (Portal maps `vrpc-status` to HTTP status) and `.message`.
Branch on `vrpc-status` / `error.code`, not the HTTP reason phrase alone.

| `vrpc-status` | Portal HTTP status |
| --- | --- |
| `OK` | `200` |
| `INVALID_REQUEST` | `400` |
| `UNAUTHORIZED` | `401` |
| `CLIENT_FORBIDDEN`/`PERMISSION_DENIED`/`ELEVATION_REQUIRED` | `403` |
| `NOT_FOUND` | `404` |
| `VALIDATION_FAILED`/`OPERATION_FAILED` | `422` |
| `SERVICE_UNAVAILABLE` | `503` |
| `GATEWAY_TIMEOUT` | `504` |
| `INTERNAL`/`UNKNOWN`/其它 | `500` |

## Wire protocol (interop boundary) / 线协议（互操作边界）

非 Go 客户端（含 TS）走 vRPC over HTTP。每次调用是一个 `POST`：/ Non-Go clients (incl. TS) use
vRPC over HTTP. Each call is a `POST`:

```text
POST <prefixUrl>/<service-skel-name>/<method-skel-name>
```

关键头（生成的 client 会自动设，手写时需带）/ key headers (generated client sets these; hand-written
calls must include them):

| Header | Required | Note |
| --- | --- | --- |
| `accept` | yes | `application/vrpc+json`（含二进制字段时 `application/vrpc+cbor`） |
| `content-type` | yes | `application/vrpc+json` 或 `application/vrpc+cbor` |
| `vrpc-trace` | yes | `id=<32 hex>,span=<16 hex>`；Portal 也允许只发 `id` |
| `vrpc-client` | yes | `name=...,version=...,instanceId=<uuid>` |
| `vrpc-options` | no | `timeout=10s`（缺省 Portal 用 30s，>120s 拒绝） |
| `vrpc-actor` | no | base64url Actor JSON，**仅由可信入口层**创建；**不要在 TS 客户端伪造** |
| `accept-encoding` | no | Portal 支持 `zstd`/`gzip`（>4KiB，偏好 zstd） |

响应头：`content-type`、`vrpc-status`、`vrpc-server`、`portal-trace-id`。记录 `portal-trace-id` 便于
排查。App 内部 vRPC handler **始终用 HTTP 200**，业务结果由 `vrpc-status` 携带；Portal rpcgw 才把
`vrpc-status` 映射成常规 HTTP 状态。/ Response headers: `content-type`, `vrpc-status`,
`vrpc-server`, `portal-trace-id` (record it for debugging). The app-internal vRPC handler always
returns HTTP 200; Portal rpcgw maps `vrpc-status` to HTTP status.

## Auth & identity / 鉴权与身份

TS 客户端是**外部 vRPC 客户端**，身份与鉴权由 **Portal** 按 site 的 Actor 策略处理--这与 Go 客户端
一致。**不要**在 TS 侧伪造 `vrpc-actor`/`vrpc-initiator`（webgw 不信任客户端提供的值）。若需要登录态，
由 Portal 的 auth/check 准入，TS 客户端只发 `vrpc-trace`/`vrpc-client`。Portal 公网入口用站点证书；
Hub/Link/Portal 之间的后端 mTLS 不保护浏览器/Node 客户端。把 Portal 放在可信网络或边缘网关
（如 Kong）之后。/ The TS client is an external vRPC client; identity/auth is handled by
**Portal**. **Don't forge** `vrpc-actor`/`vrpc-initiator` from TS.

## Build & integration / 构建与集成

- **浏览器**：Vite/webpack 打包，`prefixUrl` 用同源相对路径（如 `/api/invoke`），由 Portal 或边缘
  网关转发。Vine Hub Dashboard 就是 Vite + 生成的 client。/ Browser: bundle with Vite/webpack;
  use a same-origin relative `prefixUrl`, forwarded by Portal or an edge gateway.
- **Node**：`prefixUrl` 用 Portal 完整 URL；注意 CORS 仅对浏览器生效，Node 直连不受 CORS 限制但仍走
  同一协议。/ Node: use the full Portal URL; CORS is browser-only.
- **二进制字段**：method 的 input/output 含 `bytes` 时，生成 client 自动协商
  `application/vrpc+cbor`。/ Binary fields auto-negotiate `application/vrpc+cbor`.

## Cross-language workflow / 跨语言工作流

```bash
# 1. 写契约 / author contract
#    skel/greeting.skel: pub service GreetingService { noauth; method hello { input { name: string } output Greeting } }

# 2. 生成 Go server + TS client / generate both
skelc gen go --skel-in ./skel --go-out ./skeled
skelc gen ts --skel-in ./skel --ts-out ./web/src/skeled

# 3. Go 侧实现 server（嵌 DefaultGreetingServiceServer）
# 4. TS 侧 new GreetingService(vrpcClient) 调用
```

契约变更时**两侧一起重新生成**，保持线协议一致；固定 skelc 版本。/ Regenerate **both sides**
together on contract changes; pin the skelc version.

## Do / Don't

**Do** - 用 `@yorun-ai/vrpc` 运行时 + 生成 client；`prefixUrl` 指 Portal invoke；按 `vrpc-status`/
`error.code` 判结果；记录 `portal-trace-id`；契约变更两侧一起重新生成；固定 skelc 版本。
**Don't** - 在 TS 侧伪造 `vrpc-actor`/`vrpc-initiator`；只看 HTTP reason phrase 判成败；手写 vRPC HTTP
而不用生成 client（除非写其它语言的客户端）；改 `skeled/*.ts` 生成代码；用 `@latest` skelc。
