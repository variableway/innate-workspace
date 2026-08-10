package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/innate/agent-kanban/backend-go/internal/config"
	"github.com/innate/agent-kanban/backend-go/internal/github"
	"github.com/innate/agent-kanban/backend-go/internal/store"
	"github.com/innate/agent-kanban/backend-go/internal/taskstatus"
)

// Handler holds dependencies for all HTTP handlers.
type Handler struct {
	store *store.Store
	cfg   *config.Config
}

// New creates a new Handler.
func New(s *store.Store, cfg *config.Config) *Handler {
	return &Handler{store: s, cfg: cfg}
}

// RegisterRoutes wires all API routes onto the chi router.
func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/api/v1", func(r chi.Router) {
		// Workspaces
		r.Get("/workspaces", h.ListWorkspaces)
		r.Post("/workspaces", h.CreateWorkspace)
		r.Get("/workspaces/{workspaceId}", h.GetWorkspace)
		r.Delete("/workspaces/{workspaceId}", h.DeleteWorkspace)
		r.Get("/workspaces/{workspaceId}/stats", h.GetWorkspaceStats)

		// Projects
		r.Get("/workspaces/{workspaceId}/projects", h.ListProjects)
		r.Post("/workspaces/{workspaceId}/projects", h.AddProject)
		r.Get("/projects/{projectId}", h.GetProject)
		r.Delete("/projects/{projectId}", h.DeleteProject)
		r.Post("/projects/{projectId}/sync", h.TriggerSync)

		// Tasks
		r.Get("/workspaces/{workspaceId}/tasks", h.ListTasks)
		r.Get("/tasks/{taskId}", h.GetTask)
		r.Patch("/tasks/{taskId}", h.UpdateTask)

		// Agents
		r.Get("/workspaces/{workspaceId}/agents", h.ListAgents)
		r.Post("/workspaces/{workspaceId}/agents", h.CreateAgent)
		r.Get("/agents/{agentId}", h.GetAgent)
		r.Patch("/agents/{agentId}", h.UpdateAgent)
		r.Delete("/agents/{agentId}", h.DeleteAgent)

		// Assignments
		r.Post("/assignments", h.CreateAssignment)
		r.Post("/assignments/auto", h.AutoAssign)
		r.Patch("/assignments/{assignmentId}", h.UpdateAssignment)
		r.Get("/tasks/{taskId}/assignments", h.ListTaskAssignments)
		r.Get("/agents/{agentId}/assignments", h.ListAgentAssignments)

		// Webhooks
		r.Post("/webhooks/github", h.ReceiveGitHubWebhook)

		// Health
		r.Get("/health", h.Health)
	})
}

// ═══════════════════════════════════════════════════
// Workspace handlers
// ═══════════════════════════════════════════════════

func (h *Handler) ListWorkspaces(w http.ResponseWriter, r *http.Request) {
	ws, err := h.store.ListWorkspaces()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, ws)
}

func (h *Handler) CreateWorkspace(w http.ResponseWriter, r *http.Request) {
	var in store.CreateWorkspaceInput
	if err := decodeJSON(r, &in); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}
	if in.Name == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "name is required")
		return
	}
	ws, err := h.store.CreateWorkspace(in)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, ws)
}

func (h *Handler) GetWorkspace(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "workspaceId")
	ws, err := h.store.GetWorkspace(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "workspace not found")
		return
	}
	writeJSON(w, http.StatusOK, ws)
}

func (h *Handler) DeleteWorkspace(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "workspaceId")
	if err := h.store.DeleteWorkspace(id); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) GetWorkspaceStats(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "workspaceId")
	stats, err := h.store.GetWorkspaceStats(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, stats)
}

// ═══════════════════════════════════════════════════
// Project handlers
// ═══════════════════════════════════════════════════

func (h *Handler) ListProjects(w http.ResponseWriter, r *http.Request) {
	wsID := chi.URLParam(r, "workspaceId")
	ps, err := h.store.ListProjects(wsID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, ps)
}

func (h *Handler) AddProject(w http.ResponseWriter, r *http.Request) {
	wsID := chi.URLParam(r, "workspaceId")
	var in store.CreateProjectInput
	if err := decodeJSON(r, &in); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}
	if in.Name == "" || in.RepoOwner == "" || in.RepoName == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "name, repoOwner, repoName are required")
		return
	}
	p, err := h.store.CreateProject(wsID, in)
	if err != nil {
		if errors.Is(err, store.ErrConflict) {
			writeError(w, http.StatusConflict, "CONFLICT", "project with this repo already exists")
			return
		}
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, p)
}

