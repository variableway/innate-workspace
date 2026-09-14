# Agent Runtime — AI Agent 运行时

基于 Tauri 基座的轻量级 AI Agent Runtime，支持插件系统和多 LLM Provider。

## 状态

🧪 开发态骨架 — Bun 主控 + Deno 默认拒绝权限的执行器。暂不承诺多租户、生产隔离或浏览器自动化安全。

## 规划

基于 [AI Agent Runtime 调研报告](../../Kimi_Agent_AI%20运行时与插件调研/) 的研究成果，当前只落地开发闭环：

- **核心**: Tauri v2 桌面壳 + Rust Runtime
- **插件**: MCP Server 生态（9,400+ 工具）
- **存储**: SQLite + sqlite-vec 统一存储
- **模型**: 40+ LLM Provider 支持
- **自动化**: Playwright 浏览器 + UI-TARS 桌面控制

## 开发态运行

需要 Bun、Deno。Deno 脚本默认没有网络、文件、环境变量和子进程权限；需要能力时必须在主控层显式加入对应参数，并继续限制到项目目录。缺少 Deno 时，主控会直接提示安装命令并退出。

```bash
cd base/innate-selfhost/services/agent-runtime
bun install
bun run demo
```

预期输出中 `canReadEnv` 与 `canReadEtc` 都为 `false`。主控只接受 `agent-runtime` 目录内的脚本，并在 `SANDBOX_TIMEOUT_MS` 到期后杀掉子进程。

这段代码是开发用执行边界，不等同于容器或内核级沙箱。运行不可信代码前应迁移到独立容器或 microVM。

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
