# 第三章 六维评分矩阵

本章把第二章的事实压缩为可比较的量化结论：先定义六个维度与评分方法（3.1），再给出 5 方案 × 6 维总表并逐维度分析（3.2），最后做权重敏感性检验（3.3）。所有打分都能在第二章找到对应事实，判词即该事实的浓缩；评分是"加权假设下的相对位置"，不是绝对质量判定。

## 3.1 维度定义与评分方法

**六个维度**（等权为默认假设）：

- **① 开发便利性**：上手速度（从 0 到第一个可用 API 的时间）、API 自动化程度（是否免写 CRUD）、调试体验（控制台、诊断工具、文档质量）。
- **② PostgreSQL 原生度**：暴露给用户的是否是完整 PostgreSQL（直连、SQL 全能力、事务/RLS），以及扩展兼容面（pgvector/pg_search/TimescaleDB 等能否自由装卸，还是受平台镜像清单约束）。
- **③ 可扩展性**：性能扩展（实例升配、分区/时序/连接池能力）+ 功能扩展（函数、钩子、自定义服务接入）。
- **④ 模块不锁定**：每一层（DB/Auth/Storage/Realtime/API）可否独立替换；数据可否无损带走（标准 PG 物理库 vs 平台专有格式）；迁出时需要重建多少周边栈。
- **⑤ 懒猫私有云可转化度**：能否打包为 LPK 安装到家用/私有云盒子。考察三点：容器化程度与服务数量（越少越好转化）、密钥与依赖可否用 `stable_secret`/内部域名替代、有无必须替换的外部依赖（如托管网关）。参照基准：组合栈已有完整 LPK（7 服务 + 路由 + TCP 转发，一键 deploy.sh）[^1^]。
- **⑥ 周边生态**：GitHub stars/forks 与提交活跃度、扩展与第三方集成数量、教程与人才供给、社区讨论热度。

**评分方法**：1–5 分整数刻度，5 = 该维度五方案中最强或接近理论上限，1 = 该维度存在硬缺陷。每格附一句判词，判词必须能回溯到第二章的具体事实（版本号、容器数、许可证、stars、事件），不接受"感觉分"。评分对象为五个方案形态：**Supabase 托管版、Supabase 自托管、InsForge、Nubase、开源组合栈**。ParadeDB 与 TimescaleDB 是"底座组件"而非完整后端，不单独打分，但作为组合栈的数据库层与扩展层选项在维度②③分析中体现。

## 3.2 总表与逐维度分析

**5 方案 × 6 维总表**（括号内为一句判词）：

| 维度 | Supabase 托管 | Supabase 自托管 | InsForge | Nubase | 开源组合栈 |
|---|---|---|---|---|---|
| ① 开发便利性 | **5**（开箱即用，Studio/CLI/文档最成熟） | 3（Studio 只是托管版功能子集，运维自担） | **4**（MCP/CLI/diagnose 面向 agent 最顺手，但有密钥回退坑） | 2（一镜像起得来，但文档薄、fresh install 未验证） | 2（无统一控制台，拼装需工程能力） |
| ② PG 原生度 | 4（完整 PG 直连，但扩展清单随官方镜像走） | 4（同镜像，可自建镜像补扩展） | 3（PG15 偏旧、扩展保守、Realtime 用 Socket.IO 而非逻辑复制） | 3（database-per-project 真 PG，但 REST 层是 Java 重写） | **5**（ParadeDB 发行版即完整 PG，扩展自选） |
| ③ 可扩展性 | **4**（compute 升到 16XL、Supavisor 池化，功能扩展靠平台） | 3（同上但升级/备份无 runbook） | 3（3 容器轻量，Compute 仍 private preview） | 2（无 HA/备份/Realtime，多租户连接池待压测） | **4**（每层独立扩，可上 TimescaleDB/Citus，但需自建） |
| ④ 模块不锁定 | 2（迁出需重建 Auth/Storage/Realtime 周边栈） | 3（组件开源但 8+ 服务耦合，平台功能带不走） | 4（Apache-2.0 + PostgREST + 标准 PG，仅 OpenRouter 强绑定） | 3（Apache-2.0、数据在 PG 可带走，Memory/AI Gateway 内置逻辑难替换） | **5**（每层可独立替换，数据即物理库） |
| ⑤ 懒猫可转化度 | 1（托管服务，不可私有化） | 2（服务多、密钥配置重，无现成 LPK） | 4（仅 3 容器，密钥需显式化，OpenRouter 需替换） | 3（单镜像但 Java 栈资源占用与内部服务未拆分） | **5**（已有完整 LPK + deploy.sh，唯一已落地） |
| ⑥ 周边生态 | **5**（SDK/教程/人才/集成全面第一） | 4（共享同一生态，自托管议题在社区跟进中） | 3（12.7k stars、日更提交，但社区与文档仍薄） | 1（620 stars、0 issues、无实质社区讨论） | 4（组件各自生态成熟，组合本身无统一社区） |
| **等权合计** | **19** | **19** | **21** | **14** | **25** |

