package store_test

import (
	"context"
	"encoding/json"
	"path/filepath"
	"testing"

	"github.com/variableway/innate-go/internal/store"
)

func TestMetaCRUD(t *testing.T) {
	st, err := store.Open(filepath.Join(t.TempDir(), "t.sqlite"))
	if err != nil {
		t.Fatal(err)
	}
	defer st.Close()
	ctx := context.Background()

	rec, err := st.Create(ctx, "items", "a1", json.RawMessage(`{"name":"widget","price":9}`))
	if err != nil || rec.ID != "a1" {
		t.Fatalf("create: %v %#v", err, rec)
	}
	got, err := st.Get(ctx, "items", "a1")
	if err != nil || got == nil || string(got.Data) != `{"name":"widget","price":9}` {
		t.Fatalf("get: %v %#v", err, got)
	}
	_, err = st.Create(ctx, "notes", "n1", json.RawMessage(`{"title":"hi"}`))
	if err != nil {
		t.Fatal(err)
	}
	_ = st.LogRequest(ctx, "POST", "/api/meta/items", "items", []byte(`{"data":{}}`))
	raws, err := st.ListRawRequests(ctx, 10)
	if err != nil || len(raws) == 0 {
		t.Fatalf("raw: %v %d", err, len(raws))
	}
}
