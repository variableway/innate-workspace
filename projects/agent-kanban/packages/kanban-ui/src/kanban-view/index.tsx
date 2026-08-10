import { Button, Skeleton } from '@innate/ui'
import { RefreshCwIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  applyMove,
  createTask,
  type KanbanBoardData,
  type KanbanTask,
  type MoveRequest,
  type TaskStatus,
} from '@agent-kanban/core'
import { KanbanBoard, type KanbanMoveEvent } from '../kanban-board'
import { KanbanToolbar, type KanbanFilters } from '../kanban-toolbar'
import { NewTaskDialog, type NewTaskInput } from '../new-task-dialog'
import { TaskDetailSheet } from '../task-detail-sheet'
import { STATUS_LABEL } from '../utils'

export type KanbanViewStatus = 'ready' | 'loading' | 'error'

interface KanbanViewProps {
  data: KanbanBoardData
  /** 演示/对接状态：loading 骨架、error 重试 */
  status?: KanbanViewStatus
  readOnly?: boolean
  onRetry?: () => void
  /** 跨列流转持久化（API）；失败时回滚并 toast */
  onPersistMove?: (request: MoveRequest) => Promise<void>
  /** 关闭本地新建（接真实 API 时） */
  allowCreate?: boolean
}

export function KanbanView({
  data,
  status = 'ready',
  readOnly = false,
  onRetry,
  onPersistMove,
  allowCreate = true,
}: KanbanViewProps) {
  const [tasks, setTasks] = useState<KanbanTask[]>(data.tasks)
  const [filters, setFilters] = useState<KanbanFilters>({
    query: '',
    assigneeId: 'all',
    priority: 'all',
  })
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [newTaskOpen, setNewTaskOpen] = useState(false)

  useEffect(() => {
    setTasks(data.tasks)
  }, [data.tasks])

  const filtersActive =
    filters.query.trim() !== '' || filters.assigneeId !== 'all' || filters.priority !== 'all'

  const visibleTasks = useMemo(() => {
    const query = filters.query.trim().toLowerCase()
    return tasks.filter((task) => {
      if (filters.assigneeId !== 'all' && task.assigneeId !== filters.assigneeId) return false
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false
      if (
        query &&
        !task.title.toLowerCase().includes(query) &&
        !task.tags.some((tag) => tag.toLowerCase().includes(query))
      ) {
        return false
      }
      return true
    })
  }, [tasks, filters])

  const agentById = new Map(data.agents.map((a) => [a.id, a]))
  const selectedTask = selectedTaskId
    ? (tasks.find((t) => t.id === selectedTaskId) ?? null)
    : null

  const handleMove = async ({ taskId, to, toIndex }: KanbanMoveEvent) => {
    const task = tasks.find((t) => t.id === taskId)
    const prev = tasks
    const result = applyMove(tasks, data.columns, { taskId, to, toIndex })
    if (!result.ok) {
      toast.error('无法移动任务', { description: result.message })
      return
    }
    setTasks(result.tasks)

    if (task && task.status !== to && onPersistMove) {
      try {
        await onPersistMove({ taskId, to: to as TaskStatus, toIndex })
      } catch (err) {
        setTasks(prev)
        toast.error('同步失败，已回滚', {
          description: err instanceof Error ? err.message : String(err),
        })
        return
      }
    }

    if (task && task.status !== to) {
      toast.success(`已移动到「${STATUS_LABEL[to]}」`, {
        description: result.task.title,
      })
    }
  }

  const handleCreateTask = (input: NewTaskInput) => {
    const result = createTask(tasks, {
      title: input.title,
      description: input.description,
      priority: input.priority,
      assigneeId: input.assigneeId,
      creator: '当前用户',
      dueDate: input.dueDate,
    })
    setTasks(result.tasks)
    toast.success('任务已创建', { description: result.task.title })
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-9 w-full max-w-xl" />
        <div className="flex flex-1 gap-3">
          {data.columns.map((column) => (
            <div key={column.id} className="flex w-72 shrink-0 flex-col gap-2">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-sm font-medium">任务数据加载失败</p>
        <p className="text-sm text-muted-foreground">请检查网络连接或稍后重试。</p>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCwIcon data-icon="inline-start" />
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <KanbanToolbar
        filters={filters}
        agents={data.agents}
        readOnly={readOnly || !allowCreate}
        onFiltersChange={setFilters}
        onNewTask={() => setNewTaskOpen(true)}
      />

      <KanbanBoard
        columns={data.columns}
        tasks={visibleTasks}
        agents={data.agents}
        readOnly={readOnly}
        filtersActive={filtersActive}
        onMove={handleMove}
        onOpenTask={(task) => setSelectedTaskId(task.id)}
      />

      <TaskDetailSheet
        task={selectedTask}
        assignee={selectedTask ? agentById.get(selectedTask.assigneeId) : undefined}
        open={selectedTask !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTaskId(null)
        }}
      />

      {allowCreate ? (
        <NewTaskDialog
          agents={data.agents}
          open={newTaskOpen}
          onOpenChange={setNewTaskOpen}
          onSubmit={handleCreateTask}
        />
      ) : null}
    </div>
  )
}
