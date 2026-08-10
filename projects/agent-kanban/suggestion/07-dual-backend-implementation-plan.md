# 双后端实现计划 (Go + Node.js)

> 取代 `06-implementation-plan-on-fe-base.md` 中的单后端方案
> 核心变化：后端用 Go 和 Node.js **同时实现**，共享 OpenAPI 契约和 DB Schema
> 日期：2026-08-03

## 一、为什么双后端

| 动机 | 说明 |
|------|------|
| **性能对比** | Go 在高并发 webhook / 长轮询场景下有优势；Node.js 在 I/O 密集 + 团队熟悉度上有优势。实测才知道 |
| **契约验证** | 同一份 OpenAPI 用两种语言实现，能暴露契约的歧义和遗漏 |
| **团队分工** | 不同成员可以并行开发各自熟悉的后端 |
| **渐进选型** | MVP 阶段双轨跑，稳定后择优或保留双轨（Go 做核心服务，Node 做 BFF） |
| **互为备份** | 一个后端挂了可以切到另一个（共享 DB） |

---

## 二、整体架构

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js, innate-fe-base/apps/admin-nextjs)   │
│  ─ 通过 BACKEND_URL 环境变量切换后端                      │
│  ─ API 客户端从 OpenAPI 生成（语言无关）                   │
└────────────┬───────────────────────────────┬────────────┘
             │                               │
     BACKEND_URL=go                  BACKEND_URL=node
             │                               │
┌────────────▼────────────┐     ┌────────────▼────────────┐
│  Go Backend             │     │  Node.js Backend        │
│  (backend-go/)          │     │  (backend-node/)        │
│  ─ chi + sqlx           │     │  ─ Hono 或 Next API     │
│  ─ go-github            │     │  ─ Prisma / octokit     │
│  ─ golang-migrate       │     │  ─ 嵌入或独立           │
└────────────┬────────────┘     └────────────┬────────────┘
             │                               │
             └───────────────┬───────────────┘
                             │
                ┌────────────▼────────────┐
                │  SQLite (共享 schema.sql) │
                │  ─ 同一文件，两个后端读写  │
                └─────────────────────────┘
