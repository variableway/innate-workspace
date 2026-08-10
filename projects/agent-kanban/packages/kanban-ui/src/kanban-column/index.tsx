import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Badge, Empty, EmptyDescription, EmptyMedia, EmptyTitle, cn } from '@innate/ui'
import { InboxIcon } from 'lucide-react'
import type { Agent, KanbanColumnDef, KanbanTask } from '@agent-kanban/core'
import { KanbanCard } from '../kanban-card'

interface KanbanColumnProps {
  column: KanbanColumnDef
  tasks: KanbanTask[]
  agents: Agent[]
  readOnly?: boolean
  /** 拖拽悬停在该列上（用于 WIP 已满时的警告高亮） */
  isDragActive?: boolean
  onOpenTask?: (task: KanbanTask) => void
}

export function KanbanColumn({
  column,
  tasks,
  agents,
  readOnly = false,
  isDragActive = false,
  onOpenTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${column.id}` })

  const isFull = column.wipLimit !== undefined && tasks.length >= column.wipLimit
  const agentById = new Map(agents.map((a) => [a.id, a]))

  return (
    <section
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-xl border bg-muted/40 transition-colors',
        isOver && !isFull && 'border-ring/50 bg-accent',
        isOver && isFull && 'border-destructive/50 bg-destructive/5',
      )}
    >
      <header className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium">{column.title}</h2>
          <Badge variant={isFull ? 'destructive' : 'muted'}>
            {tasks.length}
            {column.wipLimit !== undefined && ` / ${column.wipLimit}`}
          </Badge>
        </div>
        {isFull && isDragActive && (
          <span className="text-[11px] text-destructive">已达上限</span>
        )}
      </header>

      <div
        ref={setNodeRef}
        className="flex min-h-32 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2"
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              assignee={agentById.get(task.assigneeId)}
              readOnly={readOnly}
              onOpen={onOpenTask}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <Empty className="gap-2 border-dashed py-6">
            <EmptyMedia variant="icon">
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle className="text-xs">暂无任务</EmptyTitle>
            <EmptyDescription className="text-[11px]">
              将卡片拖到这里，或新建任务
            </EmptyDescription>
          </Empty>
        )}
      </div>
    </section>
  )
}
