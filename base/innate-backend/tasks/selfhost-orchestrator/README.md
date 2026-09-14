# Self-host Orchestrator 任务组

目标：以 `base/innate-backend/innate-go` 为唯一控制入口，用 Go/Vine 管理开发态 self-host AI Infra；Bun/Deno 只作为受控脚本执行器或前端工具，不承担基础设施事实源。

## 可行性判断

**可行，建议先做本地 standalone，再按需要 linked。** 现有 `innate-go` 已有 CLI、SQLite store、Vine sample、Taskfile 和 desktop helpers；backend-go Skill 已规定 RDB/Redis、Web/Rpc/Event/Task、配置、测试和 observability 入口。缺口主要是 Docker/Compose 控制、PostgreSQL/pgvector memory adapter、BaaS adapter 和 Agent run 生命周期。

| 能力 | Go 总控 | Bun/Deno | 备注 |
|---|---|---|---|
| `selfhost up/down/status/logs` | ✅ | — | Go 调 Docker Compose CLI，先不嵌 Docker SDK |
| 配置、manifest、依赖顺序 | ✅ | — | 单一 YAML/JSON contract |
| Postgres/pgvector、memory sync | ✅ | — | Go RDB component + Domain-owned persistence |
| InsForge / Supabase | ✅ | — | HTTP/SDK adapter；当前会话只选一个 BaaS |
| Agent run 审计、超时、取消 | ✅ | — | Go 管理生命周期和 `agent_runs` |
| AI 生成脚本、Playwright | — | ✅ | Go 传 capability/timeout，Bun/Deno 执行 |
| 高性能算子 | 以后 | — | 只有 profiling 证明有收益再引入 Go WASM/WASI |

## 目标目录

```text
base/innate-backend/innate-go/
  cmd/innate-go/
  internal/cli/
  internal/selfhost/
    domain/       # service manifest、状态、memory contract
    compose/      # docker compose process adapter
    postgres/     # pgvector/memory persistence adapter
    baas/         # InsForge/Supabase adapter
    runner/       # Bun/Deno process adapter
    observability/
  docs/selfhost/
```

按 backend-go Skill 的约束：接口放在消费方；先拆文件再拆 package；Vine Module 拥有领域生命周期；跨领域连接才做 Application Component；不为假设的数据库替换预付多层 abstraction。

## 任务顺序

| 任务 | 内容 | 依赖 | 优先级 |
|---|---|---|---|
| [T00](T00-vine-version-and-boundary.md) | Vine/skelc 版本门禁与工程边界 | — | P0 |
| [T01](T01-contract-and-cli.md) | 控制面 contract 与 CLI 骨架 | T00 | P0 |
| [T01-META](T01-meta-domain.md) | Meta CRUD Domain 与统一 HTTP/Vine 入口 | T01 | P0 |
| [T02](T02-compose-lifecycle.md) | Compose 生命周期与健康检查 | T01 | P0 |
| [T03](T03-postgres-memory.md) | PostgreSQL/pgvector 与 MemoryStore | T01-META | P0 |
| [T04](T04-baas-adapters.md) | InsForge/Supabase adapter | T01、T03 | P1 |
| [T05](T05-agent-runner.md) | Bun/Deno runner 与权限边界 | T01、T02 | P1 |
| [T06](T06-vine-app-composition.md) | Vine standalone → linked 组合 | T02、T04、T01-META | P1 |
| [T07](T07-observability-recovery.md) | 事件、审计、备份恢复和诊断 | T02、T03 | P1 |
| [T08](T08-integration-acceptance.md) | 集成验收、文档和发布 | T01–T07 | P1 |

## 不纳入首期

- 不在 Go 中重写 Docker，也不立即引入 Docker SDK。
- 不同时运行 InsForge 和 Supabase 作为双主 BaaS。
- 不把 memweave SQLite 直接改写成 Postgres；通过 `MemoryStore` adapter 和后台 UPSERT 衔接。
- 不在没有 profiling 前引入 WASM、Kubernetes、服务发现、Cloudflare Tunnel 或生产级多租户。
