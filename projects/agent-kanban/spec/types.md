# TypeScript 类型定义

所有 API 接口和数据模型对应的 TypeScript 类型。

## 安装

```bash
# 从 openapi.yaml 自动生成
npx openapi-typescript ./spec/openapi.yaml -o ./src/types/api.ts
```

## 核心类型（手写定义）

```typescript
// ═══════════════════════════════════════════════════
// 基础类型
// ═══════════════════════════════════════════════════

type UUID = string;
type ISODateTime = string;
type GitHubLabel = string;

// ═══════════════════════════════════════════════════
// Workspace
// ═══════════════════════════════════════════════════

interface Workspace {
  id: UUID;
  name: string;
  description?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface WorkspaceDetail extends Workspace {
  projects: Project[];
  agents: Agent[];
}

interface WorkspaceStats {
  totalTasks: number;
  openTasks: number;
  inProgressTasks: number;
  closedTasks: number;
  totalAgents: number;
  activeAgents: number;
  totalProjects: number;
  tasksByProject: Record<string, number>;
  tasksByAgent: Record<string, number>;
}

interface CreateWorkspaceInput {
  name: string;
  description?: string;
}

// ═══════════════════════════════════════════════════
// Project
// ═══════════════════════════════════════════════════

type SyncStatus = 'idle' | 'syncing' | 'error';

interface Project {
  id: UUID;
  workspaceId: UUID;
  name: string;
  repoOwner: string;
  repoName: string;
  syncStatus: SyncStatus;
  lastSyncedAt: ISODateTime | null;
  createdAt: ISODateTime;
}

interface ProjectDetail extends Project {
  taskCount: number;
}

interface ProjectWithWebhook extends Project {
  webhookUrl: string;
  webhookSecret: string;
}

interface CreateProjectInput {
  name: string;
  repoOwner: string;
  repoName: string;
}

// ═══════════════════════════════════════════════════
// Task
// ═══════════════════════════════════════════════════

type TaskStatus = 'open' | 'in_progress' | 'closed';

interface Task {
  id: UUID;
  projectId: UUID;
  issueNumber: number;
  title: string;
  body?: string;
  labels: GitHubLabel[];
  status: TaskStatus;
  githubAssignee: string | null;
  githubUrl: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface TaskWithAssignment extends Task {
  currentAssignment: Assignment | null;
}

interface TaskDetail extends TaskWithAssignment {
  assignments: Assignment[];
  project: Project;
}

// ═══════════════════════════════════════════════════
// Agent
// ═══════════════════════════════════════════════════

type AgentStatus = 'active' | 'paused' | 'offline';

interface Agent {
  id: UUID;
  workspaceId: UUID;
  name: string;
  role: string;
  description?: string;
  modelName: string;
  capabilityTags: string[];
  skills: string[];
  githubBotAccount?: string;
  status: AgentStatus;
  createdAt: ISODateTime;
}

interface AgentStats {
  totalAssignments: number;
  completedAssignments: number;
  failedAssignments: number;
  avgDurationMs: number;
}

interface AgentDetail extends Agent {
  stats: AgentStats;
}

interface CreateAgentInput {
  name: string;
  role: string;
  description?: string;
  modelName: string;
  capabilityTags: string[];
  skills?: string[];
  githubBotAccount?: string;
}

interface UpdateAgentInput {
  name?: string;
  description?: string;
  modelName?: string;
  capabilityTags?: string[];
  skills?: string[];
  status?: AgentStatus;
}

// ═══════════════════════════════════════════════════
// Assignment
// ═══════════════════════════════════════════════════

type AssignmentStatus = 'pending' | 'running' | 'done' | 'failed';

interface Assignment {
  id: UUID;
  taskId: UUID;
  agentId: UUID;
  status: AssignmentStatus;
  modelUsed?: string;
  resultSummary?: string;
  githubCommentId?: number;
  assignedAt: ISODateTime;
  startedAt?: ISODateTime;
  completedAt?: ISODateTime;
  agent?: Agent;
}

interface CreateAssignmentInput {
  taskId: UUID;
  agentId: UUID;
  instruction?: string;
}

// ═══════════════════════════════════════════════════
// GitHub Webhook Events
// ═══════════════════════════════════════════════════

type GitHubWebhookEvent =
  | 'issues.opened'
  | 'issues.closed'
  | 'issues.reopened'
  | 'issues.labeled'
  | 'issues.unlabeled'
  | 'issues.assigned'
  | 'issues.edited';

interface GitHubWebhookPayload {
  action: string;
  issue: {
    number: number;
    title: string;
    body: string | null;
    state: 'open' | 'closed';
    labels: Array<{ name: string }>;
    assignee: { login: string } | null;
    html_url: string;
    created_at: string;
    updated_at: string;
  };
  repository: {
    owner: { login: string };
    name: string;
    full_name: string;
  };
  sender: {
    login: string;
  };
}

// ═══════════════════════════════════════════════════
// API Response Wrappers
// ═══════════════════════════════════════════════════

interface PaginatedResponse<T> {
  total: number;
  items: T[];
}

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════
// Query Params
// ═══════════════════════════════════════════════════

interface TaskQueryParams {
  status?: TaskStatus;
  projectId?: UUID;
  agentId?: UUID;
  label?: string;
  limit?: number;
  offset?: number;
}

interface AgentAssignmentQueryParams {
  status?: AssignmentStatus;
}

// ═══════════════════════════════════════════════════
// Label → Agent 路由规则
// ═══════════════════════════════════════════════════

interface RoutingRule {
  /** GitHub Label 名称 */
  label: string;
  /** 匹配的 Agent ID */
  agentId: UUID;
  /** 优先级（数字越大优先级越高） */
  priority: number;
}

// 路由匹配结果
interface MatchResult {
  matched: boolean;
  agentId?: UUID;
  agentName?: string;
  matchedLabel?: string;
  candidates?: Array<{
    agentId: UUID;
    agentName: string;
    label: string;
    priority: number;
  }>;
}
```