func (h *Handler) GetProject(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "projectId")
	p, err := h.store.GetProject(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "project not found")
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (h *Handler) DeleteProject(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "projectId")
	if err := h.store.DeleteProject(id); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) TriggerSync(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "projectId")
	project, err := h.store.GetProject(id)
	if err != nil || project == nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "project not found")
		return
	}

	// Run full sync in background (non-blocking)
	go func() {
		synced, err := github.FullSync(h.store, project.ID, project.RepoOwner, project.RepoName, h.cfg.GitHubToken)
		if err != nil {
			slog.Error("full sync failed", "project", project.ID, "error", err)
			return
		}
		slog.Info("full sync completed", "project", project.ID, "synced", synced)
	}()

	writeJSON(w, http.StatusAccepted, map[string]interface{}{
		"projectId": id,
		"status":    "queued",
		"message":   "Full sync started in background",
	})
}

// ═══════════════════════════════════════════════════
// Task handlers
// ═══════════════════════════════════════════════════

func (h *Handler) ListTasks(w http.ResponseWriter, r *http.Request) {
	wsID := chi.URLParam(r, "workspaceId")
	filter := store.TaskFilter{
		WorkspaceID: wsID,
		Status:      r.URL.Query().Get("status"),
		ProjectID:   r.URL.Query().Get("projectId"),
		AgentID:     r.URL.Query().Get("agentId"),
		Label:       r.URL.Query().Get("label"),
	}
	if l := r.URL.Query().Get("limit"); l != "" {
		filter.Limit, _ = strconv.Atoi(l)
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		filter.Offset, _ = strconv.Atoi(o)
	}
	tasks, err := h.store.ListTasks(filter)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"total": len(tasks),
		"items": tasks,
	})
}

func (h *Handler) GetTask(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "taskId")
	t, err := h.store.GetTask(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "task not found")
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func (h *Handler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "taskId")
	var body struct {
		Status string `json:"status"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}
	to, ok := taskstatus.Parse(body.Status)
	if !ok {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "status must be backlog|in_progress|in_review|done")
		return
	}

	tp, err := h.store.GetTaskWithProject(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "task not found")
		return
	}
	from, ok := taskstatus.Parse(tp.Status)
	if !ok {
		writeError(w, http.StatusConflict, "CONFLICT", "unknown current status: "+tp.Status)
		return
	}
	if !taskstatus.IsTransitionAllowed(from, to) {
		writeError(w, http.StatusConflict, "CONFLICT",
			fmt.Sprintf("invalid transition %s → %s", from, to))
		return
	}
	if from != to {
		if limit, has := taskstatus.WIPLimits[to]; has {
			count, err := h.store.CountTasksByStatusInWorkspace(tp.WorkspaceID, string(to), id)
			if err != nil {
				writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
				return
			}
			if count >= limit {
				writeError(w, http.StatusConflict, "CONFLICT",
					fmt.Sprintf("WIP limit reached for %s (max %d)", to, limit))
				return
			}
		}
	}

	nextLabels := taskstatus.MergeStatusLabel(tp.Labels, to)
	labelsJSON, _ := json.Marshal(nextLabels)
	if err := h.store.UpdateTaskStatus(id, string(to), string(labelsJSON)); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	github.WriteStatusLabel(tp.RepoOwner, tp.RepoName, tp.IssueNumber, to, tp.Labels, h.cfg.GitHubToken)

	t, err := h.store.GetTask(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, t)
}

// ═══════════════════════════════════════════════════
// Agent handlers
// ═══════════════════════════════════════════════════

func (h *Handler) ListAgents(w http.ResponseWriter, r *http.Request) {
	wsID := chi.URLParam(r, "workspaceId")
	agents, err := h.store.ListAgents(wsID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, agents)
}

func (h *Handler) CreateAgent(w http.ResponseWriter, r *http.Request) {
	wsID := chi.URLParam(r, "workspaceId")
	var in store.CreateAgentInput
	if err := decodeJSON(r, &in); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}
	if in.Name == "" || in.Role == "" || in.ModelName == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "name, role, modelName are required")
		return
	}
	a, err := h.store.CreateAgent(wsID, in)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, a)
}

func (h *Handler) GetAgent(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "agentId")
	a, err := h.store.GetAgent(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "agent not found")
		return
	}
	writeJSON(w, http.StatusOK, a)
}

func (h *Handler) UpdateAgent(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "agentId")
	var in store.UpdateAgentInput
	if err := decodeJSON(r, &in); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}
	a, err := h.store.UpdateAgent(id, in)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, a)
}

func (h *Handler) DeleteAgent(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "agentId")
	if err := h.store.DeleteAgent(id); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ═══════════════════════════════════════════════════
// Assignment handlers
// ═══════════════════════════════════════════════════

func (h *Handler) CreateAssignment(w http.ResponseWriter, r *http.Request) {
	var in store.CreateAssignmentInput
	if err := decodeJSON(r, &in); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}
	if in.TaskID == "" || in.AgentID == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "taskId and agentId are required")
		return
	}
	a, err := h.store.CreateAssignment(in)
	if err != nil {
		if errors.Is(err, store.ErrConflict) {
			writeError(w, http.StatusConflict, "CONFLICT", "task already has a pending or running assignment")
			return
		}
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, a)
}

func (h *Handler) UpdateAssignment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "assignmentId")
	var body struct {
		Status        string  `json:"status"`
		ResultSummary *string `json:"resultSummary"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}
	switch body.Status {
	case "pending", "running", "done", "failed":
	default:
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "status must be pending|running|done|failed")
		return
	}
	a, err := h.store.UpdateAssignmentStatus(id, body.Status, body.ResultSummary)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "NOT_FOUND", "assignment not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, a)
}

