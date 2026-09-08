## Facet: 本地优先统一存储架构

### 关键发现

#### 1. SQLite 作为统一存储基座的复兴

SQLite 正在经历一场"文艺复兴"，从简单的嵌入式数据库演变为 AI Agent 存储的核心基础设施。多个关键扩展使其具备关系+全文+向量的三重能力：

- **sqlite-vec** 成为本地向量搜索的首选扩展，采用零依赖 C 编写，强调本地优先操作 [^454^]。它被 LangChain 官方集成 [^449^]，在 GitHub 上已形成 82+ 公开仓库的生态系统 [^459^]。OpenClaw 的 Active Memory 插件采用 sqlite-vec 实现 70% 向量余弦相似+30% BM25+MMR+时间衰减的混合检索 [^403^]。
- **FTS5** 全文搜索与 sqlite-vec 的向量搜索结合，通过 SQL CTE + RRF（Reciprocal Rank Fusion）实现混合检索 [^518^]。AgentRoot 项目展示了完整的架构：FTS5 用于全文搜索，HNSW 近似最近邻索引加速向量搜索，BM25 + vector 融合实现最优质量 [^524^]。
- **libSQL** (Turso 分支) 为 SQLite 添加了复制友好变更、向量搜索能力和嵌入式副本支持。Turso 的 AgentFS 完全构建在 libSQL 之上 [^329^]。

#### 2. AgentFS：文件系统与数据库的融合范式

Turso 提出的 AgentFS (Agent File System) 代表了 AI Agent 存储的核心抽象创新：

- AgentFS 将文件、目录、键值状态和审计日志存储在单个 SQLite 数据库中，提供 POSIX 风格的虚拟文件系统接口 [^391^]。整个 Agent 运行时——文件、状态、历史——存储在单个 SQLite 文件中，可在机器间移动、版本控制或部署到任何地方。
- 核心接口包括：文件系统接口（POSIX 风格操作）、键值接口（JSON 序列化状态存储）、工具调用接口（审计日志）[^394^]。
- **关键洞察**："SQLite 提供了 Agent 所需的精确属性——单文件包含完整运行时、快照任意状态、用 SQL 查询 Agent 行为" [^394^]。
- 多个信号验证了这一范式：Mintlify 用虚拟文件系统替代 RAG 管道，会话创建从 46 秒降至 100 毫秒；Box 将其平台重新定位为 AI Agent 的虚拟文件系统层；ByteDance 开源 OpenViking 将 Agent 记忆组织为层次化文件系统 [^392^]。

#### 3. OpenViking：虚拟文件系统的分层加载创新

ByteDance 的 OpenViking (2026年1月开源，15,000+ GitHub Stars) 是上下文数据库的重要创新：

- 采用 `viking://` 协议将所有上下文（记忆、资源、技能）组织为层次化目录结构 [^515^]。三个根目录：`viking://resources/`（原始数据）、`viking://user/`（用户偏好和历史）、`viking://agent/`（Agent 技能和经验）。
- 核心创新是**分层上下文加载（LOD）**：每个资源自动处理为三级细节——L0 (~100 token 摘要)、L1 (~2k token 概览)、L2 (完整内容) [^517^]。
- 与传统 RAG 对比：OpenViking 在嵌套查询场景中减少 30% 检索延迟，Token 效率显著优化 [^527^]。

#### 4. GBrain：Markdown + 混合检索的本地优先知识层

Y Combinator CEO Garry Tan 于 2026年4月发布的 GBrain 快速获得 14,000+ GitHub Stars：

