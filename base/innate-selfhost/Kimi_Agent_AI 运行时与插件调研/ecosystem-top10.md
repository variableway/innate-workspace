# 5大AI Agent Runtime生态 Top 10 排名（修正版）

> 调研时间：2026年5月 | 范围：Agent Runtime（框架/工具），**不含模型本身** | 数据来源：GitHub Stars、行业报告

---

## 生态一：Claude Code 生态（Anthropic）

围绕 Claude 模型构建的 Agent Runtime 工具链。核心特点是 harness 架构（工具执行器+权限管理器+Hook系统+子Agent框架），深度集成但不开放模型切换。

| 排名 | Agent Runtime | Stars | 类型 | 核心能力 |
|------|--------------|-------|------|----------|
| 1 | **Claude Code** | N/A | 官方CLI | Harness架构：Tool Executor + Permission Manager + 12 Hook事件 + Subagent框架 |
| 2 | **Claude Agent SDK** | N/A | 官方SDK | Python/TS SDK：agent loop + MCP client + context管理，与Claude Code同runtime |
| 3 | **superpowers** | 110K | Agent Harness | 方法论优先：spec→plan→TDD red/green，调度40+ CLI agents |
| 4 | **everything-claude-code** | 105K | Agent Harness | 工具优先：98%测试覆盖，AgentShield安全扫描 |
| 5 | **Bernstein** | N/A | Python编排器 | 编排40+ CLI coding agents（Claude Code/Codex/Gemini CLI/Cursor/Aider），git worktree隔离 |
| 6 | **OpenClaw** | 228K | 开源Agent框架 | Gateway多路复用WebSocket/HTTP，多层级权限级联（global/provider/agent/session/sandbox） |
| 7 | **ralph-tui** | N/A | Agent编排器 | 多Agent loop编排：Claude Code/OpenCode/Gemini CLI/Codex/Kiro/Droid/Cursor CLI |
| 8 | **Sutando** | 300 | macOS Agent | 自动加入Zoom、语音控制、自主构建循环 |
| 9 | **ClawSweeper** | 1.3K | AI维护机器人 | AI扫描issue/PR，建议关闭什么及原因 |
| 10 | **git-parsec** | 6K | Worktree管理 | 给每个AI agent独立workspace，解决并行index.lock冲突 |

---

## 生态二：Codex 生态（OpenAI）

围绕 GPT/Codex 模型的 Agent Runtime。OpenAI Agents SDK 是官方框架，支持 handoffs、guardrails、tools、MCP，Codex CLI/Desktop 是面向终端和桌面的 Agent 应用。

| 排名 | Agent Runtime | Stars | 类型 | 核心能力 |
|------|--------------|-------|------|----------|
| 1 | **OpenAI Agents SDK** | 12K | 官方框架 | Handoffs + Guardrails + Tools(Function/MCP/Hosted) + Session管理 + Tracing |
| 2 | **Codex CLI** | N/A | 官方CLI | GPT-5.3/5.4驱动，终端原生Agent，workspace-scoped任务 |
| 3 | **Codex Desktop** | N/A | 桌面应用 | 原生Mac/Win，并行多Agent，Git worktree，cloud VM隔离 |
| 4 | **GitHub Copilot Workspace** | N/A | 云Agent | Issue→PR完整工作流，云端执行 |
| 5 | **Copilot for CLI** | N/A | 终端Agent | 命令行自动补全，shell级Agent |
| 6 | **Open Interpreter** | 56K | 通用Agent | 自然语言→代码执行，full OS control，本地运行 |
| 7 | **Pydantic AI** | 11K | Type-safe框架 | 结构化输出验证，schema约束的Agent输出 |
| 8 | **LangChain** | 116K | 通用框架 | 1000+集成，prototyping首选 |
| 9 | **Genkit** | N/A | Google框架 | Middleware系统：retries + fallbacks + tool approval + skill injection |
| 10 | **CrewAI** | 38K | 多Agent框架 | Role-based多Agent团队，任务委派 |

---

## 生态三：DeepSeek 生态

DeepSeek本身主要提供模型（通过OpenAI兼容API），Agent Runtime是第三方开源框架与DeepSeek API的组合。DeepSeek V4预调优了Claude Code、OpenCode、OpenClaw、CodeBuddy四大harness的adapter。

