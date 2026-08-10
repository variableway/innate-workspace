package store

import (
	"fmt"

	"github.com/innate/agent-kanban/backend-go/internal/model"
)

// ── GitHub Sync helpers ─────────────────────────────────────────

// FindProjectByRepo looks up a project by GitHub owner/repo.
func (s *Store) FindProjectByRepo(owner, name string) (*model.Project, error) {
	var p model.Project
	err := s.db.Get(&p, "SELECT * FROM kanban_project WHERE repo_owner = ? AND repo_name = ?", owner, name)
	if err != nil {
		// Return nil, nil if not found (not an error for webhook)
		return nil, nil
	}
	return &p, nil
}

// UpsertTaskInput holds fields for upserting a task from GitHub.
type UpsertTaskInput struct {
	ProjectID      string
	IssueNumber    int
	Title          string
	Body           string
	Labels         string // JSON array
	Status         string
	GitHubAssignee *string
	GitHubURL      string
}

// UpsertTask creates or updates a task from a GitHub Issue.
func (s *Store) UpsertTask(in UpsertTaskInput) error {
	_, err := s.db.Exec(`
		INSERT INTO kanban_task (id, project_id, issue_number, title, body, labels, status, github_assignee, github_url)
		VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(project_id, issue_number) DO UPDATE SET
			title = excluded.title,
			body = excluded.body,
			labels = excluded.labels,
			status = excluded.status,
			github_assignee = excluded.github_assignee,
			updated_at = datetime('now')`,
		in.ProjectID, in.IssueNumber, in.Title, in.Body, in.Labels,
		in.Status, in.GitHubAssignee, in.GitHubURL,
	)
	return err
}

// CloseTask marks a task as done (legacy name kept for callers).
func (s *Store) CloseTask(projectID string, issueNumber int) error {
	return s.MarkTaskDone(projectID, issueNumber, "")
}

// MarkTaskDone sets status=done and optionally replaces labels JSON.
func (s *Store) MarkTaskDone(projectID string, issueNumber int, labelsJSON string) error {
	if labelsJSON != "" {
		_, err := s.db.Exec(
			"UPDATE kanban_task SET status = 'done', labels = ?, updated_at = datetime('now') WHERE project_id = ? AND issue_number = ?",
			labelsJSON, projectID, issueNumber,
		)
		return err
	}
	_, err := s.db.Exec(
		"UPDATE kanban_task SET status = 'done', updated_at = datetime('now') WHERE project_id = ? AND issue_number = ?",
		projectID, issueNumber,
	)
	return err
}

// FindTaskByIssue returns a task by project + issue number, or nil if missing.
func (s *Store) FindTaskByIssue(projectID string, issueNumber int) (*model.Task, error) {
	var t model.Task
	err := s.db.Get(&t,
		`SELECT id, project_id, issue_number, title, body, status, github_assignee, github_url, created_at, updated_at
		 FROM kanban_task WHERE project_id = ? AND issue_number = ?`,
		projectID, issueNumber)
	if err != nil {
		return nil, nil
	}
	return &t, nil
}

// HasRunningAssignment reports whether the task has a running assignment.
func (s *Store) HasRunningAssignment(taskID string) (bool, error) {
	var count int
	err := s.db.Get(&count,
		"SELECT count(*) FROM kanban_assignment WHERE task_id = ? AND status = 'running'", taskID)
	return count > 0, err
}

// CountTasksByStatusInWorkspace counts tasks with a status in a workspace, excluding one id.
func (s *Store) CountTasksByStatusInWorkspace(workspaceID, status, excludeTaskID string) (int, error) {
	var count int
	err := s.db.Get(&count, `
		SELECT count(*) FROM kanban_task t
		JOIN kanban_project p ON t.project_id = p.id
		WHERE p.workspace_id = ? AND t.status = ? AND t.id != ?`,
		workspaceID, status, excludeTaskID)
	return count, err
}

// UpdateTaskStatus sets status and labels for a task by id.
func (s *Store) UpdateTaskStatus(taskID, status, labelsJSON string) error {
	_, err := s.db.Exec(
		`UPDATE kanban_task SET status = ?, labels = ?, updated_at = datetime('now') WHERE id = ?`,
		status, labelsJSON, taskID,
	)
	return err
}

// GetTaskWithProject returns task + repo fields for writeback.
type TaskWithProject struct {
	model.Task
	LabelsRaw   string `db:"labels"`
	RepoOwner   string `db:"repo_owner"`
	RepoName    string `db:"repo_name"`
	WorkspaceID string `db:"workspace_id"`
}

