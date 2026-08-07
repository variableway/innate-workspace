# 基于 innate-fe-base 实现 Agent Kanban 的计划

> 基座项目：`/Users/patrick/innate/innate-works/base/innate-fe-base`
> 目标：在 innate-fe-base monorepo 中新增 agent-kanban 应用，复用已有基础设施
> 分析日期：2026-08-02

## 一、核心结论

**innate-fe-base 几乎是为 agent-kanban 量身定制的底座。** 我们 spec 中需要的能力，80% 已经存在：

| 我们 spec 的需求 | innate-fe-base 现状 | 复用度 |
|------------------|---------------------|--------|
| Next.js + TypeScript | Next.js 16 App Router + TS strict | ✅ 100% |
| SQLite 数据库 | Prisma + better-sqlite3 | ✅ 100% |
| 看板拖拽 | @dnd-kit/core + modifiers + sortable | ✅ 100% |
| UI 组件库 | @innate/ui (60+ shadcn 组件) | ✅ 100% |
| 主题系统 | next-themes + CSS 变量 | ✅ 100% |
| 用户认证 | better-auth (已配 Google 登录) | ✅ 100% |
| AI 入口文件 | AGENTS.md 已存在 | ✅ 100% |
| 页面壳 | @innate/admin-composites PageContainer | ✅ 100% |
| 场景规范 | scene-specs L3 系统 | ✅ 复用模式 |
| 技能系统 | skills-kit (fe-starter) | ✅ 复用模式 |
| 路由约定 | `/dashboard/*` 文件路由 | ✅ 100% |
| 代码风格 | 一组件一目录、数据逻辑分离 | ✅ 100% |

**真正需要新写的只有：数据模型 + API 路由 + 看板组件 + GitHub 同步**。

---

## 二、innate-fe-base 架构速览

### Monorepo 结构

```
innate-fe-base/
├── apps/
│   ├── admin-nextjs/          # ← 我们在这里加 agent-kanban 路由
│   ├── admin-ui/              # TanStack 参考（不用）
│   └── web-showcase/          # UI 组件展示（不用）
├── packages/
│   ├── ui/                    # @innate/ui (60+ shadcn 组件)
│   ├── admin-composites/      # PageContainer 等复合组件
│   ├── scene-catalog/         # 场景导航 + scene-blocks
│   ├── scene-specs/           # L3 场景规范 markdown
│   ├── skills-kit/            # Agent 技能系统
│   ├── tsconfig/              # 共享 TS 配置
│   └── utils/                 # 共享工具
├── docs/                      # 文档中心
├── tasks/                     # 任务规格
└── AGENTS.md                  # AI 入口（已存在！）
```

### admin-nextjs 关键配置

| 项 | 值 |
|----|-----|
| 框架 | Next.js 16 App Router |
| 端口 | 4002 |
| 路由前缀 | `/dashboard` |
| UI | @base-ui/react + @innate/ui |
| 样式 | Tailwind CSS 4.x |
| 数据库 | Prisma + SQLite (`prisma/dev.db`) |
| 认证 | better-auth (Google + 密码) |
| 拖拽 | @dnd-kit/core + sortable |
| 图表 | recharts + apexcharts |
| 表格 | @tanstack/react-table |

### 已有的 Prisma Schema

```prisma
// apps/admin-nextjs/prisma/schema.prisma (现有)
model User { ... }       // 已有用户
model Session { ... }    // 已有会话
model Account { ... }    // 已有 OAuth 账户
```

我们需要在此基础上**追加** agent-kanban 的模型。

---

## 三、实施方案：在 admin-nextjs 中新增 agent-kanban 模块

### 方案选择

| 方案 | 优点 | 缺点 | 推荐 |
|------|------|------|------|
| A. 在 admin-nextjs 加路由 | 零配置成本，复用全部基础设施 | 与现有 demo 路由混在一起 | ⭐ 推荐 |
| B. 新建 apps/agent-kanban | 隔离清晰 | 需复制大量配置 | 后期可拆 |
| C. 独立仓库 | 完全独立 | 重复造轮子 | ❌ |

