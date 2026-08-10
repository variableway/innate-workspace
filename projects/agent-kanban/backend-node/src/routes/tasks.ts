import { Hono } from "hono";
import { all, one, parseJSONArray, run } from "../lib/db.js";
import {
  ALLOWED_TRANSITIONS,
  WIP_LIMITS,
  isTaskStatus,
  isTransitionAllowed,
  mergeStatusLabel,
  type TaskStatus,
} from "../lib/task-status.js";
import { writeStatusLabelToGitHub } from "../lib/github/sync.js";

export const taskRoutes = new Hono();

// GET /workspaces/:wsId/tasks — list tasks (cross-project aggregation)
taskRoutes.get("/workspaces/:workspaceId/tasks", (c) => {
  const wsId = c.req.param("workspaceId");
  const status = c.req.query("status");
  const projectId = c.req.query("projectId");
  const agentId = c.req.query("agentId");
  const label = c.req.query("label");
  const limit = parseInt(c.req.query("limit") || "50", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  let query = `
    SELECT t.id, t.project_id, t.issue_number, t.title, t.body, t.labels,
           t.status, t.github_assignee, t.github_url, t.created_at, t.updated_at,
           p.name AS project_name, p.repo_owner, p.repo_name,
           a.id AS assignment_id, a.task_id, a.agent_id, a.status AS assignment_status,
           a.model_used, a.result_summary, a.instruction, a.github_comment_id,
           a.retry_count, a.assigned_at, a.started_at, a.completed_at,
           ag.name AS agent_name, ag.model_name
    FROM kanban_task t
    JOIN kanban_project p ON t.project_id = p.id
    LEFT JOIN kanban_assignment a ON t.id = a.task_id AND a.status IN ('pending', 'running')
    LEFT JOIN kanban_agent ag ON a.agent_id = ag.id
    WHERE p.workspace_id = ?`;
  const args: unknown[] = [wsId];

  if (status) {
    query += " AND t.status = ?";
    args.push(status);
  }
  if (projectId) {
    query += " AND t.project_id = ?";
    args.push(projectId);
  }
  if (agentId) {
    query += " AND a.agent_id = ?";
    args.push(agentId);
  }
  query += " ORDER BY t.updated_at DESC LIMIT ? OFFSET ?";
  args.push(limit, offset);

  let tasks = all(query, ...args);

  if (label) {
    tasks = tasks.filter((t: any) => parseJSONArray(t.labels).includes(label));
  }

  const items = tasks.map((t: any) => ({
    id: t.id,
    projectId: t.project_id,
    issueNumber: t.issue_number,
    title: t.title,
    body: t.body,
    labels: parseJSONArray(t.labels),
    status: t.status,
    githubAssignee: t.github_assignee,
    githubUrl: t.github_url,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    projectName: t.project_name,
    repoOwner: t.repo_owner,
    repoName: t.repo_name,
    currentAssignment: t.assignment_id
      ? {
          id: t.assignment_id,
          taskId: t.task_id,
          agentId: t.agent_id,
          status: t.assignment_status,
          modelUsed: t.model_used,
          resultSummary: t.result_summary,
          instruction: t.instruction,
          githubCommentId: t.github_comment_id,
          retryCount: t.retry_count,
          assignedAt: t.assigned_at,
          startedAt: t.started_at,
          completedAt: t.completed_at,
          agent: { name: t.agent_name, modelName: t.model_name },
        }
      : null,
  }));

  return c.json({ total: items.length, items });
});

// GET /tasks/:id — get task detail
taskRoutes.get("/tasks/:taskId", (c) => {
  const id = c.req.param("taskId");
  const task = one<any>(
    `SELECT t.*, p.name AS project_name, p.repo_owner, p.repo_name
     FROM kanban_task t
     JOIN kanban_project p ON t.project_id = p.id
     WHERE t.id = ?`,
    id
  );
  if (!task) {
    return c.json({ code: "NOT_FOUND", message: "task not found" }, 404);
  }
  return c.json({
    id: task.id,
    projectId: task.project_id,
    issueNumber: task.issue_number,
    title: task.title,
    body: task.body,
    labels: parseJSONArray(task.labels),
    status: task.status,
    githubAssignee: task.github_assignee,
    githubUrl: task.github_url,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    projectName: task.project_name,
    repoOwner: task.repo_owner,
    repoName: task.repo_name,
  });
});

// PATCH /tasks/:id — board drag (whitelist + WIP)
taskRoutes.patch("/tasks/:taskId", async (c) => {
  const id = c.req.param("taskId");
  const body = await c.req.json<{ status?: string }>();
  if (!body.status || !isTaskStatus(body.status)) {
    return c.json(
      { code: "VALIDATION_ERROR", message: "status must be backlog|in_progress|in_review|done" },
      400
    );
  }
  const to = body.status as TaskStatus;

  const task = one<{
    id: string;
    status: string;
    labels: string;
    issue_number: number;
    project_id: string;
    repo_owner: string;
    repo_name: string;
    workspace_id: string;
  }>(
    `SELECT t.id, t.status, t.labels, t.issue_number, t.project_id,
            p.repo_owner, p.repo_name, p.workspace_id
     FROM kanban_task t
     JOIN kanban_project p ON t.project_id = p.id
     WHERE t.id = ?`,
    id
  );
  if (!task) {
    return c.json({ code: "NOT_FOUND", message: "task not found" }, 404);
  }
  if (!isTaskStatus(task.status)) {
    return c.json({ code: "CONFLICT", message: `unknown current status: ${task.status}` }, 409);
  }
  const from = task.status;

  if (!isTransitionAllowed(from, to)) {
    return c.json(
      {
        code: "CONFLICT",
        message: `invalid transition ${from} → ${to}; allowed: ${ALLOWED_TRANSITIONS[from].join(", ")}`,
      },
      409
    );
  }

  if (from !== to) {
    const limit = WIP_LIMITS[to];
    if (limit !== undefined) {
      const row = one<{ c: number }>(
        `SELECT count(*) as c FROM kanban_task t
         JOIN kanban_project p ON t.project_id = p.id
         WHERE p.workspace_id = ? AND t.status = ? AND t.id != ?`,
        task.workspace_id,
        to,
        id
      );
      if ((row?.c ?? 0) >= limit) {
        return c.json(
          {
            code: "CONFLICT",
            message: `WIP limit reached for ${to} (max ${limit})`,
            details: { reason: "wip-limit", status: to, limit },
          },
          409
        );
      }
    }
  }

  const labels = parseJSONArray(task.labels);
  const nextLabels = mergeStatusLabel(labels, to);
  run(
    `UPDATE kanban_task SET status = ?, labels = ?, updated_at = datetime('now') WHERE id = ?`,
    to,
    JSON.stringify(nextLabels),
    id
  );

  // Best-effort GitHub label writeback (does not block local update)
  void writeStatusLabelToGitHub({
    owner: task.repo_owner,
    repo: task.repo_name,
    issueNumber: task.issue_number,
    status: to,
    currentLabels: labels,
  });

  const updated = one<any>("SELECT * FROM kanban_task WHERE id = ?", id);
  return c.json({
    id: updated.id,
    projectId: updated.project_id,
    issueNumber: updated.issue_number,
    title: updated.title,
    body: updated.body,
    labels: parseJSONArray(updated.labels),
    status: updated.status,
    githubAssignee: updated.github_assignee,
    githubUrl: updated.github_url,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
  });
});
