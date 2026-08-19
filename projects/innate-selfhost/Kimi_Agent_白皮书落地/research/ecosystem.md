# PostgreSQL 系方案生态核查（访问日期：2026-08-16）

## 1. ParadeDB

- **最新版本**：`pg_search` 最新为 **0.25.2**（ParadeDB 官方升级文档写明 "The latest version of pg_search is 0.25.2"，Docker tag 同步 `paradedb/paradedb:0.25.2`；文档页更新于 2026-08-11）。
  来源：https://docs.paradedb.com/deploy/upgrading （访问 2026-08-16）
  旁证：GitHub Releases 显示 0.23.x → 0.24.x → 0.25.x 系列，第三方汇总页记录 v0.24.1（2026-06-20）。
  https://github.com/paradedb/paradedb/releases ；https://dev.co/databases/open-source/paradedb

- **许可证**：**AGPL-3.0**（仓库级 license，第三方索引页与 MCPg 的扩展许可矩阵均标注 AGPL-3.0）。注意 AGPL 的网络条款义务。
  来源：https://dev.co/databases/open-source/paradedb ；https://mcpservers.org/servers/devopam/mcpg （访问 2026-08-16）

- **pg_analytics 状态（验证通过）**：`paradedb/pg_analytics` 仓库已于 **2025-03-19 归档为只读**，README 明确 "has been discontinued and is archived… analytics 工作并入主扩展 pg_search"。官方 0.15.9 changelog 亦声明 2025-04-02 起弃用、从 Dockerfile/Helm 移除。与掌握信息（2025-03 归档、能力并入 pg_search）一致。
  来源：https://github.com/paradedb/pg_analytics ；https://docs.paradedb.com/changelog/0.15.9 （访问 2026-08-16）

- **手工安装路径**：官方为 **Postgres 15+** 提供预编译 deb/rpm/macOS 二进制（Debian 12/13、Ubuntu 24.04/26.04、macOS 15/26、RHEL 9/10；其他平台需 pgrx 源码编译）。安装后**必须**加入 `shared_preload_libraries = 'pg_search'` 并重启（近期版本起"无条件要求"，见 releases 中 #4914）。**0.25.0 起 pgvector 成为前置依赖**（pg_search 依赖其 `vector` 类型）。deb 示例：`postgresql-18-pg-search_0.25.2-1PARADEDB-resolute_amd64.deb`。
  来源：https://docs.paradedb.com/deploy/self-hosted/extension ；https://github.com/paradedb/paradedb/releases （访问 2026-08-16）

- **托管云支持**：
  - **AWS RDS：不支持**。pg_search 不在 RDS 许可扩展列表，官方 README 明确 "在 Amazon RDS 等托管服务上，除非服务商明确支持，否则无法安装"。
    来源：https://pgxn.org/dist/pg_search/0.18.5/pg_search/README.html （访问 2026-08-16）
  - **Neon：已弃用（验证通过）**。2026-03-19 起新项目不可安装 pg_search；存量安装将于 **2026 年 9 月移除**，官方提供迁移到 `lakebase_text`（基于 tsvector 的 `lakebase_bm25` 索引）的指南。
    来源：https://neon.com/docs/extensions/pg_search ；https://neon.com/docs/extensions/migrate-pg-search-to-lakebase-text （访问 2026-08-16）

- **公司动态（2025–2026）**：未见被收购记录；最近一轮融资为 **2025-04-22 Series A1，$12M**（PitchBook；此前 2023 种子轮 $2.05M，YC S23）。2026 年无新融资/收购的公开证据——**收购传闻未验证，按"无证据"处理**。
  来源：https://pitchbook.com/profiles/company/534519-73 （访问 2026-08-16）

## 2. TimescaleDB（Tiger Data）

- **最新版本**：**2.29.1，2026-08-04 发布**（继 2.29.0 / 2026-07-28；2.29.0 起移除 PostgreSQL 15 支持，仅支持 PG 16/17/18）。近期亮点：DML chunk exclusion、列存 last-point 查询优化、bloom filter 写路径剪枝（最高 160x）、cagg 增量手动刷新、`ALTER MATERIALIZED VIEW … ADD COLUMN` 在线加聚合列。
  来源：https://github.com/timescale/timescaledb/releases ；https://basekick.net/blog/timescaledb-alternatives-2026 （访问 2026-08-16）

- **许可证双轨现状（验证通过）**：双轨维持——**Apache 2.0**（Open Source/核心版，可任意商用含转售服务）+ **Timescale License（TSL，source-available 非 OSI 开源）**（Community 版，含连续聚合、列式压缩/Hypercore、保留策略等高级功能；自用免费，禁止作为托管 DBaaS 出售）。官方法律页 2025-06-17 生效版本主体已更名 "Timescale, Inc. d/b/a Tiger Data"。
  来源：https://www.tigerdata.com/legal/licenses ；https://docs.tigerdata.com/about/latest/timescaledb-editions/ （访问 2026-08-16）

- **timescaledb-ha 镜像与 pgvector（验证通过）**：`timescale/timescaledb-ha` 基于 Ubuntu + Patroni，默认打包大量扩展（PostGIS、pgBackRest、toolkit 等）；CHANGELOG 记录已包含 **pgvectorscale 与 pgai**，且 pgvector 本身自 2023 年起内置于该镜像（社区 compose 示例直接 `shared_preload_libraries='timescaledb,vector'`）。标签体系：`pgXX-tsX.Y`、`all`（含全部组件/多 PG 版本）、`oss`（纯 Apache 组件，无 TSL）。
  来源：https://github.com/timescale/timescaledb-docker-ha （README/CHANGELOG） ；https://github.com/timescale/timescaledb-docker-ha/releases （访问 2026-08-16）

