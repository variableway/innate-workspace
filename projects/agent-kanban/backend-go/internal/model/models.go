package model

import "encoding/json"

// Workspace corresponds to kanban_workspace table.
type Workspace struct {
	ID          string `json:"id" db:"id"`
	Name        string `json:"name" db:"name"`
	Description string `json:"description" db:"description"`
	UserID      *string `json:"userId" db:"user_id"`
	CreatedAt   string `json:"createdAt" db:"created_at"`
	UpdatedAt   string `json:"updatedAt" db:"updated_at"`
}

// Project corresponds to kanban_project table.
type Project struct {
	ID             string  `json:"id" db:"id"`
	WorkspaceID    string  `json:"workspaceId" db:"workspace_id"`
	Name           string  `json:"name" db:"name"`
	RepoOwner      string  `json:"repoOwner" db:"repo_owner"`
	RepoName       string  `json:"repoName" db:"repo_name"`
	WebhookSecret  *string `json:"webhookSecret,omitempty" db:"webhook_secret"`
	SyncStatus     string  `json:"syncStatus" db:"sync_status"`
	LastSyncedAt   *string `json:"lastSyncedAt" db:"last_synced_at"`
	CreatedAt      string  `json:"createdAt" db:"created_at"`
}

// Task corresponds to kanban_task table.
type Task struct {
	ID              string   `json:"id" db:"id"`
	ProjectID       string   `json:"projectId" db:"project_id"`
	IssueNumber     int      `json:"issueNumber" db:"issue_number"`
	Title           string   `json:"title" db:"title"`
	Body            string   `json:"body" db:"body"`
	Labels          []string `json:"labels" db:"-"`
	Status          string   `json:"status" db:"status"`
	GitHubAssignee  *string  `json:"githubAssignee" db:"github_assignee"`
	GitHubURL       string   `json:"githubUrl" db:"github_url"`
	CreatedAt       string   `json:"createdAt" db:"created_at"`
	UpdatedAt       string   `json:"updatedAt" db:"updated_at"`
}

// Agent corresponds to kanban_agent table.
type Agent struct {
	ID               string   `json:"id" db:"id"`
	WorkspaceID      string   `json:"workspaceId" db:"workspace_id"`
	Name             string   `json:"name" db:"name"`
	Role             string   `json:"role" db:"role"`
	Description      string   `json:"description" db:"description"`
	ModelName        string   `json:"modelName" db:"model_name"`
	CapabilityTags   []string `json:"capabilityTags" db:"-"`
	Skills           []string `json:"skills" db:"-"`
	GitHubBotAccount *string  `json:"githubBotAccount" db:"github_bot_account"`
	Status           string   `json:"status" db:"status"`
	MaxConcurrency   int      `json:"maxConcurrency" db:"max_concurrency"`
	CreatedAt        string   `json:"createdAt" db:"created_at"`
}

// Assignment corresponds to kanban_assignment table.
type Assignment struct {
	ID              string  `json:"id" db:"id"`
	TaskID          string  `json:"taskId" db:"task_id"`
	AgentID         string  `json:"agentId" db:"agent_id"`
	Status          string  `json:"status" db:"status"`
	ModelUsed       *string `json:"modelUsed" db:"model_used"`
	ResultSummary   *string `json:"resultSummary" db:"result_summary"`
	Instruction     *string `json:"instruction" db:"instruction"`
	GitHubCommentID *int    `json:"githubCommentId" db:"github_comment_id"`
	RetryCount      int     `json:"retryCount" db:"retry_count"`
	AssignedAt      string  `json:"assignedAt" db:"assigned_at"`
	StartedAt       *string `json:"startedAt" db:"started_at"`
	CompletedAt     *string `json:"completedAt" db:"completed_at"`
}

// TaskWithAssignment is the composite view for the kanban board.
type TaskWithAssignment struct {
	Task
	ProjectName       string                  `json:"projectName" db:"project_name"`
	RepoOwner         string                  `json:"repoOwner" db:"repo_owner"`
	RepoName          string                  `json:"repoName" db:"repo_name"`
	CurrentAssignment *AssignmentWithAgentInfo `json:"currentAssignment" db:"-"`
}

// AssignmentWithAgentInfo is Assignment + key agent fields.
type AssignmentWithAgentInfo struct {
	Assignment
	AgentName    string `json:"name" db:"agent_name"`
	AgentModel   string `json:"modelName" db:"model_name"`
}

// ParseJSONLabels deserializes the labels JSON string from DB.
func ParseJSONLabels(raw string) []string {
	if raw == "" || raw == "[]" {
		return []string{}
	}
	var labels []string
	if err := json.Unmarshal([]byte(raw), &labels); err != nil {
		return []string{}
	}
	return labels
}

// ParseJSONStringArray deserializes any JSON string array from DB.
func ParseJSONStringArray(raw string) []string {
	return ParseJSONLabels(raw)
}
