import { Hono } from "hono";
import { all, one, run, uuid } from "../lib/db.js";

export const projectRoutes = new Hono();

// GET /workspaces/:wsId/projects — list projects
projectRoutes.get("/workspaces/:workspaceId/projects", (c) => {
  const wsId = c.req.param("workspaceId");
  const projects = all(
    "SELECT * FROM kanban_project WHERE workspace_id = ? ORDER BY created_at",
    wsId
  );
  return c.json(projects);
});

// POST /workspaces/:wsId/projects — add project
projectRoutes.post("/workspaces/:workspaceId/projects", async (c) => {
  const wsId = c.req.param("workspaceId");
  const body = await c.req.json();

  if (!body.name || !body.repoOwner || !body.repoName) {
    return c.json(
      { code: "VALIDATION_ERROR", message: "name, repoOwner, repoName are required" },
      400
    );
  }

  // Check for duplicate repo
  const existing = one<{ c: number }>(
    "SELECT count(*) as c FROM kanban_project WHERE repo_owner = ? AND repo_name = ?",
    body.repoOwner, body.repoName
  );
  if (existing && existing.c > 0) {
    return c.json(
      { code: "CONFLICT", message: "project with this repo already exists" },
      409
    );
  }

  const id = uuid();
  const webhookSecret = `whsec_${uuid().replace(/-/g, "")}`;
  run(
    `INSERT INTO kanban_project (id, workspace_id, name, repo_owner, repo_name, webhook_secret, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, 'idle')`,
    id, wsId, body.name, body.repoOwner, body.repoName, webhookSecret
  );

  const project = one<Record<string, unknown>>("SELECT * FROM kanban_project WHERE id = ?", id);
  return c.json(
    { ...project, webhookUrl: `http://localhost:4001/api/v1/webhooks/github` },
    201
  );
});

// GET /projects/:id — get project
projectRoutes.get("/projects/:projectId", (c) => {
  const id = c.req.param("projectId");
  const project = one("SELECT * FROM kanban_project WHERE id = ?", id);
  if (!project) {
    return c.json({ code: "NOT_FOUND", message: "project not found" }, 404);
  }
  return c.json(project);
});

// DELETE /projects/:id — remove project
projectRoutes.delete("/projects/:projectId", (c) => {
  const id = c.req.param("projectId");
  run("DELETE FROM kanban_project WHERE id = ?", id);
  return c.body(null, 204);
});

// POST /projects/:id/sync — trigger full sync
projectRoutes.post("/projects/:projectId/sync", async (c) => {
  const id = c.req.param("projectId");
  const project = one<{ id: string; repo_owner: string; repo_name: string }>(
    "SELECT id, repo_owner, repo_name FROM kanban_project WHERE id = ?",
    id
  );
  if (!project) {
    return c.json({ code: "NOT_FOUND", message: "project not found" }, 404);
  }

  // Run sync in background (non-blocking)
  const token = process.env.GITHUB_TOKEN;
  const { fullSync } = await import("../lib/github/sync.js");

  fullSync(project.id, project.repo_owner, project.repo_name, token)
    .then((synced) => {
      console.log(`[sync] completed: ${synced} issues for ${project.repo_owner}/${project.repo_name}`);
    })
    .catch((err) => {
      console.error(`[sync] failed:`, err);
    });

  return c.json(
    { projectId: id, status: "queued", message: "Full sync started in background" },
    202
  );
});
