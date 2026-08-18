# TODO Ideas — base/

> **已落地拆分**：可执行任务见 [`innate-foundation/`](./innate-foundation/)（[`TASKS.md`](./innate-foundation/TASKS.md)）。本文保留分析 backlog，实施以 foundation 任务为准。

对照 `README.md` 规划 vs 当前仓库现状，整理待建设与可抽离事项。

## 现状速览

| README 目标 | 现状 | 状态 |
|-------------|------|------|
| 1. 前端基础代码 + 前端开发 SKILL | `innate-fe-base`（已注册 registry）：admin 模板、`@innate/ui`、`fe-starter` skill | ✅ 已有 |
| 2. 后端基础代码 / 后端开发 Skill | 无独立仓库或目录 | ❌ 缺失 |
| 3. 基础设施 + docker-compose | `base/` 下无 compose / Dockerfile | ❌ 缺失 |
| 4.1 AI Agent Provider Configuration Lib | 能力散落在 `flock`（`flock-core` providers）与 `projects/tooling/innate-aiswitcher`，未抽成 base 库 | ⚠️ 参考有，可复用库无 |
| 4.2 AI Agent Runtime | `flock`（`flock-agent` + langgraph-rust）是完整 runtime，但与桌面产品强耦合，未抽成独立 runtime | ⚠️ 参考有，可复用库无 |
| 5. Desktop / Tauri 可共享打包框架 | `flock/flock-ui`（Tauri）是单体应用，无共享 packaging lib | ❌ 缺失 |
| 5. Desktop Application 基础组件 | `flock-ui` 组件绑死 Flock；未沉淀为可共享 desktop 组件库 | ❌ 缺失 |

> `flock` 目前是第三方参考仓（`Onelevenvy/flock`），**未**写入 `registry.yaml` / `.gitmodules`。适合当参考，不宜当「自家基础库」直接依赖。

---

## 1. 前端基础（已有 → 增强）

- [ ] 确认 `innate-fe-base` 作为「前端脚手架唯一入口」写进本目录 README / registry 说明
- [ ] 评估 `fe-starter` 是否覆盖新项目冷启动；缺口（landing / auth / chat 等）补进 skill 或 templates
- [ ] 考虑把可复用 UI / composites 与 demo apps 的边界写清，方便其他 `projects/` 直接依赖

## 2. 后端基础代码 / Skill（待建）

- [ ] 选定技术栈（如 Go / PocketBase / Rust / Node）并新建 `innate-be-base`（或等价命名）
- [ ] 沉淀：项目骨架、鉴权、CRUD/API 约定、配置、日志、错误模型
- [ ] 编写后端开发 Skill（对齐 `fe-starter` 的 sync 模式），支持从既有后端仓库「基于参考代码」生成/改造
- [ ] 注册到父仓 `registry.yaml` + `.gitmodules`

## 3. 基础设施 + docker-compose（待建）

- [ ] 新建 `infra/`（或 `innate-infra`）：本地开发常用服务 compose
  - [ ] Postgres / Redis / MinIO（或等价对象存储）等最小集合
  - [ ] 可选：向量库、邮件、可观测（按项目需要再拆 profile）
- [ ] 统一 `.env.example`、健康检查、volume 约定
- [ ] 文档：如何被 `projects/*` 一键引用（`include` / override）

## 4. AI Agent 基础代码（从参考抽离）

### 4.1 Provider Configuration Lib

- [ ] 定义独立库职责：多 Provider 配置、API Key / Profile、模型列表、兼容层（OpenAI-compatible 等）
- [ ] 对照抽离来源：
  - `flock/crates/flock-core`（providers / model factory / config）
  - `projects/tooling/innate-aiswitcher`（本地切换器）
- [ ] 产出可被 CLI / Desktop / 服务端共用的配置契约（语言待定：Rust crate 或 TS/Go lib）
- [ ] 与 aiswitcher 的边界：配置库 vs 切换/代理服务

### 4.2 AI Agent Runtime

- [ ] 明确「Runtime」最小接口：session、tool loop、streaming、HITL approval、skill 加载
- [ ] 评估是否从 `flock-agent` / `flock-tools` / `flock-skills` 抽核心，而非 fork 整仓
- [ ] 目标形态：可嵌入桌面 / 可 CLI / 可选服务端，不绑定某一 UI
- [ ] 决定是否自研 thin runtime，还是封装现有引擎（langgraph-rust 等）

## 5. Desktop Application 基础（待建）

### 5.1 Tauri 可共享打包框架

- [ ] 抽「Tauri app shell / packaging lib」：窗口、更新、IPC 约定、构建脚本、多端打包配置
- [ ] 让多个 Desktop 产品共享同一套打包与原生能力，而不是复制 `flock-ui/src-tauri`
- [ ] 文档化：如何用该 lib 新建一个空 Desktop 应用

### 5.2 Desktop 基础组件

- [ ] 沉淀跨产品 UI 积木：聊天面板、工具审批、设置/Provider、工作区壳、日志/状态条等
- [ ] 与 `innate-fe-base` 的关系：Web 组件 vs Desktop（Tauri）组件分层，避免两套完全割裂
- [ ] 可选：先从 Flock 交互模式提炼设计稿 / 组件清单，再实现独立包

## 6. 目录与治理（横切）

- [ ] 修正 README 编号（两项都标成「5」）
- [ ] 决定 `flock` 定位：仅参考（gitignore / 文档说明）还是正式 submodule + registry
- [ ] 为每个新建 base 子仓补：README、AGENTS.md、registry 条目、clone 说明
- [ ] 约定命名：`innate-*-base` vs 功能名（provider / runtime / desktop-shell）

---

## 建议落地顺序

1. **治理澄清**：README 编号 + `flock` 是否入库  
2. **infra compose**：成本低、立刻服务多个项目  
3. **后端 base + skill**：补齐前后端对称脚手架  
4. **Provider Config Lib**：从 aiswitcher / flock 收敛配置契约  
5. **Agent Runtime 抽离**：依赖配置契约稳定后再切  
6. **Desktop shell + 组件**：在 runtime / 配置可复用后再抽 Tauri 共享层  

---

## 备注

- 本文件是 idea backlog，不是实施计划；落地时再拆到具体 issue / task。
- `innate-fe-base` 已较完整，后续以「被其他 base / projects 复用」为主，避免再堆平行前端模板仓。
