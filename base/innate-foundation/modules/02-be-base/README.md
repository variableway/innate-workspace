# 02-be-base — 后端基础 + BE Skill

## 栈

**Go + Vine**（`go.yorun.ai/vine`）。参考：`base/references/backend/golang-backend/vine-skill`。

不再做候选语言/框架 ADR。

## 优先级原则

1. **Standalone REST 服务**（单进程可跑、可 curl）— 最高
2. **CLI 样例**
3. REST 约定 / CRUD
4. **Linked** → **Separated**（linked 优先）
5. Skill 与 registry 升格材料

业务代码声明能力；standalone / linked / separated **只换启动入口**。

## 本模块样例（T01）

Standalone REST demo：`cmd/rest-demo`

| 路径 | 说明 |
|------|------|
| `GET /health` | 健康检查 |
| `GET /items` | 列表 |
| `GET /items/:id` | 详情 |
| `POST /items` | 创建 `{"name","price"}` |

Portal 监听：`http://127.0.0.1:18081`（见 `seed.yaml`）。

### 安装

```bash
# 检查 / 安装 Go 1.26.5+、vine、skelc
./scripts/install-vine.sh --check
./scripts/install-vine.sh --with-go   # 缺 Go 或版本不够时
```

说明：`go.yorun.ai` vanity 若 403，脚本会从本地 `~/workspace/yorun-ai/{vine,skelc}` 或 GitHub clone 编译安装。

### 运行

```bash
# 需要：Go 1.26.5+、skelc、对本机 vine 源码的 replace（见 go.mod）
export PATH="$(go env GOPATH)/bin:$PATH"
make gen
make build
make run
# 另开终端：
make smoke
# 或
curl -s http://127.0.0.1:18081/health
curl -s http://127.0.0.1:18081/items
curl -s -X POST http://127.0.0.1:18081/items -H 'content-type: application/json' -d '{"name":"Bolt","price":42}'
```

`go.mod` 使用：

```go
replace go.yorun.ai/vine => <local-vine-checkout>
```

若 vanity URL 可用，可改为 `go get go.yorun.ai/vine@v0.12.0` 并去掉 replace。

### 与 linked / separated

同一 `RestDemoApp` 业务代码可换：

- standalone：`standalone.NewWithOption`（当前）
- linked：`linked.NewWithOption`（T04）
- separated：`app.NewWithOption` + `vine hub/link/portal`（T05）

## 代码落点

- `cmd/rest-demo/` — 启动入口
- `internal/application/` — App spec
- `internal/web/` — REST handlers
- `skel/` / `skeled/` — 契约与生成代码
- `scripts/install-vine.sh` — 工具链安装
- Skill（后续）：`skills/be-starter/`

## 任务索引

| 任务 | 说明 | 优先级 |
|------|------|--------|
| [T01-rest-standalone.md](tasks/T01-rest-standalone.md) | Standalone REST 服务样例 | P0 |
| [T02-cli-sample.md](tasks/T02-cli-sample.md) | CLI 样例 | P0 |
| [T03-api-conventions.md](tasks/T03-api-conventions.md) | REST / 错误模型约定 | P0 |
| [T04-linked-mode.md](tasks/T04-linked-mode.md) | Linked 模式样例 | P1 |
| [T05-separated-mode.md](tasks/T05-separated-mode.md) | Separated 模式样例 | P2 |
| [T06-be-starter-skill.md](tasks/T06-be-starter-skill.md) | 编写 be-starter skill | P1 |
| [T07-prepare-registry.md](tasks/T07-prepare-registry.md) | 升格门槛 / registry 材料 | P2 |

## 本地验证（Agent 沙箱外）

当前 Cursor Agent 环境对 `go.mod` 依赖拉取受限（proxy/vanity/`GOMODCACHE`）。请在本机终端执行：

```bash
cd base/innate-foundation/modules/02-be-base
./scripts/install-vine.sh --with-go
# go.mod 里 replace 指向本机 vine 源码；若 go.yorun.ai 可用可去掉 replace
export PATH="$(go env GOPATH)/bin:$PATH"
go mod tidy
make gen
make build
make run
# 另开终端
make smoke
```

若 `go.yorun.ai` 403，保持：

```go
replace go.yorun.ai/vine => /path/to/yorun-ai/vine
```

