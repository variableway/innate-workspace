# 生态对照

两张表不要混用：左边是 **编码/助手 Harness**，右边是 **可自托管 Runtime 积木**。数字来自 2026-05 的 `ecosystem-top10.md` 与 Runtime 主报告，会漂。

## 五条 Harness 生态（不含模型本身）

| 生态 | 核心 Runtime | 模型绑定 | 本地 | 典型场景 |
|------|----------------|----------|------|----------|
| Claude Code | 官方 CLI + Agent SDK | Claude | 否 | 复杂重构、Hook/Subagent |
| Codex | Agents SDK + Codex CLI/Desktop | OpenAI | 否 | 自主任务、云 VM |
| DeepSeek | 第三方组合（OpenCode/Aider/Goose…） | API 任意 | 可以 | 低成本编码 |
| Kimi | Kimi Code CLI（MIT、MCP、subagent） | Kimi | 否 | 中文、视频输入 |
| 全部自研 | Ollama + 开源框架 | 本地任意 | 是 | 隐私优先 |

自研积木高频名字：Ollama、OpenCode、Open Interpreter、Aider、Dify、CrewAI、Goose、LangGraph、SmolAgents、Flowise。

DeepSeek / Kimi 往往是「模型进现有 Harness」，不是第三套桌面壳。

## 与本仓库的对齐

innate-selfhost 明确站在 **全部自研 / 私有云** 一侧：Ollama 预留、组合栈 BaaS、memweave、懒猫 LPK。桌面 Runtime（`services/agent-runtime`）按 [runtime-plugins.md](./runtime-plugins.md) 的 Tauri+MCP 补齐，而不是包一层 Claude Code。

## 安全优先的 implicit 规则

- 流行度 ≠ 可上生产（OpenClaw）
- 厂商 MCP 基准要当广告，直到自己压测（InsForge MCPMark）
- 技能/MCP 市场无审核 = 供应链风险（ClawHavoc）

## 原始长表

需要完整 Top 20 打分或五生态各 10 名时，打开：

- `base/innate-selfhost/Kimi_Agent_AI 运行时与插件调研/ai-agent-runtime.agent.final.md`
- `base/innate-selfhost/Kimi_Agent_AI 运行时与插件调研/ecosystem-top10.md`