- 采用 **PGLite** (WASM 嵌入式 Postgres) + pgvector 实现本地优先的混合检索 [^512^]。三条检索线并行：pgvector HNSW 余弦向量检索、tsvector 关键字检索、Claude Haiku 多查询扩展，结果通过 RRF 融合 [^530^]。
- 存储原始为 Markdown 文件（人类可读），编译到 Postgres 实现机器可检索。支持"梦想周期"（dream cycle）夜间记忆整合 [^558^]。
- v0.7.0 的关键转变：默认引擎改为 PGLite，`gbrain init` 2 秒内启动完整 Postgres + pgvector + 混合检索，零账号、零服务器、零连接字符串 [^530^]。当数据增长超过 1000 文件时，可通过 `gbrain migrate --to supabase` 无缝迁移到托管 Postgres。
- 独立基准测试显示：在 150 个真实问题中，GBrain 以 8.3x 胜率击败 OpenClaw 子代理的检索，平均 P@5 提升 +0.081 [^550^]。

#### 5. CRDT 生态：同步引擎的核心技术

CRDT (Conflict-free Replicated Data Types) 是本地优先软件的基础技术，2026 年生态显著成熟：

- **Yjs** 仍是生产环境默认选择 (~920K 周下载，17K GitHub Stars)，采用 YATA 算法，18 kB gzip 体积，生态系统最丰富（Tiptap、CodeMirror、Monaco 绑定）[^380^]。
- **Automerge v3** (2026年) 通过 Rust 核心实现约 10 倍内存减少，支持完整的 Git 风格变更历史 DAG [^376^]。适合需要版本历史作为产品特性的应用。
- **Loro** (Rust+WASM) 在性能基准中领先所有类别：260K 编辑应用 290ms (Yjs 430ms, Automerge 680ms)，编码文档仅 68KB (Yjs 160KB, Automerge 250KB)，内存 15MB (Yjs 28MB, Automerge 41MB) [^380^]。
- **性能排序** (B4 基准测试)：Loro > Yjs > Automerge。但 Yjs 生态系统成熟度仍是生产环境首选因素 [^380^]。

#### 6. Sync 引擎：四大阵营竞争

本地优先数据同步引擎形成四个明确阵营：

- **数据库复制** (PowerSync, ElectricSQL)：Postgres 到客户端 SQLite 的复制，适合大多数不需要 Google Docs 式实时文本编辑的应用 [^446^]。PowerSync 是 2026 年初最成熟选项 [^446^]，ElectricSQL 追求更激进的 active-active 复制但 2026年初生产边缘较粗糙 [^331^]。
- **全栈数据库** (Triplit, Jazz, Zero)：Triplit 内置同步的全栈数据库，TypeScript API 优秀；Jazz 是本地优先关系数据库，行级安全和 per-query auth；Zero (Rocicorp) 采用基于查询的同步方法 [^446^][^451^]。
- **CRDT 库** (Yjs, Automerge, Loro)：适合实时协作编辑场景，p2p/offline-first 的自然选择。
- **事件溯源** (LiveStore)：同步变更日志而非当前状态，智力上有吸引力但实践中增加不必要的复杂性 [^446^]。

#### 7. Letta (MemGPT)：OS 启发的三层记忆架构

Letta 作为 MemGPT 的商业化演进，代表了 Agent 记忆管理的学术源头 (论文 6,600+ 引用)：

- **三层记忆**：Core Memory（上下文窗口中的"RAM"）、Recall Memory（可搜索的对话历史"磁盘缓存"）、Archival Memory（向量索引的长期存储"冷存储"）[^431^]。
- **2026 年关键创新——Context Repositories** (2026年2月)：基于 Git 的记忆文件系统，支持自动版本控制和多 Agent worktree 的合并冲突解决 [^554^]。Agent 通过标准工具（bash、脚本）以编程方式管理记忆，支持渐进式披露。
- **基准数据**：30 天连续 Agent 运行中，Letta 在 500+ 交互中保持任务上下文，而典型 RAG 基线在 50 次后碎片化 [^433^]。但 Letta 在 LongMemEval 等标准化基准上缺乏公开数据 [^437^]。

#### 8. Mem0：轻量记忆层的默认选择

