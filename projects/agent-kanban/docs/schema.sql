-- ═══════════════════════════════════════════════════════════════
-- Agent Kanban — Canonical Database Schema
-- ═══════════════════════════════════════════════════════════════
-- This file is the SINGLE SOURCE OF TRUTH for the database schema.
-- Both Go (golang-migrate) and Node.js (better-sqlite3) use this.
--
-- Table prefix: kanban_ (avoids conflicts with better-auth tables)
-- DB engine: SQLite (TEXT for timestamps, JSON stored as TEXT)
--
-- Usage:
--   Go:      golang-migrate -path docs/ -database sqlite3://dev.db up
--   Node.js: db.exec(readFileSync('docs/schema.sql', 'utf-8'))
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- Workspace: 多项目聚合容器
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kanban_workspace (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  user_id     TEXT,                                    -- 关联 better-auth user.id (nullable for Zero-Auth mode)
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ───────────────────────────────────────────────────────────────
-- Project: GitHub Repo 映射
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kanban_project (
  id              TEXT PRIMARY KEY,
  workspace_id    TEXT NOT NULL REFERENCES kanban_workspace(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  repo_owner      TEXT NOT NULL,
  repo_name       TEXT NOT NULL,
  webhook_secret  TEXT,                                 -- GitHub webhook HMAC secret
  sync_status     TEXT NOT NULL DEFAULT 'idle'
                    CHECK(sync_status IN ('idle', 'syncing', 'error')),
  last_synced_at  TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(repo_owner, repo_name)
);

CREATE INDEX IF NOT EXISTS idx_kanban_projects_workspace ON kanban_project(workspace_id);

-- ───────────────────────────────────────────────────────────────
-- Task: GitHub Issue 聚合缓存 (read-only mirror)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kanban_task (
  id               TEXT PRIMARY KEY,
  project_id       TEXT NOT NULL REFERENCES kanban_project(id) ON DELETE CASCADE,
  issue_number     INTEGER NOT NULL,
  title            TEXT NOT NULL,
  body             TEXT NOT NULL DEFAULT '',
  labels           TEXT NOT NULL DEFAULT '[]',          -- JSON array of strings
  status           TEXT NOT NULL DEFAULT 'backlog'
                     CHECK(status IN ('backlog', 'in_progress', 'in_review', 'done')),
  github_assignee  TEXT,
  github_url       TEXT NOT NULL,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(project_id, issue_number)
);

CREATE INDEX IF NOT EXISTS idx_kanban_tasks_project ON kanban_task(project_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_status  ON kanban_task(status);

-- ───────────────────────────────────────────────────────────────
-- Agent: AI 执行体 (绑定模型 + 能力标签)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kanban_agent (
  id                  TEXT PRIMARY KEY,
  workspace_id        TEXT NOT NULL REFERENCES kanban_workspace(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  role                TEXT NOT NULL,                    -- frontend | backend | data | ...
  description         TEXT NOT NULL DEFAULT '',
  model_name          TEXT NOT NULL,                    -- kimi-long-v1 | glm-4-flash | ...
  capability_tags     TEXT NOT NULL DEFAULT '[]',       -- JSON array, matches task labels
  skills              TEXT NOT NULL DEFAULT '[]',       -- JSON array of skill names
  github_bot_account  TEXT,
  status              TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active', 'paused', 'offline')),
  max_concurrency     INTEGER NOT NULL DEFAULT 3,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_kanban_agents_workspace ON kanban_agent(workspace_id);
CREATE INDEX IF NOT EXISTS idx_kanban_agents_status    ON kanban_agent(status);

-- ───────────────────────────────────────────────────────────────
-- Assignment: Task ↔ Agent 分配记录 (核心联结表)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kanban_assignment (
  id                TEXT PRIMARY KEY,
  task_id           TEXT NOT NULL REFERENCES kanban_task(id) ON DELETE CASCADE,
  agent_id          TEXT NOT NULL REFERENCES kanban_agent(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK(status IN ('pending', 'running', 'done', 'failed')),
  model_used        TEXT,                               -- 实际使用的模型
  result_summary    TEXT,                               -- Agent 执行结果摘要
  instruction       TEXT,                               -- 可选的任务指令覆盖
  github_comment_id INTEGER,                            -- 回写 GitHub Issue 的 comment ID
  retry_count       INTEGER NOT NULL DEFAULT 0,
  stage             TEXT NOT NULL DEFAULT 'intake'
                      CHECK(stage IN (
                        'intake', 'wait_spec', 'plan', 'wait_plan',
                        'implement', 'verify', 'finalize'
                      )),
  assigned_at       TEXT NOT NULL DEFAULT (datetime('now')),
  started_at        TEXT,
  completed_at      TEXT
);

CREATE INDEX IF NOT EXISTS idx_kanban_assignments_task   ON kanban_assignment(task_id);
CREATE INDEX IF NOT EXISTS idx_kanban_assignments_agent  ON kanban_assignment(agent_id);
CREATE INDEX IF NOT EXISTS idx_kanban_assignments_status ON kanban_assignment(status);

-- ───────────────────────────────────────────────────────────────
-- Agent Audit Log: 执行日志 (可选, P2)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kanban_audit_log (
  id              TEXT PRIMARY KEY,
  assignment_id   TEXT REFERENCES kanban_assignment(id) ON DELETE CASCADE,
  agent_id        TEXT REFERENCES kanban_agent(id) ON DELETE SET NULL,
  event           TEXT NOT NULL,                        -- pickup | model_call | skill_call | success | fail | timeout
  detail          TEXT NOT NULL DEFAULT '{}',           -- JSON
  tokens_used     INTEGER,
  duration_ms     INTEGER,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_kanban_audit_assignment ON kanban_audit_log(assignment_id);
CREATE INDEX IF NOT EXISTS idx_kanban_audit_agent      ON kanban_audit_log(agent_id);

-- ───────────────────────────────────────────────────────────────
-- Artifact: 执行过程账本 (过程 SoT；状态仍以 GitHub Issue 为准)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kanban_artifact (
  id                 TEXT PRIMARY KEY,
  task_id            TEXT NOT NULL REFERENCES kanban_task(id) ON DELETE CASCADE,
  assignment_id      TEXT REFERENCES kanban_assignment(id) ON DELETE SET NULL,
  agent_id           TEXT REFERENCES kanban_agent(id) ON DELETE SET NULL,
  kind               TEXT NOT NULL
                       CHECK(kind IN ('spec', 'plan', 'note', 'log', 'summary', 'decision')),
  title              TEXT NOT NULL DEFAULT '',
  body_md            TEXT NOT NULL DEFAULT '',
  status             TEXT NOT NULL DEFAULT 'published'
                       CHECK(status IN ('draft', 'published', 'pending_review', 'approved', 'rejected')),
  version            INTEGER NOT NULL DEFAULT 1,
  github_comment_id  INTEGER,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_kanban_artifacts_task       ON kanban_artifact(task_id);
CREATE INDEX IF NOT EXISTS idx_kanban_artifacts_assignment ON kanban_artifact(assignment_id);
CREATE INDEX IF NOT EXISTS idx_kanban_artifacts_kind       ON kanban_artifact(kind);

-- ───────────────────────────────────────────────────────────────
-- Gate: Spec / Plan / Verify / Code 审查闸（产品「三关」的协议拆分）
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kanban_gate (
  id              TEXT PRIMARY KEY,
  task_id         TEXT NOT NULL REFERENCES kanban_task(id) ON DELETE CASCADE,
  assignment_id   TEXT REFERENCES kanban_assignment(id) ON DELETE SET NULL,
  gate            TEXT NOT NULL
                    CHECK(gate IN ('spec', 'plan', 'verify', 'code')),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK(status IN ('pending', 'submitted', 'approved', 'rejected', 'skipped')),
  artifact_id     TEXT REFERENCES kanban_artifact(id) ON DELETE SET NULL,
  reviewer        TEXT,                                  -- human id or 'policy:auto'
  comment         TEXT NOT NULL DEFAULT '',
  decided_at      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_kanban_gates_task       ON kanban_gate(task_id);
CREATE INDEX IF NOT EXISTS idx_kanban_gates_assignment ON kanban_gate(assignment_id);
CREATE INDEX IF NOT EXISTS idx_kanban_gates_status     ON kanban_gate(status);

-- ───────────────────────────────────────────────────────────────
-- Task Edge: 父子 / 依赖（多 Agent 拆分与阻塞可视化）
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kanban_task_edge (
  id           TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES kanban_workspace(id) ON DELETE CASCADE,
  from_task_id TEXT NOT NULL REFERENCES kanban_task(id) ON DELETE CASCADE,
  to_task_id   TEXT NOT NULL REFERENCES kanban_task(id) ON DELETE CASCADE,
  edge_type    TEXT NOT NULL
                 CHECK(edge_type IN ('parent_of', 'blocks', 'relates_to')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(from_task_id, to_task_id, edge_type)
);

CREATE INDEX IF NOT EXISTS idx_kanban_task_edges_from ON kanban_task_edge(from_task_id);
CREATE INDEX IF NOT EXISTS idx_kanban_task_edges_to   ON kanban_task_edge(to_task_id);

-- ───────────────────────────────────────────────────────────────
-- TIP Message Log: 协议信封审计 (幂等 message_id)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kanban_tip_message (
  message_id     TEXT PRIMARY KEY,
  assignment_id  TEXT REFERENCES kanban_assignment(id) ON DELETE SET NULL,
  agent_id       TEXT REFERENCES kanban_agent(id) ON DELETE SET NULL,
  task_id        TEXT REFERENCES kanban_task(id) ON DELETE SET NULL,
  type           TEXT NOT NULL
                   CHECK(type IN (
                     'claim', 'heartbeat', 'progress', 'ask_human',
                     'submit_spec', 'submit_plan', 'resume',
                     'handoff', 'complete', 'fail', 'cancel'
                   )),
  payload        TEXT NOT NULL DEFAULT '{}',           -- JSON
  result         TEXT NOT NULL DEFAULT '{}',           -- JSON 幂等回放
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_kanban_tip_assignment ON kanban_tip_message(assignment_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tip_type       ON kanban_tip_message(type);

-- ───────────────────────────────────────────────────────────────
-- Notify Channel: IM / 出站渠道 (扩展原 webhook 订阅)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kanban_notify_channel (
  id            TEXT PRIMARY KEY,
  workspace_id  TEXT NOT NULL REFERENCES kanban_workspace(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  channel_type  TEXT NOT NULL
                  CHECK(channel_type IN ('webhook', 'slack', 'feishu', 'dingtalk', 'wecom')),
  endpoint_url  TEXT NOT NULL,
  secret        TEXT,                                  -- 加签等；勿写入日志
  events        TEXT NOT NULL DEFAULT '["assignment.completed","assignment.failed"]',
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_kanban_notify_workspace ON kanban_notify_channel(workspace_id);

CREATE TABLE IF NOT EXISTS kanban_notification_delivery (
  id          TEXT PRIMARY KEY,
  channel_id  TEXT NOT NULL REFERENCES kanban_notify_channel(id) ON DELETE CASCADE,
  event_name  TEXT NOT NULL,
  task_id     TEXT REFERENCES kanban_task(id) ON DELETE SET NULL,
  status      TEXT NOT NULL
                CHECK(status IN ('pending', 'success', 'failed')),
  attempts    INTEGER NOT NULL DEFAULT 0,
  last_error  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  delivered_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_kanban_delivery_channel ON kanban_notification_delivery(channel_id);
CREATE INDEX IF NOT EXISTS idx_kanban_delivery_task    ON kanban_notification_delivery(task_id);

-- ───────────────────────────────────────────────────────────────
-- Webhook Subscriptions: 通用出站 (保留兼容；新逻辑优先 notify_channel)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kanban_webhook_subscription (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  events      TEXT NOT NULL DEFAULT '["*"]',            -- JSON array, * = all
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ═══════════════════════════════════════════════════════════════
-- End of schema.
-- Core: workspace/project/task/agent/assignment/audit (+ legacy webhook)
-- Extended: artifact / task_edge / tip_message / notify_channel / delivery
-- ═══════════════════════════════════════════════════════════════
