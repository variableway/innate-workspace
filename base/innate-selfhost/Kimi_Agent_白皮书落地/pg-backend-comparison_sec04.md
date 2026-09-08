# 第四章 规模分层技术采用分析

本章沿用白皮书 2.4 节的 Tier 1/2/3 分层框架，并用 2026-08-16 核查的最新事实刷新候选名单（如 PocketBase 继续稳居 Tier 1、ParadeDB 进入 Tier 2 数据库位、Citus/Keycloak/Cerbos 进入 Tier 3），逐层回答同一个问题：**在这个规模下，选什么、备选什么、明确不要选什么**。结论先行：**日活 1 万以下用 Supabase Free 或单机组合栈起步，1万–10万区间是三条路线分岔的真正战场，10万以上唯一的正确答案是把 PostgreSQL 收回自管并引入企业级身份与授权栈**。

## 4.1 Tier 1：个人 / MVP（日活 < 1万）

**结论先行：推荐 Supabase Free 起步，次选 InsForge 自托管（3 容器），不要在这一层自建 K8s 或引入任何按席位计费的企业组件。**

候选有四个：

- **Supabase Free**：$0/月，开箱即得 Postgres + Auth + Storage + Realtime 全家桶，生态教程与人才储备最厚，原型期"省心"价值最高 [^1^]。
- **InsForge 自托管**：Apache-2.0，最小栈仅 **3 个核心容器**（postgres + postgrest + insforge app），RLS 默认开启，MCP/CLI 控制面让 AI 编码代理直接读 schema、跑迁移、部署函数——如果 MVP 本身就是"agent 生成 CRUD"的工作流，这是当前最顺手的操作面 [^2^]。托管 Free 层亦可 $0 原型（5 万 MAU 额度，闲置 1 周自动暂停）[^3^]。
- **PocketBase**：白皮书 Tier 1 的原始推荐，2026 年判断维持不变——单二进制、SQLite 内嵌、内置 Auth/Realtime/Storage，`scp` 即部署，月成本约 $5 的 VPS 即可承载，零云依赖、一个文件夹带走 [^4^]。
- **单机组合栈**：本项目 baas 参考栈（ParadeDB + PostgREST + Authentik + MinIO + Mercure + Traefik）常驻内存约 4–6 GB，一台 4C8G VPS 可跑，但对个人 MVP 而言组件数偏多，适合"从第一天就要求零锁定"的场景而非追求速度的 MVP [^5^]。

**不要选**：任何企业级组件（Keycloak 的运维复杂度、Cerbos 的策略工程）在 <1万 DAU 阶段纯属过度设计；也不要选 Nubase——项目真实但仅 620 stars、v0.1.x、2026-06 才开源，无 Realtime/备份/HA/SSO，稚嫩度与 MVP 的"快速试错"诉求同样不匹配 [^6^]。

## 4.2 Tier 2：中小 SaaS（日活 1万–10万）

**结论先行：本层无普适最优解，按"成本 / 控制力 / 运维负担"三轴选边——求省心选 Supabase Pro，求 agent 工作流选 InsForge Pro，求成本确定性与零锁定选自管组合栈。**

