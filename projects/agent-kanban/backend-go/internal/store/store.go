package store

import (
	"fmt"
	"log/slog"

	"github.com/jmoiron/sqlx"
	_ "modernc.org/sqlite"
)

// Store wraps the database connection and provides data access methods.
type Store struct {
	db *sqlx.DB
}

// MustOpenSQLite opens a SQLite database, panicking on error.
// It also runs the schema migration if tables don't exist.
func MustOpenSQLite(dbPath string) *Store {
	db, err := sqlx.Open("sqlite", dbPath+"?_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)")
	if err != nil {
		panic(fmt.Sprintf("failed to open database: %v", err))
	}

	if err := db.Ping(); err != nil {
		panic(fmt.Sprintf("failed to ping database: %v", err))
	}

	s := &Store{db: db}
	if err := s.migrate(); err != nil {
		panic(fmt.Sprintf("failed to run migrations: %v", err))
	}

	slog.Info("database initialized", "path", dbPath)
	return s
}

// migrate runs the schema if tables don't exist yet.
// For production, use golang-migrate with the migrations/ folder.
func (s *Store) migrate() error {
	// Check if kanban_workspace exists
	var count int
	err := s.db.Get(&count, "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='kanban_workspace'")
	if err != nil {
		return fmt.Errorf("check tables: %w", err)
	}
	if count > 0 {
		slog.Debug("tables already exist, skipping migration")
		return nil
	}

	// Read and execute schema.sql
	// In production, use: migrate -path migrations/ -database sqlite3://dev.db up
	schema := `
	CREATE TABLE IF NOT EXISTS kanban_workspace (
	  id          TEXT PRIMARY KEY,
	  name        TEXT NOT NULL,
	  description TEXT NOT NULL DEFAULT '',
	  user_id     TEXT,
	  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
	  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
	);
	CREATE TABLE IF NOT EXISTS kanban_project (
	  id              TEXT PRIMARY KEY,
	  workspace_id    TEXT NOT NULL REFERENCES kanban_workspace(id) ON DELETE CASCADE,
	  name            TEXT NOT NULL,
	  repo_owner      TEXT NOT NULL,
	  repo_name       TEXT NOT NULL,
	  webhook_secret  TEXT,
	  sync_status     TEXT NOT NULL DEFAULT 'idle' CHECK(sync_status IN ('idle', 'syncing', 'error')),
	  last_synced_at  TEXT,
	  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
	  UNIQUE(repo_owner, repo_name)
	);
	CREATE INDEX IF NOT EXISTS idx_kanban_projects_workspace ON kanban_project(workspace_id);
	CREATE TABLE IF NOT EXISTS kanban_task (
	  id               TEXT PRIMARY KEY,
	  project_id       TEXT NOT NULL REFERENCES kanban_project(id) ON DELETE CASCADE,
	  issue_number     INTEGER NOT NULL,
	  title            TEXT NOT NULL,
	  body             TEXT NOT NULL DEFAULT '',
	  labels           TEXT NOT NULL DEFAULT '[]',
	  status           TEXT NOT NULL DEFAULT 'backlog' CHECK(status IN ('backlog', 'in_progress', 'in_review', 'done')),
	  github_assignee  TEXT,
	  github_url       TEXT NOT NULL,
	  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
	  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
	  UNIQUE(project_id, issue_number)
	);
	CREATE INDEX IF NOT EXISTS idx_kanban_tasks_project ON kanban_task(project_id);
	CREATE INDEX IF NOT EXISTS idx_kanban_tasks_status  ON kanban_task(status);
	CREATE TABLE IF NOT EXISTS kanban_agent (
	  id                  TEXT PRIMARY KEY,
	  workspace_id        TEXT NOT NULL REFERENCES kanban_workspace(id) ON DELETE CASCADE,
	  name                TEXT NOT NULL,
	  role                TEXT NOT NULL,
	  description         TEXT NOT NULL DEFAULT '',
	  model_name          TEXT NOT NULL,
	  capability_tags     TEXT NOT NULL DEFAULT '[]',
	  skills              TEXT NOT NULL DEFAULT '[]',
	  github_bot_account  TEXT,
	  status              TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'offline')),
	  max_concurrency     INTEGER NOT NULL DEFAULT 3,
	  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
	);
	CREATE INDEX IF NOT EXISTS idx_kanban_agents_workspace ON kanban_agent(workspace_id);
	CREATE INDEX IF NOT EXISTS idx_kanban_agents_status    ON kanban_agent(status);
	CREATE TABLE IF NOT EXISTS kanban_assignment (
	  id                TEXT PRIMARY KEY,
	  task_id           TEXT NOT NULL REFERENCES kanban_task(id) ON DELETE CASCADE,
	  agent_id          TEXT NOT NULL REFERENCES kanban_agent(id) ON DELETE CASCADE,
	  status            TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'done', 'failed')),
	  model_used        TEXT,
	  result_summary    TEXT,
	  instruction       TEXT,
	  github_comment_id INTEGER,
	  retry_count       INTEGER NOT NULL DEFAULT 0,
	  assigned_at       TEXT NOT NULL DEFAULT (datetime('now')),
	  started_at        TEXT,
	  completed_at      TEXT
	);
	CREATE INDEX IF NOT EXISTS idx_kanban_assignments_task   ON kanban_assignment(task_id);
	CREATE INDEX IF NOT EXISTS idx_kanban_assignments_agent  ON kanban_assignment(agent_id);
	CREATE INDEX IF NOT EXISTS idx_kanban_assignments_status ON kanban_assignment(status);
	`
	_, err = s.db.Exec(schema)
	if err != nil {
		return fmt.Errorf("exec schema: %w", err)
	}
	slog.Info("migration completed: all tables created")
	return nil
}

// Close closes the database connection.
func (s *Store) Close() error {
	return s.db.Close()
}

// DB exposes the underlying *sqlx.DB for advanced queries.
func (s *Store) DB() *sqlx.DB {
	return s.db
}
