import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@innate/ui'
import { PlusIcon, SearchIcon } from 'lucide-react'
import type { Agent, TaskPriority } from '@agent-kanban/core'

export interface KanbanFilters {
  query: string
  assigneeId: string | 'all'
  priority: TaskPriority | 'all'
}

interface KanbanToolbarProps {
  filters: KanbanFilters
  agents: Agent[]
  readOnly?: boolean
  onFiltersChange: (filters: KanbanFilters) => void
  onNewTask?: () => void
}

export function KanbanToolbar({
  filters,
  agents,
  readOnly = false,
  onFiltersChange,
  onNewTask,
}: KanbanToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.query}
          onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
          placeholder="搜索任务标题或标签…"
          className="w-56 pl-8"
        />
      </div>

      <Select
        value={filters.assigneeId}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, assigneeId: value as KanbanFilters['assigneeId'] })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="全部 Agent" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部 Agent</SelectItem>
          {agents.map((agent) => (
            <SelectItem key={agent.id} value={agent.id}>
              {agent.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, priority: value as KanbanFilters['priority'] })
        }
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="全部优先级" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部优先级</SelectItem>
          <SelectItem value="urgent">紧急</SelectItem>
          <SelectItem value="high">高</SelectItem>
          <SelectItem value="medium">中</SelectItem>
          <SelectItem value="low">低</SelectItem>
        </SelectContent>
      </Select>

      <div className="ml-auto">
        {!readOnly && (
          <Button onClick={onNewTask}>
            <PlusIcon data-icon="inline-start" />
            新建任务
          </Button>
        )}
      </div>
    </div>
  )
}
