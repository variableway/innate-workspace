# Agent Kanban

多项目 AI Agent 统一看板。**产品家路径：`projects/agent-kanban/`**。

需求对齐计划：[`suggestion/08-requirements-aligned-plan.md`](suggestion/08-requirements-aligned-plan.md)  
架构（双 SoT）：[`shared-context/architecture.md`](shared-context/architecture.md)  
自用优先叠加（对照 [Todos.dev](https://todos.dev/docs)）：[`shared-context/self-first-architecture.md`](shared-context/self-first-architecture.md)

## 结构

```
projects/agent-kanban/
├── canvases/             # Cursor 分析画布 Git SSOT（用 task canvas:load 同步）
├── tools/canvas-load/    # list / sync / load → ~/.cursor/projects/.../canvases
├── docs/                 # 契约 SSOT（OpenAPI / schema / 状态机 / 事件）
├── modules/              # 模块 PRD（含 artifact / TIP / notifier）
├── packages/
│   ├── kanban-core/      # 4 列状态机、WIP、applyMove
│   └── kanban-ui/        # KanbanView / Board / Card …
├── frontend/             # Vite 看板 + Agents / Projects
├── backend-go/           # chi + SQLite
├── backend-node/         # Hono + SQLite
└── pnpm-workspace.yaml
```

## 看板 4 列

`backlog` → `in_progress` → `in_review` → `done`  
WIP：进行中 ≤ 5，待审核 ≤ 3。拖拽走 `PATCH /api/v1/tasks/{id}`。

Agent 完成（TIP complete / assignment → done）→ 任务进入 **`in_review`**（非直接 done）。

## 双真相源

| 维度 | SoT | 本地 |
|------|-----|------|
| 任务状态 | GitHub Issue | SQLite 镜像 |
| 执行过程 | Artifact（plan/note/summary…） | SQLite 主存，评论只回写摘要 |

## GitHub 同步优先级（1+2+3）

1. Issue `closed` → `done`
2. 存在 `status:*` label → 对应列（冲突取字典序第一个）
3. 无 label + running assignment → `in_progress`
4. 无 label + 本地已是 `in_progress`/`in_review` → **保留本地**
5. 否则 → `backlog`

看板 PATCH 成功后写回 GitHub `status:*` label；无 `GITHUB_TOKEN` 时跳过写回。

## 能力路线（摘要）

| 里程碑 | 内容 |
|--------|------|
| M1 | 同步 + 四列看板闭环 |
| M2 | Artifact 执行账本 |
| M3 | TIP 多 Agent（claim/handoff/…） |
| M4 | IM Notifier + Swimlane / 依赖可视化 |

## 分析画布（可保留 / 可加载）

需求分析结果画布已入库：[`canvases/requirements-gap-analysis.canvas.tsx`](canvases/requirements-gap-analysis.canvas.tsx)。

Cursor 只能从 `~/.cursor/projects/<workspace>/canvases/` 渲染旁路画布，因此用 **canvas-load** 同步：

```bash
task canvas:sync                          # 仓内 → Cursor
task canvas:load -- requirements-gap-analysis   # 同步并打印可打开路径
task canvas:status                        # 检查是否漂移
```

说明见 [`canvases/README.md`](canvases/README.md)、[`tools/canvas-load/README.md`](tools/canvas-load/README.md)。

## 手工看板（实现本系统时用）

按产品自己的列与审查闸来做实现：[backlog/PLAYBOOK.md](backlog/PLAYBOOK.md)（步骤×模块）、[backlog/BOARD.md](backlog/BOARD.md)（优先级）。下一张可动手的卡：**AK-001**。

## 快速开始

```bash
cd projects/agent-kanban
pnpm install
task dev:node          # 或 task dev:go
# 另开终端
task --taskfile frontend/Taskfile.yml dev
```

契约与实现细节见 [`docs/README.md`](docs/README.md)、[`docs/states/task-states.yaml`](docs/states/task-states.yaml)。
