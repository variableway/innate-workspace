package taskstatus

import "sort"

// TaskStatus is the 4-column board status.
type TaskStatus string

const (
	Backlog    TaskStatus = "backlog"
	InProgress TaskStatus = "in_progress"
	InReview   TaskStatus = "in_review"
	Done       TaskStatus = "done"
)

var StatusLabels = map[TaskStatus]string{
	Backlog:    "status:backlog",
	InProgress: "status:in-progress",
	InReview:   "status:in-review",
	Done:       "status:done",
}

var labelToStatus = map[string]TaskStatus{
	"status:backlog":     Backlog,
	"status:in-progress": InProgress,
	"status:in-review":   InReview,
	"status:done":        Done,
}

var WIPLimits = map[TaskStatus]int{
	InProgress: 5,
	InReview:   3,
}

var AllowedTransitions = map[TaskStatus][]TaskStatus{
	Backlog:    {InProgress},
	InProgress: {Backlog, InReview, Done},
	InReview:   {InProgress, Done},
	Done:       {InProgress},
}

func Valid(s string) bool {
	_, ok := AllowedTransitions[TaskStatus(s)]
	return ok
}

func Parse(s string) (TaskStatus, bool) {
	st := TaskStatus(s)
	_, ok := AllowedTransitions[st]
	return st, ok
}

// StatusFromLabels picks status:* labels; on conflict uses lexicographically first.
func StatusFromLabels(labels []string) (TaskStatus, bool) {
	var hits []string
	for _, l := range labels {
		if _, ok := labelToStatus[l]; ok {
			hits = append(hits, l)
		}
	}
	if len(hits) == 0 {
		return "", false
	}
	sort.Strings(hits)
	return labelToStatus[hits[0]], true
}

// ResolveSyncedStatus implements the 1+2+3 priority stack.
func ResolveSyncedStatus(githubState string, labels []string, hasRunningAssignment bool, localStatus *TaskStatus) TaskStatus {
	if githubState == "closed" {
		return Done
	}
	if st, ok := StatusFromLabels(labels); ok {
		return st
	}
	if hasRunningAssignment {
		return InProgress
	}
	if localStatus != nil && (*localStatus == InProgress || *localStatus == InReview) {
		return *localStatus
	}
	return Backlog
}

func IsTransitionAllowed(from, to TaskStatus) bool {
	if from == to {
		return true
	}
	for _, t := range AllowedTransitions[from] {
		if t == to {
			return true
		}
	}
	return false
}

// MergeStatusLabel replaces status:* labels with the one for target status.
func MergeStatusLabel(labels []string, status TaskStatus) []string {
	out := make([]string, 0, len(labels)+1)
	for _, l := range labels {
		if _, ok := labelToStatus[l]; !ok {
			out = append(out, l)
		}
	}
	out = append(out, StatusLabels[status])
	sort.Strings(out)
	return out
}