**推荐方案 A**：在 `apps/admin-nextjs` 中新增 `/dashboard/kanban/*` 路由。后续如果需要独立，再用方案 B 拆出。

---

## 四、新增文件结构

```
apps/admin-nextjs/
├── prisma/
│   └── schema.prisma                    # 追加 5 个模型
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── kanban/                  # ★ 新增：看板主页
│   │   │   │   ├── page.tsx
│   │   │   │   └── _components/
│   │   │   │       ├── kanban-board.tsx
│   │   │   │       ├── kanban-column.tsx
│   │   │   │       ├── task-card.tsx
│   │   │   │       ├── task-detail-panel.tsx
│   │   │   │       ├── stats-bar.tsx
│   │   │   │       └── filter-bar.tsx
│   │   │   ├── agents/                  # ★ 新增：Agent 管理
│   │   │   │   ├── page.tsx
│   │   │   │   └── _components/
│   │   │   │       ├── agent-card.tsx
│   │   │   │       ├── agent-form.tsx
│   │   │   │       └── agent-load-view.tsx
│   │   │   ├── projects/                # ★ 新增：项目管理
│   │   │   │   ├── page.tsx
│   │   │   │   └── _components/
│   │   │   │       ├── project-card.tsx
│   │   │   │       └── add-project-dialog.tsx
│   │   │   └── ... (现有 demo 路由保留)
│   │   └── api/
│   │       ├── auth/[...all]/route.ts   # 现有
│   │       ├── workspaces/              # ★ 新增
│   │       │   ├── route.ts             # GET list, POST create
│   │       │   └── [id]/
│   │       │       ├── route.ts         # GET, PATCH, DELETE
│   │       │       ├── tasks/route.ts   # GET tasks (聚合)
│   │       │       ├── agents/route.ts  # GET agents
│   │       │       └── stats/route.ts   # GET stats
│   │       ├── projects/                # ★ 新增
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── sync/route.ts    # POST trigger sync
│   │       ├── tasks/                   # ★ 新增
│   │       │   └── [id]/
│   │       │       ├── route.ts         # GET task detail
│   │       │       └── assignments/
│   │       │           └── route.ts     # GET assignments
│   │       ├── agents/                  # ★ 新增
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── assignments/route.ts
│   │       ├── assignments/             # ★ 新增
│   │       │   └── route.ts             # POST create assignment
│   │       └── webhooks/                # ★ 新增
│   │           └── github/route.ts      # POST GitHub webhook
│   ├── components/
│   │   └── kanban/                      # ★ 新增：看板专用组件
│   │       ├── index.ts
│   │       ├── board-column.tsx
│   │       ├── draggable-card.tsx
│   │       └── assign-dialog.tsx
│   ├── lib/
│   │   ├── auth/                        # 现有
│   │   ├── prisma.ts                    # ★ 新增：Prisma 客户端单例
│   │   ├── kanban/                      # ★ 新增：业务逻辑
│   │   │   ├── queries.ts               # 数据库查询
│   │   │   ├── label-router.ts          # 标签匹配引擎
│   │   │   └── types.ts                 # 类型定义
│   │   └── github/                      # ★ 新增：GitHub 集成
│   │       ├── webhook.ts               # Webhook 处理
│   │       ├── sync.ts                  # Issue 同步
│   │       ├── verify-signature.ts      # HMAC 验签
│   │       └── client.ts                # Octokit 客户端
│   └── hooks/
│       ├── use-tasks.ts                 # ★ 新增
│       ├── use-agents.ts                # ★ 新增
│       └── use-assignments.ts           # ★ 新增
```

---

## 五、Prisma Schema 追加

在现有 `apps/admin-nextjs/prisma/schema.prisma` 基础上追加：