```

### 三层共享

| 层 | 共享文件 | Go 用法 | Node.js 用法 |
|----|---------|---------|-------------|
| **API 契约** | `spec/openapi.yaml` | 生成 chi 路由骨架 | 生成 Hono 路由 / 类型 |
| **DB Schema** | `spec/schema.sql` | golang-migrate 直接跑 | Prisma schema 映射 |
| **类型定义** | `spec/types.ts` (生成) | 手写 Go struct 对齐 | 直接 import |

**原则**：契约层只写一次，两个后端各自实现，前端不关心后端语言。

---

## 三、目录结构

```
innate-works/
├── base/innate-fe-base/              # 前端基座（不动，复用）
│   └── apps/admin-nextjs/            # 前端 + (可选) Node 嵌入式后端
│
└── projects/agent-kanban/
    ├── shared-context/               # 共享上下文（已有）
    ├── spec/                         # ★ 共享契约层（增强）
    │   ├── openapi.yaml              # 唯一 API 契约（canonical）
    │   ├── schema.sql                # 唯一 DB Schema（canonical）
    │   ├── types.ts                  # 从 OpenAPI 生成（canonical TS 类型）
    │   ├── states/                   # 状态机 YAML
    │   └── events.yaml               # 事件契约
    │
    ├── backend-go/                   # ★ Go 后端
    │   ├── cmd/kanban-api/
    │   │   └── main.go               # 入口
    │   ├── internal/
    │   │   ├── handler/              # HTTP handlers（对应 OpenAPI paths）
    │   │   │   ├── workspace.go
    │   │   │   ├── project.go
    │   │   │   ├── task.go
    │   │   │   ├── agent.go
    │   │   │   ├── assignment.go
    │   │   │   └── webhook.go
    │   │   ├── store/                # 数据访问层
    │   │   │   ├── store.go          # 接口定义
    │   │   │   ├── sqlite.go         # SQLite 实现
    │   │   │   ├── workspace.go
    │   │   │   ├── project.go
    │   │   │   ├── task.go
    │   │   │   ├── agent.go
    │   │   │   └── assignment.go
    │   │   ├── github/               # GitHub 集成
    │   │   │   ├── webhook.go        # Webhook 接收 + 验签
    │   │   │   ├── sync.go           # Issue 同步
    │   │   │   └── client.go         # go-github 封装
    │   │   ├── router/               # Label Router
    │   │   │   └── router.go
    │   │   ├── model/                # 数据模型（对齐 schema.sql）
    │   │   │   └── models.go
    │   │   └── config/
    │   │       └── config.go
    │   ├── migrations/               # SQL migrations（golang-migrate）
    │   │   ├── 001_init.up.sql       # = spec/schema.sql
    │   │   └── 001_init.down.sql
    │   ├── go.mod
    │   ├── go.sum
    │   ├── Makefile
    │   └── Dockerfile
    │
    ├── backend-node/                 # ★ Node.js 后端（独立 Hono 服务）
    │   ├── src/
    │   │   ├── index.ts              # Hono server 入口
    │   │   ├── routes/               # 路由（对应 OpenAPI paths）
    │   │   │   ├── workspaces.ts
    │   │   │   ├── projects.ts
    │   │   │   ├── tasks.ts
    │   │   │   ├── agents.ts
    │   │   │   ├── assignments.ts
    │   │   │   └── webhooks.ts
    │   │   ├── lib/
    │   │   │   ├── db.ts             # better-sqlite3 客户端
    │   │   │   ├── github/
    │   │   │   │   ├── webhook.ts
    │   │   │   │   ├── sync.ts
    │   │   │   │   └── verify-signature.ts
    │   │   │   └── kanban/
    │   │   │       ├── queries.ts
    │   │   │       └── label-router.ts
    │   │   └── types.ts              # 从 spec/types.ts import
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── Dockerfile
    │
    ├── frontend/                     # ★ 前端（从 innate-fe-base 派生）
    │   └── README.md                 # 说明如何从 innate-fe-base 派生
    │
    └── suggestion/                   # 评审与计划文档（已有）
```

---

## 四、Go 后端技术栈

| 组件 | 选型 | 理由 |
|------|------|------|
| Web 框架 | **chi v5** | 轻量、标准库风格、net/http 兼容、路由性能好 |
| DB 驱动 | **database/sql + sqlx** | 标准库 + 轻量增强，不用 ORM 也能类型安全 |
| SQLite 驱动 | **modernc.org/sqlite** | 纯 Go 实现，无需 CGO，跨平台编译 |
| GitHub SDK | **google/go-github/v60** | 官方维护，功能完整 |
| Migration | **golang-migrate** | 支持 SQL 文件，与 spec/schema.sql 直接对应 |
| 配置 | **envconfig** | 轻量，从环境变量读取 |
| 日志 | **log/slog** | Go 1.21+ 标准库，结构化日志 |
| 测试 | **testify + httptest** | 标准测试组合 |
| 热重载 | **air** | 开发时自动重启 |

### Go 后端核心代码骨架

```go
// backend-go/cmd/kanban-api/main.go
package main

import (
    "log/slog"
    "net/http"
    "os"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
    "github.com/yourorg/agent-kanban/backend-go/internal/config"
    "github.com/yourorg/agent-kanban/backend-go/internal/handler"
    "github.com/yourorg/agent-kanban/backend-go/internal/store"
)

