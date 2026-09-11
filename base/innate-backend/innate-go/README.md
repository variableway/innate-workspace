# innate-go

路径：`base/innate-backend/innate-go`（原 `base/innate-go-base`）。

后端基础工程：**CLI 工具链** + **可运行 server 样例**（meta CRUD / Vine REST），并内置 **Tauri 共享 Cargo target** 配置。

统一命令：`innate-go`。用 [Task](https://taskfile.dev) 管理不同产物的 build/run。

## 布局

```text
innate-go/
  cmd/innate-go/          CLI 入口
  cmd/server/             meta server 快捷入口
  internal/cli|metaapi|store/
  desktop/                原 desktop-cargo（CARGO_TARGET_DIR helpers）
  samples/vine-rest/      完整 Vine standalone REST 样例
  docs/                   演示规划（四模式分析与 TODO）
  Taskfile.yml
```

文档：

- 当前如何构建与启动：[`docs/build-and-run.md`](./docs/build-and-run.md)
- 四模式演示规划：[`docs/demo-four-modes-analysis.md`](./docs/demo-four-modes-analysis.md)
- 目录索引：[`docs/README.md`](./docs/README.md)

## 安装 / 构建

```bash
cd base/innate-backend/innate-go
task build          # → bin/innate-go
task install        # → $(go env GOPATH)/bin/innate-go
```

## CLI

### Desktop / Tauri（共享编译缓存）

```bash
innate-go desktop-app config    # 默认：打印 Tauri 共享 Cargo 配置
eval "$(innate-go desktop-app env)"
innate-go desktop-app status
innate-go desktop-app run -- cargo check --manifest-path path/to/src-tauri/Cargo.toml
innate-go desktop-app clean --yes
```

`task desktop:config` 等价于 `desktop-app config`。

### Server

```bash
# Meta CRUD（默认 server；SQLite：raw_requests + items + notes）
task run:server
# 或
innate-go server
innate-go server meta -addr 127.0.0.1:8080 -db ./data/meta.sqlite

curl -s localhost:8080/healthz
curl -s -X POST localhost:8080/api/meta/items \
  -H 'content-type: application/json' \
  -d '{"data":{"name":"widget","price":9}}'

# Vine REST 样例（用最新 Vine；本目录 go.mod 若仍是旧 pin / 本机 replace，以 skill `@latest` 为准）
task run:vine
# 或
innate-go server vine
```

## Task 一览

| Task | 说明 |
|------|------|
| `build` / `build:cli` / `build:server` | 构建 CLI / server |
| `test` | Go 测试 |
| `run:server` / `run:meta` | 启动 meta REST |
| `run:vine` | 启动 Vine REST 样例 |
| `desktop:config` / `desktop:status` | Tauri cargo 配置 |
| `install` | 安装 `innate-go` |

## Skill

Go + Vine 开发指南：[`base/innate-backend/skills/backend-go`](../skills/backend-go/)。

新建 Vine 应用请拷贝 skill 里的 `templates/vine-standalone/`，再 `go get go.yorun.ai/vine@latest`。不要把本仓库再复制进 skill。

## 迁移说明

| 旧路径 | 新位置 |
|--------|--------|
| `base/desktop-cargo/` | `desktop/` + `innate-go desktop-app …` |
| `projects/tooling/innate-meta-api` | 本模块 `internal/metaapi` + `innate-go server` |
| `projects/tooling/innate-vine-rest` | `samples/vine-rest/` |
