# README

Innate Workspace and Project indexes.

This workspace is the source of an Innate-related documentation site, covering Innate skills, projects and reference docs, plus small personal-use tools built with AI.

## Innate Apps

Build Apps for personal use. Each subfolder under [`innate-apps/`](innate-apps/) is a category. Projects are indexed in [`registry-innate-apps.yaml`](registry-innate-apps.yaml), synced by [`scripts/scan-innate-apps.py`](scripts/scan-innate-apps.py).

### Categories

| Category | Description | Projects |
|----------|-------------|----------|
| `content` | Content-related apps | _empty_ |
| `edu` | Education-related apps | _empty_ |
| `tooling` | Personal dev tools and CLI utilities | innate-aiswitcher, spark-cli |

### Projects

| Category | Project | Description |
|----------|---------|-------------|
| `tooling` | [innate-aiswitcher](innate-apps/tooling/innate-aiswitcher) | Local LLM Provider switcher for AI coding agents (Go + PocketBase). Select the Provider/Profile to use when starting Claude Code, Codex, Gemini CLI, Trae CLI, OpenCode etc. |
| `tooling` | [spark-cli](innate-apps/tooling/spark-cli) | CLI for daily dev automation and AI skill integration: multi-repo git management, script/task workflows, system utilities (Go, Cobra). |
