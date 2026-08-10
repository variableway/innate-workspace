package github

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/innate/agent-kanban/backend-go/internal/store"
	"github.com/innate/agent-kanban/backend-go/internal/taskstatus"
)

// SyncIssue upserts a task from a GitHub Issue event using the sync priority stack.
func SyncIssue(s *store.Store, projectID string, action string, issue *Issue) error {
	labels := make([]string, 0, len(issue.Labels))
	for _, l := range issue.Labels {
		labels = append(labels, l.Name)
	}
	labelsJSON, _ := json.Marshal(labels)

	var assignee *string
	if issue.Assignee != nil {
		assignee = &issue.Assignee.Login
	}

	switch action {
	case "opened", "reopened", "edited", "labeled", "unlabeled":
		return upsertWithResolve(s, projectID, issue, string(labelsJSON), labels, assignee)

	case "closed":
		merged := taskstatus.MergeStatusLabel(labels, taskstatus.Done)
		mergedJSON, _ := json.Marshal(merged)
		return s.MarkTaskDone(projectID, issue.Number, string(mergedJSON))

	case "assigned", "unassigned":
		return s.UpdateTaskAssignee(projectID, issue.Number, assignee)

	default:
		slog.Debug("sync: unhandled action", "action", action)
		return nil
	}
}

func upsertWithResolve(s *store.Store, projectID string, issue *Issue, labelsJSON string, labels []string, assignee *string) error {
	existing, err := s.FindTaskByIssue(projectID, issue.Number)
	if err != nil {
		return err
	}

	var local *taskstatus.TaskStatus
	running := false
	if existing != nil {
		if st, ok := taskstatus.Parse(existing.Status); ok {
			local = &st
		}
		running, _ = s.HasRunningAssignment(existing.ID)
	}

	status := taskstatus.ResolveSyncedStatus(issue.State, labels, running, local)

	return s.UpsertTask(store.UpsertTaskInput{
		ProjectID:      projectID,
		IssueNumber:    issue.Number,
		Title:          issue.Title,
		Body:           issue.Body,
		Labels:         labelsJSON,
		Status:         string(status),
		GitHubAssignee: assignee,
		GitHubURL:      issue.HTMLURL,
	})
}

// WriteStatusLabel patches GitHub issue labels (best-effort; no token = skip).
func WriteStatusLabel(owner, repo string, issueNumber int, status taskstatus.TaskStatus, currentLabels []string, token string) {
	if token == "" {
		slog.Info("sync: skip GitHub label writeback: no token")
		return
	}
	next := taskstatus.MergeStatusLabel(currentLabels, status)
	body, _ := json.Marshal(map[string]interface{}{"labels": next})
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/issues/%d", owner, repo, issueNumber)
	req, err := http.NewRequest("PATCH", url, bytes.NewReader(body))
	if err != nil {
		return
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		slog.Warn("sync: label writeback error", "error", err)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		slog.Warn("sync: label writeback failed", "status", resp.StatusCode, "body", string(b))
	}
}

// FullSync fetches all issues from a repo and syncs them to the database.
func FullSync(s *store.Store, projectID, owner, repo, token string) (int, error) {
	slog.Info("full sync started", "project", projectID, "repo", owner+"/"+repo)

	s.UpdateProjectSyncStatus(projectID, "syncing")

	issues, err := fetchAllIssues(owner, repo, token)
	if err != nil {
		s.UpdateProjectSyncStatus(projectID, "error")
		return 0, fmt.Errorf("fetch issues: %w", err)
	}

	synced := 0
	for _, issue := range issues {
		if issue.HTMLURL != "" && strings.Contains(issue.HTMLURL, "/pull/") {
			continue
		}
		action := "edited"
		if issue.State == "closed" {
			action = "closed"
		}
		if err := SyncIssue(s, projectID, action, &issue); err != nil {
			slog.Warn("sync: failed to sync issue", "number", issue.Number, "error", err)
			continue
		}
		synced++
	}

	s.UpdateProjectSyncStatus(projectID, "idle")
	s.UpdateProjectLastSynced(projectID)

	slog.Info("full sync completed", "project", projectID, "synced", synced)
	return synced, nil
}

func fetchAllIssues(owner, repo, token string) ([]Issue, error) {
	var allIssues []Issue
	page := 1
	perPage := 100

	for {
		url := fmt.Sprintf("https://api.github.com/repos/%s/%s/issues?state=all&per_page=%d&page=%d&sort=created&direction=asc", owner, repo, perPage, page)
		req, _ := http.NewRequest("GET", url, nil)
		req.Header.Set("Accept", "application/vnd.github+json")
		if token != "" {
			req.Header.Set("Authorization", "Bearer "+token)
		}

		client := &http.Client{Timeout: 30 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			return nil, err
		}

		if resp.StatusCode == 403 {
			body, _ := io.ReadAll(resp.Body)
			resp.Body.Close()
			return nil, fmt.Errorf("rate limited by GitHub: %s", string(body))
		}
		if resp.StatusCode != 200 {
			body, _ := io.ReadAll(resp.Body)
			resp.Body.Close()
			return nil, fmt.Errorf("github API %d: %s", resp.StatusCode, string(body))
		}

		var issues []Issue
		if err := json.NewDecoder(resp.Body).Decode(&issues); err != nil {
			resp.Body.Close()
			return nil, err
		}
		resp.Body.Close()

		if len(issues) == 0 {
			break
		}

		allIssues = append(allIssues, issues...)

		if len(issues) < perPage {
			break
		}
		page++
	}

	return allIssues, nil
}
