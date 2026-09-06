## 4. 统一存储架构设计

AI Agent Runtime 的存储层面临一个根本性矛盾：Agent 需要同时管理关系型配置数据、向量化的语义记忆、全文可检索的文档索引，以及大文件格式的多模态内容，但个人用户无法容忍部署 PostgreSQL + Qdrant + Elasticsearch 的多服务组合。2025 至 2026 年的技术演进给出了一个收敛性答案——以 SQLite 为核心的统一存储基座，辅以 CRDT（Conflict-free Replicated Data Type，无冲突复制数据类型）实现本地优先同步。这一架构路径不仅被 OpenClaw（344K GitHub Stars）等头部项目在生产环境中验证 [^816^]，更衍生出 AgentFS、GBrain、OpenViking 等一系列创新范式，形成了从"数据库即存储"到"文件系统即认知接口"的范式跃迁。

### 4.1 SQLite 文艺复兴

SQLite 正在经历一场结构性复兴，其角色从嵌入式关系数据库扩展为 AI Agent 的统一存储基座。这一转变由三个关键信号共同驱动：向量搜索扩展 sqlite-vec 的成熟、Turso AgentFS 对文件系统与数据库融合范式的定义，以及 PGLite 在浏览器端实现 PostgreSQL 兼容的本地优先方案。

#### 4.1.1 sqlite-vec：关系存储 + 全文搜索 + 向量搜索的三重能力

sqlite-vec 是 SQLite 向 AI Agent 存储基座演进的核心技术杠杆。该扩展以零依赖 C 语言编写，强调本地优先（local-first）操作，在 GitHub 上已形成 82 个以上公开仓库的生态系统 [^454^][^459^]。LangChain 官方将其集成为本地向量搜索的首选后端 [^449^]，OpenClaw 的 Active Memory 插件则采用 sqlite-vec 实现 70% 向量余弦相似度 + 30% BM25 + MMR（Maximal Marginal Relevance，最大边际相关性）+ 时间衰减的混合检索策略 [^403^]。

sqlite-vec 并非独立运作。与 SQLite 原生 FTS5（Full-Text Search 5）全文搜索扩展结合后，开发者可通过 SQL CTE（Common Table Expression）+ RRF（Reciprocal Rank Fusion，倒数秩融合）在单条查询中同时完成向量相似度匹配与全文关键词检索 [^518^]。AgentRoot 项目展示了这一架构的完整实现：FTS5 处理全文搜索，HNSW（Hierarchical Navigable Small World）近似最近邻索引加速向量搜索，BM25 评分与向量距离通过加权融合实现最优检索质量 [^524^]。在存储效率维度，SQLite + sqlite-vec + FTS5 的组合将关系数据、向量索引与全文检索统一在 1MB 以内的二进制体积中，这是 PostgreSQL + pgvector + 专用向量数据库方案无法比拟的紧凑度 [^513^]。

libSQL 作为 SQLite 的 Turso 分支进一步扩展了这一能力集。它为 SQLite 添加了复制友好变更协议、原生向量搜索能力与嵌入式副本（embedded replica）支持，使 SQLite 从单机数据库演变为可同步的分布式存储节点 [^329^]。Turso 的 AgentFS 完全构建在 libSQL 之上，代表了 SQLite 作为 Agent 基础设施的最高形态。