Mem0 以 "bolt-on memory layer" 定位成为 2026 年消费者应用记忆默认选项：

- **四 scope 记忆模型**：user_id（跨会话持久）、agent_id（特定 Agent 实例）、run_id/session_id（单会话）、app_id/org_id（共享组织上下文）[^326^]。
- **Graph Memory** (2026)：内置实体链接替代外部图谱存储，检索时实体匹配提升相关记忆排名 [^326^]。
- **基准数据**：个性化回忆准确率 78%，检索相关性 94%，LoCoMo 准确率较 OpenAI Memory +26% [^433^][^413^]。
- **低锁定成本**：API 表面狭窄（extract/store/retrieve），切换到其他记忆层仅需重写三个调用点 [^433^]。

#### 9. AI Agent 记忆架构的三代演进

Agent 记忆技术沿时间轴铺展为三个明确的代际 [^403^][^406^]：

- **第一代：工程化集成** (Mem0, Zep)——侧重快速接入与自动事实提取，适用于 SaaS 轻量化场景，长周期复杂推理中易出现记忆碎片化。
- **第二代：结构化与图谱** (MemoryBank/Letta, Graphiti/Zep)——引入分层存储与统一表示，时序知识图谱，多模态转统一记忆对象。
- **第三代：认知架构** (OpenClaw, Claude Code, 腾讯云 Agent Memory)——融合情景记忆、语义记忆与动态调度，构建接近人类记忆机制的层次化系统，在 PersonaMem 评测中得分从 40%-55% 跃升至 70% 以上。

#### 10. 生产级记忆架构的四层模型

RankSquire 提出的四层记忆架构成为 2026 年生产标准参考 [^337^]：

- **L1 短期工作记忆** → Redis OSS（sub-1ms），当前任务状态，TTL 过期
- **L2 长期语义记忆** → Qdrant（20ms p99 at 10M 向量），验证的领域知识
- **L3 情景记忆** → Pinecone Serverless，时间有序的 Agent 决策记录
- **工具记忆** → Weaviate，函数模式和 API 规范注册表

关键设计原则：Agent 读取长期记忆但**绝不**在执行期间直接写入；所有候选记忆必须通过 Validation Gate（来源验证、去重检查 0.92 阈值、元数据标记）[^337^]。

#### 11. MCP：正在成为"记忆总线"

Anthropic 的 MCP (Model Context Protocol) 正在从工具调用协议演变为 Agent 状态管理的标准通道：

- "Memory via MCP" 正成为一种设计模式——记忆的存储、检索、同步都通过 MCP 接口暴露，客户端无关 [^406^]。
- Mem0 的 OpenMemory、Engram、Recall、MemSearch 都通过 MCP 暴露记忆接口。MemSearch 已实现 Claude Code、OpenClaw、OpenCode、Codex CLI 的跨客户端记忆共享 [^406^]。
- GBrain、sqlite-memory-mcp、Hindsight、MemPalace 等新兴项目均采用 MCP-native 设计 [^549^]。

#### 12. TinyBase：响应式本地数据存储

TinyBase 作为 "local-first apps 的响应式数据存储" 提供了轻量级状态管理方案：

- 仅 5.0kB-9.4kB 体积，零依赖，支持键值和表格数据 [^445^]。
- v4.8 新增 PowerSync 集成，原生支持 CRDT，可同步到浏览器存储、IndexedDB、SQLite、CRDTs、PartyKit 和 ElectricSQL [^445^]。
- Expo 官方推荐的本地优先工具之一 [^197^]。

#### 13. 嵌入式数据库选型矩阵

对于本地优先统一存储的数据库选型，关键对比 [^409^]：

