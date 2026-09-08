# 第二章 五大方案逐卡

本章是全报告的事实底座：对五个候选方案逐一建立"方案卡"——一句话定位、架构组件、关键事实（版本/许可证/stars/定价）、优势、劣势与风险、成熟度判定。所有数字均来自 2026-08-16 的核查调研并在章末「来源」列出 URL；厂商自测数据已标注，未独立复现的信息如实说明。五张方案卡之外，2.6 节给出一个"无平台锁定"的开源组合参照系，作为衡量各方案锁定程度的对照基准。

## 2.1 Supabase：托管基准

**定位一句话**：PostgreSQL 托管后端的事实标准，所有"PG 系 AI 原生后端"都在对标它。

**架构组件**：核心组件多年未变——Postgres（官方镜像）、Auth（GoTrue）、PostgREST、Realtime、Storage、Studio、Kong 网关、Supavisor 连接池、Logflare 分析 [^1^]。

**关键事实**：开源主体为宽松许可证；托管版定价为 Free $0 / **Pro $25/月/组织**（2023-09 起按组织计费，网传"$25/项目"是过时说法），Pro 含 $10/月 compute credit 恰好抵一台 Micro 实例；每项目独立计费的 compute 从 Micro $10 至 16XL $3,730；计量项包括数据库磁盘 $0.125/GB、出口流量 $0.09/GB、Auth MAU 超 100K 后 $0.00325/MAU、PITR 为 $100/月/7 天留存付费 add-on [^2^]。

**优势**：生态最厚（SDK、教程、人才、第三方集成），托管版开箱即用，对团队最"省心"；开源组件矩阵完整，是可对标的完整功能集。

**劣势/风险**：① 自托管仍是"community-supported"而非官方 SLA——2025-10 官方才开 discussion #39820 收集自托管痛点；托管备份/PITR、分支、高级指标、ETL、管理 API 均为平台专属，自托管 Studio 只是功能子集 [^1^]。② 扩展决策随官方镜像走：**PG17 镜像已不再内置 TimescaleDB**（PG15 保留至 EOL，官方推荐 pg_partman + 原生分区），自托管需自建镜像 [^3^]。③ 20+ 计量项的打包计费使成本与"纯 Postgres"不可直接对比，迁出意味着重建 Auth/Storage/Realtime 周边栈 [^2^]。

**成熟度判定**：生产级基准（托管版成熟，自托管版"可用但运维自担"）。

## 2.2 InsForge：Agent 原生控制面的 BaaS

**定位一句话**：YC（P26）支持的 Apache-2.0 "agent-native" 后端平台，差异化不在 PG 层，而在给 AI 编码代理用的 MCP 语义层与 CLI 控制面。

**架构组件**：自托管最小栈仅 **3 个核心容器**（postgres + postgrest + insforge app），app 内含 dashboard、自研 Auth、storage、MCP 与 Deno 函数代理；数据库为 **PostgreSQL 15**（镜像 v15.13.4，含 pgvector、pg_cron），REST 走 PostgREST v12.2.12；Edge Functions 用 Deno；Realtime 用 Socket.IO 而非 PG 逻辑复制；Model Gateway 强绑定 OpenRouter [^4^]。Agent 侧原语：MCP 工具（读 schema、跑迁移、部署函数等）、CLI JSON 输出、config-as-code（insforge.toml plan/apply）、**backend branching**（整后端克隆+merge/reset）、`insforge diagnose` 诊断自修复 [^5^]。

**关键事实**：Apache-2.0；GitHub API 实测 **12,757 stars / 1,138 forks / 125 open issues**（2026-08-14，第三方旧文称 2.3k，以 API 为准），~2,780 commits，每日多次提交，最新 release v1.5.6 [^6^]。托管定价：Free $0（5 万 MAU、闲置 1 周自动暂停）、Pro $25/月（100k MAU、8GB DB、含 $10 Compute 抵扣）、Enterprise 有 SOC2/HIPAA/SSO [^7^]。

**优势**：面向 agent 的操作面是当前五方案中最完整的（HN 2026-05 Show HN 62 分，社区正面评价集中在"RLS 默认开启 + MCP 给 sane defaults"）；自托管极轻（3 容器）；免费层够原型 [^8^]。

