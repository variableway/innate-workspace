import { run, one, uuid, parseJSONArray, all } from "../db.js";
import {
  resolveSyncedStatus,
  isTaskStatus,
  type TaskStatus,
  mergeStatusLabel,
  statusLabelFor,
} from "../task-status.js";

// ── Types ───────────────────────────────────────────────────────

interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  state: string;
  html_url: string;
  labels: Array<{ name: string }>;
  assignee: { login: string } | null;
}

// ── Sync Issue ──────────────────────────────────────────────────

/**
 * Sync a GitHub Issue to the local task table.
 * Called by webhook handler for individual issue events.
 */
export function syncIssue(
  projectId: string,
  action: string,
  issue: GitHubIssue
): void {
  const labels = (issue.labels || []).map((l) => l.name);
  const labelsJSON = JSON.stringify(labels);
  const assignee = issue.assignee?.login || null;

  switch (action) {
    case "opened":
    case "reopened":
    case "edited":
    case "labeled":
    case "unlabeled":
      upsertTaskWithResolve(projectId, issue, labelsJSON, labels, assignee);
      break;

    case "closed":
      run(
        `UPDATE kanban_task SET status = 'done', labels = ?, updated_at = datetime('now')
         WHERE project_id = ? AND issue_number = ?`,
        JSON.stringify(mergeStatusLabel(labels, "done")),
        projectId,
        issue.number
      );
      break;

    case "assigned":
    case "unassigned":
      run(
        `UPDATE kanban_task SET github_assignee = ?, updated_at = datetime('now')
         WHERE project_id = ? AND issue_number = ?`,
        assignee,
        projectId,
        issue.number
      );
      break;

    default:
      console.log(`[sync] unhandled action: ${action}`);
  }
}

function hasRunningAssignment(taskId: string): boolean {
  const row = one<{ c: number }>(
    "SELECT count(*) as c FROM kanban_assignment WHERE task_id = ? AND status = 'running'",
    taskId
  );
  return (row?.c ?? 0) > 0;
}

function upsertTaskWithResolve(
  projectId: string,
  issue: GitHubIssue,
  labelsJSON: string,
  labels: string[],
  assignee: string | null
): void {
  const existing = one<{ id: string; status: string }>(
    "SELECT id, status FROM kanban_task WHERE project_id = ? AND issue_number = ?",
    projectId,
    issue.number
  );

  const localStatus =
    existing && isTaskStatus(existing.status) ? existing.status : null;
  const running = existing ? hasRunningAssignment(existing.id) : false;
  const status = resolveSyncedStatus({
    githubState: issue.state,
    labels,
    hasRunningAssignment: running,
    localStatus,
  });

  if (existing) {
    run(
      `UPDATE kanban_task SET title = ?, body = ?, labels = ?, status = ?,
       github_assignee = ?, updated_at = datetime('now') WHERE id = ?`,
      issue.title,
      issue.body || "",
      labelsJSON,
      status,
      assignee,
      existing.id
    );
  } else {
    run(
      `INSERT INTO kanban_task (id, project_id, issue_number, title, body, labels, status, github_assignee, github_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      uuid(),
      projectId,
      issue.number,
      issue.title,
      issue.body || "",
      labelsJSON,
      status,
      assignee,
      issue.html_url
    );
  }
}

// ── Write status label back to GitHub (best-effort) ──────────────

export async function writeStatusLabelToGitHub(opts: {
  owner: string;
  repo: string;
  issueNumber: number;
  status: TaskStatus;
  currentLabels: string[];
  token?: string;
}): Promise<void> {
  const token = opts.token || process.env.GITHUB_TOKEN;
  if (!token) {
    console.log("[sync] skip GitHub label writeback: no GITHUB_TOKEN");
    return;
  }

  const nextLabels = mergeStatusLabel(opts.currentLabels, opts.status);
  const url = `https://api.github.com/repos/${opts.owner}/${opts.repo}/issues/${opts.issueNumber}`;
  try {
    const resp = await fetch(url, {
      method: "PATCH",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ labels: nextLabels }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      console.warn(
        `[sync] label writeback failed ${resp.status}: ${body} (wanted ${statusLabelFor(opts.status)})`
      );
    }
  } catch (err) {
    console.warn("[sync] label writeback error:", err);
  }
}

// ── Full Sync ───────────────────────────────────────────────────

export async function fullSync(
  projectId: string,
  owner: string,
  repo: string,
  token?: string
): Promise<number> {
  console.log(`[sync] full sync started: ${owner}/${repo}`);

  run("UPDATE kanban_project SET sync_status = 'syncing' WHERE id = ?", projectId);

  try {
    const issues = await fetchAllIssues(owner, repo, token);
    let synced = 0;

    for (const issue of issues) {
      if (issue.html_url && issue.html_url.includes("/pull/")) continue;
      syncIssue(projectId, issue.state === "closed" ? "closed" : "edited", issue);
      synced++;
    }

    run(
      "UPDATE kanban_project SET sync_status = 'idle', last_synced_at = datetime('now') WHERE id = ?",
      projectId
    );

    console.log(`[sync] full sync completed: ${synced} issues synced`);
    return synced;
  } catch (err) {
    run("UPDATE kanban_project SET sync_status = 'error' WHERE id = ?", projectId);
    console.error(`[sync] full sync failed:`, err);
    throw err;
  }
}

async function fetchAllIssues(
  owner: string,
  repo: string,
  token?: string
): Promise<GitHubIssue[]> {
  const allIssues: GitHubIssue[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=${perPage}&page=${page}&sort=created&direction=asc`;

    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const resp = await fetch(url, { headers });

    if (resp.status === 403) {
      const body = await resp.text();
      throw new Error(`GitHub rate limited: ${body}`);
    }
    if (resp.status !== 200) {
      const body = await resp.text();
      throw new Error(`GitHub API ${resp.status}: ${body}`);
    }

    const issues = (await resp.json()) as GitHubIssue[];
    if (issues.length === 0) break;

    allIssues.push(...issues);
    if (issues.length < perPage) break;

    page++;
  }

  return allIssues;
}

// ── Label Router ────────────────────────────────────────────────

export function findMatchingAgent(
  workspaceId: string,
  labels: string[]
): { id: string; name: string; model_name: string; capability_tags: string } | null {
  const agents = all<any>(
    "SELECT * FROM kanban_agent WHERE workspace_id = ? AND status = 'active'",
    workspaceId
  );

  let bestAgent: any = null;
  let bestScore = 0;

  for (const agent of agents) {
    const tags = parseJSONArray(agent.capability_tags);
    const score = tags.filter((t: string) => labels.includes(t)).length;
    if (score > bestScore) {
      bestScore = score;
      bestAgent = agent;
    }
  }

  return bestAgent;
}
