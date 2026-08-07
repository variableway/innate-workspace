# 数据模型设计

## 一、实体关系图 (ER Diagram)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  Workspace   │       │    Agent     │       │  Assignment  │
│──────────────│       │──────────────│       │──────────────│
│ id       PK  │──1:N──│ id       PK  │       │ id       PK  │
│ name         │       │ workspaceId  │──1:N──│ taskId    FK  │
│ description  │       │ name         │       │ agentId   FK  │
│ created_at   │       │ role         │       │ status       │
│ updated_at   │       │ model_name   │       │ model_used   │
└──────────────┘       │ cap_tags JSON│       │ result_text  │
       │               │ skills JSON  │       │ gh_comment_id│
       │1:N            │ gh_bot_acct  │       │ assigned_at  │
       │               │ status       │       │ started_at   │
┌──────▼───────┐       │ created_at   │       │ completed_at │
│   Project    │       └──────────────┘       └──────┬───────┘
│──────────────│                                     │
│ id       PK  │                                     │N:1
│ workspaceId  │                              ┌──────▼───────┐
│ name         │                              │     Task     │
│ repo_owner   │──1:N─────────────────────────│──────────────│
│ repo_name    │                              │ id       PK  │
│ sync_status  │                              │ projectId FK │
│ last_synced  │                              │ issue_number │
│ created_at   │                              │ title        │
└──────────────┘                              │ body         │
                                              │ labels JSON  │
                                              │ status       │
                                              │ gh_assignee  │
                                              │ gh_url       │
                                              │ created_at   │
                                              │ updated_at   │
                                              └──────────────┘