```prisma
// ═══════════════════════════════════════════════════
// Agent Kanban 模型
// ═══════════════════════════════════════════════════

model Workspace {
  id          String   @id @default(cuid())
  name        String
  description String   @default("")
  userId      String   @map("user_id")  // 关联 better-auth 用户
  user        User     @relation(fields: [userId], references: [id])
  projects    Project[]
  agents      Agent[]
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("kanban_workspace")
}

model Project {
  id            String   @id @default(cuid())
  workspaceId   String   @map("workspace_id")
  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  name          String
  repoOwner     String   @map("repo_owner")
  repoName      String   @map("repo_name")
  webhookSecret String?  @map("webhook_secret")
  syncStatus    String   @default("idle") @map("sync_status")  // idle | syncing | error
  lastSyncedAt  DateTime? @map("last_synced_at")
  tasks         Task[]
  createdAt     DateTime @default(now()) @map("created_at")

  @@unique([repoOwner, repoName])
  @@index([workspaceId])
  @@map("kanban_project")
}

model Task {
  id             String   @id @default(cuid())
  projectId      String   @map("project_id")
  project        Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  issueNumber    Int      @map("issue_number")
  title          String
  body           String   @default("")
  labels         String   @default("[]")  // JSON array
  status         String   @default("open")  // open | in_progress | closed
  githubAssignee String?  @map("github_assignee")
  githubUrl      String   @map("github_url")
  assignments    Assignment[]
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@unique([projectId, issueNumber])
  @@index([projectId])
  @@index([status])
  @@map("kanban_task")
}

model Agent {
  id                String   @id @default(cuid())
  workspaceId       String   @map("workspace_id")
  workspace         Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  name              String
  role              String
  description       String   @default("")
  modelName         String   @map("model_name")  // kimi-long-v1 | glm-4-flash | ...
  capabilityTags    String   @default("[]")  // JSON array
  skills            String   @default("[]")  // JSON array
  githubBotAccount  String?  @map("github_bot_account")
  status            String   @default("active")  // active | paused | offline
  assignments       Assignment[]
  createdAt         DateTime @default(now()) @map("created_at")

  @@index([workspaceId])
  @@map("kanban_agent")
}

model Assignment {
  id              String    @id @default(cuid())
  taskId          String    @map("task_id")
  task            Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  agentId         String    @map("agent_id")
  agent           Agent     @relation(fields: [agentId], references: [id], onDelete: Cascade)
  status          String    @default("pending")  // pending | running | done | failed
  modelUsed       String?   @map("model_used")
  resultSummary   String?   @map("result_summary")
  instruction     String?
  githubCommentId Int?      @map("github_comment_id")
  assignedAt      DateTime  @default(now()) @map("assigned_at")
  startedAt       DateTime? @map("started_at")
  completedAt     DateTime? @map("completed_at")

  @@index([taskId])
  @@index([agentId])
  @@index([status])
  @@map("kanban_assignment")
}
```

**同时更新 User 模型**，添加 workspace 关联：
```prisma
model User {
  // ... 现有字段
  workspaces Workspace[]  // ★ 新增
}
```

执行：
```bash
cd apps/admin-nextjs
pnpm db:generate   # 重新生成 Prisma Client
pnpm db:push       # 推送 schema 到 SQLite
```

---

## 六、分阶段实施计划

### Phase 0：环境准备（半天）

**任务**：在 admin-nextjs 中搭好骨架。