func main() {
    cfg := config.Load()
    db := store.MustOpenSQLite(cfg.DBPath)
    defer db.Close()

    r := chi.NewRouter()
    r.Use(middleware.Logger, middleware.Recoverer, middleware.RequestID)

    h := handler.New(db, cfg)
    r.Route("/api/v1", func(r chi.Router) {
        r.Get("/workspaces", h.ListWorkspaces)
        r.Post("/workspaces", h.CreateWorkspace)
        r.Get("/workspaces/{id}", h.GetWorkspace)
        r.Get("/workspaces/{id}/tasks", h.ListTasks)
        r.Get("/workspaces/{id}/agents", h.ListAgents)
        r.Get("/workspaces/{id}/stats", h.GetStats)
        r.Post("/workspaces/{id}/projects", h.AddProject)
        r.Post("/workspaces/{id}/agents", h.CreateAgent)
        r.Get("/projects/{id}", h.GetProject)
        r.Delete("/projects/{id}", h.RemoveProject)
        r.Post("/projects/{id}/sync", h.TriggerSync)
        r.Get("/tasks/{id}", h.GetTask)
        r.Get("/tasks/{id}/assignments", h.ListTaskAssignments)
        r.Get("/agents/{id}", h.GetAgent)
        r.Patch("/agents/{id}", h.UpdateAgent)
        r.Delete("/agents/{id}", h.DeleteAgent)
        r.Get("/agents/{id}/assignments", h.ListAgentAssignments)
        r.Post("/assignments", h.CreateAssignment)
        r.Post("/webhooks/github", h.ReceiveGitHubWebhook)
    })

    slog.Info("Go backend starting", "port", cfg.Port)
    http.ListenAndServe(":"+cfg.Port, r)
}
```

```go
// backend-go/internal/store/task.go
package store

import "database/sql"

func (s *Store) ListTasksByWorkspace(workspaceID string, filter TaskFilter) ([]TaskWithAssignment, error) {
    rows, err := s.db.Query(`
        SELECT t.id, t.issue_number, t.title, t.status, t.labels,
               p.name AS project_name, p.repo_owner, p.repo_name,
               a.id AS assignment_id, a.status AS assignment_status,
               ag.name AS agent_name, ag.model_name
        FROM kanban_task t
        JOIN kanban_project p ON t.project_id = p.id
        LEFT JOIN kanban_assignment a ON t.id = a.task_id
            AND a.status IN ('pending', 'running')
        LEFT JOIN kanban_agent ag ON a.agent_id = ag.id
        WHERE p.workspace_id = ?
        ORDER BY t.updated_at DESC
        LIMIT ?
    `, workspaceID, filter.Limit)
    // ...
}
```

---

## 五、Node.js 后端技术栈

| 组件 | 选型 | 理由 |
|------|------|------|
| Web 框架 | **Hono** | 轻量、TypeScript 原生、与 Next.js 兼容 |
| DB 驱动 | **better-sqlite3** | 同步 API，性能好，与 innate-fe-base 一致 |
| GitHub SDK | **octokit** | 官方 SDK |
| 类型 | **zod** | 运行时验证 + 类型推断 |
| 测试 | **vitest + supertest** | 快速、兼容 TypeScript |
| 热重载 | **tsx watch** | 开发时自动重启 |

### 两种部署模式

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| **嵌入式** (默认) | API 路由放在 innate-fe-base/apps/admin-nextjs/src/app/api/ | 开发、SSR |
| **独立式** | 独立 Hono 服务在 backend-node/ | 对比测试、微服务部署 |

### Node.js 后端核心代码骨架

```typescript
// backend-node/src/index.ts (独立模式)
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { workspaceRoutes } from "./routes/workspaces"
import { projectRoutes } from "./routes/projects"
import { taskRoutes } from "./routes/tasks"
import { agentRoutes } from "./routes/agents"
import { assignmentRoutes } from "./routes/assignments"
import { webhookRoutes } from "./routes/webhooks"

const app = new Hono()

app.use("*", logger())
app.use("*", cors())

app.route("/api/v1/workspaces", workspaceRoutes)
app.route("/api/v1/projects", projectRoutes)
app.route("/api/v1/tasks", taskRoutes)
app.route("/api/v1/agents", agentRoutes)
app.route("/api/v1/assignments", assignmentRoutes)
app.route("/api/v1/webhooks", webhookRoutes)