**劣势/风险**：① **密钥回退链**：issue #905（已关闭）确认 ENCRYPTION_KEY 未设置时静默回退用 JWT_SECRET 加密全部 secrets——轮转 JWT_SECRET 会致 secrets 永久不可读；compose 文件当前仍有 `ENCRYPTION_KEY:-${JWT_SECRET:-dev-secret...}` 回退链，#1552（fail-closed 加固）仍 open，自托管务必显式设置 ENCRYPTION_KEY [^9^]。② PG 版本偏旧（15 而非 16/17），扩展生态保守（未见 pg_net/pgmq/TimescaleDB）。③ 官方自测 MCPMark 基准（vs Supabase 1.6x 快、1.7x 准确率）为**厂商自测，未独立复现**。④ 项目年轻（repo 2025-07 创建）、文档/社区薄、Compute 仍 private preview、Sites 依赖 Vercel [^6^][^8^]。

**成熟度判定**：成长早期、开发高度活跃；可用于原型与中小项目，生产采用前须先堵密钥回退并跑通 fresh install。

## 2.3 Nubase：真实但稚嫩的开源新势力

**定位一句话**：2026-06-08 才开源的"AI 原生自托管后端 + 部署层"，八大模块（DB/Auth/Storage/Assets/Functions/AI Gateway/Memory/cron）一镜像打包——真实性已核实，但稚嫩度同样真实。

**架构组件**：Java **Spring Boot 3.2** + Java 17 后端、Next.js Studio 前端、**database-per-project 多租户 PostgreSQL**（每项目独立物理库，非共享 schema；RoutingDataSource + 每租户 HikariCP 连接池）；`/rest/v1/*` 是 Java 重写的 PostgREST 兼容层而非独立 PostgREST；Auth 为 GoTrue 兼容（含 MFA/TOTP/OAuth）；内置一等公民 **Memory（mem0 兼容 API，pgvector 余弦 + BM25 ts_rank_cd + 实体加权混合检索，中文 zhparser 支持）**与 **AI Gateway**（OpenAI/Anthropic 兼容、每项目 `nbk_` key、成本统计）[^10^]。

**关键事实**：GitHub **OtterMind/Nubase**：约 **620 stars / 73 forks / 106 commits / 10 contributors / 5 releases（最新 v0.1.4，2026-06-16）**，语言 Java 76.1%，**Apache-2.0**，2026-06-08 首次开源，至 2026-08-11 仍活跃提交；有 npm 包 `nubase_cli`、Docker 镜像 `ottermind/nubase`、官方文档站与中文 README 佐证 [^11^]。

**优势**：功能叙事与代码一一对应，mem0 风格记忆层 + AI 网关是五方案中唯一"内置"的；多租户 database-per-project 是与 Supabase 自托管（单项目）的实质架构差异；Apache-2.0 + 自托管免费。

**劣势/风险（疑点如实并列）**：① **620 stars 但 GitHub Issues 为 0**、仅 5 个 PR、4 watchers——社区互动与 star 数异常不匹配，star 可能主要来自营销/聚合站导流 [^12^]。② 第三方收录站 skillsllm.com 的安全扫描记录显示 README 曾被标记 **3 处 "secret-exfiltration" 中危提示**（instruction 疑似引导发送凭据到外部端点，状态仍为 PASSED）——未定性为恶意，但 MCP 工具安全面需读者自行评估 [^12^]。③ **无公司信息**：官网无公司名/地址/团队页，GitHub 组织 OtterMind 为个人型组织；中文提交信息与 WeChat OAuth 指向中文团队背景（未验证团队身份）。④ **无定价页**：nubase.ai/pricing 返回 504，README 中"AI 网关计费系统"提交暗示未来托管付费。⑤ Reddit/HN/知乎未检索到实质社区讨论。⑥ 功能缺口：无 Realtime、无备份/PITR、无 HA、无 SSO/SCIM，官方自警"暴露公网前需审查管理端点" [^10^][^11^]。

**成熟度判定**：**真实但稚嫩，不宜生产**。v0.1.x + 两个月历史 + 异常社区信号，建议仅作技术观察对象；验证清单（安全审计、fresh install、备份演练）见第七章。

## 2.4 ParadeDB：PG 发行版，不是 BaaS

**定位一句话**：把 BM25 全文/混合搜索做进 PostgreSQL 的发行版——它是数据库层组件，不提供 Auth/Storage/Realtime，不能与 BaaS 直接比功能面。

**架构组件**：核心为 `pg_search` 扩展（BM25 索引、分面、混合搜索），发行版镜像同时打包 pgvector；**0.25.0 起 pgvector 成为 pg_search 的前置依赖**（依赖其 `vector` 类型）[^13^]。

