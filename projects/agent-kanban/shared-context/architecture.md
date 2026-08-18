# Agent Kanban 系统架构

> 对齐需求（2026-08-13）：GitHub 完全同步 · 多 Agent 分配 · 执行文档留存 ·
> 计划/分配可视化 · 多 Agent 协作协议 · IM 推送。
> 参考：[Backlog.md](https://github.com/MrLesk/Backlog.md)（Markdown 账本 + Spec→Plan→Code 三关）。
>
> **自用优先叠加**（对照 Todos.dev，看板为家、GitHub 改为可选同步、新增 Worker）：
> [`self-first-architecture.md`](./self-first-architecture.md)。本文件仍是 M1–M4 契约骨架。

## 一、模块分层架构

```
┌──────────────────────────────────────────────────────────────┐
│                     接入层 (Portal)                           │
│   Web Dashboard  │  CLI / MCP  │  (可选) Chrome Extension     │
│   看板 · Agent 负载 · Plan 面板 · 依赖图 · Assignment 时间线   │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                  同步引擎 (Sync Engine)                       │
│  GitHub Webhook  │  Polling Fallback  │  Bidirectional Sync │
│  Conflict Resolver（状态优先级栈，见 docs/states）             │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│               任务编排引擎 (Task Orchestrator)                 │
│  Aggregator  │  Status Machine  │  Label Router              │
│  子任务分解  │  优先级队列  │  未匹配高亮                      │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│              分配调度层 (Dispatch Scheduler)                   │
│  Match Engine  │  Agent Pool  │  Concurrency / Retry / Handoff│
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│     Agent Runtime + TIP (Task Interaction Protocol)           │
│  Adapter: WorkBuddy / CLI / MCP / Webhook                     │
│  claim · heartbeat · progress · ask_human · handoff · complete│
└───────────────┬────────────────────────────┬─────────────────┘
                │                            │
┌───────────────▼──────────────┐  ┌──────────▼─────────────────┐
│   Artifact Store（过程 SoT）  │  │  Notifier（IM 出口）         │
│   plan / note / log / summary│  │  Slack / 飞书 / 钉钉 / 企微  │
│   decision · 可选仓内镜像     │  │  + 通用 outbound webhook     │
└───────────────┬──────────────┘  └──────────┬─────────────────┘
                │                            │
┌───────────────▼────────────────────────────▼─────────────────┐
│                     数据 & 状态层                              │
│  SQLite (缓存/索引/聚合)                                       │
│  GitHub Issues = 状态 SoT    Artifact = 执行过程 SoT           │
│  Assignment Log  │  Audit Log  │  Notification Log            │
└──────────────────────────────────────────────────────────────┘
```

## 二、双真相源 (Dual Source of Truth)

| 维度 | 真相源 | 本地角色 | 回写目标 |
|------|--------|----------|----------|
| **任务状态**（列、开闭、label） | GitHub Issue | SQLite 镜像 + 聚合 | Issue state / `status:*` labels / assignee |
| **执行过程**（计划、笔记、日志、摘要） | Artifact Store | SQLite 主存 + 可选仓内 `docs/runs/` 镜像 | Issue comment / PR body 链接 |

**冲突原则**：状态冲突以 GitHub 优先级栈为准（见 README / `docs/states/task-states.yaml`）。过程文档以 Artifact 版本为准；GitHub 上仅保留摘要评论与链接，避免大段正文双写漂移。

## 三、核心数据流

```
GitHub Issue 创建/更新
    │
    ▼
webhook → Sync Engine → SQLite task
    │
    ▼
Task Orchestrator：解析 labels / 可选拆子任务
    │
    ├─ 匹配 Agent ──→ Dispatch：创建 Assignment (pending)
    │                      │
    │                      ▼
    │                 TIP: Agent claim → running
    │                      │
    │                      ├─ artifact.plan   （审查关 #2，可人工批准）
    │                      ├─ artifact.note/log
    │                      └─ complete / fail / handoff
    │                              │
    │                              ▼
    │                      task → in_review（人工闸）
    │                      Notifier → IM
    │                      Sync：Issue comment + status label
    │
    └─ 未匹配 ──→ 看板「待分配」──→ 人工分配
```

借鉴 Backlog.md 的人审检查点，协议上拆成阶段（详见 [`modules/review-gates.md`](../modules/review-gates.md)）：

1. **Spec 闸**：Issue body 为需求 SoT；`artifact.kind=spec` 为 AC 叠加；`submit_spec` / 欠定则 `ask_human`
2. **Plan 闸**：`submit_plan` 后 **必须停**；人批或策略 skip 后才 `implement`（协议 Skill `kanban.plan` ≠ 领域 Skill）
3. **Code 闸**：`complete` → 列 `in_review` + PR；可选先 `handoff` 给 Verify Agent
4. **指令入口**：AGENTS.md / MCP 由 Adapter 维护，只允许指向 `GET bootstrap` 与 `kanban://workflow/*`

## 四、数据模型 (ER 概要)

```
Workspace ──1:N──→ Project ──1:N──→ Task ──1:N──→ TaskEdge (依赖/父子)
    │                                   │
    │                                   │ 1:N
    │                                   ▼
    │                              Assignment ──1:N──→ Artifact
    │                                   │                 │
    └──1:N──→ Agent ←──N:M──────────────┘                 │
              │                                           │
              └── TIP envelopes (claim/progress/…)        │
                                                          ▼
                                              NotificationDelivery
```

详细模型见 [`docs/schema.sql`](../docs/schema.sql)、[`spec/models.md`](../spec/models.md)。

## 五、技术选型理由

| 决策 | 选择 | 理由 |
|------|------|------|
| **状态 SoT** | GitHub Issues | 开发者既有工作流；跨仓统一；天然开闭与 label |
| **过程 SoT** | Artifact（SQLite + 可选 Markdown 镜像） | 借 Backlog.md 留痕能力，又不取代 Issue 状态 |
| **路由** | GitHub Labels ↔ capability_tags | 零额外 UI 即可自动分配 |
| **协作** | TIP 信封协议 | 异构 Agent（WorkBuddy / Cursor / CLI）统一接入 |
| **本地存储** | SQLite | 零配置、单文件、够用 |
| **通知** | Notification Router + 渠道适配器 | 同一事件多 IM，不绑死单一 webhook URL |
| **API** | Hono / chi（双后端） | 契约在 `docs/`，语言可切换 |
| **Agent 标识** | GitHub Bot Account（可选） | Issue assignee 可见执行者 |

## 六、关键设计原则

1. **状态 SoT = GitHub，过程 SoT = Artifact**：看板可写状态（PATCH），成功后必须回写 GitHub；执行细节进 Artifact，不只堆在 Issue body。
2. **标签即路由，看板可覆盖**：自动匹配优先；手动分配与拖拽改列合法，并回写 `status:*`。
3. **Agent 经 TIP 接入，运行时无状态**：Agent 不私藏任务状态；claim 后从 Task + Artifact 拉上下文。
4. **一 Assignment 一主 Agent，协作靠 handoff/子任务**：禁止隐式抢占；handoff 必须带 `context_ref`（artifact id）。
5. **完成默认进 in_review**：Agent done ≠ Issue closed；人工/策略确认后再 done。
6. **渐进增强**：先 webhook 同步 + 单 Agent；再 Artifact；再 TIP/handoff；再多 IM。
7. **事件驱动**：模块间只依赖 `docs/events.yaml` 中的内部事件，便于双后端对齐。