const port = Number(process.env.PORT) || 4001
console.log(`Node.js backend starting on port ${port}`)
export default { port, fetch: app.fetch }
```

```typescript
// backend-node/src/routes/tasks.ts
import { Hono } from "hono"
import { db } from "../lib/db"
import type { TaskFilter } from "../types"

export const taskRoutes = new Hono()

taskRoutes.get("/workspaces/:id/tasks", async (c) => {
  const workspaceId = c.req.param("id")
  const status = c.req.query("status")
  const projectId = c.req.query("projectId")
  const limit = Number(c.req.query("limit") || 50)

  const tasks = db.prepare(`
    SELECT t.id, t.issue_number, t.title, t.status, t.labels,
           p.name AS project_name, p.repo_owner, p.repo_name,
           a.id AS assignment_id, a.status AS assignment_status,
           ag.name AS agent_name, ag.model_name
    FROM kanban_task t
    JOIN kanban_project p ON t.project_id = p.id
    LEFT JOIN kanban_assignment a ON t.id = a.task_id
      AND a.status IN ('pending', 'running')
    LEFT JOIN kanban_agent ag ON a.agent_id = ag.id
    WHERE p.workspace_id = ?
    ORDER BY t.updated_at DESC
    LIMIT ?
  `).all(workspaceId, limit)

  return c.json({ total: tasks.length, items: tasks })
})
```

---

## 六、共享契约层（关键）

### 6.1 spec/openapi.yaml（增强）

在现有 openapi.yaml 基础上：
1. 补充所有 `examples:`
2. 添加 `securitySchemes`（可选 API Key）
3. 确保所有响应有明确的 schema

### 6.2 spec/schema.sql（从 models.md 抽出）

```sql
-- 这份 SQL 是 canonical，Go 和 Node.js 都基于它
-- Go: 用 golang-migrate 直接执行
-- Node.js: 用 better-sqlite3 直接执行（或 Prisma 从此映射）

