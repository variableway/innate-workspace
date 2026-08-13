# Agent Kanban — 多项目 AI Agent 统一看板

> **产品家**：本目录 `projects/agent-kanban/` 是唯一实现与契约入口。
> 看板列：`backlog | in_progress | in_review | done`（WIP 与同步规则见 [`../docs/states/task-states.yaml`](../docs/states/task-states.yaml)）。
> 需求对齐计划：[`../suggestion/08-requirements-aligned-plan.md`](../suggestion/08-requirements-aligned-plan.md)。
> 手工实现看板：[backlog/PLAYBOOK.md](../backlog/PLAYBOOK.md)。

## 一、项目愿景

**让 GitHub Issues 成为 AI Agent 的任务队列，一个看板管理多个项目、多个 Agent 的计划、执行与留痕。**

开发者在 GitHub 上开 Issue；系统按标签路由到合适 Agent；执行过程写入可审查的 Artifact（计划 / 笔记 / 摘要）；多 Agent 通过统一交互协议协作；完成与失败可推送到 IM。参考 [Backlog.md](https://github.com/MrLesk/Backlog.md) 的「人审三关 + Markdown 账本」，但状态真相源仍是 GitHub，以支持跨仓聚合。

## 二、项目是什么

| 角色 | 说明 |
|------|------|
| **GitHub Issues** | **状态**唯一真相源。每个 Issue ≈ 一个任务（可挂子任务） |
| **GitHub Labels** | 路由规则 + `status:*` 列映射 |
| **Artifact Store** | **执行过程**真相源：plan / note / log / summary / decision |
| **TIP** | Task Interaction Protocol：异构 Agent 的 claim / progress / handoff / complete |
| **Dashboard** | 跨项目看板 + 计划面板 + Agent 负载 + 分配时间线 |
| **Notifier** | 完成/失败/待审 → Slack / 飞书 / 钉钉 / 企业微信 / 通用 webhook |
| **SQLite** | 缓存、聚合、Artifact 索引、投递日志 |

## 三、核心工作流

```
开发者创建 GitHub Issue → 打标签(frontend/backend/…)
  → Sync → 看板显示
  → Label Router 匹配 Agent → Assignment
  → Agent TIP.claim → 写 artifact.plan（可选人工批准）
  → 执行并写 note/log → TIP.complete
  → 任务进入 in_review → Notifier 推 IM
  → 人工确认 → done / close Issue
```

## 四、解决的问题

1. **跨项目看板**：多 Repo Issue + Agent 进度一屏可见
2. **自动模型路由**：标签匹配 Agent，亦可手动覆盖
3. **执行可复盘**：计划与摘要不丢（对齐 Backlog.md 账本能力）
4. **多 Agent 协作**：协议化 handoff / 子任务，而非私有约定
5. **结果可达**：完成信息进 IM，不只留在看板里
6. **可追溯**：Assignment + Artifact + Audit 全链路

## 五、模块总览

```
projects/agent-kanban/
├── shared-context/          ← 愿景与架构（你在这里）
│   ├── README.md
│   └── architecture.md
├── docs/                    ← 契约 SSOT（schema / openapi / events / states）
├── modules/                 ← 模块 PRD
│   ├── sync-engine.md
│   ├── task-orchestrator.md
│   ├── dispatch-scheduler.md
│   ├── agent-runtime.md
│   ├── agent-protocol.md    ← TIP
│   ├── review-gates.md      ← Spec/Plan/Code 闸 + 协议 Skill + Bootstrap
│   ├── artifact-store.md    ← 执行账本
│   ├── notifier.md          ← IM 推送
│   └── dashboard.md
├── suggestion/
│   └── 08-requirements-aligned-plan.md  ← 需求对齐实施计划
├── packages/ · frontend/ · backend-go/ · backend-node/
└── references/              ← AgentTODO / LobsterBoard（空位可再 clone）
```

## 六、技术栈

| 层 | 技术选型 |
|----|---------|
| **契约** | `docs/`（SQL / OpenAPI / events / 状态机 YAML） |
| **同步** | GitHub Webhooks + Octokit / go-github + 轮询兜底 |
| **后端** | Node (Hono) 与 Go (chi) 双实现 |
| **存储** | SQLite |
| **前端** | Vite + React + TanStack Query + kanban-ui |
| **Agent** | TIP Adapter（WorkBuddy / CLI / MCP / Webhook） |
| **通知** | Notification Router + 渠道适配器 |

## 七、适用范围

- 用 GitHub Issues 管任务、需要多仓聚合与多 Agent 调度的团队
- 需要执行计划可审、过程可复盘、完成可推 IM 的场景
- **不适用于**：完全不用 GitHub、且只要单仓 Markdown 看板（可直接用 Backlog.md）
