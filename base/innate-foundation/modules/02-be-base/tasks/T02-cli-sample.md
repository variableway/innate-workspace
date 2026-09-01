# 任务：CLI 样例

- **状态**：pending
- **模块**：02-be-base
- **优先级**：P0
- **依赖**：T01（目录/Go module 约定已立）
- **参考**：`base/references/backend/golang-backend/vine-skill/refs/08-cli-application.md`

## 背景

除 REST 服务外，需要独立 CLI 工具范式（跑完即退，不强起 Vine 服务进程）。风格对齐 Vine 自身：薄 `main`、可测 `run`、子命令工厂、flag + env 配对。

## 目标

在本模块落地一个可单测的 CLI 样例（可与 REST 同 module，独立 `cmd/`）。

## 执行步骤

1. 按 `08-cli-application.md`：`cmd/<tool>/main.go` 只调 `cli.Main()`；逻辑在 `internal/cli`
2. 至少两个子命令（如 `version`/`hello` 或 `export`/`import` 占位）
3. `run(args)` 返回 exitCode/stdout/stderr，不直接 `os.Exit`/`os.Stdout`（便于单测）
4. 关键 flag 配环境变量；README 写用法

## 产出

- `cmd/...` + `internal/cli/...`
- 至少 1 个包内单测覆盖 `run`

## 验收标准

- [ ] `go run`/`go test` 可验证子命令
- [ ] `main` 薄、业务不在 `Action` 里堆砌
- [ ] README 有 CLI 用法示例

## 如何执行

```text
请执行 base/innate-foundation/modules/02-be-base/tasks/T02-cli-sample.md，使用 Local Workflow。
```