**维度① 开发便利性——Supabase 托管版胜。** 5 分无任何争议：Free 层开箱即用，SDK、教程、人才供给是事实标准。InsForge 拿 4 分靠的是对 AI 编码代理的操作面——MCP 工具、CLI JSON 输出、`insforge diagnose`、backend branching 是当前五方案中最完整的 agent DX；扣分项是 #905 密钥回退这类"第一次踩到才知道"的坑。Supabase 自托管掉到 3：Studio 只是功能子集，备份/PITR/分支都带不走。Nubase 与组合栈并列末位但原因相反：前者是"一体化但稚嫩"（v0.1.4、fresh install 未验证），后者是"成熟但需自己拼装"。

**维度② PG 原生度——组合栈胜。** 组合栈直接跑 ParadeDB 发行版（PG15+、pgvector + pg_search 0.25.2），扩展装卸自由，5 分。Supabase 两版均 4：给的是完整 PG，但 PG17 镜像弃用 TimescaleDB 事件说明扩展决策在平台而不在用户；自托管可自建镜像故不更低。InsForge 3 分：PG15 偏旧、未见 pg_net/pgmq/TimescaleDB，Realtime 用 Socket.IO 绕开了 PG 逻辑复制。Nubase 3 分：底层是 database-per-project 的真 PG（含 pgvector + zhparser），但 `/rest/v1/*` 是 Java 重写而非 PostgREST 本体，兼容性长期风险自担。

**维度③ 可扩展性——托管版与组合栈并列。** Supabase 托管的 compute 阶梯（Micro $10 → 16XL $3,730）加 Supavisor 池化是最省事的性能扩展路径，给 4 而非 5 是因为功能扩展依赖平台路线。组合栈同 4：性能上可在数据库层换 TimescaleDB（hypertable/连续聚合/列压）或加 Citus，功能上每层独立演进，代价是全部自建。Nubase 仅 2：官方自警"暴露公网前需审查管理端点"，无 HA、无备份，database-per-project 的每租户 HikariCP 池在大规模下未经验证。

**维度④ 模块不锁定——组合栈满分，托管版垫底。** 组合栈每层有明名替换路径（Hasura 换 PostgREST、R2 换 MinIO、Neon 换自建 PG），数据即 PG 物理库，5 分。InsForge 4 分：Apache-2.0、3 容器、REST 走标准 PostgREST，数据可直接 `pg_dump` 带走，扣分在 Model Gateway 强绑定 OpenRouter。Supabase 托管版 2 分的判词来自第二章：迁出意味着重建 Auth/Storage/Realtime 整套周边栈，且 20+ 计量项使成本与"纯 Postgres"不可直接对比——这正是锁定定义本身。

