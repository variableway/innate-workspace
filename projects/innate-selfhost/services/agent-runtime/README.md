# Agent Runtime — AI Agent 运行时

基于 Tauri 基座的轻量级 AI Agent Runtime，支持插件系统和多 LLM Provider。

## 状态

🔲 预留 — 待实现

## 规划

基于 [AI Agent Runtime 调研报告](../../Kimi_Agent_AI%20运行时与插件调研/) 的研究成果：

- **核心**: Tauri v2 桌面壳 + Rust Runtime
- **插件**: MCP Server 生态（9,400+ 工具）
- **存储**: SQLite + sqlite-vec 统一存储
- **模型**: 40+ LLM Provider 支持
- **自动化**: Playwright 浏览器 + UI-TARS 桌面控制

## 技术栈

```
UI Layer:       Tauri v2 (React + TypeScript)
Runtime Layer:  Rust (MCP Host, Auth, Process Management)
Plugin Layer:   MCP Servers + WASM/WASI Sandbox
Storage Layer:  SQLite + sqlite-vec
```

## 依赖服务

- [baas](../baas/) — 后端 API 和认证
- [ollama](../ollama/) — 本地 LLM 推理（可选）
- [memweave](../memweave/) — 记忆层