| # | 任务 | 验收 |
|---|------|------|
| 0.1 | 追加 Prisma schema（5 个模型 + User 关联） | `pnpm db:push` 成功 |
| 0.2 | 创建 `src/lib/prisma.ts` Prisma 客户端单例 | import 无报错 |
| 0.3 | 安装 `octokit` 依赖 | `pnpm add octokit` |
| 0.4 | 创建目录结构（kanban/agents/projects 页面 + api 路由） | 目录存在 |
| 0.5 | 在 sidebar 导航添加 "Agent Kanban" 入口 | 侧边栏可见 |

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@/generated/prisma"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
```

---

### Phase 1：数据模型 + API（2 天）

**目标**：实现 spec/openapi.yaml 中定义的所有端点。

#### 1.1 Workspace API

```typescript
// src/app/api/workspaces/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession()
  const workspaces = await prisma.workspace.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { projects: true, agents: true } } },
  })
  return NextResponse.json(workspaces)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  const body = await req.json()
  const workspace = await prisma.workspace.create({
    data: { ...body, userId: session.user.id },
  })
  return NextResponse.json(workspace, { status: 201 })
}
```

#### 1.2 跨项目任务聚合 API

```typescript
// src/app/api/workspaces/[id]/tasks/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const searchParams = req.nextUrl.searchParams
  const status = searchParams.get("status")
  const projectId = searchParams.get("projectId")
  const agentId = searchParams.get("agentId")
  const label = searchParams.get("label")

  const tasks = await prisma.task.findMany({
    where: {
      project: { workspaceId: params.id },
      ...(status && { status }),
      ...(projectId && { projectId }),
      ...(agentId && {
        assignments: { some: { agentId, status: { in: ["pending", "running"] } } },
      }),
    },
    include: {
      project: { select: { name: true, repoOwner: true, repoName: true } },
      assignments: {
        where: { status: { in: ["pending", "running"] } },
        include: { agent: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  })

  // label 过滤（Prisma 不支持 JSON 查询，在应用层做）
  const filtered = label
    ? tasks.filter((t) => JSON.parse(t.labels).includes(label))
    : tasks

  return NextResponse.json({ total: filtered.length, items: filtered })
}
```

#### 1.3 其他 API 端点

按 spec/openapi.yaml 实现：
- `POST /api/workspaces/[id]/projects` — 添加项目
- `POST /api/workspaces/[id]/agents` — 注册 Agent
- `POST /api/assignments` — 创建分配
- `GET /api/agents/[id]/assignments` — Agent 负载
- `GET /api/workspaces/[id]/stats` — 统计概览

**验收**：用 curl 或 Swagger UI 调通所有端点。

---

### Phase 2：GitHub 同步引擎（2 天）

**目标**：Webhook 接收 + Issue 同步。

#### 2.1 Webhook 接收端点

```typescript
// src/app/api/webhooks/github/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyGitHubSignature } from "@/lib/github/verify-signature"
import { syncIssueToTask } from "@/lib/github/sync"

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-hub-signature-256")
  const event = req.headers.get("x-github-event")
  const payload = await req.json()

  // 根据 repo 查找 project
  const repoFullName = payload.repository?.full_name
  const [owner, name] = repoFullName?.split("/") || []
  const project = await prisma.project.findFirst({
    where: { repoOwner: owner, repoName: name },
  })
  if (!project) return NextResponse.json({ error: "project not found" }, { status: 404 })

  // 验签
  if (!verifyGitHubSignature(await req.text(), signature, project.webhookSecret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 })
  }

  // 处理事件
  if (event === "issues") {
    await syncIssueToTask(project.id, payload.action, payload.issue)
  }

  return NextResponse.json({ ok: true })
}
```

#### 2.2 Issue 同步逻辑

```typescript
// src/lib/github/sync.ts
import { prisma } from "@/lib/prisma"