func (s *Store) GetTaskWithProject(taskID string) (*TaskWithProject, error) {
	var t TaskWithProject
	err := s.db.Get(&t, `
		SELECT t.id, t.project_id, t.issue_number, t.title, t.body, t.labels, t.status,
		       t.github_assignee, t.github_url, t.created_at, t.updated_at,
		       p.repo_owner, p.repo_name, p.workspace_id
		FROM kanban_task t
		JOIN kanban_project p ON t.project_id = p.id
		WHERE t.id = ?`, taskID)
	if err != nil {
		return nil, err
	}
	t.Labels = model.ParseJSONLabels(t.LabelsRaw)
	return &t, nil
}

// UpdateTaskLabels updates the labels JSON for a task.
func (s *Store) UpdateTaskLabels(projectID string, issueNumber int, labelsJSON string) error {
	_, err := s.db.Exec(
		"UPDATE kanban_task SET labels = ?, updated_at = datetime('now') WHERE project_id = ? AND issue_number = ?",
		labelsJSON, projectID, issueNumber,
	)
	return err
}

// UpdateTaskAssignee updates the GitHub assignee for a task.
func (s *Store) UpdateTaskAssignee(projectID string, issueNumber int, assignee *string) error {
	_, err := s.db.Exec(
		"UPDATE kanban_task SET github_assignee = ?, updated_at = datetime('now') WHERE project_id = ? AND issue_number = ?",
		assignee, projectID, issueNumber,
	)
	return err
}

// UpdateProjectSyncStatus sets the sync_status field.
func (s *Store) UpdateProjectSyncStatus(projectID, status string) error {
	_, err := s.db.Exec("UPDATE kanban_project SET sync_status = ? WHERE id = ?", status, projectID)
	return err
}

// UpdateProjectLastSynced sets last_synced_at to now.
func (s *Store) UpdateProjectLastSynced(projectID string) error {
	_, err := s.db.Exec("UPDATE kanban_project SET last_synced_at = datetime('now') WHERE id = ?", projectID)
	return err
}

// GetProjectForSync returns project with repo info for sync.
func (s *Store) GetProjectForSync(projectID string) (*model.Project, error) {
	return s.GetProject(projectID)
}

// ── Label Router ────────────────────────────────────────────────

// FindMatchingAgent finds the best agent for given labels.
func (s *Store) FindMatchingAgent(workspaceID string, labels []string) (*model.Agent, error) {
	var agents []model.Agent
	err := s.db.Select(&agents, "SELECT * FROM kanban_agent WHERE workspace_id = ? AND status = 'active'", workspaceID)
	if err != nil {
		return nil, err
	}

	bestScore := 0
	var bestAgent *model.Agent

	for i := range agents {
		// Need to fetch capability_tags separately (not in struct scan)
		var rawTags string
		s.db.Get(&rawTags, "SELECT capability_tags FROM kanban_agent WHERE id = ?", agents[i].ID)
		tags := model.ParseJSONStringArray(rawTags)

		score := 0
		for _, label := range labels {
			for _, tag := range tags {
				if label == tag {
					score++
				}
			}
		}

		if score > bestScore {
			bestScore = score
			bestAgent = &agents[i]
			bestAgent.CapabilityTags = tags
			// Also fetch skills
			var rawSkills string
			s.db.Get(&rawSkills, "SELECT skills FROM kanban_agent WHERE id = ?", agents[i].ID)
			bestAgent.Skills = model.ParseJSONStringArray(rawSkills)
		}
	}

	if bestAgent == nil {
		return nil, fmt.Errorf("no matching agent")
	}
	return bestAgent, nil
}

// GetTaskWorkspaceID returns the workspace ID for a given task.
func (s *Store) GetTaskWorkspaceID(taskID string) (string, error) {
	var wsID string
	err := s.db.Get(&wsID,
		`SELECT p.workspace_id FROM kanban_task t
		 JOIN kanban_project p ON t.project_id = p.id
		 WHERE t.id = ?`, taskID)
	return wsID, err
}

// GetTaskLabels returns the labels for a task.
func (s *Store) GetTaskLabels(taskID string) ([]string, error) {
	var labelsRaw string
	err := s.db.Get(&labelsRaw, "SELECT labels FROM kanban_task WHERE id = ?", taskID)
	if err != nil {
		return nil, err
	}
	return model.ParseJSONLabels(labelsRaw), nil
}

// GetAgentModelName returns the model_name for an agent.
func (s *Store) GetAgentModelName(agentID string) (string, error) {
	var modelName string
	err := s.db.Get(&modelName, "SELECT model_name FROM kanban_agent WHERE id = ?", agentID)
	return modelName, err
}

// SetAssignmentModel sets the model_used field on an assignment.
func (s *Store) SetAssignmentModel(assignmentID, modelName string) error {
	_, err := s.db.Exec("UPDATE kanban_assignment SET model_used = ? WHERE id = ?", modelName, assignmentID)
	return err
}