**关键事实**：最新版 **pg_search 0.25.2**（Docker tag `paradedb/paradedb:0.25.2` 同步，文档更新于 2026-08-11）；许可证 **AGPL-3.0**（注意网络条款义务）；**pg_analytics 仓库已于 2025-03-19 归档只读**，analytics 能力并入 pg_search 主扩展（0.15.9 changelog 声明 2025-04-02 起弃用）；公司为 YC S23，最近一轮融资 **2025-04 Series A1 $12M**，2026 年无新融资/收购公开证据（收购传闻**未验证**，按无证据处理）[^13^][^14^][^15^]。

**优势**：PG 内一站式 BM25 + 向量混合搜索，省掉 Elasticsearch 同步管道；为 Postgres 15+ 提供预编译 deb/rpm/macOS 二进制（如 `postgresql-18-pg-search_0.25.2` deb），手工安装路径清晰。

**劣势/风险**：① **AGPL-3.0**：网络服务场景有开源义务，商业采购需法务确认（详见第七章）。② 安装后必须 `shared_preload_libraries = 'pg_search'` 并重启，运维门槛高于普通扩展。③ 托管支持面收窄：**AWS RDS 不支持**（未列入许可扩展清单）；**Neon 已于 2026-03-19 起对新项目禁用 pg_search，存量安装 2026 年 9 月移除**，官方迁移目标是 tsvector 系的 `lakebase_text`——这是"扩展层依赖托管商决策"风险的现实案例 [^16^]。

**成熟度判定**：核心扩展生产可用（0.25.x 迭代活跃），但作为平台不是完整后端；采用形态应是"自选 PG 发行版/扩展"，而非"平台"。

## 2.5 TimescaleDB（Tiger Data）：时序与连续聚合老将

**定位一句话**：PG 时序/连续聚合扩展的老牌厂商，2025-06 公司更名 **Tiger Data**（产品名 TimescaleDB 保留，托管云更名 Tiger Cloud）。

**架构组件**：hypertable 自动分区、连续聚合（2.28 起支持手动增量刷新、在线 `ADD COLUMN`）、列式压缩（Hypercore，官方口径 90–95% 压缩率，厂商自测口径未独立复现）、保留策略；`timescale/timescaledb-ha` 镜像基于 Ubuntu + Patroni，**内置 pgvector、pgvectorscale 与 pgai**，`shared_preload_libraries='timescaledb,vector'` 即可一镜像双能力 [^17^][^18^]。

**关键事实**：最新版 **2.29.1（2026-08-04 发布）**；**2.29.0 起移除 PostgreSQL 15 支持**，仅支持 PG 16/17/18；许可证双轨——**Apache-2.0**（核心版，可商用含转售）+ **TSL**（Timescale License，source-available 非 OSI 开源；含连续聚合、列压、保留策略等高级功能，自用免费、禁止作为托管 DBaaS 出售），法律主体已更名 "Timescale, Inc. d/b/a Tiger Data" [^17^][^18^]。

**优势**：时序场景（行情、IoT、指标）在 PG 生态内无可替代；连续聚合做 K 线/降采样是成熟打法；timescaledb-ha 自带向量与 AI 扩展使其具备"时序 + AI"复合潜力。

**劣势/风险**：① **TSL 双轨**：高级功能不在 Apache 范围内，转售/托管场景受限，采购需逐功能核对许可证归属。② **Supabase 已在 PG17 项目上弃用 TimescaleDB**（推荐 pg_partman + 原生分区）——托管生态位在收缩，采用者应预期"自管 PG 上自建"成为主流路径 [^3^]。③ PG15 支持移除意味着存量 PG15 用户被推向升级。

**成熟度判定**：生产级、久经考验；但定位是"时序/分析增强层"，不是 AI 原生后端平台，需与 BaaS 层组合使用。

## 2.6 参照系：无平台锁定的开源组合栈

**定位一句话**：五个方案之外的第六种形态——用可独立替换的开源组件自行拼装 BaaS，作为衡量各方案锁定程度的对照基准；本项目已交付可运行参考实现（`ai-memory-backend/baas/`）。

**架构组件（参考栈组件映射）**：`paradedb/paradedb`（PostgreSQL + pgvector + pg_search）替代 Supabase Postgres；`postgrest/postgrest` 替代自动 REST API；Authentik 替代 GoTrue；Mercure（SSE）替代 Realtime；MinIO 替代 Storage；Traefik 替代 Kong 网关，统一路由 `/api`、`/auth`、`/realtime`、`/minio` [^19^]。PostgREST 为可选层（可删、可换 Hasura/pREST）。配套 memweave 提供 SQLite 本地记忆层（FTS5 BM25 + 向量混合、时间衰减、MMR 重排，pytest 7/7 通过），与 PG 中枢构成第六章讨论的"端侧—中枢"协同。

