# 构建与启动（当前实现）

本文描述 **仓库里已经能跑的** 构建和启动方式，不包含规划中的 `demo sidecar|standalone|bundle`。

工作目录一律：

```bash
cd base/innate-backend/innate-go
```

推荐用 [Task](https://taskfile.dev)（`task`）。没有 Task 时可用下文的等价 `go build` / `go run`。

---

## 产物一览

| 产物 | 入口 | 作用 |
| --- | --- | --- |
| `bin/innate-go` | `./cmd/innate-go` | 统一 CLI（desktop-app / server meta / server vine） |
| `bin/server` | `./cmd/server` | 快捷入口，等价 `innate-go server meta …` |
| `bin/vine-rest` | `samples/vine-rest/cmd/rest-demo` | Vine standalone REST 样例（`task run:vine` 写出） |

主模块 `go.mod`：`github.com/variableway/innate-go`，Go **1.27.1**。  
`samples/vine-rest` 是**独立** Go module。

---

## 前置

| 要跑什么 | 需要 |
| --- | --- |
| 构建 CLI / meta server | Go 1.27.1+ |
| `innate-go server meta` | PATH 上有 **`sqlite3` CLI**（store 通过它访问 SQLite，不是纯 Go driver） |
| `task run:vine` | Go；可选 `skelc`（有则先 `check`/`gen go`）；Vine 依赖见该样例 `go.mod` |
| 安装 Vine / skelc CLI | `./scripts/install-vine.sh` 或 `samples/vine-rest/scripts/install-vine.sh` |

检查：

```bash
go version          # 期望 go1.27.1 或更新
task --version      # 可选
sqlite3 -version    # meta server 必需
which skelc vine    # vine-rest 生成契约时用
```

安装 CLI 到 `GOPATH/bin`：

```bash
./scripts/install-vine.sh           # vine + skelc
./scripts/install-vine.sh --with-go # 同时确保工具目录下的 Go
./scripts/install-vine.sh --check
```

---

## 构建

```bash
task build          # bin/innate-go + bin/server
task build:cli      # 仅 bin/innate-go
task build:server   # 仅 bin/server（仍是 meta 快捷入口）
task install        # go install ./cmd/innate-go → $(go env GOPATH)/bin/innate-go
task test           # go test ./...（当前主要是 internal/store）
```

不用 Task：

```bash
mkdir -p bin
go build -o bin/innate-go ./cmd/innate-go
go build -o bin/server ./cmd/server
```

`INNATE_GO`：CLI 用它定位仓库根（找 `desktop/env.sh`）。从别的目录跑已安装的 `innate-go` 时，若要 `server vine` / `desktop-app`，设成本目录绝对路径。

---

## 启动 1：meta CRUD（默认 server）

裸 `net/http` + SQLite，**不**启动 Vine Hub / Link / Portal。

```bash
task run:server
# 等同
task run:meta
# 或先 build 再：
./bin/innate-go server
./bin/innate-go server meta -addr 127.0.0.1:8080 -db ./data/meta.sqlite
./bin/server -addr 127.0.0.1:8080 -db ./data/meta.sqlite
```

| Flag | 默认 | 说明 |
| --- | --- | --- |
| `-addr` | `127.0.0.1:8080` | 监听地址（写死端口，不是 `:0`） |
| `-db` | `./data/meta.sqlite` | SQLite 文件；目录不存在会创建 |

进程会一直占用前台，Ctrl+C 结束。启动日志会打印监听地址和路由。

业务表白名单：`items`、`notes`（另有审计表 `raw_requests`）。

```bash
curl -s http://127.0.0.1:8080/healthz
curl -s http://127.0.0.1:8080/api/meta/items
curl -s -X POST http://127.0.0.1:8080/api/meta/items \
  -H 'content-type: application/json' \
  -d '{"data":{"name":"widget","price":9}}'
curl -s http://127.0.0.1:8080/api/meta/raw-requests
```

server 已在跑时：`task smoke:meta`（只打 `/healthz`）。

`go run`：

```bash
go run ./cmd/server -- -addr 127.0.0.1:8080 -db ./data/meta.sqlite
# cmd/server 会把参数插成 server meta，因此上面等价 innate-go server meta …
go run ./cmd/innate-go -- server meta -addr 127.0.0.1:8080 -db ./data/meta.sqlite
```

---

## 启动 2：Vine REST 样例

`samples/vine-rest`：`standalone.NewWithOption`，内存 `/items`，Portal 规则在 `samples/vine-rest/seed.yaml`（`matchPort: 18081`）。

从 innate-go 根目录：

```bash
task run:vine
# 或（需能解析到本仓库根，且本机有 task）
./bin/innate-go server vine
```

`task run:vine` 会：若 PATH 有 `skelc` 则生成 `skeled/`，再 `go build -o bin/vine-rest`，前台跑该二进制。Hub SQLite 写在 **`samples/vine-rest/vine.sqlite`**（相对样例目录）。

在样例目录用 Makefile：

```bash
cd samples/vine-rest
make install   # 可选：scripts/install-vine.sh --with-go
make build     # skelc gen + go build → samples/vine-rest/bin/rest-demo
make run
make smoke     # 需服务已在 18081
make clean     # 删 bin 与 vine.sqlite
```

探测（默认 seed 端口 **18081**）：

```bash
curl -s http://127.0.0.1:18081/health
curl -s http://127.0.0.1:18081/items
```

该二进制是 Vine 应用，另支持 Vine 自带参数（与 `innate-go help` 不是同一套），例如 `version`、`--log-level`、`--db-sqlite-file`、`--seed-yaml-file`。样例 `main` 里已写死 `SQLiteFile: "./vine.sqlite"`、`SeedYAMLFile: "./seed.yaml"`（显式 Option 优先于 flag）。

注意：`samples/vine-rest/go.mod` 可能仍 pin 旧 Vine 或带本机 `replace`。要以当前 Vine 为准时，在该目录 `go get go.yorun.ai/vine@latest`（skill 约定不写死版本）。

---

## 启动 3：desktop-app（不启动业务 server）

只配置 Tauri 共享 `CARGO_TARGET_DIR`，**不会**拉起 meta 或 Vine。

```bash
task desktop:config    # 先 build:cli
task desktop:status
./bin/innate-go desktop-app config
eval "$(./bin/innate-go desktop-app env)"
./bin/innate-go desktop-app run -- cargo check --manifest-path path/to/src-tauri/Cargo.toml
```

详见 `desktop/README.md`。

---

## CLI 速查（构建完成后）

```text
./bin/innate-go
./bin/innate-go help
./bin/innate-go version

./bin/innate-go desktop-app config|status|env|path|explain|clean|run
./bin/innate-go server [meta] [-addr …] [-db …]
./bin/innate-go server vine
```

无子命令或 `help` 打印上述用法。

---

## 当前没有的启动方式

下列内容见 [demo-four-modes-analysis.md](./demo-four-modes-analysis.md)，**尚未实现**：

- `innate-go demo cli|sidecar|standalone|bundle`
- sidecar：`--listen 127.0.0.1:0`、`INNATE_SIDECAR_READY`、token
- 共享 Skel `MetaStore` + `NewBundled`
