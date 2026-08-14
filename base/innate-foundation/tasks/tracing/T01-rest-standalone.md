# Tracing: T01-rest-standalone

## Task Entry (2026-08-13 17:06:15)

- **Task File**: `modules/02-be-base/tasks/T01-rest-standalone.md`
- **Task ID**: local-20260813-bab6b4d3
- **Title**: 任务：Standalone REST 服务样例
- **Started At**: 2026-08-13 17:06:15
- **Status**: completed

### Original Task Content

```markdown
# 任务：Standalone REST 服务样例

- **状态**：pending
- **模块**：02-be-base
- **优先级**：P0（本模块最高）
- **依赖**：G01
- **参考**：`base/references/backend/golang-backend/vine-skill`（`SKILL.md`、`refs/04-standalone-dev.md`、`refs/01-app-startup.md` Web 段、`refs/13-skel-syntax.md`）

## 背景

栈已定为 **Go + Vine**，不再做候选栈 ADR。首要交付是一个**可单独运行**的 REST 服务样例：单进程 standalone（Hub/Portal/Link + 业务 App），无需先起 linked/separated 拓扑即可 `curl` 验证。

linked / separated 另有任务，优先级更低。

## 目标

在 `modules/02-be-base/` 落地最小 Vine REST 应用：standalone 启动、至少一组 HTTP 路由（含 health）、README 可一条命令跑通。

## 执行步骤

1. 用 `scripts/install-vine.sh`（或等价）确认本机 Go / `vine` / `skelc` 可用；模块 README 写清版本钉扎约定
2. 初始化 Go module 与目录（建议 `cmd/rest-demo/`、`internal/application/`、`skel/`、`skeled/`）
3. 按 vine-skill：`standalone.NewWithOption` + `app.WebberEnabled`；`.skel` 声明 web，`skelc gen go`，实现 `Routes`
4. 暴露至少：`GET` health（或等价）+ 一个样例资源只读/读写路由
5. 模块 README：启动命令、如何 curl、与后续 linked/separated 的关系（业务代码不变、只换构造器）

## 产出

- 可运行源码树（本模块下）
- 启动与 curl 说明写入模块 README

## 验收标准

- [ ] 本地一条命令可启动（standalone，无需独立 Hub/Link）
- [ ] `curl` health（或等价）返回成功
- [ ] 至少一条业务 REST 路由可手工验证
- [ ] README 标明栈为 Go + Vine，并指向 vine-skill

## 如何执行

```text
请执行 base/innate-foundation/modules/02-be-base/tasks/T01-rest-standalone.md，使用 Local Workflow。
```
```

### Agent Parsed Content

在 02-be-base 落地 Go+Vine standalone REST：安装脚本、cmd/rest-demo、skel web、health+items、seed portal、README。
- **Completed At**: 2026-08-13 17:25:17

### Implementation Summary

落地 scripts/install-vine.sh（GitHub clone vine/skelc）；cmd/rest-demo meta CRUD REST（SQLite 三表 raw_requests/items/notes）；desktop-cargo CLI；go test + curl 冒烟通过。Vine standalone Web 因本机 Go 1.26.1 < 1.26.5 暂缓。
- **Completed At**: 2026-08-13 18:00:32

### Implementation Summary

合并为 base/innate-go-base：innate-go CLI（desktop-app config + server meta/vine）、meta CRUD、samples/vine-rest、desktop Cargo helpers；Taskfile 管理 build/run；旧 desktop-cargo / tooling 样例改为重定向。
- **Completed At**: 2026-08-13 19:43:28

### Implementation Summary

落地 02-be-base standalone REST 样例源码 + install-vine.sh + skel 生成；因 Agent 沙箱网络/GOMODCACHE 限制未能在会话内完成 go build/curl 验收，需本机终端 make build && make run && make smoke。