| 维度 | SQLite | DuckDB | PGlite |
|------|--------|--------|--------|
| 类型 | OLTP (事务型) | OLAP (分析型) | OLTP + 扩展 |
| 存储模型 | 行式 | 列式 | 行式 |
| 最佳场景 | 移动/IoT/嵌入式 | 分析/数据科学 | 客户端 Postgres 兼容 |
| 向量搜索 | sqlite-vec 扩展 | 不原生支持 | pgvector 原生 |
| 全文搜索 | FTS5 | 不原生支持 | tsvector 原生 |
| 大小 | < 1MB | ~10MB | ~3.7MB gzipped |
| WASM 支持 | 原生 | 实验性 | 核心设计 |

**关键洞察**：SQLite + sqlite-vec + FTS5 的组合提供了最紧凑的统一存储方案（关系+向量+全文在 <1MB 内）；PGlite 提供了完整的 Postgres 兼容性但体积更大 (~3.7MB) [^513^]。

### 主要参与者 & 来源

| 实体 | 角色/相关性 |
|------|-----------|
| **Turso/libSQL** | SQLite 分支创新者，AgentFS 提出者，嵌入式副本架构领先 |
| **ElectricSQL** | PGlite 维护者，Postgres→客户端同步引擎，Apache 2.0 开源 |
| **PowerSync** | 最成熟的生产级 sync 引擎，$49/月起，React Native/Flutter 多平台 |
| **ByteDance/OpenViking** | 虚拟文件系统范式创新者，分层上下文加载 (L0/L1/L2) |
| **Garry Tan/GBrain** | Markdown-first 本地优先知识层，PGLite + 混合检索 |
| **Letta (原 MemGPT)** | OS 启发三层记忆架构，Context Repositories (Git-based)，学术源头 |
| **Mem0** | 轻量 bolt-on 记忆层，四 scope 模型，41K GitHub Stars |
| **Yjs** | CRDT 生产标准，~920K 周下载，最丰富的编辑器绑定生态 |
| **Automerge** | 文档导向 CRDT，完整变更历史 DAG，Rust+WASM |
| **Loro** | 性能领先 CRDT，Fugue 算法，编码文档大小 68KB |
| **Rocicorp/Zero** | 基于查询的 sync 引擎，Replicache 继任者 |
| **Triplit** | 全栈本地优先数据库，TypeScript 端到端类型安全 |
| **Jazz** | 本地优先关系数据库，行级安全，git-like 分支历史 |
| **TinyBase** | 响应式数据存储，5kB-9kB，PowerSync 集成 |
| **Anthropic/MCP** | Model Context Protocol，正在成为记忆互操作标准 |
| **OpenClaw** | 文件系统即记忆的 Agent 网关，SQLite-vec 混合检索 |
| **Alex Garcia** | sqlite-vec 作者，SQLite 向量搜索生态推动者 |

### 趋势 & 信号

#### 短期趋势 (2026 H2)

1. **SQLite 作为 Agent 存储基座的加速采用**：sqlite-vec 生态在 GitHub 上已达 82+ 仓库 [^459^]，从简单 RAG 到复杂 Agent 记忆都在采用 SQLite 作为统一存储。
2. **文件系统范式的崛起**：AgentFS、OpenViking、GBrain 都验证了"文件系统作为 Agent 认知的通用接口"这一范式 [^392^]。Mintlify 的案例（46秒→100毫秒）是最有力的性能证据。
3. **MCP 作为记忆互操作标准**："MCP 之于 Agent Memory，可能就像 SQL 之于关系数据库" [^406^]。记忆后端切换将像应用切换数据库一样简单。
4. **PGLite 的本地优先革命**：Postgres 17.5 编译为 WASM 运行在浏览器/Node 中，ElectricSQL 维护，3.7MB gzipped，200ms 启动 [^514^]。GBrain 的 "2 秒就绪" 是最有力的采用信号。

#### 中期趋势 (2027)

