# 记忆层与 PG 后端

合并了 Runtime 报告的存储章、白皮书落地的 memweave/SPEC，以及 PG 五方案对比（约 2026-08-16）。

## 分工一句话

**SQLite 是端侧记忆真相源，PostgreSQL 是中枢系统记录。** 不是「选了 PG 就不能 local-first」。

## 端侧：memweave

实现目录：`base/innate-selfhost/services/memweave`（白皮书工程副本在 `Kimi_Agent_白皮书落地/ai-memory-backend/memweave`）。

机制（与 SPEC 对齐）：

- 表：`memory_sessions` / `memory_entities` / `memory_chunks` + FTS5 `memory_fts`
- `PRAGMA journal_mode=WAL`
- 混合检索：BM25 × 0.4 + 向量余弦 × 0.6
- 时间衰减：`0.95^days × (1 + 0.1 × access_count)`
- MMR 重排 λ=0.7；同 session+key 冲突则 UPDATE
- Markdown（`memory/*.md`）为可索引真相源
- embedding：sentence-transformers 优先，失败则确定性哈希向量（零依赖可跑）

原报告：pytest 7/7 通过（含多线程 WAL 写入）。

## 中枢选型（没有通吃赢家）

等权六维（便利 / PG 原生 / 可扩展 / 不锁定 / 懒猫可转化 / 生态），满分 30：

| 方案 | 合计 | 定位 |
|------|------|------|
| 开源组合栈 | 25 | 每层可替换；唯一已做懒猫 LPK |
| InsForge | 21 | Agent 操作面最完整（MCP/CLI/branching）；自托管 3 容器 |
| Supabase 托管 | 19 | 生态与省心基准；计量项多、迁出要重建周边 |
| Supabase 自托管 | 19 | 社区支持、Studio 是子集、扩展随官方镜像 |
| Nubase | 14 | 真实但稚嫩（v0.1.x、0 issues vs 数百 star），**不上生产** |

ParadeDB、TimescaleDB（Tiger Data）是 **数据库层组件**，不单独当 BaaS 打分。

### 方案要点

- **Supabase**：Pro 按**组织** $25/月（不是按项目）。自托管 community-supported；PG17 官方镜像已不带 TimescaleDB。
- **InsForge**：Apache-2.0，PG15+pgvector。部署必须**显式设置 `ENCRYPTION_KEY`**，禁止静默回退 JWT_SECRET（#905 / #1552）。
- **Nubase**：Spring Boot + 每项目独立 PG；内置 mem0 风格 Memory。观察对象，隔离试用。
- **ParadeDB**：`pg_search` 0.25.x，**AGPL-3.0**；RDS 不支持；Neon 已弃用路径。`shared_preload_libraries=pg_search`。
- **TimescaleDB 2.29.x**：仅 PG16+；连续聚合等高级能力在 **TSL**（自用免费，禁止当托管 DBaaS 转售）。

开发便利加权高则 Supabase 托管会排第一；不锁定+私有云加权高则组合栈断层领先。先定权重。

### 规模 × 类型（速查）

| | 个人 / MVP | 中小 SaaS | 企业 |
|--|------------|-----------|------|
| CRUD | Supabase Free 或 InsForge 自托管 | 省心 Pro / Agent 流 InsForge / €22 自管栈 三选 | 自管 PG + PostgREST/Hasura + Keycloak |
| Search | tsvector | 自管 + pg_search（先过 AGPL） | 极大规模才上 ES/CH |
| AI / 分析 | ParadeDB 一镜像 + DuckDB | 加 pgai | TB/亚秒 SLA 再引入 CH |
| 金融 | 单 PG（ACID+RLS） | + Timescale 连续聚合 + DuckDB 回测 | 三层自托管保审计链 |

## 端侧 × 中枢怎么长

| 阶段 | 形态 | 触发再升级 |
|------|------|------------|
| 单机 | 仅 memweave（一个 `memory.db`） | — |
| 团队 | 端侧 N 份 + 定时 UPSERT 进 PG（`(session_id,key)` + `updated_at` LWW） | 第二个要共享记忆的用户/Agent |
| 企业 | 衰减/MMR 下沉为 PL/pgSQL 或 pgai；SQLite 变缓存+离线缓冲 | 百万级条目或要跨租户审计 |

联合分析可用 DuckDB 同时 ATTACH SQLite 与 PG，不必先做管道。FDW/逻辑复制不适合「端侧经常离线」。

`write_memory` / `search` 的 API 形状三阶段保持不变。

## 采用前清单（摘录）

1. 干净环境 fresh install 到第一次真实 API
2. 所有 secret 显式化，无私有回退链
3. **恢复**演练（不是只配备份）
4. CRUD / 搜索 / 实时各压一条 p95
5. AGPL / TSL 法务三选一书面结论
6. `pg_dump` 异机恢复，估算退出人日

## 实现指针

- 组合栈 Compose：`base/innate-selfhost/services/baas/`
- 懒猫 LPK：`base/innate-selfhost/services/baas/lazycat/`
- 契约全文：`Kimi_Agent_白皮书落地/ai-memory-backend/SPEC.md`（过程稿）