**维度⑤ 懒猫私有云可转化度——组合栈唯一 5 分。** 参照 `baas/lazycat/`：LPK 三件套（package.yml / lzc-manifest.yml / lzc-build.yml）+ deploy.sh 已覆盖 7 服务、路由与 TCP 转发，密钥由懒猫 `stable_secret` 自动生成持久化，网关用懒猫自带 HTTPS——这是"已转化"而非"可转化"[^1^]。InsForge 4 分是除组合栈外最可行的候选：仅 3 个核心容器（postgres + postgrest + app），服务数少意味着 manifest 改写量最小；两个待办是显式设置 ENCRYPTION_KEY（堵 #905 回退链）和把 OpenRouter 换成可自托管的模型网关。Nubase 3 分：单镜像看似最简，但 Java Spring Boot 栈的资源占用、内部多模块未拆分为独立服务，且无任何打包先例。Supabase 自托管 2 分：8+ 服务（Kong/GoTrue/Realtime/Storage/Studio…）+ 大量密钥配置，无现成 LPK，工作量最大；托管版 1 分，按定义不可私有化。

**维度⑥ 周边生态——Supabase 断层第一。** stars、SDK 覆盖、第三方集成、人才市场四项全面领先，5 分无争议；自托管版共享该生态记 4。InsForge 3 分：12,757 stars / 1,138 forks / 每日多次提交是真实活跃度，但项目 2025-07 才建、文档与社区沉淀薄。组合栈 4 分的逻辑：PostgREST、Authentik、MinIO、ParadeDB 各自都是成熟生态，只是"组合"这件事没有统一社区。Nubase 1 分且判词必须写重：620 stars 对 0 issues、5 PR、Reddit/HN/知乎零实质讨论——第二章已判定该信号异常，生态维度上它不是一个"有社区的项目"。

## 3.3 敏感性与误用警告

等权假设下总分为：组合栈 25 > InsForge 21 > Supabase 托管 19 = Supabase 自托管 19 > Nubase 14。这个排序本身是"不锁定与私有云各占六分之一权重"这一价值观的产物，换权重即翻转：

- **若"开发便利性"加权至 40%**（其余五维均分剩余 60%）：Supabase 托管版以约 3.9 的加权分反超至第一（组合栈约 3.6、InsForge 约 3.5）。结论翻转为"初创/MVP 直接上托管，别为理论上的可迁移性付工程税"。这也是市场上 Supabase 仍是基准的现实原因——多数团队的贴现率就是很高。
- **若"模块不锁定"加权至 40%**：组合栈加权分升至约 4.6，与第二名 InsForge（约 3.9）拉开断层，Supabase 托管版跌至倒数第二（约 2.9）。结论翻转为"凡涉及数据主权、合规审查、私有云交付的场景，一体化平台全部让位"。
- **翻转的临界点**：维度①权重约 >30% 时托管版胜出；维度④+⑤ 合计权重约 >35% 时组合栈胜出且不可撼动。Nubase 在任何合理权重下都不进入前三——它的低分集中在稚嫩的硬事实（0 issues、无 HA、未验证），不是权重能救的。

**误用警告**：① 本表是 2026-08-16 时点的快照，InsForge（日更提交）与 Nubase（v0.1.x）的分数半衰期可能只有数月；② 维度⑤的 5 分依赖本项目自建的 LPK 参照实现，换其他私有云目标（群晖、K8s homelab）时容器数与密钥管理的结论方向不变、分数需重估；③ 合计分不应被引用为"某方案比某方案好 20%"这类线性陈述——维度间不可通约，正确用法是先定权重再看排序。

---

## 来源

（以下 URL 均于 2026-08-16 访问；第二章已列来源不再重复，仅列本章新增）

[^1^]: 本项目仓库 /mnt/agents/output/ai-memory-backend/baas/lazycat/README.md（LPK 打包规则、stable_secret、7 服务 manifest、deploy.sh）；懒猫官方转换规则 https://developer.lazycat.cloud/app-example-porting.html
