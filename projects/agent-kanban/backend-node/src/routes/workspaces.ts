import { Hono } from "hono";
import { all, one, run, parseJSONArray, uuid } from "../lib/db.js";

export const workspaceRoutes = new Hono();

// GET /workspaces — list all workspaces
workspaceRoutes.get("/workspaces", (c) => {
  const ws = all("SELECT * FROM kanban_workspace ORDER BY created_at DESC");
  return c.json(ws);
});

// POST /workspaces — create workspace
workspaceRoutes.post("/workspaces", async (c) => {
  const body = await c.req.json();
  if (!body.name) {
    return c.json({ code: "VALIDATION_ERROR", message: "name is required" }, 400);
  }
  const id = uuid();
  run(
    "INSERT INTO kanban_workspace (id, name, description) VALUES (?, ?, ?)",
    id, body.name, body.description || ""
  );
  const ws = one("SELECT * FROM kanban_workspace WHERE id = ?", id);
  return c.json(ws, 201);
});

// GET /workspaces/:id — get workspace
workspaceRoutes.get("/workspaces/:workspaceId", (c) => {
  const id = c.req.param("workspaceId");
  const ws = one("SELECT * FROM kanban_workspace WHERE id = ?", id);
  if (!ws) {
    return c.json({ code: "NOT_FOUND", message: "workspace not found" }, 404);
  }
  return c.json(ws);
});

// DELETE /workspaces/:id — delete workspace
workspaceRoutes.delete("/workspaces/:workspaceId", (c) => {
  const id = c.req.param("workspaceId");
  run("DELETE FROM kanban_workspace WHERE id = ?", id);
  return c.body(null, 204);
});

// GET /workspaces/:id/stats — workspace statistics
workspaceRoutes.get("/workspaces/:workspaceId/stats", (c) => {
  const wsId = c.req.param("workspaceId");

  // Task counts by status
  const statusRows = all<{ status: string; cnt: number }>(
    `SELECT t.status, COUNT(*) as cnt FROM kanban_task t
     JOIN kanban_project p ON t.project_id = p.id
     WHERE p.workspace_id = ? GROUP BY t.status`,
    wsId
  );

  let totalTasks = 0,
    backlogTasks = 0,
    inProgressTasks = 0,
    inReviewTasks = 0,
    doneTasks = 0;
  for (const row of statusRows) {
    totalTasks += row.cnt;
    if (row.status === "backlog") backlogTasks = row.cnt;
    if (row.status === "in_progress") inProgressTasks = row.cnt;
    if (row.status === "in_review") inReviewTasks = row.cnt;
    if (row.status === "done") doneTasks = row.cnt;
  }

  // Agent counts
  const totalAgents = (one<{ c: number }>(
    "SELECT count(*) as c FROM kanban_agent WHERE workspace_id = ?", wsId
  ))?.c || 0;
  const activeAgents = (one<{ c: number }>(
    "SELECT count(*) as c FROM kanban_agent WHERE workspace_id = ? AND status = 'active'", wsId
  ))?.c || 0;

  // Project count
  const totalProjects = (one<{ c: number }>(
    "SELECT count(*) as c FROM kanban_project WHERE workspace_id = ?", wsId
  ))?.c || 0;

  // Tasks by project
  const tasksByProject: Record<string, number> = {};
  const projRows = all<{ name: string; cnt: number }>(
    `SELECT p.name, COUNT(t.id) as cnt FROM kanban_project p
     LEFT JOIN kanban_task t ON t.project_id = p.id
     WHERE p.workspace_id = ? GROUP BY p.id`,
    wsId
  );
  for (const row of projRows) tasksByProject[row.name] = row.cnt;

  // Tasks by agent (pending + running)
  const tasksByAgent: Record<string, number> = {};
  const agentRows = all<{ name: string; cnt: number }>(
    `SELECT ag.name, COUNT(a.id) as cnt FROM kanban_agent ag
     LEFT JOIN kanban_assignment a ON a.agent_id = ag.id AND a.status IN ('pending','running')
     WHERE ag.workspace_id = ? GROUP BY ag.id`,
    wsId
  );
  for (const row of agentRows) tasksByAgent[row.name] = row.cnt;

  return c.json({
    totalTasks,
    backlogTasks,
    inProgressTasks,
    inReviewTasks,
    doneTasks,
    totalAgents,
    activeAgents,
    totalProjects,
    tasksByProject,
    tasksByAgent,
  });
});
