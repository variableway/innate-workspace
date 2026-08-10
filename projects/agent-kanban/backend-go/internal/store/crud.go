package store

import (
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/innate/agent-kanban/backend-go/internal/model"
)

// ── Workspace CRUD ──────────────────────────────────────────────

func (s *Store) ListWorkspaces() ([]model.Workspace, error) {
	var ws []model.Workspace
	err := s.db.Select(&ws, "SELECT * FROM kanban_workspace ORDER BY created_at DESC")
	return ws, err
}

func (s *Store) GetWorkspace(id string) (*model.Workspace, error) {
	var w model.Workspace
	err := s.db.Get(&w, "SELECT * FROM kanban_workspace WHERE id = ?", id)
	if err != nil {
		return nil, err
	}
	return &w, nil
}

type CreateWorkspaceInput struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (s *Store) CreateWorkspace(in CreateWorkspaceInput) (*model.Workspace, error) {
	w := &model.Workspace{
		ID:          uuid.NewString(),
		Name:        in.Name,
		Description: in.Description,
	}
	_, err := s.db.Exec(
		"INSERT INTO kanban_workspace (id, name, description) VALUES (?, ?, ?)",
		w.ID, w.Name, w.Description,
	)
	if err != nil {
		return nil, err
	}
	return s.GetWorkspace(w.ID)
}

func (s *Store) DeleteWorkspace(id string) error {
	_, err := s.db.Exec("DELETE FROM kanban_workspace WHERE id = ?", id)
	return err
}

// ── Project CRUD ────────────────────────────────────────────────

func (s *Store) ListProjects(workspaceID string) ([]model.Project, error) {
	var ps []model.Project
	err := s.db.Select(&ps, "SELECT * FROM kanban_project WHERE workspace_id = ? ORDER BY created_at", workspaceID)
	return ps, err
}

func (s *Store) GetProject(id string) (*model.Project, error) {
	var p model.Project
	err := s.db.Get(&p, "SELECT * FROM kanban_project WHERE id = ?", id)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

type CreateProjectInput struct {
	Name      string `json:"name"`
	RepoOwner string `json:"repoOwner"`
	RepoName  string `json:"repoName"`
}

func (s *Store) CreateProject(workspaceID string, in CreateProjectInput) (*model.Project, error) {
	// Check for duplicate repo
	var count int
	if err := s.db.Get(&count, "SELECT count(*) FROM kanban_project WHERE repo_owner = ? AND repo_name = ?", in.RepoOwner, in.RepoName); err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, ErrConflict
	}

	p := &model.Project{
		ID:          uuid.NewString(),
		WorkspaceID: workspaceID,
		Name:        in.Name,
		RepoOwner:   in.RepoOwner,
		RepoName:    in.RepoName,
		SyncStatus:  "idle",
	}
	_, err := s.db.Exec(
		"INSERT INTO kanban_project (id, workspace_id, name, repo_owner, repo_name, sync_status) VALUES (?, ?, ?, ?, ?, ?)",
		p.ID, p.WorkspaceID, p.Name, p.RepoOwner, p.RepoName, p.SyncStatus,
	)
	if err != nil {
		return nil, err
	}
	return s.GetProject(p.ID)
}

func (s *Store) DeleteProject(id string) error {
	_, err := s.db.Exec("DELETE FROM kanban_project WHERE id = ?", id)
	return err
}

// ── Task Queries ────────────────────────────────────────────────

type TaskFilter struct {
	WorkspaceID string
	Status      string
	ProjectID   string
	AgentID     string
	Label       string
	Limit       int
	Offset      int
}

