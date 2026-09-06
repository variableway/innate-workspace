package store

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// BusinessTables are the two demo business tables (plus raw_requests for audit).
var BusinessTables = map[string]struct{}{
	"items": {},
	"notes": {},
}

type Store struct {
	path string
	mu   sync.Mutex
}

type Record struct {
	ID        string          `json:"id"`
	Data      json.RawMessage `json:"data"`
	CreatedAt time.Time       `json:"createdAt"`
	UpdatedAt time.Time       `json:"updatedAt"`
}

type RawRequest struct {
	ID        int64           `json:"id"`
	Method    string          `json:"method"`
	Path      string          `json:"path"`
	TableName string          `json:"tableName"`
	Body      json.RawMessage `json:"body,omitempty"`
	CreatedAt time.Time       `json:"createdAt"`
}

func Open(path string) (*Store, error) {
	if _, err := exec.LookPath("sqlite3"); err != nil {
		return nil, fmt.Errorf("sqlite3 CLI required on PATH: %w", err)
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, err
	}
	s := &Store{path: path}
	if err := s.migrate(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *Store) Close() error { return nil }

func (s *Store) migrate() error {
	_, err := s.exec(`
CREATE TABLE IF NOT EXISTS raw_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  table_name TEXT NOT NULL DEFAULT '',
  body TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`)
	return err
}

func NormalizeTable(name string) (string, error) {
	t := strings.ToLower(strings.TrimSpace(name))
	if _, ok := BusinessTables[t]; !ok {
		return "", fmt.Errorf("unknown table %q (allowed: items, notes)", name)
	}
	return t, nil
}

func (s *Store) LogRequest(_ context.Context, method, path, table string, body []byte) error {
	b := "NULL"
	if len(body) > 0 {
		b = quote(string(body))
	}
	_, err := s.exec(fmt.Sprintf(
		`INSERT INTO raw_requests(method, path, table_name, body, created_at) VALUES(%s,%s,%s,%s,%s);`,
		quote(method), quote(path), quote(table), b, quote(time.Now().UTC().Format(time.RFC3339Nano)),
	))
	return err
}

func (s *Store) ListRawRequests(_ context.Context, limit int) ([]RawRequest, error) {
	if limit <= 0 {
		limit = 50
	}
	out, err := s.query(fmt.Sprintf(
		`SELECT json_object('id',id,'method',method,'path',path,'tableName',table_name,'body',body,'createdAt',created_at)
		 FROM raw_requests ORDER BY id DESC LIMIT %d;`, limit))
	if err != nil {
		return nil, err
	}
	var rows []RawRequest
	for _, line := range out {
		var raw struct {
			ID        int64  `json:"id"`
			Method    string `json:"method"`
			Path      string `json:"path"`
			TableName string `json:"tableName"`
			Body      any    `json:"body"`
			CreatedAt string `json:"createdAt"`
		}
		if err := json.Unmarshal([]byte(line), &raw); err != nil {
			return nil, err
		}
		r := RawRequest{ID: raw.ID, Method: raw.Method, Path: raw.Path, TableName: raw.TableName}
		r.CreatedAt, _ = time.Parse(time.RFC3339Nano, raw.CreatedAt)
		if v, ok := raw.Body.(string); ok && v != "" {
			r.Body = json.RawMessage(v)
		}
		rows = append(rows, r)
	}
	return rows, nil
}

func (s *Store) Create(_ context.Context, table, id string, data json.RawMessage) (*Record, error) {
	if !json.Valid(data) {
		return nil, errors.New("data must be valid JSON")
	}
	now := time.Now().UTC()
	_, err := s.exec(fmt.Sprintf(
		`INSERT INTO %s(id, data, created_at, updated_at) VALUES(%s,%s,%s,%s);`,
		table, quote(id), quote(string(data)), quote(now.Format(time.RFC3339Nano)), quote(now.Format(time.RFC3339Nano)),
	))
	if err != nil {
		return nil, err
	}
	return &Record{ID: id, Data: data, CreatedAt: now, UpdatedAt: now}, nil
}

func (s *Store) Get(_ context.Context, table, id string) (*Record, error) {
	out, err := s.query(fmt.Sprintf(
		`SELECT json_object('id',id,'data',json(data),'createdAt',created_at,'updatedAt',updated_at)
		 FROM %s WHERE id=%s LIMIT 1;`, table, quote(id)))
	if err != nil {
		return nil, err
	}
	if len(out) == 0 {
		return nil, nil
	}
	return decodeRecord(out[0])
}

func (s *Store) List(_ context.Context, table string) ([]Record, error) {
	out, err := s.query(fmt.Sprintf(
		`SELECT json_object('id',id,'data',json(data),'createdAt',created_at,'updatedAt',updated_at)
		 FROM %s ORDER BY created_at DESC;`, table))
	if err != nil {
		return nil, err
	}
	var rows []Record
	for _, line := range out {
		r, err := decodeRecord(line)
		if err != nil {
			return nil, err
		}
		rows = append(rows, *r)
	}
	return rows, nil
}

func (s *Store) Update(ctx context.Context, table, id string, data json.RawMessage) (*Record, error) {
	if !json.Valid(data) {
		return nil, errors.New("data must be valid JSON")
	}
	existing, err := s.Get(ctx, table, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, nil
	}
	now := time.Now().UTC()
	_, err = s.exec(fmt.Sprintf(
		`UPDATE %s SET data=%s, updated_at=%s WHERE id=%s;`,
		table, quote(string(data)), quote(now.Format(time.RFC3339Nano)), quote(id),
	))
	if err != nil {
		return nil, err
	}
	return s.Get(ctx, table, id)
}

func (s *Store) Delete(ctx context.Context, table, id string) (bool, error) {
	existing, err := s.Get(ctx, table, id)
	if err != nil {
		return false, err
	}
	if existing == nil {
		return false, nil
	}
	_, err = s.exec(fmt.Sprintf(`DELETE FROM %s WHERE id=%s;`, table, quote(id)))
	return err == nil, err
}

func decodeRecord(line string) (*Record, error) {
	var raw struct {
		ID        string          `json:"id"`
		Data      json.RawMessage `json:"data"`
		CreatedAt string          `json:"createdAt"`
		UpdatedAt string          `json:"updatedAt"`
	}
	if err := json.Unmarshal([]byte(line), &raw); err != nil {
		return nil, err
	}
	c, _ := time.Parse(time.RFC3339Nano, raw.CreatedAt)
	u, _ := time.Parse(time.RFC3339Nano, raw.UpdatedAt)
	return &Record{ID: raw.ID, Data: raw.Data, CreatedAt: c, UpdatedAt: u}, nil
}

func quote(s string) string {
	return "'" + strings.ReplaceAll(s, "'", "''") + "'"
}

func (s *Store) exec(sql string) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	cmd := exec.Command("sqlite3", s.path)
	cmd.Stdin = strings.NewReader(sql)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("sqlite3: %w: %s", err, strings.TrimSpace(stderr.String()))
	}
	return stdout.String(), nil
}

func (s *Store) query(sql string) ([]string, error) {
	out, err := s.exec(sql)
	if err != nil {
		return nil, err
	}
	out = strings.TrimSpace(out)
	if out == "" {
		return nil, nil
	}
	return strings.Split(out, "\n"), nil
}
