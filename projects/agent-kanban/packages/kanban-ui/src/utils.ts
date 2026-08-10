import type { TaskPriority, TaskStatus } from '@agent-kanban/core'

export const PRIORITY_META: Record<TaskPriority, { label: string; className: string }> = {
  urgent: { label: '紧急', className: 'bg-destructive/10 text-destructive dark:bg-destructive/20' },
  high: { label: '高', className: 'bg-warning text-warning-foreground' },
  medium: { label: '中', className: 'bg-info text-info-foreground' },
  low: { label: '低', className: 'bg-muted text-muted-foreground' },
}

export const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: '待规划',
  'in_progress': '进行中',
  'in_review': '待审核',
  done: '已完成',
}

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
})

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso))
}

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate))
}

/** 截止日期是否已过期（且任务未完成） */
export function isOverdue(dueDate: string | undefined, status: TaskStatus): boolean {
  if (!dueDate || status === 'done') return false
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return dueDate < todayStr
}