func (s *Store) ListTasks(filter TaskFilter) ([]model.TaskWithAssignment, error) {
	if filter.Limit <= 0 {
		filter.Limit = 50
	}

	query := `
		SELECT t.id, t.project_id, t.issue_number, t.title, t.body, t.labels,
		       t.status, t.github_assignee, t.github_url, t.created_at, t.updated_at,
		       p.name AS project_name, p.repo_owner, p.repo_name,
		       a.id AS assignment_id, a.task_id, a.agent_id, a.status AS assignment_status,
		       a.model_used, a.result_summary, a.instruction, a.github_comment_id,
		       a.retry_count, a.assigned_at, a.started_at, a.completed_at,
		       ag.name AS agent_name, ag.model_name
		FROM kanban_task t
		JOIN kanban_project p ON t.project_id = p.id
		LEFT JOIN kanban_assignment a ON t.id = a.task_id AND a.status IN ('pending', 'running')
		LEFT JOIN kanban_agent ag ON a.agent_id = ag.id
		WHERE p.workspace_id = ?`
	args := []interface{}{filter.WorkspaceID}

	if filter.Status != "" {
		query += " AND t.status = ?"
		args = append(args, filter.Status)
	}
	if filter.ProjectID != "" {
		query += " AND t.project_id = ?"
		args = append(args, filter.ProjectID)
	}
	if filter.AgentID != "" {
		query += " AND a.agent_id = ?"
		args = append(args, filter.AgentID)
	}
	query += " ORDER BY t.updated_at DESC LIMIT ? OFFSET ?"
	args = append(args, filter.Limit, filter.Offset)

	rows, err := s.db.Queryx(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []model.TaskWithAssignment
	for rows.Next() {
		var row struct {
			ID                string   `db:"id"`
			ProjectID         string   `db:"project_id"`
			IssueNumber       int      `db:"issue_number"`
			Title             string   `db:"title"`
			Body              string   `db:"body"`
			Labels            string   `db:"labels"`
			Status            string   `db:"status"`
			GitHubAssignee    *string  `db:"github_assignee"`
			GitHubURL         string   `db:"github_url"`
			CreatedAt         string   `db:"created_at"`
			UpdatedAt         string   `db:"updated_at"`
			ProjectName       string   `db:"project_name"`
			RepoOwner         string   `db:"repo_owner"`
			RepoName          string   `db:"repo_name"`
			AssignmentID      *string  `db:"assignment_id"`
			AssignmentTaskID  *string  `db:"task_id"`
			AssignmentAgentID *string  `db:"agent_id"`
			AssignmentStatus  *string  `db:"assignment_status"`
			ModelUsed         *string  `db:"model_used"`
			ResultSummary     *string  `db:"result_summary"`
			Instruction       *string  `db:"instruction"`
			GitHubCommentID   *int     `db:"github_comment_id"`
			RetryCount        *int     `db:"retry_count"`
			AssignedAt        *string  `db:"assigned_at"`
			StartedAt         *string  `db:"started_at"`
			CompletedAt       *string  `db:"completed_at"`
			AgentName         *string  `db:"agent_name"`
			AgentModel        *string  `db:"model_name"`
		}
		if err := rows.StructScan(&row); err != nil {
			return nil, err
		}

		twa := model.TaskWithAssignment{
			Task: model.Task{
				ID:             row.ID,
				ProjectID:      row.ProjectID,
				IssueNumber:    row.IssueNumber,
				Title:          row.Title,
				Body:           row.Body,
				Labels:         model.ParseJSONLabels(row.Labels),
				Status:         row.Status,
				GitHubAssignee: row.GitHubAssignee,
				GitHubURL:      row.GitHubURL,
				CreatedAt:      row.CreatedAt,
				UpdatedAt:      row.UpdatedAt,
			},
			ProjectName: row.ProjectName,
			RepoOwner:   row.RepoOwner,
			RepoName:    row.RepoName,
		}

		// Build assignment if exists
		if row.AssignmentID != nil {
			twa.CurrentAssignment = &model.AssignmentWithAgentInfo{
				Assignment: model.Assignment{
					ID:              *row.AssignmentID,
					TaskID:          *row.AssignmentTaskID,
					AgentID:         *row.AssignmentAgentID,
					Status:          *row.AssignmentStatus,
					ModelUsed:       row.ModelUsed,
					ResultSummary:   row.ResultSummary,
					Instruction:     row.Instruction,
					GitHubCommentID: row.GitHubCommentID,
					RetryCount:      *row.RetryCount,
					AssignedAt:      *row.AssignedAt,
					StartedAt:       row.StartedAt,
					CompletedAt:     row.CompletedAt,
				},
				AgentName:  derefStr(row.AgentName),
				AgentModel: derefStr(row.AgentModel),
			}
		}

		// Apply label filter in application layer (SQLite can't query JSON easily)
		if filter.Label != "" && !contains(twa.Labels, filter.Label) {
			continue
		}

		results = append(results, twa)
	}
	return results, nil
}

func (s *Store) GetTask(id string) (*model.Task, error) {
	var t model.Task
	var labelsRaw string
	err := s.db.QueryRowx("SELECT id, project_id, issue_number, title, body, labels, status, github_assignee, github_url, created_at, updated_at FROM kanban_task WHERE id = ?", id).
		Scan(&t.ID, &t.ProjectID, &t.IssueNumber, &t.Title, &t.Body, &labelsRaw, &t.Status, &t.GitHubAssignee, &t.GitHubURL, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, err
	}
	t.Labels = model.ParseJSONLabels(labelsRaw)
	return &t, nil
}

// ── Agent CRUD ──────────────────────────────────────────────────

func (s *Store) ListAgents(workspaceID string) ([]model.Agent, error) {
	var agents []model.Agent
	err := s.db.Select(&agents, "SELECT id, workspace_id, name, role, description, model_name, capability_tags, skills, github_bot_account, status, max_concurrency, created_at FROM kanban_agent WHERE workspace_id = ? ORDER BY created_at", workspaceID)
	if err != nil {
		return nil, err
	}
	// Parse JSON fields
	for i := range agents {
		var rawTags, rawSkills string
		s.db.Get(&rawTags, "SELECT capability_tags FROM kanban_agent WHERE id = ?", agents[i].ID)
		s.db.Get(&rawSkills, "SELECT skills FROM kanban_agent WHERE id = ?", agents[i].ID)
		agents[i].CapabilityTags = model.ParseJSONStringArray(rawTags)
		agents[i].Skills = model.ParseJSONStringArray(rawSkills)
	}
	return agents, nil
}

func (s *Store) GetAgent(id string) (*model.Agent, error) {
	var a model.Agent
	var rawTags, rawSkills string
	err := s.db.QueryRowx("SELECT id, workspace_id, name, role, description, model_name, capability_tags, skills, github_bot_account, status, max_concurrency, created_at FROM kanban_agent WHERE id = ?", id).
		Scan(&a.ID, &a.WorkspaceID, &a.Name, &a.Role, &a.Description, &a.ModelName, &rawTags, &rawSkills, &a.GitHubBotAccount, &a.Status, &a.MaxConcurrency, &a.CreatedAt)
	if err != nil {
		return nil, err
	}
	a.CapabilityTags = model.ParseJSONStringArray(rawTags)
	a.Skills = model.ParseJSONStringArray(rawSkills)
	return &a, nil
}

type CreateAgentInput struct {
	Name             string   `json:"name"`
	Role             string   `json:"role"`
	Description      string   `json:"description"`
	ModelName        string   `json:"modelName"`
	CapabilityTags   []string `json:"capabilityTags"`
	Skills           []string `json:"skills"`
	GitHubBotAccount string   `json:"githubBotAccount"`
	MaxConcurrency   int      `json:"maxConcurrency"`
}

func (s *Store) CreateAgent(workspaceID string, in CreateAgentInput) (*model.Agent, error) {
	if in.MaxConcurrency <= 0 {
		in.MaxConcurrency = 3
	}
	tagsJSON, _ := json.Marshal(in.CapabilityTags)
	skillsJSON, _ := json.Marshal(in.Skills)
	id := uuid.NewString()

	var botAccount *string
	if in.GitHubBotAccount != "" {
		botAccount = &in.GitHubBotAccount
	}

	_, err := s.db.Exec(
		"INSERT INTO kanban_agent (id, workspace_id, name, role, description, model_name, capability_tags, skills, github_bot_account, status, max_concurrency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)",
		id, workspaceID, in.Name, in.Role, in.Description, in.ModelName, string(tagsJSON), string(skillsJSON), botAccount, in.MaxConcurrency,
	)
	if err != nil {
		return nil, err
	}
	return s.GetAgent(id)
}

type UpdateAgentInput struct {
	Name           *string  `json:"name"`
	Description    *string  `json:"description"`
	ModelName      *string  `json:"modelName"`
	CapabilityTags []string `json:"capabilityTags"`
	Skills         []string `json:"skills"`
	Status         *string  `json:"status"`
	MaxConcurrency *int     `json:"maxConcurrency"`
}

func (s *Store) UpdateAgent(id string, in UpdateAgentInput) (*model.Agent, error) {
	// Build dynamic update
	setParts := []string{}
	args := []interface{}{}

	if in.Name != nil {
		setParts = append(setParts, "name = ?")
		args = append(args, *in.Name)
	}
	if in.Description != nil {
		setParts = append(setParts, "description = ?")
		args = append(args, *in.Description)
	}
	if in.ModelName != nil {
		setParts = append(setParts, "model_name = ?")
		args = append(args, *in.ModelName)
	}
	if in.CapabilityTags != nil {
		tagsJSON, _ := json.Marshal(in.CapabilityTags)
		setParts = append(setParts, "capability_tags = ?")
		args = append(args, string(tagsJSON))
	}
	if in.Skills != nil {
		skillsJSON, _ := json.Marshal(in.Skills)
		setParts = append(setParts, "skills = ?")
		args = append(args, string(skillsJSON))
	}
	if in.Status != nil {
		setParts = append(setParts, "status = ?")
		args = append(args, *in.Status)
	}
	if in.MaxConcurrency != nil {
		setParts = append(setParts, "max_concurrency = ?")
		args = append(args, *in.MaxConcurrency)
	}

	if len(setParts) == 0 {
		return s.GetAgent(id)
	}

	args = append(args, id)
	query := fmt.Sprintf("UPDATE kanban_agent SET %s WHERE id = ?", joinStrings(setParts, ", "))
	_, err := s.db.Exec(query, args...)
	if err != nil {
		return nil, err
	}
	return s.GetAgent(id)
}

func (s *Store) DeleteAgent(id string) error {
	_, err := s.db.Exec("DELETE FROM kanban_agent WHERE id = ?", id)
	return err
}

// ── Assignment CRUD ─────────────────────────────────────────────

func (s *Store) ListTaskAssignments(taskID string) ([]model.Assignment, error) {
	var as []model.Assignment
	err := s.db.Select(&as, "SELECT * FROM kanban_assignment WHERE task_id = ? ORDER BY assigned_at DESC", taskID)
	return as, err
}

func (s *Store) ListAgentAssignments(agentID, status string) ([]model.Assignment, error) {
	if status != "" {
		var as []model.Assignment
		err := s.db.Select(&as, "SELECT * FROM kanban_assignment WHERE agent_id = ? AND status = ? ORDER BY assigned_at DESC", agentID, status)
		return as, err
	}
	var as []model.Assignment
	err := s.db.Select(&as, "SELECT * FROM kanban_assignment WHERE agent_id = ? ORDER BY assigned_at DESC", agentID)
	return as, err
}

type CreateAssignmentInput struct {
	TaskID      string `json:"taskId"`
	AgentID     string `json:"agentId"`
	Instruction string `json:"instruction"`
}

func (s *Store) CreateAssignment(in CreateAssignmentInput) (*model.Assignment, error) {
	// Idempotency check: no duplicate pending/running assignment
	var count int
	if err := s.db.Get(&count, "SELECT count(*) FROM kanban_assignment WHERE task_id = ? AND status IN ('pending', 'running')", in.TaskID); err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, ErrConflict
	}

	id := uuid.NewString()
	var instruction *string
	if in.Instruction != "" {
		instruction = &in.Instruction
	}

	_, err := s.db.Exec(
		"INSERT INTO kanban_assignment (id, task_id, agent_id, status, instruction) VALUES (?, ?, ?, 'pending', ?)",
		id, in.TaskID, in.AgentID, instruction,
	)
	if err != nil {
		return nil, err
	}

	var a model.Assignment
	err = s.db.Get(&a, "SELECT * FROM kanban_assignment WHERE id = ?", id)
	return &a, err
}

