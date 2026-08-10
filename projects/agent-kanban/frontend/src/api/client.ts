const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `API ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Types ───────────────────────────────────────────────────────

export type TaskStatus = "backlog" | "in_progress" | "in_review" | "done";

export interface Workspace {
  id: string; name: string; description: string; createdAt: string;
}

export interface Project {
  id: string; workspaceId: string; name: string;
  repoOwner: string; repoName: string; syncStatus: string;
  lastSyncedAt: string | null; createdAt: string;
}

export interface Task {
  id: string; projectId: string; issueNumber: number;
  title: string; body: string; labels: string[];
  status: TaskStatus;
  githubAssignee: string | null; githubUrl: string;
  projectName: string; repoOwner: string; repoName: string;
  currentAssignment: Assignment | null;
  createdAt: string; updatedAt: string;
}

export interface Agent {
  id: string; workspaceId: string; name: string; role: string;
  description: string; modelName: string; capabilityTags: string[];
  skills: string[]; status: "active" | "paused" | "offline";
  maxConcurrency: number; createdAt: string;
}

export interface Assignment {
  id: string; taskId: string; agentId: string;
  status: "pending" | "running" | "done" | "failed";
  modelUsed: string | null; resultSummary: string | null;
  retryCount: number; assignedAt: string;
  agent?: { name: string; modelName: string };
}

export interface Stats {
  totalTasks: number;
  backlogTasks: number;
  inProgressTasks: number;
  inReviewTasks: number;
  doneTasks: number;
  totalAgents: number;
  activeAgents: number;
  totalProjects: number;
  tasksByProject: Record<string, number>;
  tasksByAgent: Record<string, number>;
}

// ── API ─────────────────────────────────────────────────────────

export const api = {
  listWorkspaces: () => request<Workspace[]>("/workspaces"),
  createWorkspace: (name: string, description = "") =>
    request<Workspace>("/workspaces", { method: "POST", body: JSON.stringify({ name, description }) }),

  listProjects: (wsId: string) => request<Project[]>(`/workspaces/${wsId}/projects`),
  addProject: (wsId: string, name: string, repoOwner: string, repoName: string) =>
    request<Project>(`/workspaces/${wsId}/projects`, { method: "POST", body: JSON.stringify({ name, repoOwner, repoName }) }),
  syncProject: (projectId: string) =>
    request<{ status: string }>(`/projects/${projectId}/sync`, { method: "POST" }),

  listTasks: (wsId: string, params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{ total: number; items: Task[] }>(`/workspaces/${wsId}/tasks${q}`);
  },
  patchTask: (taskId: string, status: TaskStatus) =>
    request<Task>(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify({ status }) }),

  listAgents: (wsId: string) => request<Agent[]>(`/workspaces/${wsId}/agents`),
  createAgent: (wsId: string, data: Partial<Agent>) =>
    request<Agent>(`/workspaces/${wsId}/agents`, { method: "POST", body: JSON.stringify(data) }),
  updateAgent: (id: string, data: Partial<Agent>) =>
    request<Agent>(`/agents/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteAgent: (id: string) =>
    request<void>(`/agents/${id}`, { method: "DELETE" }),

  createAssignment: (taskId: string, agentId: string, instruction?: string) =>
    request<Assignment>("/assignments", { method: "POST", body: JSON.stringify({ taskId, agentId, instruction }) }),
  autoAssign: (taskId: string) =>
    request<Assignment>("/assignments/auto", { method: "POST", body: JSON.stringify({ taskId }) }),
  listTaskAssignments: (taskId: string) =>
    request<Assignment[]>(`/tasks/${taskId}/assignments`),

  getStats: (wsId: string) => request<Stats>(`/workspaces/${wsId}/stats`),
  health: () => request<{ status: string }>("/health"),
};
