/** Task status machine + GitHub sync priority (aligns with docs/states/task-states.yaml) */

export type TaskStatus = "backlog" | "in_progress" | "in_review" | "done";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "status:backlog",
  in_progress: "status:in-progress",
  in_review: "status:in-review",
  done: "status:done",
};

const LABEL_TO_STATUS: Record<string, TaskStatus> = {
  "status:backlog": "backlog",
  "status:in-progress": "in_progress",
  "status:in_review": "in_review",
  "status:done": "done",
};

export const WIP_LIMITS: Partial<Record<TaskStatus, number>> = {
  in_progress: 5,
  in_review: 3,
};

export const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  backlog: ["in_progress"],
  in_progress: ["backlog", "in_review", "done"],
  in_review: ["in_progress", "done"],
  done: ["in_progress"],
};

export function isTaskStatus(s: string): s is TaskStatus {
  return s in ALLOWED_TRANSITIONS;
}

/** Parse status:* labels; on conflict pick lexicographically first label name. */
export function statusFromLabels(labels: string[]): TaskStatus | null {
  const hits = labels
    .filter((l) => l in LABEL_TO_STATUS)
    .sort((a, b) => a.localeCompare(b));
  if (hits.length === 0) return null;
  return LABEL_TO_STATUS[hits[0]];
}

/**
 * Sync resolve priority:
 * 1. closed → done
 * 2. status:* label → that column
 * 3. running assignment → in_progress
 * 4. keep local in_progress / in_review
 * 5. backlog
 */
export function resolveSyncedStatus(opts: {
  githubState: string;
  labels: string[];
  hasRunningAssignment: boolean;
  localStatus: TaskStatus | null;
}): TaskStatus {
  if (opts.githubState === "closed") return "done";

  const fromLabel = statusFromLabels(opts.labels);
  if (fromLabel) return fromLabel;

  if (opts.hasRunningAssignment) return "in_progress";

  if (opts.localStatus === "in_progress" || opts.localStatus === "in_review") {
    return opts.localStatus;
  }

  return "backlog";
}

export function isTransitionAllowed(from: TaskStatus, to: TaskStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function statusLabelFor(status: TaskStatus): string {
  return STATUS_LABELS[status];
}

/** Replace status:* labels with the one matching target status. */
export function mergeStatusLabel(labels: string[], status: TaskStatus): string[] {
  const without = labels.filter((l) => !(l in LABEL_TO_STATUS));
  return [...without, STATUS_LABELS[status]].sort((a, b) => a.localeCompare(b));
}