| 扩展/方案 | 向量搜索 | 全文搜索 | 关系存储 | 二进制体积 | 混合检索 | 生产验证 |
|:---|:---|:---|:---|:---|:---|:---|
| SQLite + sqlite-vec + FTS5 | HNSW 近似最近邻 [^454^] | BM25 评分 [^518^] | ACID 事务 | < 1 MB [^513^] | RRF 融合 [^518^] | OpenClaw, LangChain [^449^] |
| libSQL (Turso) | 原生向量类型 [^329^] | FTS5 兼容 | 嵌入式副本 | ~1 MB | SQL CTE 融合 | AgentFS [^391^] |
| PGlite + pgvector + tsvector | HNSW 余弦检索 [^530^] | tsvector 关键字 | Postgres 兼容 | ~3.7 MB gz [^514^] | RRF 三管并行 [^530^] | GBrain [^512^] |
| DuckDB | 不原生支持 | 不原生支持 | 列式分析 | ~10 MB | 需外部索引 | 数据科学场景 [^409^] |
| 专用组合 (Postgres + Qdrant) | HNSW (Qdrant) [^337^] | 需额外插件 | ACID (Postgres) | > 100 MB 合计 | 应用层融合 | RankSquire, 企业级 [^337^] |

上表对比了五类存储方案在 Agent 场景中的核心能力。SQLite + sqlite-vec + FTS5 的组合在体积效率与功能完整性之间取得了最优平衡，以不足 1MB 的二进制体积实现了三类存储引擎的等效能力。PGlite 方案以约 3.7MB 的体积代价换取了完整 PostgreSQL 兼容性，适合需要复杂查询语义的 Agent 应用。DuckDB 的列式存储模型在分析型工作负载中表现出色，但缺乏原生向量与全文搜索能力使其在 Agent 场景中适用性有限。专用组合方案在百万级向量检索延迟（Qdrant 在 1{,}000 万向量下可达 20ms P99 [^337^]）方面领先，但运维复杂度与部署成本远超个人用户容忍度。这一对比揭示了架构选择的根本权衡：本地优先的轻量 Agent 应以 SQLite 为核心，仅在向量规模突破百万级时考虑专用数据库的渐进式升级。

#### 4.1.2 AgentFS（Turso）：POSIX 风格的 Agent 存储抽象

Turso 提出的 AgentFS（Agent File System）代表了 AI Agent 存储层的核心抽象创新。AgentFS 将文件、目录、键值状态与审计日志统一存储在单个 SQLite 数据库中，对外暴露 POSIX 风格的虚拟文件系统接口 [^391^]。其关键设计洞察在于：整个 Agent 运行时——文件、状态、历史——可以被压缩为一个 SQLite 文件，从而在任意机器间移动、版本控制或部署 [^394^]。

AgentFS 的核心接口包括三个维度：文件系统接口（POSIX 风格的创建、读取、写入、目录遍历）、键值接口（JSON 序列化状态的存取）以及工具调用接口（可审计的函数执行日志）[^394^]。这一设计使 SQLite 成为 Agent 运行时的"单一事实来源"（single source of truth），所有数据操作都通过 SQL 查询完成，天然支持跨组件的数据关联与一致性保障。

这一范式已获得多维度验证。Mintlify 采用虚拟文件系统替代传统 RAG（Retrieval-Augmented Generation，检索增强生成）管道后，会话创建延迟从 46 秒降至 100 毫秒 [^392^]——两个数量级的性能提升源于消除了多服务间网络往返。Box 将其平台重新定位为 AI Agent 的虚拟文件系统层，字节跳动则于 2026 年 1 月开源 OpenViking（15{,}000+ GitHub Stars），采用 `viking://` 协议将所有上下文（记忆、资源、技能）组织为层次化目录结构 [^515^]。OpenViking 的核心创新是分层上下文加载（Level-of-Detail, LOD）：每个资源自动处理为三级细节——L0（约 100 token 摘要）、L1（约 2{,}000 token 概览）、L2（完整内容），在嵌套查询场景中较传统 RAG 减少 30% 检索延迟 [^517^][^527^]。

#### 4.1.3 GBrain：PGLite 驱动的本地优先知识层

Y Combinator CEO Garry Tan 于 2026 年 4 月发布的 GBrain 以 14{,}000+ GitHub Stars 迅速成为本地优先 Agent 知识层的标杆实现 [^512^]。GBrain v0.7.0 的关键架构决策是将默认引擎切换为 PGLite——Postgres 17.5 编译为 WebAssembly（WASM）运行在浏览器与 Node.js 环境中的嵌入式版本 [^530^]。`gbrain init` 命令可在 2 秒内启动包含完整 Postgres + pgvector + 混合检索的运行时，零账号、零服务器、零连接字符串 [^530^]。

