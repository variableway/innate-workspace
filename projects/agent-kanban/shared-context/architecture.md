# Agent Kanban 系统架构

## 一、模块分层架构

```
┌──────────────────────────────────────────────────────┐
│                    接入层 (Portal)                     │
│   Web Dashboard  │  Chrome Extension  │  CLI         │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│                  同步引擎 (Sync Engine)               │
│  GitHub Webhook Receiver  │  Polling Fallback        │
│  Bidirectional Sync  │  Conflict Resolver            │
│  事件: issue.open / close / update / labeled          │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│               任务编排引擎 (Task Orchestrator)         │
│  Task Aggregator  │  Status Machine  │  Label Router │
│  跨项目聚合 → 状态流转 → 标签匹配 → 优先级队列        │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│              分配调度层 (Dispatch Scheduler)           │
│  Match Engine  │  Agent Pool  │  Concurrency Mgr     │
│  label → Agent 匹配 → 模型选择 → 并发控制              │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│               Agent 执行层 (Agent Runtime)             │
│  WorkBuddy Expert  │  Skill Toolchain  │  Prompt     │
│  每个 Agent = { identity, model, skills, memory }     │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│            数据 & 状态层 (Data & State)                │
│  SQLite (cache)  │  GitHub Issues (source of truth)   │
│  Assignment Log  │  Agent Metrics                     │
└──────────────────────────────────────────────────────┘
```

## 二、核心数据流

```
GitHub Issue 创建/更新
    │
    ▼
webhook → Sync Engine → 写入 SQLite (task 表)
    │
    ▼
Task Orchestrator 检测新 task → 解析 labels
    │
    ├─ labels 匹配到 Agent capability_tags ──→ Dispatch Scheduler
    │                                              │
    │                                              ▼
    │                                        创建 Assignment
    │                                        更新 task.status = in_progress
    │                                        触发 Agent 执行
    │                                              │
    │                                              ▼
    │                                        Agent Runtime 拉取 task.body
    │                                        执行 (skills + model)
    │                                              │
    │                                              ▼
    │                                        结果回写 GitHub Issue (comment + close)
    │                                        更新 assignment.status = done
    │                                        更新 task.status = closed
    │
    └─ labels 未匹配 ──→ 看板上显示 "待分配" ──→ 人工介入
```

## 三、数据模型 (ER 概要)

```
Workspace ──1:N──→ Project ──1:N──→ Task
    │                                   │
    │                                   │ N:M
    │                                   │
    └──1:N──→ Agent ←──N:M──→ Assignment
```

详细数据模型见 [spec/models.md](../spec/models.md)。

## 四、技术选型理由

| 决策 | 选择 | 理由 |
|------|------|------|
| **Truth Source** | GitHub Issues | 零额外存储成本，开发者已有的工作流，天然的状态机 |
| **路由机制** | GitHub Labels | 标签即路由规则，直观、可版本控制、GitHub 原生支持 |
| **本地存储** | SQLite | 零配置、单文件、够用、与 WorkBuddy 技术栈一致 |
| **API 框架** | Hono | 轻量、TypeScript-first、边缘部署友好 |
| **Agent 执行** | WorkBuddy Experts | 复用已有的 Agent 框架，Skill 生态丰富 |
| **Agent 标识** | GitHub Bot Account | 每个 Agent 一个 Bot，issue.assignee 即可见谁在处理 |

## 五、关键设计原则

1. **GitHub Issues 是唯一真相源**：所有状态变更最终回写到 Issue，本地 SQLite 仅做缓存和聚合
2. **标签即路由**：不引入额外的任务分配 UI，利用 GitHub 已有的 Label 机制
3. **Agent 无状态**：Agent 不保存任务状态，每次从 Issue Body 读取上下文
4. **渐进增强**：先支持 webhook 实时同步，再补充 polling 兜底；先支持 label 路由，再扩展规则引擎
5. **看板只读聚合**：看板不直接修改任务，所有操作通过 GitHub API 间接完成
