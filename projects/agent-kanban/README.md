# Agent Kanban

多项目 AI Agent 统一看板。**产品家路径：`projects/agent-kanban/`**（勿再使用仓库根目录的 `agent-kanban/` 副本）。

## 结构

```
projects/agent-kanban/
├── docs/                 # 契约 SSOT（OpenAPI / schema / 状态机）
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

## GitHub 同步优先级（1+2+3）

1. Issue `closed` → `done`
2. 存在 `status:*` label → 对应列（冲突取字典序第一个）
3. 无 label + running assignment → `in_progress`
4. 无 label + 本地已是 `in_progress`/`in_review` → **保留本地**
5. 否则 → `backlog`

看板 PATCH 成功后写回 GitHub `status:*` label；无 `GITHUB_TOKEN` 时跳过写回。

Agent 完成（assignment → done）→ 任务进入 `in_review`（非直接 done）。

## 快速开始

```bash
cd projects/agent-kanban
pnpm install
task dev:node          # 或 task dev:go
# 另开终端
task --taskfile frontend/Taskfile.yml dev
```

契约与实现细节见 [`docs/README.md`](docs/README.md)、[`docs/states/task-states.yaml`](docs/states/task-states.yaml)。