GBrain 的检索架构采用三条检索线并行执行：pgvector HNSW 索引处理余弦向量检索，tsvector 处理关键字全文检索，Claude Haiku 负责多查询扩展生成，最终结果通过 RRF 算法融合 [^530^]。存储层以原始 Markdown 文件为人类可读的数据源，编译到 Postgres 实现机器可检索的索引。当数据增长超过 1{,}000 文件时，可通过 `gbrain migrate --to supabase` 无缝迁移至托管 PostgreSQL [^530^]。独立基准测试显示，在 150 个真实问题中，GBrain 以 8.3 倍胜率击败 OpenClaw 子代理的检索，平均 P@5（Precision at 5）提升 +0.081 [^550^]。

GBrain 还引入了"梦想周期"（dream cycle）的仿生记忆整合机制——夜间自动运行记忆巩固流程，模拟人类睡眠中的信息整理过程 [^558^]。这一设计与 OpenClaw Auto-Dream、Cortex-Engine 的三阶段睡眠循环共同指向同一趋势：Agent 记忆正从"被动存储"向"主动整理"演进 [^406^]。

### 4.2 CRDT 与本地优先同步

本地优先（local-first）软件架构要求数据优先存储在本地设备，网络仅用于异步同步。CRDT 作为这一范式的基础数学结构，在 2026 年实现了显著的生态成熟，同时与数据库复制、全栈数据库等同步引擎形成了明确的能力分界。

#### 4.2.1 CRDT 生态性能排序与生产选择

2026 年 CRDT 生态呈现"性能领先"与"生态成熟"的分化格局。Loro（Rust + WASM 实现）在 B4 基准测试中领先所有性能类别：260{,}000 次编辑应用耗时 290ms（Yjs 为 430ms，Automerge 为 680ms），编码后文档体积仅 68KB（Yjs 160KB，Automerge 250KB），内存占用 15MB（Yjs 28MB，Automerge 41MB）[^380^]。Loro 采用 Fugue 算法，针对文档编辑场景进行了深度优化，其编码效率与内存控制均处于行业最前沿。

| 指标 | Loro | Yjs | Automerge v3 | 说明 |
|:---|:---|:---|:---|:---|
| 260K 编辑应用时间 | 290 ms [^380^] | 430 ms [^380^] | 680 ms [^380^] | B4 基准，越低越好 |
| 编码文档大小 | 68 KB [^380^] | 160 KB [^380^] | 250 KB [^380^] | 网络传输效率 |
| 内存占用 | 15 MB [^380^] | 28 MB [^380^] | 41 MB [^380^] | 运行时内存 |
| gzip 体积 | ~15 KB | 18 KB [^380^] | ~25 KB | 客户端加载 |
| 核心语言 | Rust + WASM | JavaScript | Rust + WASM | 跨平台能力 |
| 编辑器绑定 | 新兴 | Tiptap, CodeMirror, Monaco [^380^] | 有限 | 生态成熟度 |
| Git 风格历史 | 否 | 否 | 完整 DAG [^376^] | 版本追溯能力 |
| 周下载量 | 增长中 | ~920K [^380^] | ~45K | 生产采用度 |

上表呈现了 CRDT 三强在技术性能与生态成熟度上的全面差异。Loro 在所有性能指标上领先，其 68KB 编码文档体积较 Yjs 减少 57.5%，较 Automerge 减少 72.8%，这一优势在移动网络同步场景中转化为显著的用户体验提升。然而，Yjs 凭借约 920K 周下载量与最丰富的编辑器绑定生态（Tiptap、CodeMirror、Monaco 均有官方支持）[^380^]，仍是 2026 年生产环境的默认选择。Automerge v3 于 2026 年通过 Rust 核心实现了约 10 倍内存减少，其完整的 Git 风格变更历史 DAG（Directed Acyclic Graph，有向无环图）使其在需要版本追溯作为产品特性的应用场景中不可替代 [^376^]。

