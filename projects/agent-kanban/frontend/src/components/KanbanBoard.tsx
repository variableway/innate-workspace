import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_COLUMNS,
  type Agent as BoardAgent,
  type KanbanBoardData,
  type KanbanTask,
  type TaskPriority,
} from "@agent-kanban/core";
import { KanbanView } from "@agent-kanban/ui";
import { Toaster } from "sonner";
import { api, type Agent, type Task } from "../api/client.js";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

function mapAgent(a: Agent): BoardAgent {
  return {
    id: a.id,
    name: a.name,
    initials: initials(a.name),
    role: a.role,
  };
}

function mapTask(t: Task): KanbanTask {
  const assigneeId = t.currentAssignment?.agentId ?? "";
  return {
    id: t.id,
    title: t.title,
    description: t.body || "",
    status: t.status,
    priority: "medium" as TaskPriority,
    assigneeId,
    creator: t.githubAssignee ?? "github",
    tags: t.labels ?? [],
    blocked: false,
    logSummary: t.currentAssignment?.resultSummary ?? undefined,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    history: [],
    githubUrl: t.githubUrl,
    projectName: t.projectName,
    issueNumber: t.issueNumber,
  };
}

export function KanbanBoard({
  workspaceId,
  onStatsRefresh,
}: {
  workspaceId: string;
  onStatsRefresh: () => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [taskRes, agentList] = await Promise.all([
        api.listTasks(workspaceId, { limit: "200" }),
        api.listAgents(workspaceId),
      ]);
      setTasks(taskRes.items);
      setAgents(agentList);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 15000);
    return () => clearInterval(timer);
  }, [loadData]);

  const boardData: KanbanBoardData = useMemo(
    () => ({
      columns: DEFAULT_COLUMNS,
      tasks: tasks.map(mapTask),
      agents: agents.map(mapAgent),
    }),
    [tasks, agents],
  );

  const status = loading ? "loading" : error ? "error" : "ready";

  return (
    <div className="kanban-shell">
      <Toaster position="top-center" richColors />
      <KanbanView
        data={boardData}
        status={status}
        allowCreate={false}
        onRetry={loadData}
        onPersistMove={async ({ taskId, to }) => {
          await api.patchTask(taskId, to);
          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, status: to } : t)),
          );
          onStatsRefresh();
        }}
      />
    </div>
  );
}
