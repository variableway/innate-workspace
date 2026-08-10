import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@innate/ui'
import { useState } from 'react'
import type { Agent, TaskPriority } from '@agent-kanban/core'

export interface NewTaskInput {
  title: string
  description: string
  priority: TaskPriority
  assigneeId: string
  dueDate?: string
}

interface NewTaskDialogProps {
  agents: Agent[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: NewTaskInput) => void
}

export function NewTaskDialog({ agents, open, onOpenChange, onSubmit }: NewTaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [assigneeId, setAssigneeId] = useState(agents[0]?.id ?? '')
  const [dueDate, setDueDate] = useState('')

  const reset = () => {
    setTitle('')
    setDescription('')
    setPriority('medium')
    setAssigneeId(agents[0]?.id ?? '')
    setDueDate('')
  }

  const handleSubmit = () => {
    if (!title.trim() || !assigneeId) return
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      assigneeId,
      dueDate: dueDate || undefined,
    })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-6">
        <DialogHeader>
          <DialogTitle>新建任务</DialogTitle>
          <DialogDescription>任务将进入「待规划」列，可随时拖拽调整。</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-task-title">标题</Label>
            <Input
              id="new-task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="一句话说明要做什么"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-task-desc">描述</Label>
            <Textarea
              id="new-task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="背景、目标、验收口径…"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>优先级</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">紧急</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>负责 Agent</Label>
              <Select value={assigneeId} onValueChange={(v) => setAssigneeId(v as string)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择 Agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name} · {agent.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-task-due">截止日期（可选）</Label>
            <Input
              id="new-task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !assigneeId}>
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
