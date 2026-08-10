package main

import (
	"log/slog"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/innate/agent-kanban/backend-go/internal/config"
	"github.com/innate/agent-kanban/backend-go/internal/handler"
	"github.com/innate/agent-kanban/backend-go/internal/store"
)

func main() {
	// Init structured logging
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	cfg := config.Load()
	slog.Info("starting Agent Kanban Go backend", "config", cfg)

	// Open database + run migrations
	s := store.MustOpenSQLite(cfg.DBPath)
	defer s.Close()

	// Setup router
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:4002", "http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-API-Key", "X-Hub-Signature-256", "X-GitHub-Event"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Register API routes
	h := handler.New(s, cfg)
	h.RegisterRoutes(r)

	// Start server
	addr := ":" + cfg.Port
	slog.Info("server listening", "addr", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		slog.Error("server failed", "error", err)
		os.Exit(1)
	}
}
