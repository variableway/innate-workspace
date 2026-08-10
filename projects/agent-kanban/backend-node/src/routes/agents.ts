import { Hono } from "hono";
import { all, one, run, parseJSONArray, uuid } from "../lib/db.js";

export const agentRoutes = new Hono();

// GET /workspaces/:wsId/agents — list agents
agentRoutes.get("/workspaces/:workspaceId/agents", (c) => {
  const wsId = c.req.param("workspaceId");
  const agents = all<any>(
    "SELECT * FROM kanban_agent WHERE workspace_id = ? ORDER BY created_at",
    wsId
  );
  // Parse JSON fields
  for (const a of agents) {
    a.capabilityTags = parseJSONArray(a.capability_tags);
    a.skills = parseJSONArray(a.skills);
    delete a.capability_tags;
    delete a.skills;
  }
  return c.json(agents);
});

// POST /workspaces/:wsId/agents — create agent
agentRoutes.post("/workspaces/:workspaceId/agents", async (c) => {
  const wsId = c.req.param("workspaceId");
  const body = await c.req.json();

  if (!body.name || !body.role || !body.modelName) {
    return c.json(
      { code: "VALIDATION_ERROR", message: "name, role, modelName are required" },
      400
    );
  }

  const id = uuid();
  const tags = JSON.stringify(body.capabilityTags || []);
  const skills = JSON.stringify(body.skills || []);
  const maxConcurrency = body.maxConcurrency || 3;

  run(
    `INSERT INTO kanban_agent (id, workspace_id, name, role, description, model_name, capability_tags, skills, github_bot_account, status, max_concurrency)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
    id, wsId, body.name, body.role, body.description || "", body.modelName,
    tags, skills, body.githubBotAccount || null, maxConcurrency
  );

  const agent = one<any>("SELECT * FROM kanban_agent WHERE id = ?", id);
  agent.capabilityTags = parseJSONArray(agent.capability_tags);
  agent.skills = parseJSONArray(agent.skills);
  delete agent.capability_tags;
  delete agent.skills;
  return c.json(agent, 201);
});

// GET /agents/:id — get agent detail
agentRoutes.get("/agents/:agentId", (c) => {
  const id = c.req.param("agentId");
  const agent = one<any>("SELECT * FROM kanban_agent WHERE id = ?", id);
  if (!agent) {
    return c.json({ code: "NOT_FOUND", message: "agent not found" }, 404);
  }
  agent.capabilityTags = parseJSONArray(agent.capability_tags);
  agent.skills = parseJSONArray(agent.skills);
  delete agent.capability_tags;
  delete agent.skills;

  // Get stats
  const stats = one<any>(
    `SELECT
       count(*) as totalAssignments,
       sum(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completedAssignments,
       sum(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedAssignments,
       sum(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as runningCount
     FROM kanban_assignment WHERE agent_id = ?`,
    id
  );

  return c.json({ ...agent, stats: { ...stats, avgDurationMs: null } });
});

// PATCH /agents/:id — update agent
agentRoutes.patch("/agents/:agentId", async (c) => {
  const id = c.req.param("agentId");
  const body = await c.req.json();

  const setParts: string[] = [];
  const args: unknown[] = [];

  if (body.name !== undefined) { setParts.push("name = ?"); args.push(body.name); }
  if (body.description !== undefined) { setParts.push("description = ?"); args.push(body.description); }
  if (body.modelName !== undefined) { setParts.push("model_name = ?"); args.push(body.modelName); }
  if (body.capabilityTags !== undefined) { setParts.push("capability_tags = ?"); args.push(JSON.stringify(body.capabilityTags)); }
  if (body.skills !== undefined) { setParts.push("skills = ?"); args.push(JSON.stringify(body.skills)); }
  if (body.status !== undefined) { setParts.push("status = ?"); args.push(body.status); }
  if (body.maxConcurrency !== undefined) { setParts.push("max_concurrency = ?"); args.push(body.maxConcurrency); }

  if (setParts.length > 0) {
    args.push(id);
    run(`UPDATE kanban_agent SET ${setParts.join(", ")} WHERE id = ?`, ...args);
  }

  const agent = one<any>("SELECT * FROM kanban_agent WHERE id = ?", id);
  agent.capabilityTags = parseJSONArray(agent.capability_tags);
  agent.skills = parseJSONArray(agent.skills);
  delete agent.capability_tags;
  delete agent.skills;
  return c.json(agent);
});

// DELETE /agents/:id — delete agent
agentRoutes.delete("/agents/:agentId", (c) => {
  const id = c.req.param("agentId");
  run("DELETE FROM kanban_agent WHERE id = ?", id);
  return c.body(null, 204);
});