5. **记忆即基础设施**：Agent Memory 从"功能模块"升级为"基础设施层"，Memory as a Service 成形（Mem0 Cloud $24M 融资），但本地优先的替代方案（GBrain、sqlite-memory-mcp）同步崛起 [^406^]。
6. **OS 化记忆中枢**：记忆系统成为 Agent 的操作系统级组件，统一管理多模态、多 Agent 共享状态 [^404^]。
7. **混合检索成为默认**：纯向量不够精确，纯图谱开销太大。向量+图+全文检索+结构化存储的多引擎组合成为主流 [^518^]。
8. **Agent "做梦"——仿生记忆整合**：OpenClaw Auto-Dream、Cortex-Engine 模拟人类睡眠时的记忆巩固过程（收集→整合→评估），学术跟进（D-MEM、CraniMem、Oblivion）[^406^]。
9. **简单文件系统胜过复杂记忆架构的 Letta 基准**：Letta Filesystem 在 LoCoMo 基准上达 74.0%，仅通过将对话历史存储在文件中，就击败了专门的记忆工具库 [^553^]。

#### 架构信号

10. **从 Flat RAG 到 Layered Sovereign Memory**：生产 Agent 部署从单一向量集合的平面检索转向四层分层记忆架构（短期/长期/情景/工具），每层有专用后端、检索延迟要求和失败模式 [^337^]。
11. **CRDT 与数据库复制的融合**：FOSDEM 2026  dedicates 整个 track 给 "Local-First, sync engines, CRDTs" [^335^]。Yjs + SQLite 的混合架构成为移动端离线优先的标准模式 [^436^]。
12. **Context Repositories 的版本控制记忆**：Letta 的 Git-based 记忆文件系统代表了 Agent 记忆版本化的重要方向，支持多 Agent worktree 协作 [^554^]。

### 争议 & 冲突观点

#### 1. OT vs CRDT：算法之争的 2026 共识

**争议**：CRDT 是否已经取代了 OT (Operational Transformation)？

- **OT 派**：Google Docs、Figma、Taskade 仍使用 OT，对于中心化服务器架构，OT 更简单、更便宜。"CRDT 解决了大多数 SaaS 产品不需要的去中心化同步问题" [^435^]。Taskade 明确指出"对于服务器介导的 AI Agent 工作空间，OT 仍是正确选择" [^376^]。
- **CRDT 派**：Yjs 在实时协作编辑中占主导地位，Figma 2019 年从 OT 切换到 CRDT 以获得离线优先能力。2026 年 FOSDEM  dedicates 整个 track 给 CRDT [^335^]。
- **2026 共识**：选择取决于架构——中心化服务器用 OT，离线优先/p2p/分布式用 CRDT [^384^]。两者正在收敛（Gentle & Kleppmann 2024 年的 eg-walker 是 CRDT 穿着 OT 的接口）[^376^]。

#### 2. 简单文件系统 vs 复杂记忆架构

- **Letta 的发现**：仅通过将对话历史存储在文件中就达到 LoCoMo 74.0%，击败专门的记忆工具库 [^553^]。
- **反方观点**：专门的记忆系统（Mem0、Zep、Letta 自身）在多 session 个性化、时序推理、跨源事实检索上仍显著优于简单文件存储。Mem0 在 50+ session 个性化回忆达 78% 准确率 [^433^]。
- **调和观点**：简单文件系统足以处理会话连续性，但复杂的分层记忆管理在长周期、多 Agent、多模态场景中仍然必要。

#### 3. 被动提取 vs Agent 自编辑记忆

- **Mem0 的被动提取**：系统决定提取什么事实，开发者控制输入，系统处理分解和存储。可预测且 Token 高效，但无法做出 nuanced 判断 [^438^]。
- **Letta 的自编辑**：Agent 在推理循环中调用记忆函数决定记住什么。更自适应，但记忆质量完全依赖模型判断——如果模型未能保存某事，它就永远丢失了 [^438^]。
- **基准差异**：Mem0 在快速模糊回忆上领先；Letta 在情景连贯性（Agent 记住"昨天我们尝试了 X 但失败了"）上显著领先 [^433^]。