export async function syncIssueToTask(
  projectId: string,
  action: string,
  issue: any
) {
  const status = issue.state === "open" ? "open" : "closed"

  if (action === "opened" || action === "reopened") {
    await prisma.task.upsert({
      where: { projectId_issueNumber: { projectId, issueNumber: issue.number } },
      create: {
        projectId,
        issueNumber: issue.number,
        title: issue.title,
        body: issue.body || "",
        labels: JSON.stringify(issue.labels?.map((l: any) => l.name) || []),
        status,
        githubAssignee: issue.assignee?.login,
        githubUrl: issue.html_url,
      },
      update: { title: issue.title, body: issue.body, status, updatedAt: new Date() },
    })
  } else if (action === "closed") {
    await prisma.task.updateMany({
      where: { projectId, issueNumber: issue.number },
      data: { status: "closed" },
    })
  } else if (action === "labeled" || action === "unlabeled") {
    await prisma.task.updateMany({
      where: { projectId, issueNumber: issue.number },
      data: { labels: JSON.stringify(issue.labels?.map((l: any) => l.name) || []) },
    })
  }
}
```

#### 2.3 手动全量同步

```typescript
// src/app/api/projects/[id]/sync/route.ts
import { Octokit } from "octokit"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = await prisma.project.findUnique({ where: { id: params.id } })
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 })

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
  const issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
    owner: project.repoOwner,
    repo: project.repoName,
    state: "all",
    per_page: 100,
  })

  for (const issue of issues) {
    await syncIssueToTask(project.id, "opened", issue)
  }

  await prisma.project.update({
    where: { id: project.id },
    data: { syncStatus: "idle", lastSyncedAt: new Date() },
  })

  return NextResponse.json({ synced: issues.length })
}
```

**验收**：
- 在 GitHub Repo 创建 Issue → 看板实时出现
- Issue 打标签 → 看板卡片标签更新
- 手动触发同步 → 全量 Issue 导入

---

### Phase 3：看板 UI（3 天）

**目标**：跨项目 Kanban 看板，复用 @dnd-kit + @innate/ui。

#### 3.1 看板主页面

```tsx
// src/app/dashboard/kanban/page.tsx
import { KanbanBoard } from "./_components/kanban-board"
import { StatsBar } from "./_components/stats-bar"
import { FilterBar } from "./_components/filter-bar"

export default function KanbanPage() {
  return (
    <div className="flex flex-col gap-4 h-full">
      <StatsBar workspaceId={workspaceId} />
      <FilterBar />
      <KanbanBoard workspaceId={workspaceId} />
    </div>
  )
}
```

#### 3.2 Kanban 看板组件（复用 @dnd-kit）

```tsx
// src/app/dashboard/kanban/_components/kanban-board.tsx
"use client"
import { DndContext, DragEndEvent } from "@dnd-kit/core"
import { useTasks } from "@/hooks/use-tasks"
import { KanbanColumn } from "./kanban-column"

const COLUMNS = [
  { id: "open", title: "待处理" },
  { id: "in_progress", title: "进行中" },
  { id: "closed", title: "已完成" },
]

export function KanbanBoard({ workspaceId }: { workspaceId: string }) {
  const { tasks, isLoading } = useTasks(workspaceId)

  if (isLoading) return <div>Loading...</div>

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id)
    return acc
  }, {} as Record<string, typeof tasks>)

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-3 gap-4 h-full">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={grouped[col.id] || []}
          />
        ))}
      </div>
    </DndContext>
  )

  function handleDragEnd(e: DragEndEvent) {
    // 调用 PATCH /api/tasks/[id] 更新 status
  }
}
```

#### 3.3 任务卡片（复用 @innate/ui 的 Card + Badge）

```tsx
// src/app/dashboard/kanban/_components/task-card.tsx
import { Card } from "@innate/ui"
import { Badge } from "@innate/ui"

export function TaskCard({ task }: { task: Task }) {
  const labels = JSON.parse(task.labels)
  const assignment = task.assignments[0]

  return (
    <Card className="p-3 cursor-pointer hover:shadow-md transition">
      <div className="flex flex-wrap gap-1 mb-2">
        {labels.map((label: string) => (
          <Badge key={label} variant="secondary">{label}</Badge>
        ))}
      </div>
      <h3 className="font-medium text-sm mb-1">{task.title}</h3>
      <p className="text-xs text-muted-foreground">
        {task.project.repoOwner}/{task.project.repoName} #{task.issueNumber}
      </p>
      {assignment && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs">{assignment.agent.name}</span>
          <Badge variant={assignment.status === "running" ? "default" : "outline"}>
            {assignment.status}
          </Badge>
        </div>
      )}
    </Card>
  )
}
```

#### 3.4 其他 UI 组件

- `StatsBar` — 复用 scene-blocks 的 MetricCards 模式
- `FilterBar` — 复用 @innate/ui 的 Select + Input
- `TaskDetailPanel` — 复用 @innate/ui 的 Sheet（侧滑面板）
- `AssignDialog` — 复用 @innate/ui 的 Dialog + Select

**验收**：
- 看板三列显示，任务卡片可拖拽
- 点击卡片展开详情面板
- 筛选器（项目/Agent/标签）生效
- 统计栏数据准确

---

### Phase 4：Agent 管理 + 分配（2 天）

**目标**：Agent CRUD + 手动分配 + Label Router。

#### 4.1 Agent 管理页面

```tsx
// src/app/dashboard/agents/page.tsx
// 复用 @innate/ui 的 Card + Table + Dialog
// 展示所有 Agent，支持创建/编辑/删除
```

#### 4.2 Label Router

```typescript
// src/lib/kanban/label-router.ts
import { prisma } from "@/lib/prisma"

