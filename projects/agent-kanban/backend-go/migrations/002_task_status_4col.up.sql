-- Migrate task status: open→backlog, closed→done (in_progress kept)
-- SQLite: rebuild table to replace CHECK constraint

PRAGMA foreign_keys = OFF;

CREATE TABLE kanban_task_new (
  id               TEXT PRIMARY KEY,
  project_id       TEXT NOT NULL REFERENCES kanban_project(id) ON DELETE CASCADE,
  issue_number     INTEGER NOT NULL,
  title            TEXT NOT NULL,
  body             TEXT NOT NULL DEFAULT '',
  labels           TEXT NOT NULL DEFAULT '[]',
  status           TEXT NOT NULL DEFAULT 'backlog'
                     CHECK(status IN ('backlog', 'in_progress', 'in_review', 'done')),
  github_assignee  TEXT,
  github_url       TEXT NOT NULL,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(project_id, issue_number)
);

INSERT INTO kanban_task_new (
  id, project_id, issue_number, title, body, labels, status,
  github_assignee, github_url, created_at, updated_at
)
SELECT
  id, project_id, issue_number, title, body, labels,
  CASE status
    WHEN 'open' THEN 'backlog'
    WHEN 'closed' THEN 'done'
    WHEN 'in_progress' THEN 'in_progress'
    WHEN 'backlog' THEN 'backlog'
    WHEN 'in_review' THEN 'in_review'
    WHEN 'done' THEN 'done'
    ELSE 'backlog'
  END,
  github_assignee, github_url, created_at, updated_at
FROM kanban_task;

DROP TABLE kanban_task;
ALTER TABLE kanban_task_new RENAME TO kanban_task;

CREATE INDEX IF NOT EXISTS idx_kanban_tasks_project ON kanban_task(project_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_status  ON kanban_task(status);

PRAGMA foreign_keys = ON;
