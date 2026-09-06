# README

Innate Workspace and Project indexes.

This workspace is the source of an Innate-related documentation site, covering Innate skills, projects and reference docs, plus small personal-use tools built with AI.

## Innate Apps

Build Apps for personal use. Each subfolder under [`innate-apps/`](innate-apps/) is a category. Innate-related projects (apps plus [`base/`](base/) templates) are indexed in [`registry-innate.yaml`](registry-innate.yaml), synced by [`scripts/scan-innate-apps.py`](scripts/scan-innate-apps.py).

### Categories

| Category | Description | Projects |
|----------|-------------|----------|
| `content` | Content-related apps | innate-feeds, innate-wip |
| `edu` | Education-related apps | _empty_ |
| `tooling` | Personal dev tools and CLI utilities | innate-aiswitcher, spark-cli |

### Projects

| Category | Project | Description |
|----------|---------|-------------|
| `content` | [innate-feeds](innate-apps/content/innate-feeds) | GitHub trending / starred / issues-digest feed app (Hono + SQLite API or static GitHub Pages). |
| `content` | [innate-wip](innate-apps/content/innate-wip) | Personal website & project tracking with GitHub Issues integration and weekly progress summaries (Next.js). |
| `tooling` | [innate-aiswitcher](innate-apps/tooling/innate-aiswitcher) | Local LLM Provider switcher for AI coding agents (Go + PocketBase). Select the Provider/Profile to use when starting Claude Code, Codex, Gemini CLI, Trae CLI, OpenCode etc. |
| `tooling` | [spark-cli](innate-apps/tooling/spark-cli) | CLI for daily dev automation and AI skill integration: multi-repo git management, script/task workflows, system utilities (Go, Cobra). |
| `base` | [innate-fe-base](base/innate-fe-base) | pnpm monorepo for Web client development: shared UI primitives, admin scene templates and reference apps. |
| `content` | [ai-content-os](innate-apps/content/innate-feeds/ai-content-os) | AI content production OS for WeChat 公众号 creators: topic discovery → AI writing → publishing (third-party). |
| `content` | [baoyu-skills](innate-apps/content/innate-feeds/baoyu-skills) | Baoyu's AI Agent skills for daily work efficiency (Claude Code, Codex, third-party). |
| `base` | [oil-frontend](base/innate-fe-base/suggestion/oil-frontend) | Agent Skill set constraining AI product frontend implementation (third-party). |
