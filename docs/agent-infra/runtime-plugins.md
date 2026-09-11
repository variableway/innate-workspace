# Runtime 与 Plugin

来源：`Kimi_Agent_AI 运行时与插件调研`（约 2026-05）。Stars 与 CVE 会变，选型时复核。

## 三个关键词

1. **MCP 标准化** — Host → Client → Server，JSON-RPC 2.0；原语 Tools / Resources / Prompts；传输 stdio（本地）与 Streamable HTTP（远程）。SSE 传输已废弃。约 9400+ 公共 server、企业团队高部署率。2025-12 Anthropic 将 MCP 捐给 Linux Foundation AAIF。
2. **Tauri 基座化** — 相对 Electron：包体积与内存大幅下降、Capability 默认拒绝。本地 LLM 三条路径：sidecar 管 Ollama（最成熟）、Rust 原生推理（Candle 等）、HTTP 多提供商客户端。
3. **SQLite 统一化** — Agent 状态 = 一个 SQLite 文件；sqlite-vec 做向量；与 memweave 的 FTS5+向量混合检索同一方向。细节见 [memory-backend.md](./memory-backend.md)。

## Plugin 三种模式

| 模式 | 长处 | 短处 | 用法 |
|------|------|------|------|
| MCP | 生态最大 | 审核弱则供应链风险 | 默认插件层 |
| WASM/WASI | 启动快、默认拒绝 | 生态小于 MCP | 第三方不可信代码 |
| Extension API（VS Code 式） | 宿主集成深 | 可移植性差 | IDE 内 Agent |

**ClawHavoc**（技能市场恶意 skill、大量暴露实例）说明：不能把「完全开放的技能商店」当差异化。商店必须有审核、签名、默认沙箱。

OpenClaw 以极高 Stars 定义了功能上限，也以大量安全公告定义了安全下限；综合评估里未进入「可推荐 Runtime」主清单。

## 推荐栈（个人「一个软件」）

**Tauri v2 + Rust Agent Runtime + MCP + SQLite**，推理侧挂 Ollama。

Top 5 速查（六维加权：影响力 / 轻量 / 本地 / 扩展 / 部署 / 安全；满分口径见原报告）：

| 倾向 | 项目 | 角色 |
|------|------|------|
| 本地推理底座 | Ollama | 必配 sidecar，本身不是完整 Agent |
| 安全向编码 Agent | Goose | Rust、WASM、AAIF、MCP 原生 |
| VS Code | Cline | Human-in-the-loop；缺 OS 级沙箱 |
| 极致轻量 | ZeroClaw / NanoBot | 小二进制 / 短代码复刻核心工作流 |
| 自动软件工程 | OpenHands | 超出「轻量桌面」范畴时再上 |

完整 Top 20 与五类拆分（助手 / 编码 / 本地 LLM / 轻量 Runtime / 自主开发）见原报告 `ai-agent-runtime.agent.final.md`。本手册不重复 20 行打分表。

## 协议只需两层（个人 Runtime）

调研类比：MCP≈传输能力、A2A≈应用间调用。个人用户现阶段实现 **MCP + A2A** 即可；支付协议（AP2）等放到中期。

## 办公 Skill 套件（同一 Runtime）

`office-skill-suite.md` 规划的是 AgentForge 上的 MCP 矩阵（MarkItDown / Pandoc / 导出 DOCX·PPTX·XLSX / Mermaid），不另起存储与壳。实现应落在 `services/agent-runtime`（预留），不进本目录。
