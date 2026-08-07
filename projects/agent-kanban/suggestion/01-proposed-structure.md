# Proposed Structure — AI-Friendly 文档结构

> 目标：让任何 AI Agent 打开项目后，能在最少 token 内获取完成任务所需的精确上下文。

## 一、设计原则

| 原则 | 说明 |
|------|------|
| **单一真相源 (SSOT)** | 每个事实只在一处定义，其他地方用 `$ref` 或链接引用 |
| **机器可解析优先** | 契约用 YAML/JSON，不用 ASCII art；状态机用 YAML 定义 |
| **显式元数据** | 每个文件有 front-matter：`read_when`, `audience`, `depends_on`, `status` |
| **分层加载** | AI 先读入口 → 再读概览 → 按需读细节，避免一次加载全部 |
| **稳定 ID** | 需求、用户故事、功能点都有 ID（`REQ-001`, `US-1`），可跨文件引用 |
| **示例驱动** | API、数据结构都带 `examples:`，AI 可直接模仿 |

---

## 二、建议的新目录结构

```
agent-kanban/
│
├── AGENTS.md                         ★ 新增：AI 入口文件（最高优先级）
│
├── shared-context/
│   ├── README.md                     项目概述（保留）
│   ├── architecture.md               系统架构（保留）
│   ├── glossary.md                   ★ 新增：术语表
│   └── decisions/                    ★ 新增：决策记录 (ADR)
│       ├── 001-github-as-source-of-truth.md
│       ├── 002-label-based-routing.md
│       ├── 003-sqlite-for-aggregation.md
│       └── 004-workbuddy-as-agent-runtime.md
│
├── spec/
│   ├── openapi.yaml                  ★ 升级为 canonical API 源（加 examples）
│   ├── schema.sql                    ★ 新增：canonical SQL（从 models.md 抽出）
│   ├── types.ts                      ★ 新增：canonical TS 类型（从 openapi 生成）
│   ├── states/                       ★ 新增：状态机 YAML 定义
│   │   ├── task-states.yaml
│   │   └── assignment-states.yaml
│   └── events.yaml                   ★ 新增：事件契约（webhook 事件类型）
│
├── modules/
│   ├── README.md                     ★ 新增：模块索引 + 依赖图
│   ├── sync-engine/
│   │   ├── README.md                 模块概述
│   │   ├── contract.yaml             ★ 新增：输入/输出契约
│   │   ├── prd.md                    用户故事 + 验收标准
│   │   └── notes.md                  实现细节 + 边界场景
│   ├── task-orchestrator/
│   │   ├── README.md
│   │   ├── contract.yaml
│   │   ├── prd.md
│   │   └── notes.md
│   ├── dispatch-scheduler/
│   │   ├── README.md
│   │   ├── contract.yaml
│   │   ├── prd.md
│   │   └── notes.md
│   ├── agent-runtime/
│   │   ├── README.md
│   │   ├── contract.yaml
│   │   ├── prd.md
│   │   └── notes.md
│   └── dashboard/
│       ├── README.md
│       ├── contract.yaml
│       └── prd.md
│
└── suggestion/                       本评审目录
```

---

## 三、AGENTS.md — AI 入口文件规范

这是最重要的新增文件。位置：项目根目录。

### 作用
- AI Agent 进入项目时**第一个读的文件**
- 告诉 AI：项目是什么、读哪些文件、读的顺序、当前状态

### 模板

