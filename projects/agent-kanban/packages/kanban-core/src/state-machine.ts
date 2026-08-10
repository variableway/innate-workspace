import type {
  KanbanColumnDef,
  KanbanTask,
  MoveRequest,
  MoveResult,
  TaskStatus,
  TransitionRecord,
} from './types'

/** 看板列定义（WIP 上限为硬阻断规则） */
export const DEFAULT_COLUMNS: KanbanColumnDef[] = [
  { id: 'backlog', title: '待规划' },
  { id: 'in_progress', title: '进行中', wipLimit: 5 },
  { id: 'in_review', title: '待审核', wipLimit: 3 },
  { id: 'done', title: '已完成' },
]

/** 允许的状态流转（blocked 卡片不允许离开当前列） */
const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  backlog: ['in_progress'],
  in_progress: ['backlog', 'in_review', 'done'],
  in_review: ['in_progress', 'done'],
  done: ['in_progress'],
}

export function isTransitionAllowed(from: TaskStatus, to: TaskStatus): boolean {
  if (from === to) return true
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

export function getColumnWipLimit(
  columns: KanbanColumnDef[],
  status: TaskStatus,
): number | undefined {
  return columns.find((c) => c.id === status)?.wipLimit
}

export function countByStatus(tasks: KanbanTask[], status: TaskStatus): number {
  return tasks.filter((t) => t.status === status).length
}

/** 目标列是否已达 WIP 上限 */
export function isWipExceeded(
  tasks: KanbanTask[],
  columns: KanbanColumnDef[],
  status: TaskStatus,
): boolean {
  const limit = getColumnWipLimit(columns, status)
  if (limit === undefined) return false
  return countByStatus(tasks, status) >= limit
}

export function columnTasks(tasks: KanbanTask[], status: TaskStatus): KanbanTask[] {
  return tasks.filter((t) => t.status === status)
}

let seq = 0
function nextId(prefix: string): string {
  seq += 1
  return `${prefix}-${Date.now().toString(36)}-${seq}`
}

/**
 * 状态机：校验并执行一次流转。
 * - 同列移动（排序）总是允许；
 * - 跨列移动需通过流转白名单 + WIP 上限校验（硬阻断）；
 * - 成功后写入 history 流转记录并更新 updatedAt。
 */
export function applyMove(
  tasks: KanbanTask[],
  columns: KanbanColumnDef[],
  request: MoveRequest,
  now: string = new Date().toISOString(),
): MoveResult {
  const task = tasks.find((t) => t.id === request.taskId)
  if (!task) {
    return { ok: false, reason: 'task-not-found', message: '任务不存在或已被删除' }
  }

  const from = task.status
  const to = request.to

  if (from !== to) {
    if (task.blocked) {
      return {
        ok: false,
        reason: 'invalid-transition',
        message: '任务处于阻塞状态，请先解除阻塞',
      }
    }
    if (!isTransitionAllowed(from, to)) {
      return {
        ok: false,
        reason: 'invalid-transition',
        message: `不支持从「${from}」直接流转到「${to}」`,
      }
    }
    if (isWipExceeded(tasks, columns, to)) {
      const limit = getColumnWipLimit(columns, to)
      const column = columns.find((c) => c.id === to)
      return {
        ok: false,
        reason: 'wip-limit',
        message: `「${column?.title ?? to}」已达在制品上限（${limit}），请先完成或移出部分任务`,
      }
    }
  }

  const record: TransitionRecord = {
    id: nextId('tr'),
    from: from === to ? task.status : from,
    to,
    at: now,
  }

  const moved: KanbanTask = {
    ...task,
    status: to,
    updatedAt: now,
    history: from === to ? task.history : [...task.history, record],
  }

  const rest = tasks.filter((t) => t.id !== task.id)
  const targetColumnTasks = rest.filter((t) => t.status === to)
  const insertAt =
    request.toIndex === undefined
      ? targetColumnTasks.length
      : Math.max(0, Math.min(request.toIndex, targetColumnTasks.length))

  let inserted = 0
  const next: KanbanTask[] = []
  for (const t of rest) {
    if (t.status === to && inserted === 0 && targetColumnTasks.indexOf(t) === insertAt) {
      next.push(moved)
      inserted = 1
    }
    next.push(t)
  }
  if (!inserted) next.push(moved)

  return { ok: true, tasks: next, task: moved }
}

/** 新建任务（默认进入 backlog 列尾） */
export function createTask(
  tasks: KanbanTask[],
  input: Pick<KanbanTask, 'title' | 'description' | 'priority' | 'assigneeId' | 'creator'> &
    Partial<Pick<KanbanTask, 'dueDate' | 'tags'>>,
  now: string = new Date().toISOString(),
): { tasks: KanbanTask[]; task: KanbanTask } {
  const task: KanbanTask = {
    id: nextId('task'),
    title: input.title,
    description: input.description,
    status: 'backlog',
    priority: input.priority,
    assigneeId: input.assigneeId,
    creator: input.creator,
    dueDate: input.dueDate,
    tags: input.tags ?? [],
    blocked: false,
    createdAt: now,
    updatedAt: now,
    history: [{ id: nextId('tr'), from: null, to: 'backlog', at: now }],
  }
  return { tasks: [...tasks, task], task }
}
