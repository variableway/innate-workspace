# 第五章 应用类型解决方案

第四章按"规模"分层，本章换一条轴：按**应用类型**给出"最小可行栈 + 升级路径"。四类典型负载——CRUD、Search、Data-intensive、金融交易——对 PG 生态的调用方式截然不同，同一套栈在四类负载下的优劣会反转。每节末尾给出升级触发条件，5.5 汇总成表。所有版本号、许可证与定价均为 2026-08-16 核查事实，出处见章末「来源」。

## 5.1 CRUD 为主：管理后台与业务工具

**判断**：CRUD 类应用（管理后台、内部工具、表单系统）的瓶颈不在数据库，而在"API 的边际生产成本"——谁把"建表到可调接口"的距离压到最短，谁就赢。

**最小可行栈**：PostgreSQL + **PostgREST**（REST）或 **Hasura**（GraphQL + 实时订阅）。两者都做到"建表即 API"：PostgREST 通过 `PGRST_DB_SCHEMA` 暴露 schema，RLS 直接成为 API 的安全边界；Hasura 额外提供 GraphQL 联邦与 console [^1^]。认证接 Authentik/Keycloak 签发的 JWT，全栈一台 4C8G VPS（约 €22/月）即可承载中小团队全部内部系统 [^2^]。

**升级路径一：Agent 生成 CRUD**。InsForge 在此有真实而非营销的价值：其 MCP 语义层向编码代理暴露 `get-table-schema`、`run-raw-sql`（strict mode）、`bulk-upsert` 等工具，并支持 agent 直接执行迁移前滚——CRUD 从"人写接口"变为"agent 读 schema 后生成表+RLS+API" [^3^]。HN 社区实测评价"RLS 默认开启 + MCP 给 sane defaults 是巨大胜利"（2026-05，62 分）；官方 MCPMark 基准（vs Supabase 1.6x 快、1.7x 准确率）为**厂商自测，未独立复现**。代价是 PG 锁在 15、扩展生态保守，且自托管务必显式设置 `ENCRYPTION_KEY` 以规避密钥回退链（issue #905/#1552）。

**升级路径二：多库路由**。当需要把同一套自动 API 铺到多个存量库时，**pREST**（Go 实现的 PostgREST 精神续作）是更轻的路由选项：单二进制、低内存、可按实例挂载不同库，适合网关化部署 [^1^]。Hasura 则以多数据源联邦覆盖同一需求，但更重。

**不要选**：为纯 CRUD 后台引入 Realtime/Edge Functions 全家桶——80% 的内部工具用不到，徒增运维面。

## 5.2 Search 需求：三级阶梯

**判断**：PG 内搜索的天花板在 2026 年已被显著抬高，多数中小场景不再需要 Elasticsearch；但"什么时候 PG 系扛不住"必须有明确边界。

**阶梯一：内置 tsvector/tsquery**。零成本起步，`ts_rank_cd` 排序 + GIN 索引即可支撑百万行级的关键词检索；中文场景加 zhparser。这是 Neon 官方为 pg_search 用户指定的降级迁移目标（`lakebase_text`，基于 tsvector）的底层能力 [^4^]。

**阶梯二：pg_search 0.25.2（ParadeDB）**。当需求升级为 BM25 相关性、分面聚合、模糊纠错、向量混合搜索时，pg_search 把 Tantivy 引擎做进 PG：最新版 **0.25.2**，0.25.0 起 pgvector 成为前置依赖，向量+BM25 一体 [^4^]。两个采用前提必须写进采购单：① **AGPL-3.0** 网络条款义务，商业 SaaS 需法务确认；② 安装后必须配置 `shared_preload_libraries = 'pg_search'` 并重启，且 **AWS RDS 不支持、Neon 已对新项目禁用**（存量 2026 年 9 月移除）——它实质上是"自管 PG 专属"方案 [^4^]。

```sql
-- pg_search 最小示例：BM25 索引 + 混合检索
CREATE INDEX idx_docs_bm25 ON docs
  USING bm25 (id, title, body) WITH (key_field='id');
SELECT id, paradedb.score(id) AS bm25_score
FROM docs WHERE docs @@@ 'title:数据库 OR body:后端'
ORDER BY bm25_score DESC LIMIT 20;
```

