package cli

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/variableway/innate-go/internal/metaapi"
	"github.com/variableway/innate-go/internal/metaapp"
	"github.com/variableway/innate-go/internal/store"
	"go.yorun.ai/vine/app/standalone"
)

func cmdServer(args []string) int {
	kind := "meta"
	if len(args) > 0 {
		switch args[0] {
		case "meta", "sidecar", "vine", "help", "-h", "--help":
			kind = args[0]
			args = args[1:]
		}
	}
	switch kind {
	case "help", "-h", "--help":
		fmt.Print(`innate-go server — start backend samples

  innate-go server [meta]   Meta Domain Vine standalone REST (default)
  innate-go server sidecar  Lightweight loopback HTTP adapter
  innate-go server vine     Vine standalone REST sample

Flags for meta:
  -addr 127.0.0.1:8080
  -db   ./data/meta.sqlite
`)
		return 0
	case "meta":
		return runMetaServer(args)
	case "sidecar":
		return runMetaSidecar(args)
	case "vine":
		return runVineServer(args)
	default:
		fmt.Fprintf(os.Stderr, "unknown server kind: %s\n", kind)
		return 2
	}
}

func runMetaSidecar(args []string) int {
	addr, dbPath := "127.0.0.1:8080", "./data/meta.sqlite"
	for i := 0; i < len(args); i++ {
		switch args[i] {
		case "-addr":
			if i+1 < len(args) {
				i++
				addr = args[i]
			}
		case "-db":
			if i+1 < len(args) {
				i++
				dbPath = args[i]
			}
		}
	}
	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		log.Println(err)
		return 1
	}
	st, err := store.Open(dbPath)
	if err != nil {
		log.Println(err)
		return 1
	}
	server := &http.Server{Addr: addr, Handler: metaapi.New(st).Handler()}
	fmt.Printf("innate-go server sidecar listening on http://%s\n", addr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Println(err)
		return 1
	}
	return 0
}

func runMetaServer(args []string) int {
	addr := "127.0.0.1:8080"
	dbPath := "./data/meta.sqlite"
	for i := 0; i < len(args); i++ {
		switch args[i] {
		case "-addr":
			i++
			if i < len(args) {
				addr = args[i]
			}
		case "-db":
			i++
			if i < len(args) {
				dbPath = args[i]
			}
		}
	}
	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		log.Println(err)
		return 1
	}
	if err := os.Setenv("INNATE_META_DB", dbPath); err != nil {
		log.Println(err)
		return 1
	}
	seedPath := filepath.Join(rootDir(), "internal", "metaapp", "seed.yaml")
	port := "8080"
	if idx := strings.LastIndex(addr, ":"); idx >= 0 && idx+1 < len(addr) {
		port = addr[idx+1:]
	}
	if _, err := strconv.Atoi(port); err != nil {
		log.Printf("invalid -addr %q: %v", addr, err)
		return 2
	}
	seed, err := os.ReadFile(seedPath)
	if err != nil {
		log.Printf("read meta seed: %v", err)
		return 1
	}
	seed = []byte(strings.Replace(string(seed), "matchPort: 8080", "matchPort: "+port, 1))
	seedFile, err := os.CreateTemp("", "innate-meta-seed-*.yaml")
	if err != nil {
		log.Printf("create meta seed: %v", err)
		return 1
	}
	seedPath = seedFile.Name()
	defer os.Remove(seedPath)
	if _, err := seedFile.Write(seed); err != nil {
		seedFile.Close()
		log.Printf("write meta seed: %v", err)
		return 1
	}
	if err := seedFile.Close(); err != nil {
		log.Printf("close meta seed: %v", err)
		return 1
	}
	hubDBPath := dbPath + ".vine-hub.sqlite"
	fmt.Printf("innate-go server meta listening on Vine entry http://0.0.0.0:%s (requested %s)\n", port, addr)
	if host, _, ok := strings.Cut(addr, ":"); ok && host != "" && host != "0.0.0.0" && host != "[::]" {
		fmt.Println("  note: Vine standalone entry currently binds all interfaces; use the lightweight HTTP adapter for loopback-only sidecars")
	}
	fmt.Printf("  GET  /healthz\n")
	fmt.Printf("  CRUD /api/meta/{items|notes}  body: {\"data\":{...}}\n")
	fmt.Printf("  GET  /api/meta/raw-requests\n")
	standalone.NewWithOption[*metaapp.App](standalone.Option{
		SQLiteFile:   hubDBPath,
		SeedYAMLFile: seedPath,
	}).StartAndWait()
	return 0
}

func runVineServer(args []string) int {
	root := rootDir()
	sample := filepath.Join(root, "samples", "vine-rest")
	if !fileExists(filepath.Join(sample, "go.mod")) {
		fmt.Fprintf(os.Stderr, "vine-rest sample not found at %s\n", sample)
		return 1
	}
	// Prefer task if available
	if _, err := exec.LookPath("task"); err == nil {
		cmd := exec.Command("task", "run:vine")
		cmd.Dir = root
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.Stdin = os.Stdin
		if err := cmd.Run(); err != nil {
			if ee, ok := err.(*exec.ExitError); ok {
				return ee.ExitCode()
			}
			fmt.Fprintln(os.Stderr, err)
			return 1
		}
		return 0
	}
	cmd := exec.Command("make", "run")
	cmd.Dir = sample
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin
	if err := cmd.Run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 1
	}
	return 0
}
