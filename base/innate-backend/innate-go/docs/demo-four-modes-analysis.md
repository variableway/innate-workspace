# innate-go 四模式演示：分析与任务清单

路径：`base/innate-backend/innate-go/docs/demo-four-modes-analysis.md`  
日期：2026-09-07  
用途：后续任务排期的唯一主记录（结论、现状、缺口、TODO、验收）。  
来源：围绕 Vine 最新用法、meta CRUD、standalone / bundle / sidecar / Auth / Skel 的设计讨论。

相关代码：本目录上级 `innate-go/`。  
相关 skill：`base/innate-backend/skills/backend-go/`。  
新建 Vine 应用模板：`skills/backend-go/templates/vine-standalone/`（不要把本仓库再复制进 skill）。

---

## 1. 目标演示（必须同时能指给观众看）

| # | 模式 | 观众看到什么 | Vine 角色 |
| --- | --- | --- | --- |
| 1 | **CLI 工具** | `innate-go …` 发现/启动/桌面缓存；Vine 二进制自带 `version` / `help` / `--log-level` / `--seed-yaml-file` | 工具链 CLI ≠ Vine `appcli` |
| 2 | **Vine standalone** | 一个 App + 同进程 Hub / Portal / Link；Portal 打到 Web | 单节点 |
| 3 | **Sidecar** | Host spawn、`127.0.0.1:0`、READY、`/healthz`、**无 Hub** | **不是** Vine 节点 |
| 4 | **Composable app** | `standalone.NewBundled(A, B)`；B 用 **Rpc client** 调 A，不注入对方 Dao | 同进程多 App |

原则：**同一套 meta CRUD 业务，四种装配。**  
桌面 sidecar 不起 Hub / Link / Portal；进网格才 `standalone` / bundle。

建议命令面（尚未实现）：

```text
innate-go demo cli          # 工具链说明 + exec Vine 二进制 version/help
innate-go demo sidecar      # 裸 HTTP，READY 行
innate-go demo standalone   # 一个 Vine App
innate-go demo bundle       # NewBundled(meta, storefront)
innate-go server meta       # 可与 sidecar 合并或作为 sidecar 别名
```

---

## 2. 已拍板的设计结论

排期时不要推翻这些边界；有变更先改本文再改代码。

### 2.1 产品 vs Vine

- 「表即 REST」（Supabase 式）是 **Innate** 能力，不是 Vine 内置。Vine RDB 不 AutoMigrate 出 REST。
- Vine 管：契约（Skel）、DI、发现、托管配置、Portal 准入、Rpc/Web/Event/Task。
- 动态表用 `table: string` + `data: json`。**不要**为每张运行时表生成 Skel `data` / `require Items:read`。

### 2.2 Hub 登记什么

- Hub **不登记** `/api/meta/items` 这种 REST path。
- 登记的是：App 名、实例、**Web Skel 名 / Rpc 服务名**、Portal **站点 + `match*` / `route*` 规则**。
- 对外 URL：Portal `matchPathPrefix`（客户端看到的）+ `routePathPrefix`（转给应用的前缀）。
- 应用内 Web：handler `Routes()` + eternal `basePath`（默认 `/rest`）；Vine 还会加 `/{WebSkel名}` 前缀，由 Portal 对齐。
- `eternal` **不是 etcd**。存储是 Hub DB（SQLite 或 Postgres），经 Link 读取。`eternal` = 本实例首次读到的快照；`instant` = 后续新执行能看到更新。seed YAML 只导入一次，之后 DB 是真相源。

### 2.3 Auth 与权限

- 认证：Skel `actor` + `AuthService.authenticate`；Portal 解析 `Authorization`。Web **没有** header → 匿名 Actor。
- Auth **可替换**的是同一契约上的 **Go 实现**（`InitModules` / `ServicerInitHandlers` / `BindCommon` 接口）。换 Module 要**重启**，不是热插拔。同一 Skel 服务名一个应用里只能有一个实现。
- 权限：`resource` + `require` 主要罩 **RpcGW**。WebGW **只认证、不跑 require**。
- 动态 REST 细权限分三层：Portal 认证 → Auth `checkCodes`（粗码如 `MetaTable:read`）→ CRUD `Authorizer`（表/行，要自己做）。
- 网格内其它 App 调 meta：注入 **Rpc `MetaStoreService` client**，不要互相 scrape HTTP。