CREATE TABLE IF NOT EXISTS kanban_workspace (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  user_id     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS kanban_project (
  id            TEXT PRIMARY KEY,
  workspace_id  TEXT NOT NULL REFERENCES kanban_workspace(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  repo_owner    TEXT NOT NULL,
  repo_name     TEXT NOT NULL,
  webhook_secret TEXT,
  sync_status   TEXT NOT NULL DEFAULT 'idle',
  last_synced_at TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(repo_owner, repo_name)
);
-- ... 其余表见 spec/models.md
```

### 6.3 类型生成

```bash
# 生成 TypeScript 类型（前端 + Node.js 后端共用）
npx openapi-typescript spec/openapi.yaml -o spec/types.ts

# Go 类型手写（对齐 schema.sql），放在 backend-go/internal/model/models.go
```

### 6.4 契约测试

```yaml
# spec/contract-tests.yaml — 两个后端必须通过的测试用例
- name: "创建 workspace"
  request:
    method: POST
    path: /api/v1/workspaces
    body: { name: "测试工作空间" }
  response:
    status: 201
    body:
      name: "测试工作空间"
      id: "string"  # 类型检查

- name: "创建 project"
  request:
    method: POST
    path: /api/v1/workspaces/{workspaceId}/projects
    body: { name: "前端项目", repoOwner: "my-org", repoName: "frontend-app" }
  response:
    status: 201
```

---

## 七、分阶段实施计划

### Phase 0：共享契约层（1 天）

| # | 任务 | 产出 |
|---|------|------|
| 0.1 | 从 spec/models.md 抽出 spec/schema.sql | canonical DB schema |
| 0.2 | 增强 spec/openapi.yaml（补 examples） | canonical API 契约 |
| 0.3 | `npx openapi-typescript` 生成 spec/types.ts | TS 类型 |
| 0.4 | 编写 spec/contract-tests.yaml | 契约测试用例 |
| 0.5 | 写 spec/states/*.yaml 状态机 | 机器可解析状态 |

**验收**：schema.sql 可直接执行；openapi.yaml 导入 Swagger 无错误。

---

### Phase 1：Go 后端 MVP（3 天，可与 Phase 2 并行）

| # | 任务 | 文件 |
|---|------|------|
| 1.1 | 初始化 Go 项目（go.mod + 依赖） | `backend-go/go.mod` |
| 1.2 | 配置 golang-migrate，导入 schema.sql | `backend-go/migrations/` |
| 1.3 | 实现 store 层（database/sql + sqlx） | `internal/store/*.go` |
| 1.4 | 实现 handler 层（chi 路由） | `internal/handler/*.go` |
| 1.5 | 实现 Workspace/Project/Task/Agent/Assignment CRUD | 对应 handler 文件 |
| 1.6 | 配置 air 热重载 | `.air.toml` |
| 1.7 | 写 Makefile（migrate/dev/test/build） | `Makefile` |

**Go 依赖清单**：
```go
// backend-go/go.mod
require (
    github.com/go-chi/chi/v5 v5.0.12
    github.com/jmoiron/sqlx v1.4.0
    modernc.org/sqlite v1.29.0
    github.com/google/go-github/v60 v60.0.0
    github.com/golang-migrate/migrate/v4 v4.17.0
    github.com/kelseyhightower/envconfig v1.4.0
    github.com/stretchr/testify v1.9.0
)
```

**验收**：Go 后端跑通所有 CRUD 端点，通过契约测试。

---

### Phase 2：Node.js 后端 MVP（3 天，可与 Phase 1 并行）

| # | 任务 | 文件 |
|---|------|------|
| 2.1 | 初始化 Node 项目（Hono + better-sqlite3） | `backend-node/package.json` |
| 2.2 | 执行 schema.sql 初始化 SQLite | `backend-node/src/lib/db.ts` |
| 2.3 | 实现路由层（Hono routes） | `src/routes/*.ts` |
| 2.4 | 实现 Workspace/Project/Task/Agent/Assignment CRUD | 对应路由文件 |
| 2.5 | 配置 tsx watch 热重载 | `package.json scripts` |
| 2.6 | 写 vitest 测试 | `src/**/*.test.ts` |

**Node 依赖清单**：
```json
{
  "dependencies": {
    "hono": "^4.6.0",
    "better-sqlite3": "^11.0.0",
    "@octokit/rest": "^21.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0",
    "supertest": "^7.0.0"
  }
}
```

**验收**：Node.js 后端跑通所有 CRUD 端点，通过契约测试。

---

### Phase 3：GitHub 同步（两个后端各实现，2 天）

**Go 版本**：
| # | 任务 | 文件 |
|---|------|------|
| 3.1a | 实现 HMAC-SHA256 验签 | `internal/github/webhook.go` |
| 3.2a | 实现 Issue 事件处理 | `internal/github/sync.go` |
| 3.3a | 实现全量同步（go-github paginate） | `internal/github/client.go` |
| 3.4a | 集成到 chi 路由 | `internal/handler/webhook.go` |

**Node.js 版本**：
| # | 任务 | 文件 |
|---|------|------|
| 3.1b | 实现 HMAC-SHA256 验签 | `src/lib/github/verify-signature.ts` |
| 3.2b | 实现 Issue 事件处理 | `src/lib/github/sync.ts` |
| 3.3b | 实现全量同步（octokit paginate） | `src/lib/github/sync.ts` |
| 3.4b | 集成到 Hono 路由 | `src/routes/webhooks.ts` |

**验收**：GitHub 创建 Issue → 两个后端都能正确同步到 DB。

---

### Phase 4：看板 UI（3 天，复用 innate-fe-base）

| # | 任务 | 文件 |
|---|------|------|
| 4.1 | 从 innate-fe-base 派生前端 app | `frontend/` 或直接用 admin-nextjs |
| 4.2 | 配置 BACKEND_URL 环境变量切换 | `.env.local` |
| 4.3 | 从 OpenAPI 生成 API 客户端 | `src/lib/api-client.ts` |
| 4.4 | 实现 KanbanBoard（@dnd-kit） | `src/components/kanban-board.tsx` |
| 4.5 | 实现 TaskCard（@innate/ui Card+Badge） | `src/components/task-card.tsx` |
| 4.6 | 实现 StatsBar + FilterBar | `src/components/stats-bar.tsx` |
| 4.7 | 实现 TaskDetailPanel（@innate/ui Sheet） | `src/components/task-detail.tsx` |

**验收**：前端能切换 Go/Node 后端，看板功能一致。

---

### Phase 5：Label Router + 分配（两个后端各实现，2 天）

**Go 版本**：
```go
// backend-go/internal/router/router.go
func FindMatchingAgent(db *sqlx.DB, workspaceID string, labels []string) (*Agent, error) {
    var agents []Agent
    err := db.Select(&agents, "SELECT * FROM kanban_agent WHERE workspace_id = ? AND status = 'active'", workspaceID)
    // 应用层匹配：capability_tags 与 labels 求交集，得分最高者胜出
    bestScore := 0
    var bestAgent *Agent
    for i := range agents {
        tags := parseJSONArray(agents[i].CapabilityTags)
        score := intersectionCount(tags, labels)
        if score > bestScore {
            bestScore = score
            bestAgent = &agents[i]
        }
    }
    return bestAgent, nil
}
```

**Node.js 版本**：
```typescript
// backend-node/src/lib/kanban/label-router.ts
export async function findMatchingAgent(workspaceId: string, labels: string[]) {
  const agents = db.prepare(
    "SELECT * FROM kanban_agent WHERE workspace_id = ? AND status = 'active'"
  ).all(workspaceId)

  let bestAgent = null
  let bestScore = 0
  for (const agent of agents) {
    const tags = JSON.parse(agent.capability_tags)
    const score = tags.filter((t: string) => labels.includes(t)).length
    if (score > bestScore) {
      bestScore = score
      bestAgent = agent
    }
  }
  return bestAgent
}
```

**验收**：创建带标签的 Issue → 两个后端都能自动匹配 Agent 并创建 Assignment。

---

### Phase 6：对比测试 + 部署（1 天）

| # | 任务 | 产出 |
|---|------|------|
| 6.1 | 跑契约测试对比两个后端行为 | 测试报告 |
| 6.2 | wrk 压测对比性能 | 性能报告 |
| 6.3 | 写 Dockerfile（Go + Node 各一个） | `backend-go/Dockerfile`, `backend-node/Dockerfile` |
| 6.4 | 写 docker-compose.yml（前端+Go+Node+DB） | `docker-compose.yml` |

---

## 八、Go vs Node.js 对比矩阵

| 维度 | Go | Node.js |
|------|-----|---------|
| **并发模型** | Goroutine（轻量） | Event loop（单线程） |
| **Webhook 高并发** | ⭐ 强 | 中 |
| **DB 操作** | database/sql（显式） | better-sqlite3（同步简单） |
| **类型安全** | ⭐ 编译时 | TypeScript（运行时需 zod） |
| **二进制部署** | ⭐ 单文件 | 需 node 运行时 |
| **开发速度** | 中 | ⭐ 快（热重载 + TS） |
| **GitHub SDK** | go-github | ⭐ octokit（更活跃） |
| **生态成熟度** | 中 | ⭐ 高 |
| **内存占用** | ⭐ 低 | 中 |
| **团队熟悉度** | 视团队 | ⭐ 通常更高 |

**预期结论**（待实测验证）：
- Webhook 接收 + 高频同步 → Go 更优
- CRUD + 业务逻辑 → 两者差异不大，Node.js 开发更快
- 最终可能：Go 做同步引擎，Node.js 做 BFF

---

## 九、前端切换后端的方式

```typescript
// frontend/src/lib/api-client.ts
// 从 OpenAPI 生成的客户端，通过环境变量切换后端

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4001"

export const api = {
  async listTasks(workspaceId: string, params?: URLSearchParams) {
    const query = params ? `?${params}` : ""
    const res = await fetch(`${BACKEND_URL}/api/v1/workspaces/${workspaceId}/tasks${query}`)
    return res.json()
  },
  // ... 其他方法
}
```

```bash
# .env.local — 切换到 Go 后端
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080

# .env.local — 切换到 Node.js 后端
NEXT_PUBLIC_BACKEND_URL=http://localhost:4001
```

---

## 十、工作量估算

| Phase | 任务 | 工时 | 可并行 |
|-------|------|------|--------|
| Phase 0 | 共享契约层 | 1 天 | — |
| Phase 1 | Go 后端 MVP | 3 天 | 与 Phase 2 并行 |
| Phase 2 | Node.js 后端 MVP | 3 天 | 与 Phase 1 并行 |
| Phase 3 | GitHub 同步（双后端） | 2 天 | 串行（依赖 1+2） |
| Phase 4 | 看板 UI | 3 天 | 与 Phase 3 并行 |
| Phase 5 | Label Router（双后端） | 2 天 | 串行（依赖 3） |
| Phase 6 | 对比测试 + 部署 | 1 天 | 串行 |
| **合计** | | **8-9 天**（并行） | |

**对比单后端方案（9-11 天）**：双后端因 Phase 1/2 并行，总工时反而更短。但需要两人同时开发。

**MVP（Phase 0 + 1 或 2 + 4）= 5 天**（单后端 + 前端）。

---

## 十一、关键决策记录

### 决策 1：Go 用 chi 而非 Gin/Echo

**理由**：chi 与标准库 net/http 100% 兼容，中间件生态丰富，性能与 Gin 相当，但更"标准库风格"。

### 决策 2：Go 用 modernc.org/sqlite 而非 mattn/go-sqlite3

**理由**：modernc 是纯 Go 实现，不需要 CGO，交叉编译简单。mattn 需要 CGO，部署复杂。

### 决策 3：Node.js 用 Hono 而非 Express/Fastify

**理由**：Hono 是 TypeScript 原生，类型安全好，轻量，与 Cloudflare Workers / Next.js 都兼容。后续如果要部署到边缘，Hono 无需改动。

### 决策 4：Node.js 用 better-sqlite3 而非 Prisma

**理由**：与 Go 的 database/sql 对称——都是直接 SQL。这样两个后端的查询逻辑可以直接对比，不会被 ORM 抽象隐藏。如果需要 Prisma 的类型安全，可以从 schema.sql 生成 Prisma schema。

### 决策 5：共享 SQLite 文件

**理由**：MVP 阶段两个后端共享同一个 dev.db 文件，方便对比。生产环境应该用独立 DB 实例。

### 决策 6：契约测试驱动

**理由**：两个后端必须通过同一套契约测试，确保行为一致。契约测试用例从 OpenAPI 推导。

---

## 十二、与之前计划的对齐

| 之前的计划 (06) | 现在的计划 (07) | 变化 |
|----------------|----------------|------|
| 单后端 (Next.js API Routes) | 双后端 (Go + Node.js Hono) | ★ 核心变化 |
| Prisma schema | spec/schema.sql (canonical) | 两个后端共享 |
| 嵌入式 API | 独立后端服务 | 前端通过 URL 切换 |
| 9-11 天 | 8-9 天（并行） | 因并行而缩短 |
| spec/openapi.yaml | spec/openapi.yaml (增强) | 加 examples + 契约测试 |

前端部分（Phase 4）**完全不变**——仍然复用 innate-fe-base，用 @dnd-kit + @innate/ui。

---

## 十三、下一步

1. **立即执行 Phase 0**：抽出 schema.sql + 增强 openapi.yaml（1 天）
2. **Phase 1 和 2 并行启动**：两人分别做 Go 和 Node.js 后端
3. **Phase 4 可提前启动**：前端用 mock 数据开发，不阻塞后端

要我现在开始执行 Phase 0 吗？