生产选择的决策框架因此清晰：追求极致性能且接受新兴生态的选 Loro；需要成熟绑定与社区支持的选 Yjs；将版本历史作为产品特性的选 Automerge。对于 AI Agent Runtime 而言，若同步场景以状态快照为主而非实时协同编辑，Loro 的性能优势使其成为更优的默认选项。

#### 4.2.2 Sync Engine 格局：轻量级、移动端与复杂查询的分化

本地优先数据同步引擎在 2026 年形成四个明确阵营 [^446^]。数据库复制阵营以 PowerSync 与 ElectricSQL 为代表，二者均实现 PostgreSQL 到客户端 SQLite 的变更流复制。PowerSync 是 2026 年初最成熟的生产选项，支持 React Native 与 Flutter 跨平台，定价自 $49/月起 [^446^]。ElectricSQL 追求更激进的 active-active 双向复制，但 2026 年初生产边缘仍显粗糙 [^331^]。这一阵营适合大多数不需要 Google Docs 式实时文本编辑的应用场景。

全栈数据库阵营包含 Triplit、Jazz 与 Zero（Rocicorp）。Triplit 提供内置同步的全栈数据库与 TypeScript 端到端类型安全 API；Jazz 定位本地优先关系数据库，支持行级安全与 per-query 认证；Zero 采用基于查询的同步方法，是 Replicache 的继任者，针对复杂查询场景优化 [^446^][^451^]。CRDT 库阵营（Yjs、Automerge、Loro）则适合实时协作编辑场景，是 p2p（peer-to-peer）与离线优先架构的自然选择 [^446^]。事件溯源阵营以 LiveStore 为代表，同步变更日志而非当前状态，虽然在理论层面具有吸引力，但在实践中增加了不必要的架构复杂性 [^446^]。

这一格局的技术选择逻辑取决于同步需求的本质：若数据模型以结构化记录为主且冲突解决策略简单，数据库复制是运维成本最低的选择；若查询模式复杂且需要实时响应，Zero 的基于查询同步更具优势；若协作场景涉及频繁并发编辑且需离线能力，CRDT 库是唯一可行的技术路径。

#### 4.2.3 2026 年共识：中心化架构用 OT，离线优先 / p2p 用 CRDT

CRDT 与 OT（Operational Transformation，操作转换）的算法之争在 2026 年达成了明确的架构共识：选择取决于系统拓扑——中心化服务器架构使用 OT，离线优先 / p2p / 分布式架构使用 CRDT [^384^]。OT 在 Google Docs、Figma、Taskade 等中心化生产系统中仍占主导地位，原因简洁而务实："对于服务器介导的 AI Agent 工作空间，OT 仍是正确选择，CRDT 解决了大多数 SaaS 产品不需要的去中心化同步问题" [^435^][^376^]。Figma 于 2019 年从 OT 切换至 CRDT 的历史则提供了反例——其动机正是为了获得离线优先能力 [^376^]。

两个算法范式正在收敛。Gentle 与 Kleppmann 2024 年提出的 eg-walker 算法可被理解为"CRDT 穿着 OT 的接口"，在保持 CRDT 数学正确性的同时提供了 OT 式的操作接口 [^376^]。2026 年 FOSDEM（Free and Open Source Software Developers' European Meeting）专门设立完整 track 讨论"Local-First, Sync Engines, CRDTs" [^335^]，标志着本地优先从边缘理念进入主流技术议程。对于 AI Agent Runtime，这一共识具有直接的架构含义：若 Agent 以单机运行为主，CRDT 提供了无需服务器的同步能力；若 Agent 需要云端协调的多用户协作，OT 的简洁性更具工程优势。

### 4.3 统一存储层设计建议