### 2.4 Sidecar 与桌面

- Sidecar = Host 拉起的 **本机 HTTP 进程**（loopback + 数据目录）。Tauri/Electron 是入口，不必再套 Portal。
- 路径（`/healthz`、`/api/meta/{table}`）编译进二进制，**不用注册中心**。base URL（端口）由父进程通过 READY 行或 `sidecar.json` 获得。
- Webview 直连要配 CSP / capability；或 Host `invoke` 代发。TS `MetaApi` 让页面像本地函数；**跨进程仍是 IPC**，不能变成真 local call。
- 真 local call = 取消 sidecar，把实现放进 Tauri/Electron 主进程。
- `innate-go desktop-app` **只**管 Tauri Cargo 共享缓存，不负责拉起 sidecar。
- Vine standalone 当桌面 sidecar **过重**（同进程仍有 Hub/Portal/Link）。默认桌面用裸 HTTP。

### 2.5 应用组合（standalone → 多应用）

- 组合单位是 **App**（`Name()`），不是进程。同 App 内 Go 注入；跨 App 只用 Skel Rpc/Event/Task。
- `standalone.New`：Hub→Portal→Link→App，一个进程。
- `standalone.NewBundled`：共享一份运行时，多个不同名 App；关停先停业务再停 Link。
- `linked` / `separated`：同一 `ApplicationSpec`，只换 `main`。**演示可不做**，文档提一句即可。
- 同名 App = Event 消费组抢一份；不同名 = 各收一份。Task 全局一个队列。

### 2.6 Meta 的 Skel 形状（推荐）

冻稳定边界，表分发留在 Go：

- `pub data MetaRecord { id, table, data: json, createdAt, updatedAt }`
- `service MetaStoreService`（list/get/create/update/delete，`table: string`）
- `web MetaCrudWeb { for ClientActor }`（**不声明** HTTP path）
- `config MetaCrudConfig eternal { basePath }`
- `resource MetaTable { action read, write, delete }`
- `actor ClientActor` + `auth` + `permission {}`

sidecar **可以**只用 HTTP 实现同一 API 形状，不必为用 Skel 去起 Hub。

Vine **不会**从 Web/`Routes` 自动生成 Swagger。若需要：运行时按表目录生成 `openapi.json`（额外工作）。

---

## 3. 目标架构（实现时对齐）

```text
internal/store + TableCRUD（共享内核）
        │
        ├─ sidecar     Listen 127.0.0.1:0 + READY     ← 桌面，无 Hub
        └─ Vine 节点
              ├─ standalone  MetaApp（Web + Rpc）
              └─ bundle      MetaApp + StorefrontApp（Rpc client）
```

Storefront **禁止** import Meta 的 Dao；只注入生成的 `MetaStoreServiceClient`。

```text
现在
  innate-go CLI ──┬── server meta     裸 HTTP + sqlite3
                  ├── server vine     exec vine-rest（旧 Vine、内存 REST）
                  └── desktop-app     Cargo 缓存

目标
  innate-go CLI ──┬── demo cli
                  ├── sidecar / server meta
                  ├── standalone
                  └── bundle
```

---

## 4. 当前代码现状（2026-09-07）

落点：`base/innate-backend/innate-go`。

### 4.1 CLI — 有一半

| 有 | 缺 |
| --- | --- |
| `cmd/innate-go`：`desktop-app` / `server meta` / `server vine` / `version` / `help` | 不是 Vine `appcli`；无 `demo cli/standalone/bundle` |
| `cmd/server` = 强行 `server meta` | sidecar READY / token / 端口 0 |
| Task：`build` / `run:server` / `run:vine` / `desktop:*` | `server vine` 是 `exec task`，不是进程内装配 |
| `desktop/` Cargo 共享 target | 与 sidecar 进程无关 |

### 4.2 Vine standalone — 最小样例，偏旧

