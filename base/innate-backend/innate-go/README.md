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
  Taskfile.yml
```

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

# Vine REST 样例（Go 1.26.5+ / vine / skelc）
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

Go + Vine 开发指南：[`base/innate-backend/skills/backend-go`](../innate-backend/skills/backend-go/)。

## 迁移说明

| 旧路径 | 新位置 |
|--------|--------|
| `base/desktop-cargo/` | `desktop/` + `innate-go desktop-app …` |
| `projects/tooling/innate-meta-api` | 本模块 `internal/metaapi` + `innate-go server` |
| `projects/tooling/innate-vine-rest` | `samples/vine-rest/` |
