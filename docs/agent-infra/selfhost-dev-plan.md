# 开发态 Self-host AI Infra：InsForge、Supabase、pgvector 与 Memory

这份方案把 Bun、Deno、Go、WASM、InsForge、Supabase、pgvector 和 memory 分成“稳定内核”和“可替换控制面”。目标是让一个开发者在 Mac 上复现数据库、记忆、模型和 Agent 执行环境，同时可以切换 InsForge 或 Supabase 做集成验证。

## 结论

InsForge 与 Supabase 都是 BaaS 控制面，都会覆盖数据库访问、Auth、Storage、Realtime、项目 API 等能力。它们不应该在开发环境里同时常驻，更不应该对同一业务表双写。推荐结构是：

- **稳定内核**：PostgreSQL + pgvector、`MemoryStore` contract、`agent_runs`、Bun/Deno runtime。
- **本地记忆**：memweave（SQLite + FTS5 + 本地 embedding）作为离线真相源。
- **共享记忆**：Postgres 的 `memory_items` 作为经过确认的投影，支持 pgvector、过滤和 RLS。
- **BaaS 适配器（二选一）**：先用 InsForge 验证 Agent/MCP/项目 API；需要 Supabase SDK、Auth、RLS、Realtime 或 Storage 兼容性时切换 Supabase。
- **模型**：Ollama 可选，保持 OpenAI-compatible provider 接口。

```text
Bun agent-runtime ── Deno 受限执行器
        │
        ├── MemoryStore ── memweave SQLite/Markdown（离线真相源）
        │              └── Postgres adapter → pgvector memory_items（共享投影）
        ├── InsForge adapter  或  Supabase adapter（当前会话只选一个）
        └── Ollama（可选）
```

## 为什么要改原方案

1. Caddy/Cloudflare、Traefik、Authentik、Mercure、MinIO 同时启动，对开发机资源和排错都不划算。
2. Bun 与 Go 同时作为主控会造成两套调试链；MVP 先用 Bun，只有 profiling 证明存在瓶颈才提取 Go worker。
3. Deno `--allow-*` 是应用权限边界，不是恶意代码的强隔离；第三方代码要迁移到 rootless 容器或 microVM。
4. WASM 先不进入主路径，等有真实 CPU/序列化热点再引入 WASI 算子。
5. InsForge 和 Supabase 是替代关系，不是叠加关系。统一 schema 和 adapter 才能避免 Auth、迁移、权限、记忆出现两套事实。

## 职责边界

| 层 | 负责 | 不负责 |
|---|---|---|
| PostgreSQL + pgvector | 关系数据、运行审计、共享 memory、向量检索 | 登录 UI、模型推理、代码沙箱 |
| InsForge adapter | Agent/MCP、项目 API、快速开发控制面 | 取代本地 memory 真相源 |
| Supabase adapter | Auth、RLS、Realtime、Storage、supabase-js 兼容性 | 与 InsForge 并行维护业务后端 |
| memweave | 离线写入、Markdown 可审查、FTS5 + 本地向量 | 多用户实时共享 |
| Bun/Deno | 编排、超时、权限声明、结构化事件 | 生产级隔离 |

## Memory 体系

memory 分为三类：

| 类型 | 真相源 | 索引 | 生命周期 |
|---|---|---|---|
| 会话事件、草稿、离线笔记 | memweave SQLite/Markdown | FTS5 + 本地向量 | 可编辑、可 git 审查 |
| 用户事实、偏好、摘要 | Postgres `memory_items` | pgvector + metadata/filter | 用户或 Agent 确认后上传 |
| 运行日志、工具调用、错误 | `agent_runs`，后续 events 表 | 时间/状态索引 | 可清理，用于调试和评估 |

统一接口保持：`write(facts, scope)`、`search(query, scope, filters)`、`forget(id|scope)`。同步采用本地先写、后台幂等 UPSERT；冲突键建议为 `(workspace_id, user_id, agent_id, session_id, kind, logical_key)`，按 `updated_at` 做 LWW 并记录 `source`。

embedding 先固定 384 维，与当前 memweave 的 MiniLM/hash fallback 对齐。可使用 sentence-transformers、Ollama embedding 或 hash fallback，但必须记录 `embedding_model`；模型或维度变化时建立新索引版本，禁止混用。

## 已落地

