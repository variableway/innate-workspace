# Agent Kanban — 多项目 AI Agent 统一看板

## 一、项目愿景

**让 GitHub Issues 成为 AI Agent 的任务队列，一个看板管理多个项目的所有 Agent 工作。**

不再需要人工在多个项目间切换、手动指派任务给不同 AI 模型——Agent Kanban 将 GitHub Issues 作为唯一任务源，通过标签自动路由到不同的 AI Agent（Kimi / GLM / Hunyuan 等），在一个统一看板上实时追踪所有任务的进度。

## 二、项目是什么

Agent Kanban 是一个轻量级的多项目任务编排层，架在 GitHub Issues 和 WorkBuddy AI Agent 之间：

| 角色 | 说明 |
|------|------|
| **GitHub Issues** | 任务的唯一真相源（Source of Truth）。每个 Issue = 一个任务 |
| **GitHub Labels** | 分配路由规则。`frontend` → Kimi, `backend` → GLM, `data` → Hunyuan |
| **Agent Kanban Dashboard** | 统一的跨项目看板，聚合所有 Repo 的 Issue，支持按项目/标签/Agent/状态筛选 |
| **WorkBuddy Experts** | AI Agent 执行体，每个 Expert 绑定一个模型，通过 Skill 工具链执行任务 |
| **SQLite 本地缓存** | 聚合存储层，缓存所有项目的 Issue、Agent、分配记录 |

## 三、核心工作流

```
开发者创建 GitHub Issue → 打上标签(frontend/backend/data)
    → webhook 触发同步 → 看板实时显示
    → Label Router 匹配 Agent → 自动分配
    → Agent 拉取 Issue Body → 执行任务(write code / fix bug / generate report)
    → Agent 在 Issue 下评论结果 → 关闭 Issue
    → 看板状态自动更新
```

## 四、解决的问题

1. **跨项目看板**：一个页面看到所有 GitHub Repo 的 Issue 和 Agent 执行进度
2. **自动模型路由**：不需要记住"这个任务该用哪个模型"，标签自动匹配
3. **任务-模型解耦**：同一个项目里前端任务用 Kimi、后端任务用 GLM，相互独立
4. **状态可视化**：每个任务的状态（待处理→执行中→已完成）在看板上实时可见
5. **可追溯**：每次 Agent 执行都有 Assignment 记录，谁用什么模型、花了多长时间、产出什么

## 五、模块总览

```
agent-kanban/
├── shared-context/          ← 项目级共享上下文（你在这里）
│   ├── README.md            # 项目概述、目的、模块结构
│   └── architecture.md      # 系统架构、数据流、技术选型
├── spec/                    ← API 规范与数据模型
│   ├── openapi.yaml         # OpenAPI 3.0 规范
│   ├── types.md             # TypeScript 类型定义
│   └── models.md            # 数据模型设计（ER 图 + SQL）
└── modules/                 ← 各模块 PRD
    ├── sync-engine.md       # 同步引擎
    ├── task-orchestrator.md # 任务编排引擎
    ├── dispatch-scheduler.md# 分配调度层
    ├── agent-runtime.md     # Agent 执行层
    └── dashboard.md         # 统一看板
```

## 六、技术栈

| 层 | 技术选型 |
|----|---------|
| **同步引擎** | Node.js + GitHub Webhooks + Octokit |
| **后端 API** | Node.js + Hono (轻量 Web 框架) |
| **本地存储** | SQLite (better-sqlite3) |
| **前端看板** | React + TypeScript + TanStack Query |
| **Agent 执行** | WorkBuddy Experts + Automations |
| **CI/CD** | GitHub Actions |

## 七、适用范围

- 使用 GitHub Issues 管理任务的多项目团队
- 希望将日常开发任务自动分配给不同 AI 模型处理的团队
- 需要统一监控多个 AI Agent 工作进度的场景
- 不适用于：不使用 GitHub 的团队、单个项目（WorkBuddy 内置看板已够用）
