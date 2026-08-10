// ═══════════════════════════════════════════════════════════════
// Agent Kanban — Canonical TypeScript Types
// ═══════════════════════════════════════════════════════════════
// 对齐 docs/schema.sql 的表结构
// 前端 (Next.js) 和 Node.js 后端 (Hono) 共用此文件
//
// 注意: 此文件手写，与 schema.sql 保持同步
// Go 后端在 backend-go/internal/model/models.go 中手写对应 struct
// ═══════════════════════════════════════════════════════════════

// ── Enums ──────────────────────────────────────────────────────

export type ProjectSyncStatus = 'idle' | 'syncing' | 'error';
/** 看板 4 列：待规划 / 进行中 / 待审核 / 已完成 */
export type TaskStatus = 'backlog' | 'in_progress' | 'in_review' | 'done';
export type AgentStatus = 'active' | 'paused' | 'offline';
export type AssignmentStatus = 'pending' | 'running' | 'done' | 'failed';

/** GitHub status:* label → TaskStatus（字典序冲突时取第一个匹配） */
export const STATUS_LABEL_PREFIX = 'status:';
export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'status:backlog',
  in_progress: 'status:in-progress',
  in_review: 'status:in-review',
  done: 'status:done',
};

export const WIP_LIMITS: Partial<Record<TaskStatus, number>> = {
  in_progress: 5,
  in_review: 3,
};

// ── Core Entities (aligns with kanban_* tables) ────────────────

export interface Workspace {
  id: string;
  name: string;
  description: string;
  userId: string | null;        // null in Zero-Auth mode
  createdAt: string;            // ISO 8601
  updatedAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  repoOwner: string;
  repoName: string;
  webhookSecret: string | null; // only returned on creation
  syncStatus: ProjectSyncStatus;
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  issueNumber: number;
  title: string;
  body: string;
  labels: string[];             // parsed from JSON
  status: TaskStatus;
  githubAssignee: string | null;
  githubUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  workspaceId: string;
  name: string;
  role: string;                 // frontend | backend | data | ...
  description: string;
  modelName: string;            // kimi-long-v1 | glm-4-flash | ...
  capabilityTags: string[];    // parsed from JSON, matches task labels
  skills: string[];             // parsed from JSON
  githubBotAccount: string | null;
  status: AgentStatus;
  maxConcurrency: number;       // default 3
  createdAt: string;
}

export interface Assignment {
  id: string;
  taskId: string;
  agentId: string;
  status: AssignmentStatus;
  modelUsed: string | null;
  resultSummary: string | null;
  instruction: string | null;
  githubCommentId: number | null;
  retryCount: number;
  assignedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

// ── Composite Views (for API responses) ────────────────────────

export interface TaskWithAssignment extends Task {
  projectName: string;
  repoOwner: string;
  repoName: string;
  currentAssignment: AssignmentWithAgent | null;
}

export interface AssignmentWithAgent extends Assignment {
  agent: Pick<Agent, 'id' | 'name' | 'role' | 'modelName'>;
}

export interface AgentDetail extends Agent {
  stats: {
    totalAssignments: number;
    completedAssignments: number;
    failedAssignments: number;
    runningCount: number;
    avgDurationMs: number | null;
  };
}

export interface WorkspaceStats {
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

// ── API Input Types ────────────────────────────────────────────

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
}

export interface CreateProjectInput {
  name: string;
  repoOwner: string;
  repoName: string;
}

export interface CreateAgentInput {
  name: string;
  role: string;
  description?: string;
  modelName: string;
  capabilityTags: string[];
  skills?: string[];
  githubBotAccount?: string;
  maxConcurrency?: number;
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  modelName?: string;
  capabilityTags?: string[];
  skills?: string[];
  status?: AgentStatus;
  maxConcurrency?: number;
}

export interface CreateAssignmentInput {
  taskId: string;
  agentId: string;
  instruction?: string;
}

export interface UpdateTaskInput {
  status: TaskStatus;
}

// ── Query Filter Types ─────────────────────────────────────────

export interface TaskFilter {
  status?: TaskStatus;
  projectId?: string;
  agentId?: string;
  label?: string;
  limit?: number;               // default 50
  offset?: number;              // default 0
}

export interface AssignmentFilter {
  status?: AssignmentStatus;
}

// ── Event Payload Types (aligns with docs/events.yaml) ─────────

export interface GitHubWebhookPayload {
  action: string;
  issue: {
    number: number;
    title: string;
    body: string;
    labels: Array<{ name: string }>;
    assignee: { login: string } | null;
    html_url: string;
    state: string;
  };
  repository: {
    full_name: string;
  };
}

export interface InternalEvent<T = unknown> {
  name: string;
  timestamp: string;
  payload: T;
}

// ── Error Response ─────────────────────────────────────────────

export interface ApiError {
  code: string;                 // NOT_FOUND | VALIDATION_ERROR | CONFLICT | ...
  message: string;
  details?: Record<string, unknown>;
}
