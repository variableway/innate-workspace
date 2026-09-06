# 报告大纲：PostgreSQL 系 AI 原生后端方案全景对比与技术采用分析

> 文件名基准：pg-backend-comparison；章节文件 pg-backend-comparison_secNN.md
> 语言：中文；风格：技术咨询报告（克制、数据驱动、结论先行）
> 输入材料：/mnt/agents/output/research/{nubase,insforge,ecosystem}.md
> 附加上下文：/mnt/agents/upload/AI_Memory_and_Backend_Alternatives_Whitepaper.md（Tier 分层与替代框架）、/mnt/agents/output/ai-memory-backend/（已实现的 memweave + baas 参考栈）

## 第一章 执行摘要（~1200 字）【Round 3，汇总各章结论】
- 1.1 一句话结论与全景判断矩阵（5 方案 × 六维评分预览）
- 1.2 三个核心判断：① Supabase 仍是基准但被两面夹击 ② 2026 年的分化轴是"Agent 操作面" ③ PG 扩展生态使"一个库干五件事"成立
- 1.3 选型速查表（规模 × 应用类型）

## 第二章 五大方案逐卡（~3000 字）【Round 1，一切结论的事实底座】
- 2.1 Supabase：托管基准。组件架构、定价（Pro $25/组织、计量项）、自托管 community-supported 现状、PG17 弃用 TimescaleDB 事件
- 2.2 InsForge：YC 支持、Apache-2.0、12.7k stars、3 容器自托管、MCP 语义层/CLI 控制面、PG15+pgvector+RLS、已知风险（#905 密钥回退、#1552、fresh install 坑）、定价
- 2.3 Nubase：2026-06-08 开源、620 stars、Java Spring Boot 3.2 + PG + mem0 风格 Memory + AI Gateway、database-per-project 多租户、疑点（0 issues 的 620 stars、skillsllm 中危标记、无公司信息、/pricing 504）→ "真实但稚嫩，验证清单待补"
- 2.4 ParadeDB：不是 BaaS 而是 PG 发行版；pg_search 0.25.2（AGPL）+ pgvector 依赖；pg_analytics 归档并入；手工安装路径（deb/preload）；托管支持现状（RDS ✗、Neon 弃用）；Series A1 $12M
- 2.5 TimescaleDB（Tiger Data）：2.29.1、TSL/Apache 双轨、hypertable/连续聚合/列压/保留策略、timescaledb-ha 自带 pgvector、PG15 支持移除、更名 Tiger Data
- 2.6 参照系：开源自托管组合栈（本项目 baas 参考实现：ParadeDB+PostgREST+Authentik+MinIO+Mercure，含懒猫 LPK 部署）

## 第三章 六维评分矩阵（~1800 字）【Round 2】
- 3.1 维度定义与评分方法（1-5 分 + 一句判词）
  ① 开发便利性 ② PostgreSQL 原生度 ③ 可扩展性 ④ 模块不锁定（可替换性） ⑤ 懒猫私有云可转化度 ⑥ 周边生态丰富度
- 3.2 总矩阵表 + 逐维度分析（每维度一段：谁赢、为什么、证据）
- 3.3 敏感性与误用警告（评分是加权假设，给出改权重后的结论变化）

## 第四章 规模分层技术采用分析（~2000 字）【Round 2】
- 4.1 个人/MVP（日活<1万）：PocketBase / Supabase Free / InsForge 自托管 / 单机组合栈
- 4.2 中小 SaaS（1万-10万）：Supabase Pro vs InsForge Pro vs 自管组合栈（€22 VPS）——成本/控制力/运维负担三轴
- 4.3 企业级（>10万）：自管 PG + Citus、Keycloak/Cerbos、K8s；合规与审计视角
- 4.4 每层给出推荐 + 次选 + 明确的"不要选"

## 第五章 应用类型解决方案（~2200 字）【Round 2】
- 5.1 CRUD 为主（管理后台/工具）：PostgREST/Hasura 直接出 API；InsForge 的 Agent 生成 CRUD 价值
- 5.2 Search 需求：PG tsvector → pg_search（BM25/AGPL）→ 何时必须上 ES/ClickHouse 的边界
- 5.3 Data-intensive（分析/报表/AI）：ParadeDB 混合搜索、DuckDB 嵌入式 OLAP 互补、pgai 管道
- 5.4 金融交易数据：OLTP（ACID/RLS/审计）+ TimescaleDB（行情时序）+ DuckDB（回测）三层组合；连续聚合做 K 线；监管友好性论证
- 5.5 每类给出"最小可行栈 + 升级路径"表格

## 第六章 SQLite Local Memory × PostgreSQL 的协同与演进（~1800 字）【Round 2】
- 6.1 分工模型：SQLite = 边缘/端侧记忆真相源，PG = 中枢系统记录（memweave 已实现作为参照）
- 6.2 同步路径：CRDT/文件同步 → PG 汇聚；FDW/duckdb 查 SQLite；pgai 向量化回灌
- 6.3 扩展层演进路线：SQLite-Vector 量化检索 ↔ pgvector；SQLite-Sync CRDT ↔ PG 逻辑复制；memweave 记忆逻辑（时间衰减/MMR）移植为 PG 存储过程/pgai 任务的可能性
- 6.4 三阶段演进图：单机 local-first → 团队同步 → 企业中枢（每阶段的栈形态与迁移触发条件）

## 第七章 风险登记册与验证清单（~1200 字）【Round 3】
- 7.1 各方案风险表（Nubase 稚嫩/InsForge 密钥回退/Supabase 托管计量成本/AGPL/TSL）
- 7.2 采购/采用前验证清单（跑通 fresh install、压测、备份恢复演练、许可证法务确认）
- 7.3 总结论（一段话）

## 引用规范
- 正文用脚注 [^N^]，来源清单由各章 writer 就地列于章节末尾「来源」小节（URL + 2026-08-16），汇编时去重合并为附录
- 未验证信息必须标注「未验证」；厂商自测数据必须标注