| 排名 | Agent Runtime | Stars | 类型 | 核心能力（+DeepSeek） |
|------|--------------|-------|------|---------------------|
| 1 | **OpenCode** | 140K | 终端Agent | 75+ providers（含DeepSeek），$2-5/mo实现90%高级性能 |
| 2 | **Aider** | 39K | 结对编程 | Git-native自动commit，DeepSeek via OpenRouter |
| 3 | **Goose** | 32K | Block Agent | Apache 2.0，MCP-native，25+ providers含DeepSeek |
| 4 | **OpenClaw** | 228K | 个人助手 | Gateway架构，DeepSeek兼容（tool calling + agent loop） |
| 5 | **CrewAI** | 38K | 多Agent框架 | Role-based crews，DeepSeek via API |
| 6 | **LangGraph** | 19K | 状态机编排 | DAG-based状态机，持久化checkpoint |
| 7 | **SmolAgents** | 18K | 极简框架 | ~1K行核心，CodeAgent减少30% LLM调用 |
| 8 | **AutoGPT** | N/A | 自主执行 | Goal→autonomous execution |
| 9 | **Dify** | 60K | 可视化工作流 | 自托管，GUI builder |
| 10 | **n8n** | N/A | 工作流自动化 | 400+集成，self-hostable |

---

## 生态四：Kimi 生态（Moonshot AI）

Kimi Code CLI是核心Agent Runtime，MIT许可证开源。基于pi-tui构建TUI，支持ACP协议、MCP、video输入、subagents。Kimi模型通过OpenAI兼容API和MCP与第三方Agent Runtime集成。

| 排名 | Agent Runtime | Stars | 类型 | 核心能力 |
|------|--------------|-------|------|----------|
| 1 | **Kimi Code CLI** | N/A | 官方CLI | MIT开源，单二进制，video输入，MCP配置，6内置subagents |
| 2 | **pi-tui** | N/A | TUI框架 | Kimi Code的终端UI基础架构 |
| 3 | **Kimi 2.6 Code** | N/A | 社区版 | Bun构建，OpenAI兼容API |
| 4 | **OpenCode** | 140K | 终端Agent | 通过OpenRouter支持Moonshot AI（Kimi） |
| 5 | **Aider** | 39K | 结对编程 | 通过OpenRouter支持Kimi模型 |
| 6 | **Goose** | 32K | Block Agent | 25+ providers含Moonshot AI |
| 7 | **Zed** | 54K | Rust编辑器 | ACP协议原生集成Kimi Code |
| 8 | **OpenClaw** | 228K | 个人助手 | MCP连接Kimi Open Platform |
| 9 | **Continue.dev** | 26K | IDE扩展 | VS Code + JetBrains，支持Kimi API |
| 10 | **Claude Code + Kimi** | N/A | 适配方案 | 通过Kimi Soul adapter连接 |

---

## 生态五：全部自研/开源自研

完全自托管、零云依赖的Agent Runtime技术栈。Ollama作为本地LLM运行时核心，配合各种开源Agent框架。

| 排名 | Agent Runtime | Stars | 类型 | 核心能力 |
|------|--------------|-------|------|----------|
| 1 | **Ollama** | 161K | LLM运行时 | ollama run model，本地推理，零API成本 |
| 2 | **OpenCode** | 140K | 终端Agent | 75+ providers，完全开源 |
| 3 | **Open Interpreter** | 56K | 通用Agent | 自然语言→代码执行，full OS control |
| 4 | **Aider** | 39K | 结对编程 | Git-native自动commit，model-agnostic |
| 5 | **Dify** | 60K | 可视化工作流 | 自托管GUI builder，RAG-based |
| 6 | **CrewAI** | 38K | 多Agent框架 | Role-based crews，任务委派 |
| 7 | **Goose** | 32K | Block Agent | Apache 2.0，MCP-native，25+ providers |
| 8 | **LangGraph** | 19K | 状态机编排 | DAG-based，持久化checkpoint，crash recovery |
| 9 | **SmolAgents** | 18K | 极简框架 | ~1K行核心，HuggingFace原生 |
| 10 | **Flowise** | 32K | 拖拽编辑器 | Low-code agent building |

---

## 生态对比：Agent Runtime维度

| 维度 | Claude Code | Codex | DeepSeek | Kimi | 全部自研 |
|------|:--:|:--:|:--:|:--:|:--:|
| **核心Runtime** | Claude Code CLI | OpenAI Agents SDK | 第三方组合 | Kimi Code CLI | Ollama + 框架 |
| **模型锁定** | Claude only | OpenAI only | 任意（API） | Kimi only | 任意（本地） |
| **开源度** | 部分（harness） | SDK开源 | 依赖第三方 | CLI开源 | 完全开源 |
| **MCP支持** | 原生 | 是 | 依赖框架 | 原生 | 依赖框架 |
| **Subagent** | 原生（6角色） | Handoffs | 依赖框架 | 原生（6角色） | 依赖框架 |
| **本地部署** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **最佳场景** | 复杂重构 | 自主任务 | 低成本编码 | 中文/视频 | 隐私优先 |
