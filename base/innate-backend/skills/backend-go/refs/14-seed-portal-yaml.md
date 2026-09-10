# 14 · Seed & Portal Rule YAML / 配置 seed 与 Portal 规则 YAML

> Bilingual. Code is shared. Schema is grounded in `internal/daemon/hub/src/server/mod/seeder/yaml.go`
> and portal enum constants. / 双语，代码共享。schema 依据 `seeder/yaml.go` 与 portal 枚举常量。

## What the seed is / seed 是什么

Hub 的 seed YAML 在启动时**导入初始状态**到 Hub 数据库：应用配置、Portal 规则、站点、证书。导入后
**数据库是真相源**，seed 不是持续备份。用 `--seed-yaml-file`（或 `standalone.Option.SeedYAMLFile`）
导入；运行期改配置走 Hub Dashboard 或 Hub API。/ The seed YAML imports initial state into the Hub
DB at startup: app configs, Portal rules, sites, certs. After import, **the DB is the source of
truth** - the seed is not an ongoing backup. Apply via `--seed-yaml-file` / `standalone.Option.SeedYAMLFile`;
runtime changes go through the Hub Dashboard or Hub API.

```bash
vine hub serve --mq-embedded-nats --db-sqlite-file ./hub.sqlite --seed-yaml-file ./seed.yaml
# 或 standalone / or standalone:
# standalone.NewWithOption[*App](standalone.Option{SQLiteFile: "./hub.sqlite", SeedYAMLFile: "./seed.yaml"})
```

## Top-level keys / 顶层键

```go title="seeder/yaml.go (source of truth)"
type _SettingsYAMLPayload struct {
    AppConfigs    []_AppConfig  `yaml:"appConfigs"`
    PortalEntries []_PortalSite `yaml:"portalSites"`   // 注意：yaml 键是 portalSites / note: yaml key is portalSites
    PortalRules   []_PortalRule `yaml:"portalRules"`
    PortalCerts   []_PortalCert `yaml:"portalCerts"`
}
```

四个顶层键：`appConfigs`、`portalSites`、`portalRules`、`portalCerts`。每项都有 `override`（见末尾）。
/ Four top-level keys; each item has `override` (see below).

## appConfigs - 应用配置

按全限定 Skel 名标识；`value` 是**编码成 YAML 字符串的 JSON**。/ Identified by fully-qualified
Skel name; `value` is **JSON encoded as a YAML string**.

```yaml title="seed.yaml"
appConfigs:
  - name: demo.checkout.CheckoutConfig
    value: '{"timeoutMs":3000,"currency":"CNY"}'
  - name: demo.checkout.FeatureFlagsConfig
    value: '{"newCheckout":true}'
    override: true   # 覆盖已有同名值 / override existing same-name value
```

| Field | Type | Note |
| --- | --- | --- |
| `name` | string | 全限定 Skel 名，如 `demo.checkout.CheckoutConfig` / fully-qualified Skel name |
| `value` | string | JSON 字符串 / JSON string |
| `override` | bool | 是否覆盖已存在的同名配置 / override existing |

## portalRules - 入口与路由规则（entry + route）

一条 `portalRule` 描述一个监听入口（matchScheme/host/port/pathPrefix）以及它路由到哪个 site 或重定向。
对应 Portal 的 `portal:rule:*`。/ A `portalRule` describes a listener entry and where it routes.

```yaml title="seed.yaml (portalRules)"
portalRules:
  - name: admin
    matchScheme: https
    matchPathPrefix: /admin
    routeType: SITE
    routeSiteName: admin-site
  - name: api
    matchScheme: http
    matchPort: 8080
    matchPathPrefix: /api
    routeType: PERMANENT_REDIRECT
    routeRedirectionPattern: https://demo.local
  - name: hosted
    matchScheme: http
    matchHost: demo.local
    matchPort: 8080
    matchPathPrefix: /
    routeType: SITE
    routeSiteName: home-site
    routePathPrefix: /internal   # 可选：转发前替换已匹配的 path 前缀 / optional rewrite
```