**阶梯三：何时必须上 ES/ClickHouse**。边界条件有三：① **文档规模到百亿级**——PG 单库即便分区也难承载该量级倒排索引的写入放大；② **跨地域分片与多活**——ES 的分片路由与跨集群复制是 PG 扩展不提供的；③ **搜索流量与 OLTP 强隔离的合规/SLA 要求**。此时正确形态是"PG 为系统记录 + 变更数据捕获（CDC）同步到 ES/ClickHouse"，而不是替换 PG [^5^]。

## 5.3 Data-intensive：分析、报表与 AI 管道

**判断**：2026 年的 PG 扩展生态使"一个库干五件事"在中等规模（TB 以内）成立；超过边界后，ClickHouse/DuckDB 以互补而非替代的方式接入。

**最小可行栈**：**ParadeDB 发行版**（PG + pgvector + pg_search 一镜像）承载业务数据、全文与向量混合检索，省掉 ES + 向量库两条同步管道 [^4^]。

**升级路径一：嵌入式 OLAP**。**DuckDB** 是分析层的最佳互补：`pip` 级集成、进程内零运维，可直接以 `postgres_scanner` 或 parquet 直读方式对 PG/对象存储做即席聚合，把重分析查询从 OLTP 库卸载到笔记本或任务容器：

```sql
-- DuckDB 内直接扫 PG 做报表，不占生产库 CPU
INSTALL postgres; LOAD postgres;
ATTACH 'dbname=app host=pg.internal' AS pg (TYPE POSTGRES);
SELECT date_trunc('day', created_at) d, count(*), sum(amount)
FROM pg.orders GROUP BY 1 ORDER BY 1;
```

**升级路径二：自动 embedding 管道**。**pgai**（Timescale/Tiger Data 出品，`timescaledb-ha` 镜像已内置）在 PG 内定义 vectorizer：行插入即自动调用 embedding 模型、写回向量列，把"业务表 → 向量索引"的 ETL 从应用代码里消掉 [^6^]。与 pgvector 组合后，AI 记忆与业务数据同库，审计与备份策略统一。

**边界**：① **分析数据量到 TB 级以上、QPS 要求亚秒聚合**——上 ClickHouse 做列存分析层，PG 保留系统记录；② **实时写入吞吐超单库**（>10 万行/秒持续）——Kafka + ClickHouse 管道。ParadeDB 的 `pg_analytics` 仓库已归档只读（2025-03-19），其能力并入 pg_search，说明 PG 内 OLAP 路线收敛于"搜索增强"而非"替代列存数仓" [^4^]。

## 5.4 金融交易数据：三层组合

**核心论点**：金融场景的正确答案不是"选一个最快的库"，而是**用 PG 系三层组合（OLTP 系统记录 + TimescaleDB 行情时序 + DuckDB 回测）同时满足 ACID 正确性、时序查询效率与监管可审计性**——kdb+/ClickHouse 只在明确的规模触发条件下才进入。

**第一层：OLTP 系统记录 = PostgreSQL**。订单、成交、持仓、资金流水必须落在具备完整 ACID、行级安全（RLS）与触发器/WAL 审计链的库上——这是监管视角下"系统记录"（system of record）的唯一合格形态：数据不出域（自管或专有云）、RLS 做账户级隔离、WAL + PITR 提供完整可重放的审计轨迹。Supabase/InsForge 这类 BaaS 的 RLS 默认开启实践（HN 实测正面评价）证明该模式已被工程化 [^3^]。

**第二层：行情与 K 线 = TimescaleDB hypertable + 连续聚合**。Tick/分钟线写入 hypertable 自动分区，连续聚合物化 5 分/小时/日 K 线并增量刷新（2.28 起支持手动增量刷新、轻锁），列式压缩（官方口径 90–95%，厂商自测）+ 保留策略控制存储成本；当前版本 **2.29.1**（2026-08-04，已移除 PG15 支持）[^5^][^7^]：

```sql
-- 连续聚合生成 5 分钟 K 线（TSL 许可证功能）
CREATE MATERIALIZED VIEW kline_5m WITH (timescaledb.continuous) AS
SELECT time_bucket('5 minutes', ts) AS bucket, symbol,
       first(price, ts) AS open, max(price) AS high,
       min(price) AS low, last(price, ts) AS close, sum(volume) AS vol
FROM ticks GROUP BY bucket, symbol;
```

注意许可证与兼容性含义：连续聚合属 **TSL**（source-available，自用免费、禁止作为托管 DBaaS 转售）[^7^]；且 **Supabase PG17 镜像已弃用 TimescaleDB**——若行情层跑在托管 PG 上，应预期迁移到自管 PG 或官方推荐的 pg_partman + 原生分区路线，这一托管生态位收缩是采购决策的现实变量 [^8^]。