export async function findMatchingAgent(
  workspaceId: string,
  labels: string[]
): Promise<Agent | null> {
  const agents = await prisma.agent.findMany({
    where: { workspaceId, status: "active" },
  })

  // 找出 capabilityTags 与 task labels 有交集的 Agent
  // 匹配标签越多，优先级越高
  let bestAgent = null
  let bestScore = 0

  for (const agent of agents) {
    const tags = JSON.parse(agent.capabilityTags) as string[]
    const score = tags.filter((t) => labels.includes(t)).length
    if (score > bestScore) {
      bestScore = score
      bestAgent = agent
    }
  }

  return bestAgent
}

export async function autoAssign(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  })
  if (!task) return

  const labels = JSON.parse(task.labels) as string[]
  const agent = await findMatchingAgent(task.project.workspaceId, labels)

  if (agent) {
    await prisma.assignment.create({
      data: {
        taskId: task.id,
        agentId: agent.id,
        status: "pending",
        modelUsed: agent.modelName,
      },
    })
    // TODO: 触发 Agent 执行（Phase 5）
  }
}
```

#### 4.3 手动分配 API

```typescript
// src/app/api/assignments/route.ts
export async function POST(req: NextRequest) {
  const { taskId, agentId, instruction } = await req.json()

  // 幂等检查
  const existing = await prisma.assignment.findFirst({
    where: { taskId, status: { in: ["pending", "running"] } },
  })
  if (existing) {
    return NextResponse.json({ error: "task already assigned" }, { status: 409 })
  }

  const assignment = await prisma.assignment.create({
    data: { taskId, agentId, instruction, status: "pending" },
    include: { agent: true },
  })

  return NextResponse.json(assignment, { status: 201 })
}
```

**验收**：
- Agent 管理页面 CRUD 正常
- 创建带标签的任务 → 自动匹配 Agent → 创建 Assignment
- 手动分配 API 幂等

---

### Phase 5：Agent 执行集成（可选，2 天）

**目标**：通过 WorkBuddy Automation 触发 Agent 执行。

这一步不在 innate-fe-base 内实现，而是在 WorkBuddy 侧配置 Automation：

```yaml
# WorkBuddy Automation 配置（不在代码库中）
name: "前端 Agent 任务拾取器"
scheduleType: recurring
rrule: "FREQ=MINUTELY;INTERVAL=5"
modelId: kimi-long-v1
prompt: |
  1. 调用 GET /api/agents/[前端AgentId]/assignments?status=pending
  2. 取最早的一条，调用 PATCH 设为 running
  3. 读取 task.body，执行任务
  4. 完成后调用 PATCH 设为 done
  5. 在 GitHub Issue 下评论结果
