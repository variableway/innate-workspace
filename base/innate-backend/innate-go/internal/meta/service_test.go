package meta

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/variableway/innate-go/internal/store"
)

func TestServiceCreateGeneratesIDAndRejectsUnknownTable(t *testing.T) {
	st, err := store.Open(t.TempDir() + "/meta.sqlite")
	if err != nil {
		t.Skipf("sqlite3 unavailable: %v", err)
	}
	svc := NewService(st)
	rec, err := svc.Create(context.Background(), "items", "", json.RawMessage(`{"name":"widget"}`))
	if err != nil {
		t.Fatal(err)
	}
	if rec.ID == "" {
		t.Fatal("expected generated id")
	}
	if _, err := svc.List(context.Background(), "users"); err == nil {
		t.Fatal("expected unknown table error")
	}
}