| Field | Type | Note |
| --- | --- | --- |
| `name` | string | 规则名 / rule name |
| `matchScheme` | string | `http`/`https`/`tcp` |
| `matchHost` | string | 主机名（SNI/Host 匹配）/ host match |
| `matchPort` | int | 端口；0 表示默认 / port; 0 = default |
| `matchPathPrefix` | string | 路径前缀 / path prefix |
| `routeType` | string | `SITE` / `PERMANENT_REDIRECT` / `TEMPORARY_REDIRECT` |
| `routeSiteName` | string | `routeType: SITE` 时指向 `portalSites` 里的 site |
| `routeRedirectionPattern` | string | 重定向目标（`*_REDIRECT` 时用） |
| `routePathPrefix` | string | SITE 转发前替换已匹配 path 前缀；空则保持原行为 |
| `override` | bool | 覆盖同名 / override |

`routeType` 枚举 / enums:

- `SITE` - 路由到 site（`routeSiteName`）
- `PERMANENT_REDIRECT` / `TEMPORARY_REDIRECT` - 用 `routeRedirectionPattern`

当前字段是扁平 `match*` / `route*`。旧 YAML（`scheme`/`host`/`port`/`pathPrefix`/`targetType`/`siteName`/`redirectionPattern`/`targetPath`）仍可导入但会告警；**一条规则不要混用新旧字段名**。Hub 会迁移数据库列。升级 Hub 与 Portal 必须一起做。
/ Current fields are `match*`/`route*`. Legacy names warn; mixing in one rule is rejected.

## portalSites - 站点定义（RpcGW / WebGW）

一个 `portalSite` 定义一个 Rpc 或 Web 网关站点：类型、Actor 鉴权、CORS、绑定的 Web 名。对应
`portal:site:*`。/ A `portalSite` defines an Rpc or Web gateway site: type, Actor auth, CORS, bound
web name. Maps to `portal:site:*`.

```yaml title="seed.yaml (portalSites)"
portalSites:
  - name: admin-site
    type: WEBGW
    actorSkelName: vine.hub.AdminActor
    actorVia: client
    cors:
      mode: STRICT
      allowedOrigins:
        - https://demo.local
    webName: vine.hub.DashboardWeb

  - name: rpc-site
    type: RPCGW
    actorSkelName: demo.portal.ClientActor
    actorVia: client
    cors:
      mode: DISABLED
```

| Field | Type | Note |
| --- | --- | --- |
| `name` | string | 站点名（被 `portalRules.routeSiteName` 引用）/ site name |
| `type` | string | `RPCGW` / `WEBGW` |
| `actorSkelName` | string | 鉴权 Actor 的全限定 Skel 名 / auth Actor Skel name |
| `actorVia` | string | Actor 通道，如 `client` / Actor via channel |
| `cors` | object | `{ mode, allowedOrigins }` |
| `webName` | string | `WEBGW` 时绑定的 Web 全限定名 / bound web name for WEBGW |
| `override` | bool | 覆盖同名 / override |

`type` 枚举（`portal_site.go`）：`RPCGW`（Rpc 网关）、`WEBGW`（Web 网关）。/ `type` enums:
`RPCGW`, `WEBGW`.

`cors.mode` 枚举（`portal_site.go`）/ `cors.mode` enums:

- `DISABLED` - 关闭 CORS / off
- `SAME_DOMAIN` - 同域允许 / same-domain
- `STRICT` - 严格，按 `allowedOrigins` / strict, per `allowedOrigins`

## portalCerts - TLS 证书

```yaml title="seed.yaml (portalCerts)"
portalCerts:
  - name: demo-local
    issuer: Let's Encrypt
    domains:
      - demo.local
    publicKeyBase64: <base64>
    privateKeyBase64: <base64>
    validFrom: 2026-01-01T00:00:00Z
    validTo: 2027-01-01T00:00:00Z
    override: true
```