// UpdateAssignmentStatus updates assignment status and side-effects task status.
func (s *Store) UpdateAssignmentStatus(id, status string, resultSummary *string) (*model.Assignment, error) {
	var existing model.Assignment
	if err := s.db.Get(&existing, "SELECT * FROM kanban_assignment WHERE id = ?", id); err != nil {
		return nil, ErrNotFound
	}

	switch status {
	case "running":
		_, err := s.db.Exec(
			`UPDATE kanban_assignment SET status = 'running', started_at = datetime('now') WHERE id = ?`, id)
		if err != nil {
			return nil, err
		}
		_, err = s.db.Exec(
			`UPDATE kanban_task SET status = 'in_progress', updated_at = datetime('now') WHERE id = ?`,
			existing.TaskID)
		if err != nil {
			return nil, err
		}
	case "done":
		_, err := s.db.Exec(
			`UPDATE kanban_assignment SET status = 'done', completed_at = datetime('now'),
			 result_summary = COALESCE(?, result_summary) WHERE id = ?`,
			resultSummary, id)
		if err != nil {
			return nil, err
		}
		_, err = s.db.Exec(
			`UPDATE kanban_task SET status = 'in_review', updated_at = datetime('now') WHERE id = ?`,
			existing.TaskID)
		if err != nil {
			return nil, err
		}
	case "failed":
		_, err := s.db.Exec(
			`UPDATE kanban_assignment SET status = 'failed', completed_at = datetime('now') WHERE id = ?`, id)
		if err != nil {
			return nil, err
		}
	default:
		_, err := s.db.Exec(`UPDATE kanban_assignment SET status = ? WHERE id = ?`, status, id)
		if err != nil {
			return nil, err
		}
	}

	var a model.Assignment
	err := s.db.Get(&a, "SELECT * FROM kanban_assignment WHERE id = ?", id)
	return &a, err
}