```

**验收**：创建带 `frontend` 标签的 Issue → 5 分钟内前端 Agent 拾取并执行。

---

## 七、复用清单（不需要新写）

| 能力 | 来源 | 用法 |
|------|------|------|
| UI 组件 | `@innate/ui` | Card, Badge, Button, Dialog, Sheet, Select, Input, Table |
| 拖拽 | `@dnd-kit/core` | KanbanBoard 拖拽 |
| 页面壳 | `@innate/admin-composites` | PageContainer |
| 主题 | `next-themes` + CSS 变量 | light/dark 切换 |
| 认证 | `better-auth` | 保护 API 路由 |
| 数据库 | Prisma + SQLite | 数据持久化 |
| 图表 | recharts | StatsBar 统计图 |
| 表格 | @tanstack/react-table | Agent 列表 |
| Sidebar 导航 | `AppSidebar` | 添加 Kanban 入口 |
| AGENTS.md | 已存在 | 追加 agent-kanban 相关说明 |
| 场景规范模式 | scene-specs | 写 kanban-scene-spec.md |

---

## 八、需要新增的依赖

```bash
cd apps/admin-nextjs
pnpm add octokit          # GitHub API SDK
# @dnd-kit, @innate/ui, prisma, better-auth 已存在
```

仅一个新依赖。

---

## 九、工作量估算

| Phase | 任务 | 工时 | 依赖 |
|-------|------|------|------|
| Phase 0 | 环境准备 | 0.5 天 | 无 |
| Phase 1 | 数据模型 + API | 2 天 | Phase 0 |
| Phase 2 | GitHub 同步 | 2 天 | Phase 1 |
| Phase 3 | 看板 UI | 3 天 | Phase 1 |
| Phase 4 | Agent 管理 + 分配 | 2 天 | Phase 1 |
| Phase 5 | Agent 执行集成 | 2 天（可选） | Phase 4 |
| **合计** | | **9-11 天** | |

**MVP（Phase 0-3）= 5.5 天**，可演示完整看板 + GitHub 同步。

---

## 十、与 spec/ 文档的对齐

本计划实现了以下 spec 文档：

| Spec 文档 | 实现位置 | 状态 |
|-----------|---------|------|
| `spec/openapi.yaml` | `src/app/api/` | Phase 1 |
| `spec/models.md` (SQL) | `prisma/schema.prisma` | Phase 0 |
| `modules/sync-engine.md` | `src/lib/github/` | Phase 2 |
| `modules/task-orchestrator.md` | `src/lib/kanban/label-router.ts` | Phase 4 |
| `modules/dispatch-scheduler.md` | `src/app/api/assignments/route.ts` | Phase 4 |
| `modules/dashboard.md` | `src/app/dashboard/kanban/` | Phase 3 |
| `modules/agent-runtime.md` | WorkBuddy Automation（外部） | Phase 5 |

---

## 十一、关键决策记录

### 决策 1：在 admin-nextjs 加路由，而非新建 app

**理由**：
- 零配置成本，立即复用全部依赖和配置
- admin-nextjs 已有完整的认证、数据库、UI 组件链路
- 后续如需独立，可拆为 `apps/agent-kanban`

### 决策 2：用 Prisma 替代裸 SQL

**理由**：
- innate-fe-base 已用 Prisma，保持一致
- Prisma 提供类型安全，与 TypeScript 集成更好
- 我们的 spec/models.md 中的 SQL 可直接映射为 Prisma schema

### 决策 3：Label Router 用应用层匹配

**理由**：
- Prisma + SQLite 不支持 JSON 查询
- Agent 数量少（通常 < 10），全量加载 + 内存匹配性能足够
- 匹配逻辑简单（交集 + 计分），不需要数据库函数

### 决策 4：Agent 执行放在 WorkBuddy 侧

**理由**：
- innate-fe-base 是前端项目，不适合跑 AI 模型
- WorkBuddy 已有 Expert + Automation 机制
- API 层只负责创建 Assignment，Agent 通过 API 拾取任务

---

## 十二、下一步行动

1. **立即执行 Phase 0**：追加 Prisma schema + 创建目录结构（半天）
2. **Phase 1-3 并行**：API + 同步 + UI 可以分工同时推进
3. **Phase 4 在 MVP 后**：先跑通看板，再加 Agent 分配
4. **Phase 5 按需**：Agent 执行集成需要 WorkBuddy 侧配置

要我现在开始执行 Phase 0 吗？
