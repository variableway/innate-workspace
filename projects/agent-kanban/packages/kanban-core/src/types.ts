/**
 * Agent Kanban 领域类型定义。
 * 对齐 docs/types.ts TaskStatus（API/DB 下划线）。
 */

/** 任务状态 = 看板列 ID（与 docs SSOT 一致） */
export type TaskStatus = 'backlog' | 'in_progress' | 'in_review' | 'done'

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'

export interface Agent {
  id: string
  name: string
  /** Avatar 上的短标识（1~2 字符） */
  initials: string
  /** 一句话职责描述 */
  role: string
}

export interface TransitionRecord {
  id: string
  from: TaskStatus | null
  to: TaskStatus
  /** ISO 8601 时间戳 */
  at: string
}

export interface KanbanTask {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  /** 负责执行的 Agent */
  assigneeId: string
  /** 创建人（人类成员） */
  creator: string
  /** ISO 日期，可选 */
  dueDate?: string
  tags: string[]
  blocked: boolean
  /** 运行日志摘要 */
  logSummary?: string
  createdAt: string
  updatedAt: string
  history: TransitionRecord[]
  /** API 扩展字段（可选） */
  githubUrl?: string
  projectName?: string
  issueNumber?: number
}

export interface KanbanColumnDef {
  id: TaskStatus
  title: string
  /** WIP（在制品）上限；undefined 表示不限制 */
  wipLimit?: number
}

export interface KanbanBoardData {
  columns: KanbanColumnDef[]
  tasks: KanbanTask[]
  agents: Agent[]
}

/** 拖拽流转请求 */
export interface MoveRequest {
  taskId: string
  to: TaskStatus
  /** 目标列内插入位置（可选，缺省追加到列尾） */
  toIndex?: number
}

export type MoveResult =
  | { ok: true; tasks: KanbanTask[]; task: KanbanTask }
  | { ok: false; reason: 'wip-limit' | 'invalid-transition' | 'task-not-found'; message: string }
