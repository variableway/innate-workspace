package meta

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"

	"github.com/variableway/innate-go/internal/store"
)

// Service contains the Meta CRUD use cases shared by HTTP and Vine adapters.
type Service struct {
	store *store.Store
}

// NewService creates a Meta CRUD domain service.
func NewService(st *store.Store) *Service { return &Service{store: st} }

// List returns records from an allowed dynamic table.
func (s *Service) List(ctx context.Context, table string) ([]store.Record, error) {
	t, err := normalize(table)
	if err != nil {
		return nil, err
	}
	return s.store.List(ctx, t)
}

// Get returns one record from an allowed dynamic table.
func (s *Service) Get(ctx context.Context, table, id string) (*store.Record, error) {
	t, err := normalize(table)
	if err != nil {
		return nil, err
	}
	return s.store.Get(ctx, t, id)
}

// Create adds one record to an allowed dynamic table.
func (s *Service) Create(ctx context.Context, table, id string, data json.RawMessage) (*store.Record, error) {
	t, err := normalize(table)
	if err != nil {
		return nil, err
	}
	if id == "" {
		id, err = newID()
		if err != nil {
			return nil, err
		}
	}
	return s.store.Create(ctx, t, id, data)
}

// Update changes one record in an allowed dynamic table.
func (s *Service) Update(ctx context.Context, table, id string, data json.RawMessage) (*store.Record, error) {
	t, err := normalize(table)
	if err != nil {
		return nil, err
	}
	return s.store.Update(ctx, t, id, data)
}

// Delete removes one record from an allowed dynamic table.
func (s *Service) Delete(ctx context.Context, table, id string) (bool, error) {
	t, err := normalize(table)
	if err != nil {
		return false, err
	}
	return s.store.Delete(ctx, t, id)
}

// LogRequest records an HTTP request for audit purposes.
func (s *Service) LogRequest(ctx context.Context, method, path, table string, body []byte) error {
	return s.store.LogRequest(ctx, method, path, table, body)
}

// ListRawRequests returns recent request audit records for diagnostics.
func (s *Service) ListRawRequests(ctx context.Context, limit int) ([]store.RawRequest, error) {
	return s.store.ListRawRequests(ctx, limit)
}

func normalize(table string) (string, error) { return store.NormalizeTable(table) }

func newID() (string, error) {
	var b [8]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	return hex.EncodeToString(b[:]), nil
}
