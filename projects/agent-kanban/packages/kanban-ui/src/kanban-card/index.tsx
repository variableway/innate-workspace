import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Avatar, AvatarFallback, Badge, Card, CardContent, cn } from '@innate/ui'
import { CalendarIcon, CircleAlertIcon, GripVerticalIcon } from 'lucide-react'
import type { Agent, KanbanTask } from '@agent-kanban/core'
import { PRIORITY_META, formatDate, isOverdue } from '../utils'

interface KanbanCardProps {
  task: KanbanTask
  assignee?: Agent
  readOnly?: boolean
  onOpen?: (task: KanbanTask) => void
}

export function KanbanCard({ task, assignee, readOnly = false, onOpen }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: readOnly })

  const priority = PRIORITY_META[task.priority]
  const overdue = isOverdue(task.dueDate, task.status)

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'gap-2 py-3 shadow-xs transition-colors hover:border-foreground/20',
        isDragging && 'z-20 opacity-70 shadow-md ring-2 ring-ring/40',
        task.blocked && 'border-destructive/40',
      )}
      onClick={() => onOpen?.(task)}
    >
      <CardContent className="flex flex-col gap-2 px-3">
        <div className="flex items-start gap-1.5">
          {!readOnly && (
            <button
              type="button"
              aria-label="拖拽排序"
              className="mt-0.5 cursor-grab touch-none text-muted-foreground/60 hover:text-muted-foreground active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
              {...attributes}
              {...listeners}
            >
              <GripVerticalIcon data-icon />
            </button>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <span className="line-clamp-2 text-[13px] font-medium leading-snug">
                {task.title}
              </span>
              <Badge className={cn('shrink-0 border-transparent', priority.className)}>
                {priority.label}
              </Badge>
            </div>
            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="muted" className="text-[11px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pl-6 text-xs text-muted-foreground">
          <div className="flex min-w-0 items-center gap-1.5">
            <Avatar size="sm">
              <AvatarFallback>{assignee?.initials ?? '?'}</AvatarFallback>
            </Avatar>
            <span className="truncate">{assignee?.name ?? '未分配'}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {task.blocked && (
              <span className="flex items-center gap-0.5 text-destructive">
                <CircleAlertIcon data-icon />
                阻塞
              </span>
            )}
            {task.dueDate && (
              <span
                className={cn(
                  'flex items-center gap-0.5',
                  overdue && 'font-medium text-destructive',
                )}
              >
                <CalendarIcon data-icon />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
