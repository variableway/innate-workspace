package cli

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/variableway/innate-go/internal/metaapi"
	"github.com/variableway/innate-go/internal/store"
)

func cmdServer(args []string) int {
	kind := "meta"
	if len(args) > 0 {
		switch args[0] {
		case "meta", "vine", "help", "-h", "--help":
			kind = args[0]
			args = args[1:]
		}
	}
	switch kind {
	case "help", "-h", "--help":
		fmt.Print(`innate-go server — start backend samples

  innate-go server [meta]   Meta CRUD REST on SQLite (default)
  innate-go server vine     Vine standalone REST sample

Flags for meta:
  -addr 127.0.0.1:8080
  -db   ./data/meta.sqlite
`)
		return 0
	case "meta":
		return runMetaServer(args)
	case "vine":
		return runVineServer(args)
	default:
		fmt.Fprintf(os.Stderr, "unknown server kind: %s\n", kind)
		return 2
	}
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
	st, err := store.Open(dbPath)
	if err != nil {
		log.Println(err)
		return 1
	}
	defer st.Close()
	srv := metaapi.New(st)
	fmt.Printf("innate-go server meta listening on http://%s\n", addr)
	fmt.Printf("  GET  /healthz\n")
	fmt.Printf("  CRUD /api/meta/{items|notes}  body: {\"data\":{...}}\n")
	fmt.Printf("  GET  /api/meta/raw-requests\n")
	if err := http.ListenAndServe(addr, srv.Handler()); err != nil {
		log.Println(err)
		return 1
	}
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
