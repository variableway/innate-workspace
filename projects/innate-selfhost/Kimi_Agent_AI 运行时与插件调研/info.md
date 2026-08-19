# AgentForge Product Research

## Product Vision
AgentForge is a lightweight AI Agent Runtime base that enables users to BUILD / MODIFY / INTEGRATE tools through a plugin system, turning modifications into standalone products.

Core concept: "Your AI Agent, Your Product" — one runtime, infinite possibilities.

## Target Users
- Indie developers who want to build AI-powered tools quickly
- Technical product managers who need to prototype AI features
- Open source enthusiasts who want to customize and distribute AI agents
- Small teams who need private, local-first AI infrastructure

## Key Differentiators
1. **Lightweight**: <20MB single binary (Tauri-based)
2. **Plugin-native**: 9,400+ MCP servers available out of the box
3. **Browser + Computer-use**: Built-in web automation AND desktop control
4. **AI-powered modification**: Clone → AI modify → Package → Ship
5. **Local-first**: All data stays on device, SQLite unified storage
6. **Multi-Agent Provider**: 40+ LLM providers with intelligent routing

## Technical Architecture (4 Layers)
```
UI Layer:       Tauri v2 (cross-platform desktop, 15MB, <100ms startup)
Runtime Layer:  Rust (MCP Host, A2A client, auth, process management)
Plugin Layer:   MCP Servers (9,400+) + WASM/WASI sandbox
Storage Layer:  SQLite + sqlite-vec (unified, portable, single-file)
```

## Key Features
- **Plugin Marketplace**: Browse, install, configure MCP servers with one click
- **Built-in Browser**: Playwright-powered web automation for data extraction, testing
- **Computer-use Agent**: UI-TARS integration for desktop automation
- **Code Editor**: Monaco/CodeMirror-based editing with AI assistance
- **Terminal**: Built-in terminal for running commands and agents
- **Multi-Provider**: Connect to Claude, GPT, Gemini, Ollama, and 40+ more
- **Agent Studio**: Visual workflow builder for chaining agents and tools
- **One-click Publish**: Package modifications as standalone Tauri apps

## MVP (Phase 1: 0-2 months)
- Tauri v2 desktop shell with React UI
- MCP Host with 5 built-in tool integrations
- SQLite unified storage
- Basic code editor + terminal
- Claude/GPT/Ollama provider support

## Extended (Phase 2-3: 2-6 months)
- WASM plugin sandbox
- Built-in Playwright browser automation
- UI-TARS desktop automation
- Multi-Agent orchestration (A2A)
- Agent Studio visual workflow builder
- Plugin marketplace with ratings

## Competitive Landscape
- OpenClaw: 344K Stars but security issues
- Goose: 32K Stars, Linux Foundation, MCP-native
- Dify: Enterprise-focused, heavier
- Coze: Cloud-first, not local
- Nezha: 7MB Agent-first but limited providers
- oh-my-pi: 40+ providers but terminal-only

## Roadmap
Q2 2026: MVP with MCP + Tauri + SQLite
Q3 2026: Browser automation + Computer-use + WASM sandbox
Q4 2026: Plugin marketplace + Agent Studio + A2A orchestration
Q1 2027: Multi-agent collaboration + Cloud sync + Mobile support

## Waiting List Integration
- Feishu (Lark) multi-dimensional table for collecting early user info
- Fields: Name, Email, Use Case, Company/Role, Preferred Provider
- Webhook-based submission from the website
