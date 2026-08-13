# docs/ — Canonical 契约层

> 此目录是 Agent Kanban 的 **唯一真相源 (Single Source of Truth) for contracts**。
> Go 和 Node.js 两个后端都基于此目录的文件实现。
>
> **产品双 SoT**（见 `shared-context/architecture.md`）：
> - 任务**状态** SoT = GitHub Issues
> - 执行**过程** SoT = Artifact（本目录 schema 中的 `kanban_artifact`）
>
> Task 状态为看板 4 列：`backlog | in_progress | in_review | done`（含 WIP 与 GitHub 同步优先级栈，见 `states/task-states.yaml`）。

## 文件清单

| 文件 | 用途 | Go 用法 | Node.js 用法 |
|------|------|---------|-------------|
| `schema.sql` | DB Schema（核心表 + Artifact / TIP / Notify / Edge） | golang-migrate | better-sqlite3 `db.exec()` |
| `openapi.yaml` | API 契约 | 生成 chi 路由骨架 + 测试 | 生成 Hono 路由 + TS 类型 |
| `types.ts` | TypeScript 类型定义 | 参考（手写 Go struct 对齐） | 直接 import |
| `events.yaml` | 事件契约（GitHub + 内部 + TIP + 出站通知） | 实现事件分发 | 实现事件分发 |
| `contract-tests.yaml` | 契约测试用例（两个后端必须通过） | Go test 实现 | vitest 实现 |
| `states/task-states.yaml` | Task 状态机 | `store.TaskTransition()` | `taskTransition()` |
| `states/assignment-states.yaml` | Assignment 状态机 | `store.AssignmentTransition()` | `assignmentTransition()` |

## 模块契约索引

| 模块 PRD | 契约触点 |
|----------|----------|
| [sync-engine](../modules/sync-engine.md) | events `github_events`、task 表 |
| [task-orchestrator](../modules/task-orchestrator.md) | task 状态机、task_edge |
| [dispatch-scheduler](../modules/dispatch-scheduler.md) | assignment 状态机 |
| [agent-runtime](../modules/agent-runtime.md) | TIP Adapter 实现 |
| [agent-protocol](../modules/agent-protocol.md) | `POST /tip`、`kanban_tip_message`、bootstrap |
| [review-gates](../modules/review-gates.md) | `kanban_gate`、Assignment.stage、协议 Skill |
| [artifact-store](../modules/artifact-store.md) | `kanban_artifact` |
| [notifier](../modules/notifier.md) | `kanban_notify_channel`、outbound_notifications |
| [dashboard](../modules/dashboard.md) | 聚合读模型 |

## 使用方式

### Go 后端

```bash
migrate -path docs/ -database sqlite3://dev.db up
# 基于 openapi.yaml / contract-tests.yaml 实现与测试
```

### Node.js 后端

```bash
sqlite3 dev.db < docs/schema.sql
# 类型：直接 import docs/types.ts
```

### 前端

```typescript
import type { Task, Agent, Assignment, Artifact, TipEnvelope } from "../docs/types"
```

## 修改规则

1. **修改 DB schema** → 只改 `schema.sql`，Go / Node 各自适配（含迁移）
2. **修改 API** → 只改 `openapi.yaml`，两个后端各自适配
3. **修改类型** → 只改 `types.ts`，Go 手动对齐 struct
4. **修改状态机** → 只改 `states/*.yaml`
5. **修改事件 / TIP / 通知** → 只改 `events.yaml`
6. **新增测试用例** → 加到 `contract-tests.yaml`，两个后端都必须通过

## 对齐检查

```bash
cd backend-go && go test ./... -run Contract
cd backend-node && pnpm test:contract
```