基于前述技术演进与生态格局，AI Agent Runtime 的存储层设计应遵循"SQLite 核心 + 渐进扩展"的原则，将 Agent 的完整状态封装为单一文件，并通过分层记忆架构满足不同访问模式的延迟要求。

#### 4.3.1 推荐架构：SQLite 核心 + sqlite-vec + 文件系统

推荐的存储层架构采用三层组合：SQLite 作为关系数据与配置的核心引擎，sqlite-vec 作为向量索引扩展，操作系统文件系统作为大文件与 blob（binary large object）的存储后端。这一组合的关系存储能力处理 Agent 配置、工具注册表、会话状态等结构化数据；sqlite-vec 的 HNSW 索引支撑语义记忆与文档检索；文件系统则负责存储超出数据库存储效率的多媒体内容与大型模型文件。

这一架构的核心优势在于可预测性与可移植性。SQLite 的单文件模型使 Agent 的状态管理简化为文件操作——复制、备份、迁移都通过标准文件系统工具完成。WAL（Write-Ahead Logging）模式启用后，SQLite 支持读写分离与并发安全，满足 Agent 运行时的多线程访问需求 [^93^]。当向量规模增长至百万级时，可通过渐进路径升级：第二层引入本地 Qdrant 或 ChromaDB 处理大规模语义索引，第三层通过 MCP（Model Context Protocol）连接外部知识源（Notion、Confluence、Google Drive 等）[^797^]。

GBrain 的 PGLite 方案提供了 SQLite 的替代路径。PGLite 以 3.7MB gzipped 体积提供完整 PostgreSQL 17.5 兼容性，200ms 启动时间，原生 pgvector 支持 [^514^]。对于需要复杂 SQL 查询、存储过程或 PostgreSQL 生态兼容的 Agent 应用，PGLite 是更合适的基座选择；对于追求极致轻量的场景，SQLite + sqlite-vec 的 <1MB 体积仍不可超越。

#### 4.3.2 Agent State = 一个 SQLite 文件：可移植的完整 Agent 快照

从 sqlite-vec 到 AgentFS 再到 Letta（原 MemGPT）的 Context Repositories，2026 年的所有存储创新都指向同一设计原则：个人 AI Agent 的数据层应当是单一文件、零配置、可移植、自包含的 [^811^]。AgentFS 将整个 Agent 运行时存储在单个 SQLite 文件中 [^394^]，Llamafile 将 LLM + 推理引擎打包为单文件，ZeroClaw 将 Agent Runtime 打包为不足 5MB 的二进制——这些"单 X 化"趋势的驱动力是降低认知负荷与运维复杂度。

Letta 于 2026 年 2 月推出的 Context Repositories 将这一原则推向新高度。基于 Git 的记忆文件系统支持自动版本控制与多 Agent worktree 的合并冲突解决，Agent 通过标准 bash 与脚本工具以编程方式管理记忆，支持渐进式披露（progressive disclosure）模式 [^554^]。这一设计的深层意义在于：Agent 记忆的版本控制不再依赖专有机制，而是复用了软件工程领域成熟的 Git 工具链。Letta 的基准数据进一步验证了这一简化路径的有效性——在 LoCoMo（Long Context Memory Evaluation）基准上，仅通过将对话历史存储在文件中的 Filesystem 方案达到 74.0%，击败了专门的记忆工具库 [^553^]。

将 Agent State 设计为单一 SQLite 文件的工程实践包括：所有配置参数存储在 `agent_config` 表中；对话历史按会话 ID 分区存储在 `conversation_history` 表中；向量嵌入通过 sqlite-vec 的虚拟表机制存储；工具执行日志以结构化 JSON 存储在 `tool_audit_log` 表中。这一 schema 设计使 Agent 快照简化为 `.dump` 命令生成的 SQL 文件或直接的 `.sqlite` 二进制复制，备份与恢复操作的时间复杂度为 $O(1)$——仅取决于文件大小，与数据模型复杂度无关。