func (h *Handler) AutoAssign(w http.ResponseWriter, r *http.Request) {
	var in struct {
		TaskID string `json:"taskId"`
	}
	if err := decodeJSON(r, &in); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}
	if in.TaskID == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "taskId is required")
		return
	}

	// Get task workspace + labels
	wsID, err := h.store.GetTaskWorkspaceID(in.TaskID)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "task not found")
		return
	}

	labels, err := h.store.GetTaskLabels(in.TaskID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	if len(labels) == 0 {
		writeError(w, http.StatusUnprocessableEntity, "NO_MATCHING_AGENT", "task has no labels to match")
		return
	}

	// Find matching agent
	agent, err := h.store.FindMatchingAgent(wsID, labels)
	if err != nil || agent == nil {
		writeError(w, http.StatusUnprocessableEntity, "NO_MATCHING_AGENT",
			"no agent matches labels: "+joinLabels(labels))
		return
	}

	// Idempotency check
	existing, _ := h.store.ListTaskAssignments(in.TaskID)
	for _, a := range existing {
		if a.Status == "pending" || a.Status == "running" {
			writeError(w, http.StatusConflict, "CONFLICT", "task already has a pending or running assignment")
			return
		}
	}

	// Create assignment with agent's model
	assignment, err := h.store.CreateAssignment(store.CreateAssignmentInput{
		TaskID:  in.TaskID,
		AgentID: agent.ID,
	})
	if err != nil {
		if errors.Is(err, store.ErrConflict) {
			writeError(w, http.StatusConflict, "CONFLICT", "task already assigned")
			return
		}
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	// Set model_used
	modelName := agent.ModelName
	h.store.SetAssignmentModel(assignment.ID, modelName)

	writeJSON(w, http.StatusCreated, assignment)
}

func (h *Handler) ListTaskAssignments(w http.ResponseWriter, r *http.Request) {
	taskID := chi.URLParam(r, "taskId")
	as, err := h.store.ListTaskAssignments(taskID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, as)
}

func (h *Handler) ListAgentAssignments(w http.ResponseWriter, r *http.Request) {
	agentID := chi.URLParam(r, "agentId")
	status := r.URL.Query().Get("status")
	as, err := h.store.ListAgentAssignments(agentID, status)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, as)
}

// ═══════════════════════════════════════════════════
// Webhook handler (stub for Phase 3)
// ═══════════════════════════════════════════════════

func (h *Handler) ReceiveGitHubWebhook(w http.ResponseWriter, r *http.Request) {
	event := r.Header.Get("X-GitHub-Event")
	signature := r.Header.Get("X-Hub-Signature-256")

	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "cannot read body")
		return
	}

	// Parse payload to find repo
	var payload struct {
		Repository struct {
			FullName string `json:"full_name"`
		} `json:"repository"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid JSON")
		return
	}

	// Find project by repo
	repoFull := payload.Repository.FullName
	if repoFull == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "missing repository info")
		return
	}

	// Split owner/name
	parts := splitRepo(repoFull)
	if len(parts) != 2 {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid repo name")
		return
	}

	project, err := h.store.FindProjectByRepo(parts[0], parts[1])
	if err != nil || project == nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "project not registered")
		return
	}

	// Verify HMAC signature
	if project.WebhookSecret != nil && *project.WebhookSecret != "" {
		if !github.VerifySignature(body, signature, *project.WebhookSecret) {
			slog.Warn("webhook: invalid signature", "repo", repoFull)
			writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid signature")
			return
		}
	}

	// Handle the webhook event
	if err := github.HandleWebhook(h.store, event, body); err != nil {
		slog.Error("webhook: handling failed", "event", event, "error", err)
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	slog.Info("webhook processed", "event", event, "repo", repoFull)
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// ═══════════════════════════════════════════════════
// Health
// ═══════════════════════════════════════════════════

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status": "ok",
	})
}

// ═══════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]string{
		"code":    code,
		"message": message,
	})
}

func decodeJSON(r *http.Request, v interface{}) error {
	return json.NewDecoder(r.Body).Decode(v)
}

func splitRepo(full string) []string {
	for i, c := range full {
		if c == '/' {
			return []string{full[:i], full[i+1:]}
		}
	}
	return nil
}

func joinLabels(labels []string) string {
	result := ""
	for i, l := range labels {
		if i > 0 {
			result += ", "
		}
		result += l
	}
	return result
}