#### 4. SQLite 是否足够？专用向量数据库的必要性

- **SQLite 足够派**：sqlite-vec + FTS5 的组合实现了关系+向量+全文三重能力，对于 <1M 向量的场景完全足够。GBrain 的 PGLite 方案验证了嵌入式数据库的可行性 [^512^]。
- **专用数据库派**：生产级 Agent 需要 Qdrant (20ms p99 at 10M 向量)、Weaviate (BM25+dense 混合) 等专用向量数据库来处理大规模检索 [^337^]。
- **实用共识**：小规模/本地优先用 SQLite + sqlite-vec；大规模生产部署用专用向量数据库。两者不是替代关系，而是不同规模的选择。

#### 5. Letta 的高锁定成本是否合理

- **支持方**：Letta 拥有 Agent 循环意味着更深度的记忆集成，30 天连续运行保持上下文的能力证明了其价值 [^433^]。
- **反对方**：锁定成本高（迁移需 2-6 周重写），Token/API 成本比 Mem0 高 2-3 倍，检索延迟未达 sub-300ms [^432^]。建议不确定记忆架构时从 Mem0 开始 [^433^]。

### 推荐深入调研领域

1. **SQLite + sqlite-vec + FTS5 的统一存储实现路径**：针对 AI Agent Runtime 的具体数据层设计，如何将关系数据、向量嵌入、全文索引统一在 SQLite 中。需深入研究混合检索的 RRF 融合策略、HNSW 索引在 sqlite-vec 中的实现状态、以及性能基准。

2. **AgentFS 规范的详细技术实现**：Turso 的 AgentFS 提供了文件系统+数据库融合的核心抽象，但其具体 SQLite schema 设计、inode/dentry 表结构、whiteout 机制、以及嵌入式副本同步协议值得深入分析。

3. **Context Repositories 与 Git 版本化记忆的工程实践**：Letta 的 Git-based 记忆文件系统是重要创新，需深入研究其 progressive disclosure 模式、多 Agent worktree 冲突解决、以及在实际编码 Agent 中的表现。

4. **MCP 作为记忆互操作标准的演化**：MCP 正在成为 Agent Memory 的"总线"，需跟踪其协议规范、各记忆后端的 MCP 适配实现、以及跨客户端记忆共享的实际效果。

5. **分层记忆架构的 Token 效率优化**：OpenViking 的 L0/L1/L2 分层加载、GBrain 的编译真理/时间线分离、Mem0 的压缩引擎（Token 消耗降低 90%）都指向同一方向——精细化记忆管理的 Token 效率。

6. **CRDT 与 SQLite 的混合架构模式**：Yjs + SQLite 的离线优先模式 [^436^]、ElectricSQL 的 Postgres→SQLite active-active 复制、以及 TinyBase 的 CRDT 原生支持，代表了本地优先同步的技术前沿。

7. **PGLite 的生产就绪状态评估**：作为 WASM 嵌入式 Postgres，PGLite 的 3.7MB 体积、200ms 启动、pgvector 原生支持使其成为 SQLite 的有力竞争者。需评估其在 Agent 场景中的实际性能、内存占用和持久化可靠性。

8. **仿生记忆整合（Agent "做梦"）的工程实现**：OpenClaw Auto-Dream 的三阶段睡眠循环、GBrain 的 dream cycle  nightly consolidation 等机制，代表了 Agent 记忆从"被动存储"到"主动整理"的范式转变。

9. **本地优先架构的隐私与安全模型**：本地优先天然满足数据主权要求（GDPR、数据不出域），但跨设备同步的加密、多租户隔离、访问控制仍需深入研究。

10. **记忆基准测试的真实含义**：LoCoMo、LongMemEval、BEAM、PersonaMem 等基准各有侧重，需理解各基准的评测方法和实际生产环境的相关性，避免基准"刷分"误导架构选择。