- **连续聚合与列式压缩现状**：仍是核心功能且持续演进——2.28 支持手动增量刷新（分批、轻锁）、CASE 向量化、first/last 稀疏索引直读列存元数据；2.29 优化列存 last-point 查询。压缩 90–95% 压缩率的官方口径未变。
  来源：https://github.com/timescale/timescaledb/releases ；https://www.tigerdata.com/docs/get-started/news/new （访问 2026-08-16）

- **TigerData 更名（验证通过）**：Timescale Inc. 于 **2025 年 6 月**更名为 **Tiger Data**；产品名 TimescaleDB 保留，托管云 Timescale Cloud → **Tiger Cloud**。官方文档域名为 docs.tigerdata.com，TSL 法律页主体也已更名。
  来源：https://7wdata.be/tool/tigerdata/ ；https://www.tigerdata.com/legal/licenses ；https://www.tigerdata.com/docs/get-started/news/new （访问 2026-08-16）

- **附带发现**：Supabase 已在 **Postgres 17 项目上弃用 TimescaleDB**（PG15 保留至 EOL），推荐 pg_partman + 原生分区。来源：https://basekick.net/blog/timescaledb-alternatives-2026 ；https://www.supascale.app/blog/timescaledb-for-selfhosted-supabase-time-series-data-guide （访问 2026-08-16）

## 3. Supabase

- **自托管官方支持状态**：官方口径仍是 **"community-supported"**（社区支持），非官方 SLA 支持。2025-10 官方在 GitHub 开了 discussion #39820 收集自托管痛点并设有专职人员跟进；核心服务（Postgres、Auth、Storage、Realtime、PostgREST）社区反馈稳定，但**托管备份/PITR、分支（branching）、高级指标、ETL、管理 API 均为平台（托管版）专属**，自托管 Studio 仅单项目、无组织/分支/高级监控；Logflare 分析组件可选且生产推荐 BigQuery 后端。组件清单核心未变（GoTrue/Auth、PostgREST、Realtime、Storage、Studio、Kong、Supavisor、Logflare、Postgres），但 **supabase/postgres 的 PG17 镜像不再内置 TimescaleDB**（需自建镜像）。
  来源：https://queryglow.com/blog/supabase-self-hosted ；https://www.supascale.app/blog/timescaledb-for-selfhosted-supabase-time-series-data-guide （访问 2026-08-16）

- **托管版定价模型（2026-08 现状，多源交叉验证）**：
  - 计划：Free $0；**Pro $25/月/组织**（注意：2023-09 起按组织计费而非按项目，网上大量"$25/项目"的说法是错的）；Team $599/月起（配额与 Pro 相同，买的是 SOC2/ISO/SSO/更长留存等治理能力）；Enterprise 定制。
  - Pro 含 **$10/月 compute credit**（恰好抵一台 Micro 实例）；**每项目独立计费的 compute**：Micro $10、Small $15、Medium $60、Large $110、XL $210、2XL $410，至 16XL $3,730。
  - 计量项：数据库磁盘 $0.125/GB、文件存储 $0.0213/GB、出口流量 $0.09/GB（cached $0.03）、Auth MAU 超出 100K 后 $0.00325/MAU；PITR 为 $100/月/7 天留存的付费 add-on（Pro 不含）。
  - 来源：https://selfhost.dev/blog/supabase-pricing-explained/ （2026-08-05 对照官网核验）；https://omidsaffari.com/blog/supabase-pricing （2026-08-04 核验）（访问 2026-08-16）

- **相对纯开源组合的锁定点**：
  1. **Dashboard/管理平台不可自托管平移**：组织管理、分支、高级指标、备份/PITR、ETL、管理 API 只在托管平台存在，自托管 Studio 功能子集。
  2. **配置分裂与运维自担**：自托管无托管备份，升级 Postgres 大版本无官方 runbook；邮件模板等配置需改 env 并重启。
  3. **扩展集随官方镜像走**：托管/官方镜像扩展清单受 Supabase 取舍影响（如 PG17 移除 TimescaleDB；Neon 弃 pg_search 属 Neon 侧但同理），锁定在供应商的扩展决策上。
  4. **计费维度耦合**：BaaS 打包计费（MAU、Realtime 连接数、Edge Function 调用量等 20+ 计量项）使成本与"纯 Postgres"不可直接对比，迁移出 Supabase 意味着重建 Auth/Storage/Realtime 等周边栈。
  来源：https://queryglow.com/blog/supabase-self-hosted ；https://selfhost.dev/blog/supabase-pricing-explained/ （访问 2026-08-16）

## 未验证事项汇总

- ParadeDB 2026 年是否有新一轮融资/收购谈判：未发现公开证据（PitchBook 最近一轮止于 2025-04 Series A1 $12M）。
- Supabase 自托管组件清单是否有官方逐项对比页面：以上结论基于社区调研文章与官方 discussion #39820 的转述，未逐条核对官方仓库当前 docker-compose。
- AWS RDS 不支持 pg_search：基于 ParadeDB 官方 README 的通用声明（RDS 未将其列入许可扩展清单），未在 RDS 官方扩展列表页逐项核验。