| 有 | 缺 |
| --- | --- |
| `samples/vine-rest`：`standalone.NewWithOption`、`Webber`、内存 `/items` | 不接 `internal/store`；不是通用 meta |
| Skel：`web RestDemoWeb` + `data Item` + `actor via openapi` | 无 service / config / event / task / resource / permission / auth |
| `seed.yaml`：WEBGW + `matchPort: 18081` | 单 App；无 bundle |
| skill 模板 Hello Module | 无 Rpc/Web |
| | `samples/vine-rest/go.mod`：**pin Vine v0.12.0** + **本机 `replace`** |

### 4.3 Sidecar — 只有手跑的 meta HTTP

| 有 | 缺 |
| --- | --- |
| `internal/store`：sqlite3 CLI、`items`/`notes` 白名单、`data` JSON | `--listen 127.0.0.1:0`、READY、`sidecar.json` |
| `internal/metaapi`：`/healthz`、`/api/meta/{table}` CRUD | Bearer token、SIGTERM 约定 |
| `-addr 127.0.0.1:8080` | Tauri `externalBin` / Electron `extraResources` |
| | TS client、Host `invoke` 代发 |

### 4.4 Composable app — 没有

无第二个不同 `Name()` 的 App，无 `NewBundled`，无跨 App Rpc。

### 4.5 Vine 能力面（演示尚未覆盖）

| 能力 | 现状 |
| --- | --- |
| 通用 meta Skel（`MetaStore` + `json`） | 无 |
| Module `Bind()`（TableCRUD / Auth） | 无 |
| Rpc handler | 无 |
| eternal / instant config | 无 |
| Actor AuthService + `checkCodes` | 无（vine-rest actor 几乎空） |
| Event / Task | 无 |
| Vine `rdb.Database` / Redis | meta 用 sqlite3 CLI |
| `app/testkit` | 无 |
| linked / separated | 无（演示可不做） |

---

## 5. TODO（施工单）

### P0 — 四条命令能跑通

- [ ] 抽出共享内核：`internal/store` + 与 HTTP/Vine 无关的 TableCRUD（存储第一刀可继续 sqlite3 CLI）。
- [ ] Skel `innate.meta`：`MetaRecord`、`MetaStoreService`、`MetaCrudWeb`、`ClientActor`、`MetaCrudConfig`；`skelc gen go`。
- [ ] Sidecar 入口：`innate-go sidecar`（或升级 `server meta`）。`--listen 127.0.0.1:0`、stdout `INNATE_SIDECAR_READY url`、`GET /healthz`、`--data-dir`、可选 `--token`；**不起** Hub/Link/Portal。实现上先 `net.Listen` 再 `http.Serve`，用 `ln.Addr()` 拼 URL。
- [ ] Standalone：`MetaApp`（`Webber` + `Servicer`），`standalone.NewWithOption`；seed 将 Portal 前缀转到 `MetaCrudWeb`；CRUD 走同一 store。
- [ ] Bundle：第二 App（如 `innate.demo.storefront`）Web 只调 `MetaStoreServiceClient`；`standalone.NewBundled(meta, storefront)`。
- [ ] CLI：`innate-go demo cli|sidecar|standalone|bundle`；Vine flag 原样传给子进程（`--log-level`、`--db-sqlite-file`、`--seed-yaml-file`）。
- [ ] README（或本文 §6）一条验收路径。
- [ ] `samples/vine-rest`：去掉本机 `replace`，`go get go.yorun.ai/vine@latest`；或并入 demo 并标 deprecated。

### P1 — Vine 用法装进 standalone + bundle

- [ ] `MetaCrudModule.Bind()` 出 TableCRUD；Web/Rpc handler 只注入接口。
- [ ] 可替换 Auth：`ClientAuthService.authenticate` 默认 token/API Key；`Init*` 可换实现；`portalSites.actorSkelName` 固定。
- [ ] `resource MetaTable` + actor `permission {}`；Rpc 用 `require`；Web 映射 HTTP 动词 → `checkCodes`。
- [ ] Portal seed 用现行 `match*` / `route*`；文档写清 Hub 不登记表 path。
- [ ] standalone/bundle 从 seed 读 `MetaCrudConfig`；sidecar 用 flag，不读 Hub。
- [ ] Event 或 Task 各一个（例如 record 变更 Event，storefront 听），证明仍按 App 名消费。
- [ ] 文档区分 `innate-go help` 与 `./bin/vine-bundle version`。
- [ ] `app/testkit`：`MetaStoreService` 至少 1–2 个集成测试。