```markdown
---
audience: ai-agent
priority: read-first
---

# AGENTS.md

## 项目一句话
多项目 AI Agent 统一看板：GitHub Issues 作任务源，Label 路由到不同 AI 模型。

## 阅读顺序（按需加载）
1. **必读**：本文件 + `shared-context/README.md`
2. **理解架构**：`shared-context/architecture.md` + `shared-context/glossary.md`
3. **理解数据**：`spec/schema.sql`（canonical）→ `spec/openapi.yaml`
4. **实现某模块**：`modules/<module>/README.md` → `contract.yaml` → `prd.md`

## 单一真相源 (SSOT) 映射
| 事实 | Canonical 文件 | 其他格式 |
|------|---------------|---------|
| API 定义 | `spec/openapi.yaml` | types.ts 自动生成 |
| 数据库 Schema | `spec/schema.sql` | models.md 仅作 ER 图说明 |
| 状态机 | `spec/states/*.yaml` | PRD 中的 ASCII 图作示意 |
| 术语定义 | `shared-context/glossary.md` | — |

## 决策记录
所有"为什么这样选"的问题，查 `shared-context/decisions/`。
关键决策：001(GitHub SoT) / 002(Label 路由) / 003(SQLite) / 004(WorkBuddy Runtime)

## 当前实现状态
| 模块 | 状态 | 入口文件 |
|------|------|---------|
| sync-engine | planned | modules/sync-engine/README.md |
| task-orchestrator | planned | modules/task-orchestrator/README.md |
| dispatch-scheduler | planned | modules/dispatch-scheduler/README.md |
| agent-runtime | planned | modules/agent-runtime/README.md |
| dashboard | planned | modules/dashboard/README.md |

## AI 协作约定
- 修改 API 时，**只改 openapi.yaml**，types.ts 由代码生成
- 修改数据库时，**只改 schema.sql**，并在 models.md 同步 ER 图
- 新增技术决策时，在 `decisions/` 下新建 ADR 文件
- 引用需求时用稳定 ID：`REQ-001`, `US-3`, `F-7`
```

---

## 四、文件 Front-Matter 规范

每个 `.md` 文件顶部加 YAML front-matter，让 AI 快速判断是否需要读：

```yaml
---
audience: ai-agent | human | both
read_when:
  - implementing X
  - debugging Y
depends_on:
  - spec/openapi.yaml
  - shared-context/glossary.md
status: draft | planned | implemented | deprecated
canonical: false  # true 表示这是该事实的权威源
---
```

### 示例：dispatch-scheduler/README.md

```yaml
---
audience: both
read_when:
  - implementing dispatch logic
  - debugging assignment failures
depends_on:
  - spec/states/assignment-states.yaml
  - spec/openapi.yaml#/paths/~1assignments
status: planned
canonical: false
---

# Dispatch Scheduler

## 一句话
接收匹配结果，创建 Assignment，控制 Agent 并发，触发执行。

## 契约
- 输入：`MatchResult` (定义见 contract.yaml)
- 输出：`Assignment` (定义见 spec/openapi.yaml)
- 依赖状态机：spec/states/assignment-states.yaml

## 关键约束
- 单 Agent 最大并发：3 (可配置)
- 失败重试上限：2 次
- pending 超时告警：30 分钟

## 实现入口
详见 `prd.md` (需求) 和 `notes.md` (实现细节)。
```

---

## 五、Contract YAML 规范

每个模块有一个 `contract.yaml`，明确定义输入/输出，AI 可直接用于生成接口代码。

### 示例：dispatch-scheduler/contract.yaml

```yaml
module: dispatch-scheduler
version: 1.0.0

input:
  - name: MatchResult
    type: object
    schema:
      $ref: ../../spec/openapi.yaml#/components/schemas/MatchResult
    source: task-orchestrator

output:
  - name: Assignment
    type: object
    schema:
      $ref: ../../spec/openapi.yaml#/components/schemas/Assignment
    consumers:
      - agent-runtime
      - dashboard

events_emitted:
  - name: assignment.created
    payload: { assignmentId: string }
  - name: assignment.started
    payload: { assignmentId: string, agentId: string }
  - name: assignment.completed
    payload: { assignmentId: string, status: done|failed }

events_consumed:
  - name: match.found
    from: task-orchestrator

config:
  max_concurrency_per_agent: 3
  retry_max: 2
  retry_delay_seconds: 300
  pending_timeout_minutes: 30
  running_timeout_hours: 2
```

---

## 六、状态机 YAML 规范

替代 PRD 中的 ASCII 状态图，AI 可直接生成状态机代码。

### 示例：spec/states/assignment-states.yaml

```yaml
entity: Assignment
initial: pending
transitions:
  - from: pending
    to: running
    event: agent_pickup
    guard: "agent.status == 'active' && agent.running_count < agent.max_concurrency"
    action: "set started_at = now()"
  
  - from: running
    to: done
    event: execute_success
    action: "set completed_at = now(), result_summary = payload.result"
  
  - from: running
    to: pending
    event: execute_failed
    guard: "retry_count < retry_max"
    action: "increment retry_count, set delay = 300s"
  
  - from: running
    to: failed
    event: execute_failed
    guard: "retry_count >= retry_max"
    action: "set completed_at = now()"

  - from: running
    to: failed
    event: timeout
    guard: "now() - started_at > running_timeout"
```

---

## 七、ADR (决策记录) 规范

### 模板：shared-context/decisions/00X-title.md

```markdown
---
adr: 001
status: accepted
date: 2026-08-02
---

# ADR-001: GitHub Issues 作为唯一真相源

## 背景
系统需要管理多个项目的任务，任务需要被 AI Agent 处理。

## 决策
以 GitHub Issues 作为任务的唯一真相源（Source of Truth）。
本地 SQLite 仅作聚合缓存，不作为权威数据。

## 理由
1. GitHub Issues 已是团队现有工作流
2. Webhook 提供实时事件，无需自建任务创建 API
3. Issue 的 label/assignee/comment 天然映射到任务路由/分配/结果回写
4. 避免数据漂移：单一写入点

## 备选方案（已否决）
- **自建任务表**：需要重复实现 CRUD + 权限 + 通知，且与 GitHub 数据双写
- **TAPD/Jira**：增加外部依赖，且与代码仓库距离远

## 后果
- 优点：零数据漂移，天然支持团队协作
- 缺点：依赖 GitHub 可用性；Issue body 是 Markdown，结构化字段需用 label 模拟
```

---

## 八、Glossary 规范

### shared-context/glossary.md

```markdown
# 术语表

| 术语 | 定义 | Canonical 文件 |
|------|------|---------------|
| Workspace | 多项目聚合容器，1:N Project | spec/openapi.yaml#/Workspace |
| Project | 一个 GitHub Repo 的映射 | spec/openapi.yaml#/Project |
| Task | 一个 GitHub Issue 的本地缓存 | spec/openapi.yaml#/Task |
| Agent | AI 执行体，绑定模型 + Skills | spec/openapi.yaml#/Agent |
| Assignment | Task ↔ Agent 的分配记录 | spec/openapi.yaml#/Assignment |
| MatchResult | Label Router 的输出，含 taskId + agentId | modules/task-orchestrator/contract.yaml |
| Label Router | 根据 task.labels 匹配 agent.capability_tags 的引擎 | modules/task-orchestrator/README.md |
```

---

## 九、模块索引规范

### modules/README.md

```markdown
# 模块索引

## 依赖图
\`\`\`
sync-engine ──→ task-orchestrator ──→ dispatch-scheduler ──→ agent-runtime
     │                                                              │
     └────────────── dashboard ←────────────────────────────────────┘
\`\`\`

## 模块清单
| 模块 | 职责 | 状态 | 入口 |
|------|------|------|------|
| sync-engine | GitHub webhook 接收 + Issue 同步 | planned | ./sync-engine/README.md |
| task-orchestrator | 跨项目聚合 + Label 匹配 | planned | ./task-orchestrator/README.md |
| dispatch-scheduler | 并发控制 + 分配 + 重试 | planned | ./dispatch-scheduler/README.md |
| agent-runtime | AI 执行 + 结果回写 | planned | ./agent-runtime/README.md |
| dashboard | 统一 Kanban UI | planned | ./dashboard/README.md |

## 模块间契约
所有模块间数据流通过 `contract.yaml` 定义，详见各模块目录。
```

---

## 十、改造收益预估

| 指标 | 现状 | 改造后 |
|------|------|--------|
| AI 找到入口所需 token | ~2000 (随机读) | ~200 (读 AGENTS.md) |
| 数据模型一致性风险 | 高（3 处定义） | 低（1 处 canonical） |
| 状态机实现准确度 | 依赖 AI 理解 ASCII | 可直接生成代码 |
| 决策可追溯性 | 无 | ADR 完整记录 |
| 跨文件引用准确度 | 软链接 | $ref 硬引用 |

---

## 十一、实施优先级

| 优先级 | 任务 | 工作量 |
|--------|------|--------|
| P0 | 创建 AGENTS.md | 1 小时 |
| P0 | 抽出 schema.sql 为 canonical | 30 分钟 |
| P0 | 为 openapi.yaml 加 examples | 1 小时 |
| P1 | 创建 glossary.md | 30 分钟 |
| P1 | 把 PRD 拆分为 README + contract + prd + notes | 3 小时 |
| P1 | 状态机转 YAML | 1 小时 |
| P2 | 写 4 个 ADR | 2 小时 |
| P2 | 为所有 .md 加 front-matter | 1 小时 |