#### 4.3.3 分层记忆架构：从亚毫秒级工作记忆到语义记忆的分级设计

生产级 Agent 的记忆管理需要区分不同访问频率、持久性要求与检索语义的存储层级。RankSquire 提出的四层记忆架构已成为 2026 年的生产标准参考 [^337^]，该架构可简化为三层模型以适应个人 Agent Runtime 的轻量约束。

![分层记忆架构延迟对比](memory_layer_latency_chart.png)

**L1 短期工作记忆**对应人类认知中的"工作区"，存储当前任务的瞬时状态。该层采用内存优先策略（Redis OSS 或纯内存数据结构），访问延迟低于 1ms，数据通过 TTL（Time-To-Live）机制自动过期。L1 层的设计原则是"快取优先"——任何需要亚毫秒响应的状态查询都应命中此层。对于单机 Agent Runtime，该层可通过 SQLite 的内存模式（`:memory:`）或简单的进程内哈希表实现，无需引入外部依赖。

**L2 长期语义记忆**存储经过验证的领域知识与向量化文档嵌入，是 Agent RAG 管道的核心数据源。该层以 SQLite + sqlite-vec 为默认后端，在百万级向量下可实现约 20ms P99 查询延迟 [^337^]。当数据规模增长时，渐进升级至 Qdrant（开源，20ms P99 at 1{,}000 万向量 [^337^]）或 ChromaDB。关键设计原则是 Agent 读取长期记忆但**绝不**在执行期间直接写入——所有候选记忆必须通过 Validation Gate（来源验证、去重检查 0.92 相似度阈值、元数据标记）才能持久化 [^337^]。这一约束防止了推理错误在记忆层中累积导致的"记忆污染"。

**L3 情景记忆**记录时间有序的 Agent 决策与交互历史，支持跨会话的经验回溯。该层以文件系统或 SQLite 表的 append-only 日志形式存储，查询延迟在约 100ms 量级可接受。Letta 的学术源头（MemGPT 论文 6{,}600+ 引用）将这一层类比为操作系统的"磁盘缓存"——不在当前上下文中，但可通过搜索快速调出 [^431^]。Letta 在 30 天连续 Agent 运行的基准中，于 500 次以上交互中保持任务上下文连贯性，而典型 RAG 基线在 50 次交互后即出现记忆碎片化 [^433^]——这一数据凸显了分层记忆架构在长周期运行中的必要性。

三层之间的数据流向遵循严格的升级路径：L1 工作记忆中的高价值信息经 Validation Gate 审核后升级至 L2 语义记忆；L2 中的交互记录与决策上下文按时间序列归档至 L3 情景记忆；L3 的历史数据通过"梦想周期"式的夜间整合流程，提取结构化知识回流至 L2。Mem0 的压缩引擎已实现 Token 消耗降低 90% 的记忆优化 [^403^]，OpenViking 的 L0/L1/L2 分层加载则在检索阶段实现了 Token 效率的显著优化 [^517^]。这些信号共同指向同一方向：精细化记忆管理是 2026 年 Agent 架构竞争的关键差异化因素。

MCP 正在成为记忆层互操作的标准通道。"Memory via MCP"的设计模式使记忆的存储、检索、同步都通过 MCP 接口暴露，客户端实现无关 [^406^]。Mem0 的 OpenMemory、Engram、Recall、MemSearch 均已通过 MCP 暴露记忆接口，其中 MemSearch 已实现 Claude Code、OpenClaw、OpenCode、Codex CLI 的跨客户端记忆共享 [^406^]。GBrain、sqlite-memory-mcp、Hindsight、MemPalace 等新兴项目均采用 MCP-native 架构 [^549^]。对于 Agent Runtime 的存储层设计，这意味着记忆后端的选择将成为可替换组件——正如 SQL 抽象了关系数据库的实现差异，MCP 正在抽象 Agent 记忆系统的接口差异。