| Field | Type | Note |
| --- | --- | --- |
| `name` | string | 证书名 / cert name |
| `issuer` | string | 颁发者 / issuer |
| `domains` | []string | 域名列表（SNI 匹配）/ domains (SNI match) |
| `publicKeyBase64` | string | 证书 Base64 / cert base64 |
| `privateKeyBase64` | string | 私钥 Base64 / private key base64 |
| `validFrom` | time | 生效时间 / valid from |
| `validTo` | time | 过期时间 / valid to |
| `override` | bool | 覆盖同名 / override |

> ⚠️ 私钥进 seed 等于进 Hub 数据库。Hub Redis 分发配置（含私钥）。未开后端 mTLS 时内嵌 Redis
> 仍是开发期明文；开 mTLS 后 Redis 要求 ACL 用户名与客户端证书身份一致。seed 文件、Hub DB、
> 备份都要限制在可信运维边界，不要进版本控制。/ Private keys in seed = in the Hub DB.
> Treat Redis access as secret access; don't commit seeds with private keys.

## override semantics / override 语义

每项的 `override: true` 表示**覆盖已存在的同名记录**；省略/`false` 时同名已存在则跳过。这样 seed
可同时含"初始默认"与"强制覆盖"两类。/ `override: true` overwrites an existing same-name record;
otherwise the existing one is kept. This lets a seed carry both "initial defaults" and "forced overrides".

## Apply & manage / 应用与管理

- **启动导入**：`vine hub serve --seed-yaml-file` 或 `standalone.Option.SeedYAMLFile`。
- **运行期管理**：Portal 规则/站点/证书/配置也可经 **Hub Dashboard** 或 **Hub API**（生成服务
  `PortalRuleService`/`PortalSiteService`/`PortalEntryService`/`PortalCertService`/`AppConfigService`）
  增删改，热生效（Portal 订阅 Hub Redis，多数变更免重启）。/ Runtime management via Hub Dashboard
  or Hub API (generated services); hot-reload via Hub Redis subscription.
- **真相源**：导入后 Hub 数据库是真相源；再改 seed 不会回灌，除非重新导入。/ After import the Hub
  DB is source of truth; editing the seed won't back-fill unless re-imported.
- **恢复验证**：还原 Hub DB 备份后，要校验配置、Portal 规则、站点、证书、端点订阅。/ After restoring
  a Hub DB backup, verify configs, Portal rules, sites, certs, endpoint subscriptions.

## A complete minimal seed / 完整最小 seed

```yaml title="seed.yaml"
appConfigs:
  - name: demo.checkout.CheckoutConfig
    value: '{"timeoutMs":3000,"currency":"CNY"}'

portalRules:
  - name: web
    matchScheme: http
    matchPort: 7088
    matchPathPrefix: /
    routeType: SITE
    routeSiteName: web-site
  - name: api
    matchScheme: http
    matchPort: 7088
    matchPathPrefix: /api
    routeType: SITE
    routeSiteName: rpc-site

portalSites:
  - name: web-site
    type: WEBGW
    actorSkelName: demo.portal.ClientActor
    actorVia: client
    cors: { mode: SAME_DOMAIN }
    webName: demo.portal.UserPortalWeb
  - name: rpc-site
    type: RPCGW
    actorSkelName: demo.portal.ClientActor
    actorVia: client
    cors: { mode: DISABLED }
```

## Do / Don't

**Do** - 把 seed 当"初始状态导入"而非备份；私钥/凭据不进版本控制；运行期改走 Dashboard/API；还原后
校验全部配置；用 `override` 区分默认与强制覆盖。
**Don't** - 把 seed 当持续备份；改了 seed 期望自动回灌 DB；把 Hub Redis/DB 暴露给不可信网络；漏配
`routeType`/`type`/`cors.mode` 的合法枚举值；在同一条规则里混用 `scheme` 与 `matchScheme`。
