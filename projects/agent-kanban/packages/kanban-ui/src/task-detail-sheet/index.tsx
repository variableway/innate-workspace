import {
  Avatar,
  AvatarFallback,
  Badge,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  cn,
} from '@innate/ui'
import { ArrowRightIcon, CalendarIcon, CircleAlertIcon, TerminalIcon } from 'lucide-react'
import type { Agent, KanbanTask } from '@agent-kanban/core'
import { PRIORITY_META, STATUS_LABEL, formatDate, formatDateTime } from '../utils'

interface TaskDetailSheetProps {
  task: KanbanTask | null
  assignee?: Agent
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailSheet({ task, assignee, open, onOpenChange }: TaskDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        {task && (
          <div className="flex h-full flex-col gap-5 overflow-y-auto p-6">
            <SheetHeader className="p-0">
              <div className="flex items-center gap-2">
                <Badge className={cn('border-transparent', PRIORITY_META[task.priority].className)}>
                  {PRIORITY_META[task.priority].label}
                </Badge>
                <Badge variant="outline">{STATUS_LABEL[task.status]}</Badge>
                {task.blocked && (
                  <Badge variant="destructive">
                    <CircleAlertIcon data-icon="inline-start" />
                    阻塞
                  </Badge>
                )}
              </div>
              <SheetTitle className="text-base leading-snug">{task.title}</SheetTitle>
              <SheetDescription className="text-xs">编号 {task.id}</SheetDescription>
            </SheetHeader>

            <section className="flex flex-col gap-2 text-sm">
              <h3 className="text-xs font-medium text-muted-foreground">描述</h3>
              <p className="leading-relaxed">{task.description || '（无描述）'}</p>
            </section>

            <Separator />

            <section className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">负责 Agent</span>
                <span className="flex items-center gap-1.5">
                  <Avatar size="sm">
                    <AvatarFallback>{assignee?.initials ?? '?'}</AvatarFallback>
                  </Avatar>
                  {assignee?.name ?? '未分配'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">创建人</span>
                <span>{task.creator}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">截止日期</span>
                <span className="flex items-center gap-1">
                  <CalendarIcon data-icon className="text-muted-foreground" />
                  {task.dueDate ? formatDate(task.dueDate) : '未设置'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">最近更新</span>
                <span>{formatDateTime(task.updatedAt)}</span>
              </div>
            </section>

            {task.tags.length > 0 && (
              <section className="flex flex-wrap gap-1">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="muted">
                    {tag}
                  </Badge>
                ))}
              </section>
            )}

            {task.logSummary && (
              <>
                <Separator />
                <section className="flex flex-col gap-2">
                  <h3 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <TerminalIcon data-icon />
                    运行日志摘要
                  </h3>
                  <div className="rounded-lg bg-muted/60 p-3 text-[13px] leading-relaxed text-muted-foreground">
                    {task.logSummary}
                  </div>
                </section>
              </>
            )}

            <Separator />

            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-medium text-muted-foreground">流转记录</h3>
              <ol className="flex flex-col gap-3">
                {task.history.map((record) => (
                  <li key={record.id} className="flex items-start gap-2 text-[13px]">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                    <div className="flex flex-col gap-0.5">
                      <span>
                        {record.from === null ? (
                          <>创建于「{STATUS_LABEL[record.to]}」</>
                        ) : (
                          <span className="flex items-center gap-1">
                            {STATUS_LABEL[record.from]}
                            <ArrowRightIcon data-icon className="text-muted-foreground" />
                            {STATUS_LABEL[record.to]}
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(record.at)}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