- `base/innate-selfhost/infra/docker-compose.dev.yml`：固定版本 pgvector Postgres；Valkey 为 `queue` profile。
- `base/innate-selfhost/infra/dev-init.sql`：启用 `pgcrypto`/`vector`，创建 `agent_runs`、`memory_items` 和开发 RLS 策略。
- `base/innate-selfhost/infra/env.dev.example`：开发端口、数据卷、沙箱超时。
- `base/innate-selfhost/services/agent-runtime/src/main.ts`：Bun 调度 Deno、超时杀进程、输出 JSON 结果。
- `base/innate-selfhost/services/memweave`：现有 SQLite local-first memory 实现。
- `base/innate-selfhost/scripts/deploy.sh dev`：启动开发数据库。

## 运行方式

```bash
cd base/innate-selfhost
bash scripts/setup.sh
bash scripts/deploy.sh dev

cd services/agent-runtime
bun run demo
```

开发数据库：`postgresql://postgres:dev-only-change-me@localhost:55432/agent_dev`。

本地模型单独运行 `cd services/ollama && docker compose up -d`。InsForge 或 Supabase 集成应作为独立 profile/adapter 接入，当前会话只启用一个；若某发行版不支持外部 Postgres，就用其自带数据库做兼容测试，并通过导出/导入验证迁移，不做双写主库。

## InsForge 与 Supabase 是否共用 PostgreSQL

可以共用同一个 **PostgreSQL 实例**，但建议按 database 和 role 隔离：

```text
一个 Postgres 容器/集群
  ├── agent_dev      → runtime、memory_items、agent_runs
  ├── insforge_dev   → InsForge 自己的迁移和系统表
  └── supabase_dev   → Supabase Auth/Realtime/Storage/项目表
```

这种方式共享 CPU、内存和 pgvector 镜像，但每个 BaaS 拥有自己的数据库、迁移历史和数据库角色。`vector` 扩展需要在实际使用它的每个 database 中单独 `CREATE EXTENSION`；PostgreSQL 的 role 是实例级对象，名称必须避免冲突。

不建议让 InsForge 和 Supabase 共用同一个 database，更不要让它们同时管理同一张业务表。两套 BaaS 通常会创建自己的 metadata、auth、storage、realtime 表和 RLS/trigger；自动迁移可能互相覆盖。只有在产品文档明确支持“外部数据库 + 指定 schema”，并且为每套服务建立独立 role、schema、migration owner 时，才考虑同库不同 schema。

共享业务数据时，选择一个 owner：由 `agent_dev` 的 `memory_items`/领域表作为事实源，InsForge 或 Supabase 通过 adapter/API 访问；不要让两个 BaaS 对同一表自动 CRUD。这样可以共用 Postgres 的物理资源，也保留随时拆成两个实例的退出路径。

## 实施路线图

| 阶段 | 产出 | 验收 |
|---|---|---|
| P0 | Compose、pgvector、Bun→Deno runner、`agent_runs`/`memory_items` schema | `docker compose config` 通过，权限拒绝和超时可复现 |
| P1 | TypeScript `MemoryStore`、memweave adapter、Postgres adapter、Ollama/mock provider | 离线写入/搜索通过，恢复后 UPSERT 幂等 |
| P2 | InsForge adapter/profile、MCP manifest、capability 校验 | 可完成项目/API/MCP smoke test，记忆仍走统一 contract |
| P3 | Supabase adapter/profile、Auth/RLS/Realtime/Storage contract tests | 登录、RLS、订阅、上传各有 smoke test |
| P4 | 断网同步、冲突合并、embedding 版本迁移、评估集 | 多设备/多用户隔离可验证，检索质量有基准 |
| P5 | rootless 容器、浏览器 profile；按 profiling 引入 Go/WASM | 第三方脚本崩溃不影响主控，资源上限生效 |

## 工程约束

- InsForge 与 Supabase 不同时作为业务后端，不双写 Auth、Storage、Realtime 或 memory。
- 开发端口使用 `55432`/`56379`，避免覆盖本机服务；默认只绑定 localhost。
- secret 只放 `.env.dev`，镜像固定 tag，升级后重跑 fresh install 和 `docker compose config`。
- `services/baas` 保留为完整组合栈/私有云集成测试，不作为开发默认依赖。
- 不在 MVP 引入服务发现、Kubernetes、Cloudflare Tunnel 或多租户认证。

## 下一步编码顺序

1. 定义 TypeScript `MemoryStore` contract，实现 memweave 和 Postgres 两个 adapter。
2. 给 runtime 增加 `run`/`list` CLI，把运行和 memory 事件写入 Postgres。
3. 先接 InsForge adapter 做 Agent/MCP 流程，再接 Supabase adapter 做 SDK/Auth/RLS 兼容测试。
4. 定义 MCP plugin manifest 和 capability 校验。
5. 第三方脚本迁移 rootless 容器；有 profiling 证据后再拆 Go/WASM。
