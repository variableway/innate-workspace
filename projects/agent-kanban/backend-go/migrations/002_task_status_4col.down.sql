-- Reverse 4-col status back to open/in_progress/closed

PRAGMA foreign_keys = OFF;

CREATE TABLE kanban_task_new (
  id               TEXT PRIMARY KEY,
  project_id       TEXT NOT NULL REFERENCES kanban_project(id) ON DELETE CASCADE,
  issue_number     INTEGER NOT NULL,
  title            TEXT NOT NULL,
  body             TEXT NOT NULL DEFAULT '',
  labels           TEXT NOT NULL DEFAULT '[]',
  status           TEXT NOT NULL DEFAULT 'open'
                     CHECK(status IN ('open', 'in_progress', 'closed')),
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
    WHEN 'backlog' THEN 'open'
    WHEN 'done' THEN 'closed'
    WHEN 'in_review' THEN 'in_progress'
    WHEN 'in_progress' THEN 'in_progress'
    ELSE 'open'
  END,
  github_assignee, github_url, created_at, updated_at
FROM kanban_task;

DROP TABLE kanban_task;
ALTER TABLE kanban_task_new RENAME TO kanban_task;

CREATE INDEX IF NOT EXISTS idx_kanban_tasks_project ON kanban_task(project_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_status  ON kanban_task(status);

PRAGMA foreign_keys = ON;
