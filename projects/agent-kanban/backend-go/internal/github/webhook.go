package github

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"github.com/innate/agent-kanban/backend-go/internal/store"
)

// WebhookPayload represents the relevant fields from a GitHub webhook.
type WebhookPayload struct {
	Action     string      `json:"action"`
	Issue      *Issue      `json:"issue"`
	Repository Repository  `json:"repository"`
	Label      *Label      `json:"label"`
}

type Issue struct {
	Number  int     `json:"number"`
	Title   string  `json:"title"`
	Body    string  `json:"body"`
	State   string  `json:"state"`
	HTMLURL string  `json:"html_url"`
	Labels  []Label `json:"labels"`
	Assignee *struct {
		Login string `json:"login"`
	} `json:"assignee"`
}

type Label struct {
	Name string `json:"name"`
}

type Repository struct {
	FullName string `json:"full_name"`
}

// VerifySignature checks the HMAC-SHA256 signature of the webhook body.
func VerifySignature(body []byte, signature string, secret string) bool {
	if !strings.HasPrefix(signature, "sha256=") {
		return false
	}
	expectedMAC := strings.TrimPrefix(signature, "sha256=")

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(expectedMAC), []byte(expected))
}

// HandleWebhook processes a GitHub webhook event.
func HandleWebhook(s *store.Store, event string, body []byte) error {
	var payload WebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		return fmt.Errorf("parse payload: %w", err)
	}

	// Find project by repo
	parts := strings.SplitN(payload.Repository.FullName, "/", 2)
	if len(parts) != 2 {
		return fmt.Errorf("invalid repo full name: %s", payload.Repository.FullName)
	}
	owner, name := parts[0], parts[1]

	// Look up project (need to query store)
	project, err := s.FindProjectByRepo(owner, name)
	if err != nil {
		return fmt.Errorf("project not found for %s/%s: %w", owner, name, err)
	}
	if project == nil {
		slog.Warn("webhook: project not registered", "repo", payload.Repository.FullName)
		return nil
	}

	// Only handle issues events
	if event != "issues" || payload.Issue == nil {
		slog.Debug("webhook: ignoring non-issues event", "event", event)
		return nil
	}

	slog.Info("webhook: processing issue event",
		"action", payload.Action,
		"issue", payload.Issue.Number,
		"repo", payload.Repository.FullName,
	)

	return SyncIssue(s, project.ID, payload.Action, payload.Issue)
}

// FetchIssue retrieves a single issue from GitHub API (for manual sync).
func FetchIssue(owner, repo string, number int, token string) (*Issue, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/issues/%d", owner, repo, number)
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Accept", "application/vnd.github+json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("github API %d: %s", resp.StatusCode, string(body))
	}

	var issue Issue
	if err := json.NewDecoder(resp.Body).Decode(&issue); err != nil {
		return nil, err
	}
	return &issue, nil
}