**第三层：回测与量化分析 = DuckDB**。回测是典型"读多、可重跑、无并发写入"负载：DuckDB 直接扫 TimescaleDB 导出的 parquet 或经 postgres_scanner 连库拉数，进程内列存执行，策略迭代不需要动生产库（示例见 5.3）。数据同时满足"研究自由度"与"生产隔离"两个互相冲突的要求。

**kdb+/ClickHouse 的触发条件**：① **Tick 级数据存量超 TB 且要求毫秒级全历史扫描**（高频做市/全市场回放）→ kdb+；② **多资产全市场行情写入持续 >10 万行/秒、查询以全库聚合为主** → ClickHouse 作为行情分析层，PG 仍保留交易记录 [^5^]。未触发前，引入它们意味着额外团队、许可证成本（kdb+ 为商业闭源）与同步管道，属于为不存在的问题付利息。

**监管友好性小结**：三层全部为可自托管软件，数据不出域；交易层 WAL 审计链 + 时序层保留策略 + 分析层只读快照，构成"不可变记录—派生视图—研究副本"的清晰证据链，比"一切进黑盒商业引擎"在合规答辩时更有利。

## 5.5 汇总：四类应用 × 最小栈/升级栈

| 应用类型 | 最小可行栈 | 升级栈（触发条件） | 明确不要选 |
|---|---|---|---|
| **CRUD 为主** | PG + PostgREST（或 Hasura）+ Authentik JWT | InsForge（agent 生成 CRUD/迁移）；pREST/Hasura 联邦（多库路由） | 全量 BaaS 全家桶 |
| **Search 需求** | PG tsvector + GIN（中文 +zhparser） | pg_search 0.25.2（BM25/混合搜索；自管 PG 专属）；ES/ClickHouse + CDC（百亿文档/跨地域分片） | 百万行级就上 ES 集群 |
| **Data-intensive** | ParadeDB 一镜像（PG+pgvector+pg_search） | DuckDB 嵌入 OLAP；pgai 自动 embedding；ClickHouse（TB 级/亚秒聚合 SLA） | 自建 ES+向量库双管道 |
| **金融交易数据** | PG（OLTP+RLS+WAL 审计）+ TimescaleDB（行情/K 线）+ DuckDB（回测） | kdb+（TB 级 tick 毫秒回放）；ClickHouse（>10 万行/秒全市场行情） | 交易记录进非 ACID 存储 |

四类的共同主线：**默认从"PG + 扩展"出发，只在量化触发条件命中时引入专用引擎**——PG 系在 2026 年能覆盖的负载面比多数团队的直觉更宽，而每一次外引专用引擎都应以可测量的边界为依据，而非以惯性为依据。

---

## 来源

（以下 URL 均于 2026-08-16 访问）

[^1^]: https://github.com/PostgREST/postgrest ；https://github.com/prest/prest ；https://hasura.io （自动 API 层组件）
[^2^]: 本项目仓库 /mnt/agents/output/ai-memory-backend/baas/README.md（组合栈成本与组件映射）
[^3^]: https://docs.insforge.dev/mcp-setup.md ；https://docs.insforge.dev/agent-native/overview.md ；HN Algolia story 48181342（2026-05，62 分）；GitHub InsForge issues #905/#1552（密钥回退）；官方 MCPMark 为厂商自测
[^4^]: https://docs.paradedb.com/deploy/upgrading ；https://docs.paradedb.com/deploy/self-hosted/extension ；https://github.com/paradedb/pg_analytics （归档声明）；https://neon.com/docs/extensions/pg_search ；https://neon.com/docs/extensions/migrate-pg-search-to-lakebase-text ；https://pgxn.org/dist/pg_search/0.18.5/pg_search/README.html （RDS 不支持声明）；AGPL-3.0 许可证
[^5^]: https://www.tigerdata.com/docs/get-started/news/new ；https://www.tigerdata.com/legal/licenses （TSL 双轨：连续聚合/列压/保留策略归属）
[^6^]: https://github.com/timescale/timescaledb-docker-ha （timescaledb-ha 内置 pgvector/pgvectorscale/pgai）
[^7^]: https://github.com/timescale/timescaledb/releases （2.29.1 / 2026-08-04 / 移除 PG15 支持）
[^8^]: https://basekick.net/blog/timescaledb-alternatives-2026 ；https://www.supascale.app/blog/timescaledb-for-selfhosted-supabase-time-series-data-guide （Supabase PG17 弃用 TimescaleDB）