**关键事实**：整套栈常驻内存约 4–6 GB，一台 **4C8G VPS（约 €22/月，如 Hetzner CX32）** 可承载日活 1–10 万规模；各层可独立拆分替换（如 Neon 换自建 PG、Cloudflare R2 换 MinIO）。**已提供懒猫私有云（LazyCat）LPK 打包配置与一键部署脚本**（`baas/lazycat/deploy.sh`，lzc-cli 打包安装到盒子），是五方案中唯一直接面向家用/私有云场景落地的路径 [^19^][^20^]。验证状态：memweave 测试 7/7 通过；baas compose YAML 解析通过，**容器实机启动未验证**（开发环境无 Docker）。

**优势**：零平台锁定、成本透明（€22/月 vs 托管计量计费）、许可证可逐组件选择（可避开 AGPL 组件替换）、私有云/NAS 场景唯一可行解。

**劣势/风险**：运维自担（无托管备份/PITR、升级无 runbook、监控需自建）；组件间无统一控制台，DX 不如一体化平台；总拥有成本随团队规模上升。

**成熟度判定**：组件均为生产级开源项目，但"组合"本身需要工程能力背书；适合作为第二至五章评分与分层分析的锚点。

---

## 来源

（以下 URL 均于 2026-08-16 访问）

[^1^]: https://queryglow.com/blog/supabase-self-hosted （自托管 community-supported、组件清单、平台专属功能）
[^2^]: https://selfhost.dev/blog/supabase-pricing-explained/ ；https://omidsaffari.com/blog/supabase-pricing （定价模型，2026-08 对照官网核验）
[^3^]: https://basekick.net/blog/timescaledb-alternatives-2026 ；https://www.supascale.app/blog/timescaledb-for-selfhosted-supabase-time-series-data-guide （Supabase PG17 弃用 TimescaleDB）
[^4^]: https://docs.insforge.dev/core-concepts/database/overview.md ；https://raw.githubusercontent.com/InsForge/InsForge/main/deploy/docker-compose/docker-compose.yml
[^5^]: https://docs.insforge.dev/agent-native/overview.md ；https://docs.insforge.dev/mcp-setup.md
[^6^]: https://github.com/InsForge/InsForge 及 GitHub API /repos/InsForge/InsForge（stars/forks/commits，2026-08-14）
[^7^]: https://insforge.dev/pricing
[^8^]: HN Algolia story 48181342（2026-05，62 分）；https://agent-finder.co/reviews/insforge （独立实测 7/10）；https://www.developersdigest.tech/blog/agent-native-backends-insforge
[^9^]: GitHub InsForge issues #890 / #901 / #905 / #1552 / #1763
[^10^]: https://nubase.ai/features ；https://nubase.ai/docs 、/docs/concepts 、/docs/getting-started
[^11^]: https://github.com/OtterMind/Nubase 及仓库 README、docs/architecture.md
[^12^]: https://skillsllm.com/skill/nubase （安全扫描记录）；https://ossinsight.io/analyze/OtterMind/Nubase ；GitHub Issues/PR 列表（0 issues / 5 PR）
[^13^]: https://docs.paradedb.com/deploy/upgrading ；https://docs.paradedb.com/deploy/self-hosted/extension ；https://github.com/paradedb/paradedb/releases
[^14^]: https://github.com/paradedb/pg_analytics （归档声明）；https://docs.paradedb.com/changelog/0.15.9
[^15^]: https://pitchbook.com/profiles/company/534519-73 （Series A1 $12M）
[^16^]: https://neon.com/docs/extensions/pg_search ；https://neon.com/docs/extensions/migrate-pg-search-to-lakebase-text ；https://pgxn.org/dist/pg_search/0.18.5/pg_search/README.html （RDS 不支持声明）
[^17^]: https://github.com/timescale/timescaledb/releases （2.29.1 / PG15 支持移除）
[^18^]: https://www.tigerdata.com/legal/licenses ；https://docs.tigerdata.com/about/latest/timescaledb-editions/ ；https://github.com/timescale/timescaledb-docker-ha
[^19^]: 本项目仓库 /mnt/agents/output/ai-memory-backend/baas/README.md（组件映射、成本说明、验证状态）
[^20^]: 本项目仓库 /mnt/agents/output/ai-memory-backend/baas/lazycat/（LPK 打包与 deploy.sh）
