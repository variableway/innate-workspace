package cli

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// Main is the innate-go entry (testable).
func Main(args []string) int {
	if len(args) == 0 {
		printRootHelp()
		return 0
	}
	switch args[0] {
	case "desktop-app", "desktop":
		return cmdDesktopApp(args[1:])
	case "server":
		return cmdServer(args[1:])
	case "version":
		fmt.Println("innate-go 0.1.0")
		return 0
	case "help", "-h", "--help":
		printRootHelp()
		return 0
	default:
		fmt.Fprintf(os.Stderr, "unknown command: %s\n", args[0])
		printRootHelp()
		return 2
	}
}

func printRootHelp() {
	fmt.Print(`innate-go — backend + desktop toolchain CLI

Usage:
  innate-go desktop-app config   Tauri/desktop shared Cargo config (default)
  innate-go desktop-app status|env|path|explain|clean|run
  innate-go server [meta]        Start meta CRUD REST (SQLite)
  innate-go server vine          Start Vine REST sample (via task)
  innate-go version

Build with Taskfile: task build / task run:server / task run:vine
`)
}

func rootDir() string {
	if v := os.Getenv("INNATE_GO"); v != "" {
		return v
	}
	candidates := []string{}
	if cwd, err := os.Getwd(); err == nil {
		candidates = append(candidates, cwd)
	}
	if exe, err := os.Executable(); err == nil {
		candidates = append(candidates, filepath.Dir(exe), filepath.Join(filepath.Dir(exe), ".."))
	}
	for _, start := range candidates {
		dir, _ := filepath.Abs(start)
		for i := 0; i < 10; i++ {
			if fileExists(filepath.Join(dir, "desktop", "env.sh")) {
				return dir
			}
			parent := filepath.Dir(dir)
			if parent == dir {
				break
			}
			dir = parent
		}
	}
	cwd, _ := os.Getwd()
	return cwd
}

func desktopDir() string { return filepath.Join(rootDir(), "desktop") }
func targetDir() string {
	if v := os.Getenv("CARGO_TARGET_DIR"); v != "" {
		return v
	}
	return filepath.Join(desktopDir(), "target")
}

func fileExists(p string) bool {
	_, err := os.Stat(p)
	return err == nil
}

func cmdDesktopApp(args []string) int {
	sub := "config"
	if len(args) > 0 {
		sub = args[0]
		args = args[1:]
	}
	switch sub {
	case "config":
		return desktopConfig()
	case "status":
		return desktopStatus()
	case "env":
		return desktopEnv()
	case "path":
		fmt.Println(targetDir())
		return 0
	case "explain":
		return desktopExplain()
	case "clean":
		return desktopClean(args)
	case "run":
		return desktopRun(args)
	case "help", "-h", "--help":
		fmt.Print(`innate-go desktop-app — shared Tauri/Cargo compile cache

Subcommands:
  config    default: print Tauri cargo shared config + how to apply
  status    show CARGO_TARGET_DIR and disk use
  env       print export lines (eval "$(innate-go desktop-app env)")
  path      print target dir only
  explain   four goals / boundaries
  clean     remove shared target/ (needs --yes)
  run --    run a command with env applied
`)
		return 0
	default:
		fmt.Fprintf(os.Stderr, "unknown desktop-app subcommand: %s\n", sub)
		return 2
	}
}

func desktopConfig() int {
	t := targetDir()
	_ = os.MkdirAll(t, 0o755)
	fmt.Printf(`# innate-go desktop-app config (Tauri / shared Cargo target)

CARGO_TARGET_DIR=%s
desktop_helpers=%s

# Apply in current shell:
eval "$(innate-go desktop-app env)"
# or: source %s/env.sh

# Node:
#   import { withDesktopCargoEnv } from ".../desktop/env.mjs"

# Run a build with shared target:
innate-go desktop-app run -- cargo check --manifest-path path/to/src-tauri/Cargo.toml

# Clean once:
innate-go desktop-app clean --yes

See: innate-go desktop-app explain
`, t, desktopDir(), desktopDir())
	return 0
}

func desktopEnv() int {
	t := targetDir()
	_ = os.MkdirAll(t, 0o755)
	def := filepath.Join(desktopDir(), "target")
	if os.Getenv("CARGO_TARGET_DIR") == "" {
		fmt.Printf("export CARGO_TARGET_DIR=%q\n", def)
	} else {
		fmt.Printf("export CARGO_TARGET_DIR=%q\n", os.Getenv("CARGO_TARGET_DIR"))
	}
	if out, err := exec.Command("uname", "-s").Output(); err == nil && strings.TrimSpace(string(out)) == "Darwin" {
		mdt := os.Getenv("MACOSX_DEPLOYMENT_TARGET")
		if mdt == "" {
			mdt = "10.13"
		}
		fmt.Printf("export MACOSX_DEPLOYMENT_TARGET=%q\n", mdt)
	}
	return 0
}

func desktopStatus() int {
	pre := os.Getenv("CARGO_TARGET_DIR") != ""
	t := targetDir()
	fmt.Printf("CARGO_TARGET_DIR=%s\n", t)
	if pre {
		fmt.Println("source=already-set (not overridden)")
	} else {
		fmt.Printf("source=default (%s)\n", filepath.Join(desktopDir(), "target"))
	}
	if st, err := os.Stat(t); err != nil || !st.IsDir() {
		fmt.Println("exists=no")
		return 0
	}
	cmd := exec.Command("du", "-sh", t)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	_ = cmd.Run()
	return 0
}

func desktopExplain() int {
	fmt.Print(`innate-go desktop-app — shared Cargo compile artifacts (Tauri default)

| Goal | What you get |
|------|----------------|
| 1. build too big | Shrinks N copies of tauri/wry target/ into ~1 dir. Still can be multi-GB debug. |
| 2. same cache / deps | Download cache is already ~/.cargo. Compile outputs share via CARGO_TARGET_DIR when versions+features+rustc match. |
| 3. one path to clean | Everything under desktop/target — clean once. |
| 4. that's enough | Just the env var. No Cargo workspace, no shell-lib required for this goal. |

Boundaries:
- Does NOT force identical Cargo.toml versions across apps.
- Builds without this env still write to each app's src-tauri/target.
- Does NOT cover frontend dist/ or node_modules.

Typical:
  eval "$(innate-go desktop-app env)"
  innate-go desktop-app config
`)
	return 0
}

func desktopClean(args []string) int {
	yes := false
	for _, a := range args {
		if a == "--yes" {
			yes = true
		}
	}
	t := targetDir()
	if !yes {
		fmt.Printf("Will remove: %s\nRe-run: innate-go desktop-app clean --yes\n", t)
		return 1
	}
	if err := os.RemoveAll(t); err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 1
	}
	fmt.Printf("removed %s\n", t)
	return 0
}

func desktopRun(args []string) int {
	if len(args) > 0 && args[0] == "--" {
		args = args[1:]
	}
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "usage: innate-go desktop-app run -- <command> [args...]")
		return 2
	}
	env := os.Environ()
	if os.Getenv("CARGO_TARGET_DIR") == "" {
		t := filepath.Join(desktopDir(), "target")
		_ = os.MkdirAll(t, 0o755)
		env = append(env, "CARGO_TARGET_DIR="+t)
	}
	cmd := exec.Command(args[0], args[1:]...)
	cmd.Env = env
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		if ee, ok := err.(*exec.ExitError); ok {
			return ee.ExitCode()
		}
		fmt.Fprintln(os.Stderr, err)
		return 1
	}
	return 0
}
