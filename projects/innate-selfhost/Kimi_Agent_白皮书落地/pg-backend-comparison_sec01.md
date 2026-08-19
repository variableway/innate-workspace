# 第一章 执行摘要

## 1.1 一句话结论与全景判断

**一句话结论：2026 年的 PostgreSQL 系后端选型没有通吃赢家——求省心与生态选 Supabase 托管版，求零锁定与私有云交付选开源自托管组合栈，求 AI 编码代理（Agent）原生工作流选 InsForge；Nubase 真实但稚嫩，当前仅作技术观察对象。**

本报告以 2026-08-16 核查的事实为底座，对五个方案形态（Supabase 托管版、Supabase 自托管版、InsForge、Nubase、开源组合栈）按六个维度（开发便利性 / PG 原生度 / 可扩展性 / 模块不锁定 / 私有云可转化度 / 周边生态）逐一打分。等权合计全景如下（缩略预览，**评分方法与逐维度证据详见第三章**）：

| 方案 | 等权合计（满分 30） | 一句话定位 |
|---|---|---|
| 开源组合栈 | **25** | 每层可替换、数据即物理库，唯一已落地私有云打包 |
| InsForge | **21** | Agent 操作面最完整的 BaaS，3 容器自托管 |
| Supabase 托管版 | 19 | 生态断层第一的行业基准，但锁定与计量成本真实存在 |
| Supabase 自托管版 | 19 | 共享生态但平台功能带不走，运维自担 |
| Nubase | 14 | 620 stars 对 0 issues 信号异常，不宜生产 |

排序本身是价值观的产物：把"开发便利性"加权到 40%，Supabase 托管版反超第一；把"不锁定 + 私有云"加权到 35% 以上，组合栈断层领先。先定权重，再看排序。

需要同时指出：本报告的范围不止"中枢选型"。第六章论证了端侧（SQLite local-first 记忆）与中枢（PG 系统记录）的双层分工——"SQLite 是我的记忆，PG 是我们的事实"，并给出从单机到团队同步再到企业中枢的三阶段演进路径；记忆逻辑（时间衰减/MMR/冲突合并）可随规模逐层下沉为 PG 存储过程与 pgai 任务，API 形状全程不变。这意味着第一章的选型结论天然兼容未来的 local-first 扩展，不存在"选了 PG 底座就锁死端侧路线"的问题。

## 1.2 三个核心判断

**判断一：Supabase 仍是基准，但正被两面夹击。** 它的生态优势（SDK、教程、人才、集成）在 2026 年依然断层第一，托管版开箱即用的"省心"价值对多数团队仍是正确默认。但两个方向的压力是真实的：向上，20+ 计量项（磁盘 $0.125/GB、出口 $0.09/GB、PITR $100/月 add-on 等）使成本随规模线性恶化，迁出意味着重建 Auth/Storage/Realtime 整套周边栈；向下，PG17 镜像弃用 TimescaleDB 事件证明扩展决策权在平台而不在用户——"用的是真 PG"与"PG 归你管"是两回事。

**判断二：2026 年的分化轴是"Agent 操作面"。** BaaS 的功能面（Auth/Storage/Realtime/API）已经高度同质化，新竞争点是谁把后端变成 AI 编码代理可直接操作的对象。InsForge 的 MCP 语义层、CLI JSON 输出、backend branching 与 diagnose 自愈是当前五方案中最完整的 agent DX（12.7k stars、日更提交）；Nubase 内置 mem0 风格 Memory 与 AI Gateway 是同一方向上的另一种押注，但其 0 issues、无 HA、v0.1.x 的稚嫩度决定了它暂时只是信号而非选项。

**判断三：PG 扩展生态使"一个库干五件事"在中等规模成立。** pgvector（向量）+ pg_search 0.25.2（BM25 混合搜索）+ TimescaleDB 2.29.1（时序/连续聚合）+ pgai（自动 embedding 管道）+ DuckDB（嵌入式 OLAP）的组合，让 OLTP、全文搜索、向量检索、时序、分析五类负载在 TB 以内收敛到一个 PG 底座，省掉 ES/向量库两条同步管道。代价是两条硬约束：pg_search 的 AGPL-3.0 与 TimescaleDB 高级功能的 TSL 在企业采购中需法务书面确认；且 pg_search 实质上是自管 PG 专属（RDS 不支持、Neon 已禁用）。

## 1.3 选型速查表（规模 × 应用类型）

| | 个人 / MVP（<1万 DAU） | 中小 SaaS（1万–10万） | 企业级（>10万） |
|---|---|---|---|
| **CRUD 为主** | Supabase Free 起步；agent 生成 CRUD 工作流选 InsForge 自托管 | 三轴选边：省心 Supabase Pro / agent 流 InsForge Pro / 成本确定 €22 自管栈 | 自管 PG + PostgREST/Hasura + Keycloak/Cerbos，BaaS 托管版退场 |
| **Search 需求** | PG tsvector + GIN（中文 +zhparser），百万行内别上 ES | 自管 PG + pg_search 做 BM25/混合搜索（先过 AGPL 法务关） | 百亿级文档或跨地域分片才上 ES/ClickHouse，PG 保留系统记录 + CDC |
| **Data-intensive / AI** | ParadeDB 一镜像（PG+pgvector+pg_search），DuckDB 做即席分析 | 加 pgai 自动 embedding 管道，重分析卸载到 DuckDB | TB 级 / 亚秒聚合 SLA 命中时引入 ClickHouse，PG 不退场 |
| **金融交易数据** | PG（ACID+RLS+WAL 审计）单层起步 | 叠 TimescaleDB hypertable + 连续聚合做行情 K 线 + DuckDB 回测 | 三层组合全自托管保审计链；kdb+/ClickHouse 仅在量化触发条件命中时进入 |

**行动建议**：① 先按 1.1 的权重自检明确价值取向，再查表选型；② 任何规模都不要选 Nubase 上生产，Supabase 自托管不要当中小 SaaS 主力；③ 采用 InsForge 自托管前务必显式设置 ENCRYPTION_KEY（密钥回退链 #905/#1552 未闭合）；④ 采购含 pg_search（AGPL）或 TimescaleDB 高级功能（TSL）的栈前，先过法务。

---

## 来源

本章全部数字与判词回溯至第二至第六章，来源清单详见各章章末「来源」小节。