| 三轴 | Supabase Pro | InsForge Pro | 自管组合栈（€22 VPS） |
|---|---|---|---|
| **名义成本** | $25/月/**组织**（含 $10 compute credit，恰抵一台 Micro）[^7^] | $25/月（100k MAU、8GB DB、含 $10 Compute 抵扣）[^3^] | €22/月 4C8G VPS（如 Hetzner CX32）[^5^] |
| **隐性成本** | 见下方计量项分析 | PG15 偏旧、扩展生态保守，Compute 仍 private preview [^2^] | 备份/PITR/监控/升级全部自担，TCO 随团队规模上升 |
| **控制力** | 低（托管黑盒，扩展决策随官方镜像走） | 中（Apache-2.0 可随时转自托管） | 高（每层可独立替换） |
| **运维负担** | 最低 | 低（3 容器） | 最高（无统一控制台、无托管备份） |

**Supabase 计量项的隐性成本必须单独说清**。$25/组织只是入场价：数据库磁盘 $0.125/GB、文件存储 $0.0213/GB、出口流量 $0.09/GB（cached $0.03）、Auth MAU 超 100K 后 $0.00325/MAU、PITR 为 $100/月/7 天留存的付费 add-on（Pro 不含）[^7^]。一个 50GB 数据库 + 200GB/月出口 + 需要 PITR 的项目，月度账单将显著高于 $25——而 20+ 计量项的打包计费使成本与"纯 Postgres"不可直接对比，这是迁出时才发现的真实锁定 [^7^]。与之对照，€22/月的组合栈成本曲线是平的：容量上限即硬件上限，不存在"用得越多单价项越多"的惊吓，但代价是 PITR、监控、升级 runbook 全部自建。InsForge 的 $25 介于两者之间，且其自托管路径（3 容器 + compose）使"先用托管、超标后转自托管"成为三者中迁移成本最低的选项——前提是先堵密钥回退：务必显式设置 ENCRYPTION_KEY，当前 compose 仍存在回退链（#905 已确认静默回退、#1552 加固仍 open），轮转 JWT_SECRET 会导致 secrets 永久不可读 [^8^]。

**不要选**：Supabase 自托管作为本层主力——官方定位为 community-supported 而非 SLA 产品，托管版的备份/PITR、分支、管理 API 均为平台专属，自托管 Studio 只是功能子集；且 PG17 镜像已弃用 TimescaleDB，自托管需自建镜像 [^9^]。同样不建议在本层就上 K8s——Docker Compose 足以承载 4C8G 单机 1–10 万日活 [^5^]。

## 4.3 Tier 3：企业级（日活 > 10万）

**结论先行：这一层 BaaS 平台整体退场，正确形态是"自管 PG + 企业级身份/授权 + 专业 IaC"；同时 AGPL 与 TSL 许可证从纸面条款变成真实的采购约束。**

推荐形态（沿用白皮书 Tier 3 框架并以 2026 事实刷新）：

- **数据库**：自管 PostgreSQL（或 RDS 等托管）+ **Citus** 分片做水平扩展；时序/行情数据叠 **TimescaleDB 2.29.1**（hypertable/连续聚合/列压，注意 2.29.0 起移除 PG15 支持）[^10^]；搜索叠 **ParadeDB pg_search 0.25.2**（BM25 + 向量混合）[^11^]。
- **身份与授权**：**Keycloak**（Red Hat 背书，最全协议支持、LDAP/AD 联邦）替代 GoTrue 系；**Cerbos** 做字段级/资源级授权引擎——RLS 之外补齐复杂权限审计面 [^4^]。
- **部署**：Kubernetes + Terraform，监控/备份/PITR 按内部 SLO 自建；多集群 MinIO 或 Cloudflare R2 承担全球分布存储 [^4^]。

**合规审计视角**：企业采购的核心问题是可审计性与责任边界。BaaS 托管版（含 Supabase Enterprise）把审计外包给厂商 SOC2 报告；自管路线的审计对象变为自身 IaC 与 runbook。两条路都可行，但混合（核心数据自管、周边托管）在企业级通常带来最差的审计拼接成本，建议整层选边。

**许可证在这一层成为硬约束**：① **ParadeDB pg_search 为 AGPL-3.0**，网络服务场景触发开源义务，且 Neon 已 2026-03-19 起对新项目禁用、AWS RDS 不支持——"扩展层依赖托管商决策"的风险在企业级必须书面排除，商业采购需法务确认 [^11^]。② **TimescaleDB 双轨**：Apache-2.0 核心版之外的高级功能（连续聚合、列压、保留策略）属 **TSL**（source-available、非 OSI），自用免费但禁止作为托管 DBaaS 转售——若企业产品形态涉及对外提供数据库服务，需逐功能核对许可证归属 [^10^]。③ 对照之下，InsForge 与 Nubase 的 Apache-2.0 在许可证维度最干净，但前者未达企业成熟度、后者明确不宜生产 [^6^]。

**不要选**：任何 single-tenant BaaS 托管版直接扛 >10万 DAU 核心流量——计量成本（egress/MAU/磁盘）随规模线性恶化且无容量上限议价权；也不要选 PocketBase（单二进制架构到不了这一层）和 Nubase（稚嫩度问题见 4.1）。

## 4.4 三层速查表与升级触发条件

| 层 | 推荐 | 次选 | 明确不要选 |
|---|---|---|---|
| Tier 1（<1万 DAU） | Supabase Free | InsForge 自托管（3 容器）/ PocketBase | 企业组件（Keycloak/Cerbos）、Nubase、自建 K8s |
| Tier 2（1万–10万） | 按三轴选边：省心=Supabase Pro / agent 流=InsForge Pro / 成本确定=€22 自管栈 | 三者互为次选 | Supabase 自托管当主力、过早 K8s |
| Tier 3（>10万） | 自管 PG + Citus + Keycloak/Cerbos + K8s/Terraform | BaaS Enterprise 合约（审计外包路线） | BaaS 标准托管版扛核心流量、PocketBase、Nubase |

**升级触发条件（出现这些信号就该往下一层迁）**：

- **T1→T2**：Supabase Free 额度触顶（MAU/磁盘连续两周 >80%）；出现第一个付费客户需要 PITR 与备份 SLA；团队从 1 人扩到 3 人以上、需要迁移审查与分支。
- **T2→T3**：Supabase 月度计量账单（磁盘+egress+MAU 超额）超过自管成本的 2 倍；合规方（客户/监管）首次要求 SOC2 自证或数据驻留；单库写入成为瓶颈需 Citus 分片；RLS 已无法表达权限模型、需 Cerbos 级授权引擎；AGPL/TSL 组件进入对外售卖路径。
- **反向信号**：若自管栈的运维投入超过一名工程师 30% 工时，应考虑反向迁回托管——分层是双向的。

---

## 来源

（以下 URL 均于 2026-08-16 访问）

[^1^]: https://supabase.com/pricing （Free/Pro 档位，2026-08 核验）
[^2^]: https://docs.insforge.dev/core-concepts/database/overview.md ；https://raw.githubusercontent.com/InsForge/InsForge/main/deploy/docker-compose/docker-compose.yml （3 容器栈、PG15）
[^3^]: https://insforge.dev/pricing
[^4^]: /mnt/agents/upload/AI_Memory_and_Backend_Alternatives_Whitepaper.md §2.4（Tier 1/2/3 框架，本报告以 2026 事实刷新）
[^5^]: /mnt/agents/output/ai-memory-backend/baas/README.md（€22/月 4C8G、4–6GB 常驻内存、1–10万日活容量判断）
[^6^]: https://github.com/OtterMind/Nubase ；https://nubase.ai/docs （620 stars/v0.1.4/功能缺口）
[^7^]: https://selfhost.dev/blog/supabase-pricing-explained/ ；https://omidsaffari.com/blog/supabase-pricing （计量项单价与计费维度耦合）
[^8^]: GitHub InsForge issues #905 / #1552（密钥回退链）
[^9^]: https://queryglow.com/blog/supabase-self-hosted ；https://basekick.net/blog/timescaledb-alternatives-2026 （自托管 community-supported、PG17 弃用 TimescaleDB）
[^10^]: https://github.com/timescale/timescaledb/releases （2.29.1/PG15 移除）；https://www.tigerdata.com/legal/licenses （TSL 双轨）
[^11^]: https://github.com/paradedb/paradedb/releases （0.25.2/AGPL-3.0）；https://neon.com/docs/extensions/pg_search （Neon 禁用）；https://pgxn.org/dist/pg_search/0.18.5/pg_search/README.html （RDS 不支持）