// ── Stats ───────────────────────────────────────────────────────

type WorkspaceStats struct {
	TotalTasks       int            `json:"totalTasks"`
	BacklogTasks     int            `json:"backlogTasks"`
	InProgressTasks  int            `json:"inProgressTasks"`
	InReviewTasks    int            `json:"inReviewTasks"`
	DoneTasks        int            `json:"doneTasks"`
	TotalAgents      int            `json:"totalAgents"`
	ActiveAgents     int            `json:"activeAgents"`
	TotalProjects    int            `json:"totalProjects"`
	TasksByProject   map[string]int `json:"tasksByProject"`
	TasksByAgent     map[string]int `json:"tasksByAgent"`
}

func (s *Store) GetWorkspaceStats(workspaceID string) (*WorkspaceStats, error) {
	stats := &WorkspaceStats{
		TasksByProject: make(map[string]int),
		TasksByAgent:   make(map[string]int),
	}

	// Task counts by status
	rows, err := s.db.Query(`
		SELECT t.status, COUNT(*) FROM kanban_task t
		JOIN kanban_project p ON t.project_id = p.id
		WHERE p.workspace_id = ? GROUP BY t.status`, workspaceID)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var status string
		var count int
		rows.Scan(&status, &count)
		stats.TotalTasks += count
		switch status {
		case "backlog":
			stats.BacklogTasks = count
		case "in_progress":
			stats.InProgressTasks = count
		case "in_review":
			stats.InReviewTasks = count
		case "done":
			stats.DoneTasks = count
		}
	}
	rows.Close()

	// Agent counts
	s.db.Get(&stats.TotalAgents, "SELECT count(*) FROM kanban_agent WHERE workspace_id = ?", workspaceID)
	s.db.Get(&stats.ActiveAgents, "SELECT count(*) FROM kanban_agent WHERE workspace_id = ? AND status = 'active'", workspaceID)

	// Project count
	s.db.Get(&stats.TotalProjects, "SELECT count(*) FROM kanban_project WHERE workspace_id = ?", workspaceID)

	// Tasks by project
	rows, err = s.db.Query(`
		SELECT p.name, COUNT(t.id) FROM kanban_project p
		LEFT JOIN kanban_task t ON t.project_id = p.id
		WHERE p.workspace_id = ? GROUP BY p.id`, workspaceID)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var name string
		var count int
		rows.Scan(&name, &count)
		stats.TasksByProject[name] = count
	}
	rows.Close()

	// Tasks by agent (pending + running)
	rows, err = s.db.Query(`
		SELECT ag.name, COUNT(a.id) FROM kanban_agent ag
		LEFT JOIN kanban_assignment a ON a.agent_id = ag.id AND a.status IN ('pending', 'running')
		WHERE ag.workspace_id = ? GROUP BY ag.id`, workspaceID)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var name string
		var count int
		rows.Scan(&name, &count)
		stats.TasksByAgent[name] = count
	}
	rows.Close()

	return stats, nil
}

// ── Errors ──────────────────────────────────────────────────────

var ErrConflict = fmt.Errorf("conflict")
var ErrNotFound = fmt.Errorf("not found")

// ── Helpers ─────────────────────────────────────────────────────

func derefStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func joinStrings(parts []string, sep string) string {
	result := ""
	for i, p := range parts {
		if i > 0 {
			result += sep
		}
		result += p
	}
	return result
}
