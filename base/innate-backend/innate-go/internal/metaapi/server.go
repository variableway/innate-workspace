package metaapi

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"github.com/variableway/innate-go/internal/store"
)

type Server struct {
	Store *store.Store
	Mux   *http.ServeMux
}

func New(st *store.Store) *Server {
	s := &Server{Store: st, Mux: http.NewServeMux()}
	s.Mux.HandleFunc("GET /healthz", s.handleHealth)
	s.Mux.HandleFunc("GET /api/meta/raw-requests", s.handleListRaw)
	s.Mux.HandleFunc("GET /api/meta/{table}", s.handleList)
	s.Mux.HandleFunc("POST /api/meta/{table}", s.handleCreate)
	s.Mux.HandleFunc("GET /api/meta/{table}/{id}", s.handleGet)
	s.Mux.HandleFunc("PUT /api/meta/{table}/{id}", s.handleUpdate)
	s.Mux.HandleFunc("DELETE /api/meta/{table}/{id}", s.handleDelete)
	return s
}

func (s *Server) Handler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		table := ""
		if rest, ok := strings.CutPrefix(r.URL.Path, "/api/meta/"); ok {
			table, _, _ = strings.Cut(rest, "/")
		}
		body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
		_ = r.Body.Close()
		r.Body = io.NopCloser(strings.NewReader(string(body)))
		_ = s.Store.LogRequest(r.Context(), r.Method, r.URL.Path, table, body)
		s.Mux.ServeHTTP(w, r)
	})
}

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) handleListRaw(w http.ResponseWriter, r *http.Request) {
	rows, err := s.Store.ListRawRequests(r.Context(), 100)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": rows})
}

func (s *Server) handleList(w http.ResponseWriter, r *http.Request) {
	table, err := store.NormalizeTable(r.PathValue("table"))
	if err != nil {
		writeErr(w, http.StatusBadRequest, err.Error())
		return
	}
	rows, err := s.Store.List(r.Context(), table)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"table": table, "items": rows})
}

type writeBody struct {
	Data json.RawMessage `json:"data"`
	ID   string          `json:"id,omitempty"`
}

func (s *Server) handleCreate(w http.ResponseWriter, r *http.Request) {
	table, err := store.NormalizeTable(r.PathValue("table"))
	if err != nil {
		writeErr(w, http.StatusBadRequest, err.Error())
		return
	}
	var req writeBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if len(req.Data) == 0 {
		writeErr(w, http.StatusBadRequest, `body must include "data" object`)
		return
	}
	id := req.ID
	if id == "" {
		id = newID()
	}
	rec, err := s.Store.Create(r.Context(), table, id, req.Data)
	if err != nil {
		writeErr(w, http.StatusConflict, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, rec)
}

func (s *Server) handleGet(w http.ResponseWriter, r *http.Request) {
	table, err := store.NormalizeTable(r.PathValue("table"))
	if err != nil {
		writeErr(w, http.StatusBadRequest, err.Error())
		return
	}
	rec, err := s.Store.Get(r.Context(), table, r.PathValue("id"))
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	if rec == nil {
		writeErr(w, http.StatusNotFound, "not found")
		return
	}
	writeJSON(w, http.StatusOK, rec)
}

func (s *Server) handleUpdate(w http.ResponseWriter, r *http.Request) {
	table, err := store.NormalizeTable(r.PathValue("table"))
	if err != nil {
		writeErr(w, http.StatusBadRequest, err.Error())
		return
	}
	var req writeBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if len(req.Data) == 0 {
		writeErr(w, http.StatusBadRequest, `body must include "data" object`)
		return
	}
	rec, err := s.Store.Update(r.Context(), table, r.PathValue("id"), req.Data)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	if rec == nil {
		writeErr(w, http.StatusNotFound, "not found")
		return
	}
	writeJSON(w, http.StatusOK, rec)
}

func (s *Server) handleDelete(w http.ResponseWriter, r *http.Request) {
	table, err := store.NormalizeTable(r.PathValue("table"))
	if err != nil {
		writeErr(w, http.StatusBadRequest, err.Error())
		return
	}
	ok, err := s.Store.Delete(r.Context(), table, r.PathValue("id"))
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	if !ok {
		writeErr(w, http.StatusNotFound, "not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, code int, msg string) {
	writeJSON(w, code, map[string]any{"error": map[string]any{"code": code, "message": msg}})
}

func newID() string {
	var b [8]byte
	_, _ = rand.Read(b[:])
	return hex.EncodeToString(b[:])
}
