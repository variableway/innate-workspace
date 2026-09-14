CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'timed_out')),
  stdout text NOT NULL DEFAULT '',
  stderr text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS agent_runs_created_at_idx ON agent_runs (created_at DESC);

-- Unified memory contract shared by InsForge, Supabase adapters and runtime.
-- Dimension 384 matches memweave's MiniLM/hash fallback.
CREATE TABLE IF NOT EXISTS memory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id text NOT NULL DEFAULT 'local',
  agent_id text,
  session_id text,
  kind text NOT NULL CHECK (kind IN ('fact', 'preference', 'event', 'note', 'summary')),
  logical_key text,
  content text NOT NULL,
  source text NOT NULL DEFAULT 'agent',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(384),
  embedding_model text,
  importance real NOT NULL DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
  access_count integer NOT NULL DEFAULT 0 CHECK (access_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz
);

CREATE INDEX IF NOT EXISTS memory_items_scope_idx
  ON memory_items (workspace_id, user_id, agent_id, session_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS memory_items_embedding_idx
  ON memory_items USING hnsw (embedding vector_cosine_ops);

ALTER TABLE memory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS memory_items_dev_policy ON memory_items;
CREATE POLICY memory_items_dev_policy ON memory_items
  USING (current_setting('app.workspace_id', true) IS NULL
      OR workspace_id = current_setting('app.workspace_id', true));