### P2 — 桌面沟通（不挡 Vine 演示）

- [ ] 最小 TS `MetaApi` client（list/get/create/…）。
- [ ] 文档：Tauri 读 READY / `invoke("sidecar_info")`；可选 Host 代发。
- [ ] 禁止把 Vine standalone 打进 Tauri sidecar；`desktop-app` 继续只做 Cargo。

### P3 — 刻意不做

- sidecar 里起 Link / Portal
- 每张表一个 Skel `data`；动态表编译期 `require Items:read`
- Webview 直打 Vine Rpc
- linked / separated 作为**必做**演示（README 一句「同一 Spec 可换 `linked.New`」即可）
- 运行时热替换 Auth Module
- 指望 Vine 自动生成 Swagger（需要则自建 `openapi.json`）
- 为同 App 两个 Module 造 Rpc；bundle 里跨 App 用 Go 注入对方内部类型

---

## 6. 验收路径（P0 完成即演示）

```bash
cd base/innate-backend/innate-go

# 1. CLI
innate-go help
innate-go demo cli
# 期望：工具链帮助；并能看到 Vine 二进制 version/help/--db-sqlite-file

# 2. Sidecar（无 Hub）
innate-go demo sidecar
# stdout: INNATE_SIDECAR_READY http://127.0.0.1:<port>
curl -s "$URL/healthz"
curl -s "$URL/api/meta/items"

# 3. Standalone（有 Hub/Portal）
innate-go demo standalone
curl -s "http://127.0.0.1:<portal-port>/rest/items"   # 端口与 path 以 seed 为准

# 4. Bundle
innate-go demo bundle
# Storefront 的 HTTP 内部 Rpc → MetaStore；停掉再起 hub.sqlite 仍在
```

同一业务数据（items/notes JSON）在 2/3/4 应对得上；4 的跨 App 只走 Rpc。

---

## 7. Vine 能力对照（演示覆盖规划）

| Vine 能力 | 放哪条模式 | 优先级 |
| --- | --- | --- |
| `appcli`（version/help/log-level/seed） | CLI + standalone/bundle 二进制 | P0 |
| Application + Webber | standalone | P0 |
| Servicer + 生成 client | bundle（跨 App） | P0 |
| `standalone.New` / `NewBundled` | standalone / bundle | P0 |
| Portal seed `match*`/`route*` | standalone / bundle | P0 |
| Skel web/service/data/config/actor | 共享契约 | P0 |
| Module `Bind()` | standalone / bundle | P1 |
| Actor auth + 可替换 AuthService | standalone（Portal） | P1 |
| `resource` + `require` + `checkCodes` | Rpc 必做；Web 映射 | P1 |
| Event 或 Task | bundle | P1 |
| eternal config via Hub | standalone / bundle | P1 |
| `app/testkit` | 测试包 | P1 |
| RDB Component / Redis | 可选替换 sqlite3 CLI | P2+ |
| `linked.New` / separated | 文档 only | P3 |
| OpenAPI 运行时生成 | 可选附加 | P3 |

---

## 8. 排期怎么用本文

1. 开任务先看 **§5 P0**，不要从 P1 Auth/Event 做起。
2. 改架构先改 **§2**，再改代码，避免 sidecar 又去连 Hub。
3. 验收只认 **§6** 四条命令，不认「vine-rest 内存 /items 还能 curl」为四模式完成。
4. skill（`SKILL.md`）继续写 Vine **怎么用**；本文写 Innate **演示怎么拼**。二者冲突时：运行时以最新 Vine 源码为准，产品边界以本文 §2 为准。

---

## 9. 现状一句话

**现在：工具链 CLI + 裸 meta HTTP + 一个偏旧的 Vine REST 单 App。**  
**要演示四种模式：共享 meta 内核 + Skel Rpc/Web + sidecar 握手 + standalone + NewBundled，再把 Auth / 权限 / config / Event 挂在 Vine 那两条上。**