```

## 二、SQL Schema

```sql
-- ═══════════════════════════════════════════════════
-- 工作空间
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS workspaces (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ═══════════════════════════════════════════════════
-- 项目 (GitHub Repo 映射)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS projects (
  id            TEXT PRIMARY KEY,
  workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  repo_owner    TEXT NOT NULL,
  repo_name     TEXT NOT NULL,
  webhook_secret TEXT,
  sync_status   TEXT NOT NULL DEFAULT 'idle' CHECK(sync_status IN ('idle','syncing','error')),
  last_synced_at TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(repo_owner, repo_name)
);

CREATE INDEX idx_projects_workspace ON projects(workspace_id);

-- ═══════════════════════════════════════════════════
-- 任务 (GitHub Issue 聚合缓存)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tasks (
  id            TEXT PRIMARY KEY,
  project_id    TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  issue_number  INTEGER NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT DEFAULT '',
  labels        TEXT NOT NULL DEFAULT '[]',      -- JSON array
  status        TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','closed')),
  github_assignee TEXT,
  github_url    TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(project_id, issue_number)
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_labels ON tasks(labels);  -- For JSON search

-- ═══════════════════════════════════════════════════
-- AI Agent
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS agents (
  id              TEXT PRIMARY KEY,
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL,
  description     TEXT DEFAULT '',
  model_name      TEXT NOT NULL,
  capability_tags TEXT NOT NULL DEFAULT '[]',    -- JSON array
  skills          TEXT NOT NULL DEFAULT '[]',    -- JSON array
  github_bot_account TEXT,
  status          TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','paused','offline')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_agents_workspace ON agents(workspace_id);
CREATE INDEX idx_agents_status ON agents(status);

-- ═══════════════════════════════════════════════════
-- 任务分配记录 (核心联结表)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS assignments (
  id              TEXT PRIMARY KEY,
  task_id         TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id        TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','running','done','failed')),
  model_used      TEXT,
  result_summary  TEXT,
  instruction     TEXT,                          -- 可选的任务指令覆盖
  github_comment_id INTEGER,
  assigned_at     TEXT NOT NULL DEFAULT (datetime('now')),
  started_at      TEXT,
  completed_at    TEXT
);

CREATE INDEX idx_assignments_task ON assignments(task_id);
CREATE INDEX idx_assignments_agent ON assignments(agent_id);
CREATE INDEX idx_assignments_status ON assignments(status);
```

## 三、核心查询

### 3.1 跨项目聚合看板

```sql
-- 获取 Workspace 下所有任务（聚合视图）
SELECT
  t.id, t.issue_number, t.title, t.status, t.labels, t.github_assignee,
  p.name AS project_name, p.repo_owner, p.repo_name,
  a.id AS assignment_id, a.status AS assignment_status,
  ag.name AS agent_name, ag.model_name
FROM tasks t
JOIN projects p ON t.project_id = p.id
LEFT JOIN assignments a ON t.id = a.task_id AND a.status IN ('pending', 'running')
LEFT JOIN agents ag ON a.agent_id = ag.id
WHERE p.workspace_id = ?
ORDER BY t.updated_at DESC
LIMIT ? OFFSET ?;
```

### 3.2 Label 路由匹配

```sql
-- 根据 task labels 查找匹配的 Agent
-- 调用时传入 task_id，解析其 labels JSON 数组
-- 逻辑: Agent 的 capability_tags 与 task labels 有交集即可匹配
SELECT ag.*
FROM agents ag
WHERE ag.workspace_id = ?
  AND ag.status = 'active'
  AND EXISTS (
    SELECT 1 FROM json_each(ag.capability_tags) AS ct
    WHERE ct.value IN (/* parsed task labels */)
  )
ORDER BY
  -- 匹配标签越多，优先级越高
  (SELECT COUNT(*) FROM json_each(ag.capability_tags) AS ct
   WHERE ct.value IN (/* parsed task labels */)) DESC
LIMIT 1;
```

### 3.3 Agent 负载统计

```sql
SELECT
  ag.id, ag.name, ag.model_name,
  COUNT(a.id) AS total_assignments,
  SUM(CASE WHEN a.status = 'running' THEN 1 ELSE 0 END) AS running_count,
  SUM(CASE WHEN a.status = 'done' THEN 1 ELSE 0 END) AS done_count,
  SUM(CASE WHEN a.status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
  AVG(
    CASE WHEN a.completed_at IS NOT NULL AND a.started_at IS NOT NULL
      THEN (julianday(a.completed_at) - julianday(a.started_at)) * 86400000
    END
  ) AS avg_duration_ms
FROM agents ag
LEFT JOIN assignments a ON ag.id = a.agent_id
WHERE ag.workspace_id = ?
GROUP BY ag.id;
```

### 3.4 Workspace 统计概览

```sql
-- 按状态统计任务
SELECT status, COUNT(*) AS cnt
FROM tasks t
JOIN projects p ON t.project_id = p.id
WHERE p.workspace_id = ?
GROUP BY status;

-- 按项目统计任务
SELECT p.name, COUNT(*) AS cnt
FROM tasks t
JOIN projects p ON t.project_id = p.id
WHERE p.workspace_id = ?
GROUP BY p.id;

-- 按 Agent 统计任务
SELECT ag.name, COUNT(a.id) AS cnt
FROM assignments a
JOIN agents ag ON a.agent_id = ag.id
WHERE ag.workspace_id = ?
  AND a.status IN ('pending', 'running')
GROUP BY ag.id;
```

## 四、索引策略

| 索引 | 用途 | 类型 |
|------|------|------|
| `idx_tasks_status` | 看板按状态筛选 | B-tree |
| `idx_tasks_project` | 按项目查询任务 | B-tree |
| `idx_assignments_task` | 任务分配历史 | B-tree |
| `idx_assignments_agent` | Agent 负载统计 | B-tree |
| `idx_assignments_status` | 运行中任务筛选 | B-tree |

SQLite 不支持 JSON 索引，labels 和 capability_tags 的匹配在应用层解析后做 IN 查询。

## 五、数据生命周期

```
Task 创建 → webhook 写入
  → status = open
  → Label Router 匹配 → 创建 Assignment (status = pending)
  → Agent 拾取 → task.status = in_progress, assignment.status = running
  → Agent 完成 → task.status = closed, assignment.status = done
  → (可选) Agent 失败 → assignment.status = failed, task 保持 in_progress

清理策略:
  - closed 超过 90 天的 task: 软删除（保留聚合统计，标记 archived）
  - done/failed 超过 180 天的 assignment: 归档到日志表
```
