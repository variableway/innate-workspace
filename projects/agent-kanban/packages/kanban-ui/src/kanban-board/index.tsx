import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useState } from 'react'
import type { Agent, KanbanColumnDef, KanbanTask, TaskStatus } from '@agent-kanban/core'
import { KanbanCard } from '../kanban-card'
import { KanbanColumn } from '../kanban-column'

/** 优先指针命中（空列也可放置），兜底矩形相交 */
const collisionDetection: CollisionDetection = (args) => {
  const within = pointerWithin(args)
  return within.length > 0 ? within : rectIntersection(args)
}

export interface KanbanMoveEvent {
  taskId: string
  to: TaskStatus
  toIndex?: number
}

interface KanbanBoardProps {
  columns: KanbanColumnDef[]
  /** 已按筛选条件过滤后的任务 */
  tasks: KanbanTask[]
  agents: Agent[]
  readOnly?: boolean
  /** 筛选激活时，跨列移动统一追加到列尾（无法表达精确位置） */
  filtersActive?: boolean
  onMove?: (event: KanbanMoveEvent) => void
  onOpenTask?: (task: KanbanTask) => void
}

export function KanbanBoard({
  columns,
  tasks,
  agents,
  readOnly = false,
  filtersActive = false,
  onMove,
  onOpenTask,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  const agentById = new Map(agents.map((a) => [a.id, a]))

  const handleDragStart = ({ active }: DragStartEvent) => {
    const task = tasks.find((t) => t.id === active.id) ?? null
    setActiveTask(task)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTask(null)
    if (!over || !onMove) return

    const taskId = String(active.id)
    const overId = String(over.id)

    let to: TaskStatus | undefined
    let toIndex: number | undefined

    if (overId.startsWith('column:')) {
      to = overId.slice('column:'.length) as TaskStatus
    } else {
      const overTask = tasks.find((t) => t.id === overId)
      if (!overTask) return
      to = overTask.status
      if (!filtersActive) {
        const columnTaskIds = tasks.filter((t) => t.status === to).map((t) => t.id)
        toIndex = Math.max(0, columnTaskIds.indexOf(overId))
      }
    }

    const task = tasks.find((t) => t.id === taskId)
    if (!task || !to) return
    if (task.status === to && toIndex === undefined) return

    onMove({ taskId, to, toIndex })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="flex flex-1 items-stretch gap-3 overflow-x-auto pb-2">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasks.filter((t) => t.status === column.id)}
            agents={agents}
            readOnly={readOnly}
            isDragActive={activeTask !== null}
            onOpenTask={onOpenTask}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="w-72 rotate-2">
            <KanbanCard
              task={activeTask}
              assignee={agentById.get(activeTask.assigneeId)}
              readOnly
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
