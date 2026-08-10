import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Singleton database connection
let db: Database.Database | null = null;

export function getDB(dbPath?: string): Database.Database {
  if (db) return db;

  const path = dbPath || process.env.DB_PATH || "dev.db";
  db = new Database(path);

  // Enable foreign keys + WAL mode
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Run migrations (schema.sql)
  migrate(db);

  console.log(`[db] SQLite initialized at ${path}`);
  return db;
}

function migrate(database: Database.Database) {
  // Check if tables exist
  const count = database
    .prepare(
      "SELECT count(*) as c FROM sqlite_master WHERE type='table' AND name='kanban_workspace'"
    )
    .get() as { c: number };

  if (count.c > 0) {
    console.log("[db] Tables already exist, skipping migration");
    return;
  }

  // Read and execute schema.sql from docs/
  const schemaPath = resolve(__dirname, "../../../docs/schema.sql");
  try {
    const schema = readFileSync(schemaPath, "utf-8");
    database.exec(schema);
    console.log("[db] Migration completed: all tables created");
  } catch (err) {
    // Fallback: inline schema
    console.warn("[db] Could not read docs/schema.sql, using inline schema");
    database.exec(INLINE_SCHEMA);
    console.log("[db] Inline migration completed");
  }
}

// Fallback schema (should match docs/schema.sql)
const INLINE_SCHEMA = `
CREATE TABLE IF NOT EXISTS kanban_workspace (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  user_id TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS kanban_project (
  id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES kanban_workspace(id) ON DELETE CASCADE,
  name TEXT NOT NULL, repo_owner TEXT NOT NULL, repo_name TEXT NOT NULL, webhook_secret TEXT,
  sync_status TEXT NOT NULL DEFAULT 'idle' CHECK(sync_status IN ('idle','syncing','error')),
  last_synced_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(repo_owner, repo_name)
);
CREATE INDEX IF NOT EXISTS idx_kanban_projects_workspace ON kanban_project(workspace_id);
CREATE TABLE IF NOT EXISTS kanban_task (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES kanban_project(id) ON DELETE CASCADE,
  issue_number INTEGER NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL DEFAULT '',
  labels TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'backlog' CHECK(status IN ('backlog','in_progress','in_review','done')),
  github_assignee TEXT, github_url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(project_id, issue_number)
);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_project ON kanban_task(project_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_status ON kanban_task(status);
CREATE TABLE IF NOT EXISTS kanban_agent (
  id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES kanban_workspace(id) ON DELETE CASCADE,
  name TEXT NOT NULL, role TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  model_name TEXT NOT NULL, capability_tags TEXT NOT NULL DEFAULT '[]', skills TEXT NOT NULL DEFAULT '[]',
  github_bot_account TEXT, status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','paused','offline')),
  max_concurrency INTEGER NOT NULL DEFAULT 3, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_kanban_agents_workspace ON kanban_agent(workspace_id);
CREATE INDEX IF NOT EXISTS idx_kanban_agents_status ON kanban_agent(status);
CREATE TABLE IF NOT EXISTS kanban_assignment (
  id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES kanban_task(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES kanban_agent(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','running','done','failed')),
  model_used TEXT, result_summary TEXT, instruction TEXT, github_comment_id INTEGER,
  retry_count INTEGER NOT NULL DEFAULT 0, assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  started_at TEXT, completed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_kanban_assignments_task ON kanban_assignment(task_id);
CREATE INDEX IF NOT EXISTS idx_kanban_assignments_agent ON kanban_assignment(agent_id);
CREATE INDEX IF NOT EXISTS idx_kanban_assignments_status ON kanban_assignment(status);
`;

// Query helpers
export function all<T = unknown>(sql: string, ...params: unknown[]): T[] {
  return getDB().prepare(sql).all(...params) as T[];
}

export function one<T = unknown>(sql: string, ...params: unknown[]): T | undefined {
  return getDB().prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, ...params: unknown[]): { changes: number; lastInsertRowid: number | bigint } {
  return getDB().prepare(sql).run(...params);
}

// JSON field parsing helper
export function parseJSONArray(raw: string | null | undefined): string[] {
  if (!raw || raw === "[]" || raw === "") return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Generate UUID (crypto.randomUUID is available in Node 18+)
export function uuid(): string {
  return crypto.randomUUID();
}
