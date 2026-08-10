# docs/ — Canonical 契约层

> 此目录是 Agent Kanban 的 **唯一真相源 (Single Source of Truth)**。
> Go 和 Node.js 两个后端都基于此目录的文件实现。
>
> Task 状态为看板 4 列：`backlog | in_progress | in_review | done`（含 WIP 与 GitHub 同步优先级栈，见 `states/task-states.yaml`）。

## 文件清单

| 文件 | 用途 | Go 用法 | Node.js 用法 |
|------|------|---------|-------------|
| `schema.sql` | 数据库 Schema (7 张表 + 9 个索引) | golang-migrate 直接执行 | better-sqlite3 `db.exec()` |
| `openapi.yaml` | API 契约 (增强版, 含 examples) | 生成 chi 路由骨架 + 测试 | 生成 Hono 路由 + TS 类型 |
| `types.ts` | TypeScript 类型定义 | 参考（手写 Go struct 对齐） | 直接 import |
| `events.yaml` | 事件契约 (GitHub webhook + 内部事件) | 实现事件分发 | 实现事件分发 |
| `contract-tests.yaml` | 契约测试用例 (两个后端必须通过) | Go test 实现 | vitest 实现 |
| `states/task-states.yaml` | Task 状态机 | 实现 `store.TaskTransition()` | 实现 `taskTransition()` |
| `states/assignment-states.yaml` | Assignment 状态机 | 实现 `store.AssignmentTransition()` | 实现 `assignmentTransition()` |

## 使用方式

### Go 后端

```bash
# 初始化数据库
migrate -path docs/ -database sqlite3://dev.db up

# 基于 openapi.yaml 生成路由 (手动或用 oapi-codegen)
# 基于 contract-tests.yaml 编写 Go 测试
```

### Node.js 后端

```bash
# 初始化数据库
sqlite3 dev.db < docs/schema.sql

# 生成 TS 类型 (可选，已有手写 types.ts)
npx openapi-typescript docs/openapi.yaml -o docs/generated-types.ts

# 基于 contract-tests.yaml 编写 vitest 测试
```

### 前端

```typescript
// 直接 import 类型
import type { Task, Agent, Assignment } from "@/docs/types"
```

## 修改规则

1. **修改 DB schema** → 只改 `schema.sql`，Go 和 Node 各自适配
2. **修改 API** → 只改 `openapi.yaml`，两个后端各自适配
3. **修改类型** → 只改 `types.ts`，Go 手动对齐 struct
4. **修改状态机** → 只改 `states/*.yaml`，两个后端各自实现
5. **新增测试用例** → 加到 `contract-tests.yaml`，两个后端都必须通过

## 对齐检查

两个后端实现完成后，运行契约测试确保行为一致：

```bash
# Go 后端测试
cd backend-go && go test ./... -run Contract

# Node.js 后端测试
cd backend-node && pnpm test:contract

# 结果应该完全一致
```
