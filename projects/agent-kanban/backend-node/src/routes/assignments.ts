import { Hono } from "hono";
import { all, one, run, uuid } from "../lib/db.js";

export const assignmentRoutes = new Hono();

// POST /assignments — manual assignment
assignmentRoutes.post("/assignments", async (c) => {
  const body = await c.req.json();

  if (!body.taskId || !body.agentId) {
    return c.json(
      { code: "VALIDATION_ERROR", message: "taskId and agentId are required" },
      400
    );
  }

  // Idempotency check
  const existing = one<{ c: number }>(
    "SELECT count(*) as c FROM kanban_assignment WHERE task_id = ? AND status IN ('pending', 'running')",
    body.taskId
  );
  if (existing && existing.c > 0) {
    return c.json(
      { code: "CONFLICT", message: "task already has a pending or running assignment" },
      409
    );
  }

  const id = uuid();
  run(
    "INSERT INTO kanban_assignment (id, task_id, agent_id, status, instruction) VALUES (?, ?, ?, 'pending', ?)",
    id, body.taskId, body.agentId, body.instruction || null
  );

  const assignment = one("SELECT * FROM kanban_assignment WHERE id = ?", id);
  return c.json(assignment, 201);
});

// POST /assignments/auto — auto assign (Label Router stub for Phase 5)
assignmentRoutes.post("/assignments/auto", async (c) => {
  const body = await c.req.json();
  if (!body.taskId) {
    return c.json(
      { code: "VALIDATION_ERROR", message: "taskId is required" },
      400
    );
  }

  // Get task with labels
  const task = one<any>(
    `SELECT t.*, p.workspace_id FROM kanban_task t
     JOIN kanban_project p ON t.project_id = p.id
     WHERE t.id = ?`,
    body.taskId
  );
  if (!task) {
    return c.json({ code: "NOT_FOUND", message: "task not found" }, 404);
  }

  const labels = JSON.parse(task.labels || "[]");
  if (labels.length === 0) {
    return c.json(
      { code: "NO_MATCHING_AGENT", message: "Task has no labels to match" },
      422
    );
  }

  // Find matching agent (capability_tags ∩ labels)
  const agents = all<any>(
    "SELECT * FROM kanban_agent WHERE workspace_id = ? AND status = 'active'",
    task.workspace_id
  );

  let bestAgent: any = null;
  let bestScore = 0;
  for (const agent of agents) {
    const tags = JSON.parse(agent.capability_tags || "[]");
    const score = tags.filter((t: string) => labels.includes(t)).length;
    if (score > bestScore) {
      bestScore = score;
      bestAgent = agent;
    }
  }

  if (!bestAgent) {
    return c.json(
      { code: "NO_MATCHING_AGENT", message: `No agent matches labels: [${labels.join(", ")}]` },
      422
    );
  }

  // Check idempotency
  const existing = one<{ c: number }>(
    "SELECT count(*) as c FROM kanban_assignment WHERE task_id = ? AND status IN ('pending', 'running')",
    body.taskId
  );
  if (existing && existing.c > 0) {
    return c.json(
      { code: "CONFLICT", message: "task already has a pending or running assignment" },
      409
    );
  }

  const id = uuid();
  run(
    "INSERT INTO kanban_assignment (id, task_id, agent_id, status, model_used) VALUES (?, ?, ?, 'pending', ?)",
    id, body.taskId, bestAgent.id, bestAgent.model_name
  );

  const assignment = one("SELECT * FROM kanban_assignment WHERE id = ?", id);
  return c.json(assignment, 201);
});

// GET /tasks/:taskId/assignments — list task assignments
assignmentRoutes.get("/tasks/:taskId/assignments", (c) => {
  const taskId = c.req.param("taskId");
  const assignments = all(
    "SELECT * FROM kanban_assignment WHERE task_id = ? ORDER BY assigned_at DESC",
    taskId
  );
  return c.json(assignments);
});

// GET /agents/:agentId/assignments — list agent assignments
assignmentRoutes.get("/agents/:agentId/assignments", (c) => {
  const agentId = c.req.param("agentId");
  const status = c.req.query("status");

  if (status) {
    const assignments = all(
      "SELECT * FROM kanban_assignment WHERE agent_id = ? AND status = ? ORDER BY assigned_at DESC",
      agentId, status
    );
    return c.json(assignments);
  }

  const assignments = all(
    "SELECT * FROM kanban_assignment WHERE agent_id = ? ORDER BY assigned_at DESC",
    agentId
  );
  return c.json(assignments);
});

// PATCH /assignments/:id — update assignment status; side-effects task status
assignmentRoutes.patch("/assignments/:assignmentId", async (c) => {
  const id = c.req.param("assignmentId");
  const body = await c.req.json<{ status?: string; resultSummary?: string }>();
  const next = body.status;
  if (!next || !["pending", "running", "done", "failed"].includes(next)) {
    return c.json(
      { code: "VALIDATION_ERROR", message: "status must be pending|running|done|failed" },
      400
    );
  }

  const assignment = one<any>("SELECT * FROM kanban_assignment WHERE id = ?", id);
  if (!assignment) {
    return c.json({ code: "NOT_FOUND", message: "assignment not found" }, 404);
  }

  if (next === "running") {
    run(
      `UPDATE kanban_assignment SET status = 'running', started_at = datetime('now') WHERE id = ?`,
      id
    );
    run(
      `UPDATE kanban_task SET status = 'in_progress', updated_at = datetime('now') WHERE id = ?`,
      assignment.task_id
    );
  } else if (next === "done") {
    run(
      `UPDATE kanban_assignment SET status = 'done', completed_at = datetime('now'),
       result_summary = COALESCE(?, result_summary) WHERE id = ?`,
      body.resultSummary ?? null,
      id
    );
    // Agent complete → in_review (not done)
    run(
      `UPDATE kanban_task SET status = 'in_review', updated_at = datetime('now') WHERE id = ?`,
      assignment.task_id
    );
  } else if (next === "failed") {
    run(
      `UPDATE kanban_assignment SET status = 'failed', completed_at = datetime('now') WHERE id = ?`,
      id
    );
  } else {
    run(`UPDATE kanban_assignment SET status = ? WHERE id = ?`, next, id);
  }

  const updated = one("SELECT * FROM kanban_assignment WHERE id = ?", id);
  return c.json(updated);
});
