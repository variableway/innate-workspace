## Facet: 本地优先存储方案（SQLite / CRDT / 统一数据层）

### 关键发现

#### 1. SQLite已成为AI Agent本地存储的核心基础设施

SQLite正经历"SQLite文艺复兴" [^179^]，从嵌入式数据库向生产级分布式数据库转变。对于AI Agent场景，SQLite的单文件特性、零配置、低延迟读取（~0.01ms）使其成为理想选择。关键数据点：

- **sqlite-memory**：基于Markdown的AI Agent记忆系统，支持语义搜索、混合检索和离线优先同步，使用SQLite作为单一存储后端 [^90^]
- **Agent Memory (MCP)**：使用SQLite为Codex、Claude Code等AI客户端提供共享持久记忆，支持可选嵌入向量增强检索 [^98^]
- **sqlite-vec**：Alex Garcia开发的SQLite扩展，为SQLite添加原生向量搜索能力，支持KNN搜索、多种距离度量（cosine/L2/L1/Hamming）、SIMD加速，仅需30MB默认内存 [^124^][^125^]
- 在100,000个向量（384维）的查询中，sqlite-vec可在100ms内完成；支持float32/int8/bit等多种向量格式 [^125^][^135^]

#### 2. SQLite生态 fork 与扩展正在快速演进

多个SQLite fork 和扩展正在为本地优先架构提供关键能力：

- **libSQL (Turso)**：SQLite的开源fork，添加原生复制、嵌入式副本、HTTP访问和WASM UDF支持。支持"每用户一个数据库"模式，读取在本地进行，写入同步到远程主节点 [^181^][^186^]
- **Turso Rust重写**：基于MVCC的并发写入、异步优先API、原生向量搜索，代表SQLite生态的长期方向 [^181^]
- **cr-sqlite (Vulcan)**：SQLite扩展，添加基于CRDT的多写入者复制能力，支持离线编辑和自动冲突解决 [^139^][^183^]
- **PGlite**：ElectricSQL将PostgreSQL编译为WASM（仅3MB gzipped），可在浏览器中运行完整Postgres，支持pgvector扩展和反应式实时查询 [^196^][^200^][^201^]

#### 3. AgentFS：文件系统作为统一存储抽象的创新模式

**AgentFS**是Turso提出的面向AI Agent的文件系统抽象，核心洞察是将SQLite作为Agent运行时的完整状态容器 [^128^][^130^]：

- 提供三个核心接口：POSIX风格文件系统、键值存储（JSON序列化）、工具调用审计日志
- 底层使用经典inode/dentry设计，完全在SQLite表中实现
- 整个Agent运行时可快照为单个SQLite文件复制，支持完整可审计性和可重现性
- Agent已训练大量shell脚本、Unix文档和基于文件的工作流，文件系统接口与Agent能力天然匹配 [^128^]

#### 4. CRDT库和同步引擎生态趋于成熟

CRDT（无冲突复制数据类型）是解决多设备/多Agent数据同步的核心技术：

**CRDT库**：
- **Yjs**：实时文本编辑的CRDT框架，使用高效二进制编码，是Tiptap/BlockNote/Notion风格编辑器的主流选择 [^126^][^127^]
- **Automerge 3.0**（2025年5月）：内存使用降低约10倍（Rust核心+稳定JS API），使浏览器中的大型文档操作成为现实 [^126^]
- **Loro**（1.0版2024年）：支持富文本和可移动树CRDT，填补Yjs和Automerge的空白 [^126^][^127^]
- **Diamond Types**：高性能Rust CRDT文本编辑实现 [^127^]

**Sync引擎**：
- **ElectricSQL**：将Postgres数据同步到客户端SQLite，使用"shapes"声明式订阅，支持PGlite在浏览器中运行Postgres [^178^][^180^]
- **PowerSync**：生产级双向同步引擎，支持React Native/Flutter/Kotlin，使用桶（bucket）系统解决部分动态同步问题 [^178^][^180^][^182^]
- **Zero**（Rocicorp）：客户端反应式缓存，乐观更新，细粒度响应性 [^180^]
- **Triplit**：全栈同步引擎+数据库，2025年被Supabase收购 [^139^]

#### 5. AI Agent记忆系统的存储架构分层模式

多篇研究论文和项目揭示了Agent记忆系统的统一存储分层模式：

- **MemoryOS**（北京邮电大学+腾讯AI Lab）：提出三层存储架构——短期记忆(STM)、中期记忆(MTM)、长期个人记忆(LPM)，在LoCoMo基准上相比基线平均提升49.11% F1 [^213^]
- **MemGPT/Letta**：将LLM视为操作系统，内存分层为主上下文(RAM)和外部上下文(磁盘)，Agent通过工具调用主动管理自身内存（memory_insert/memory_replace），使用文件系统实现 achieves 74.0% on LoCoMo [^184^][^188^]
- **计算机架构类比**：Agent I/O层 → Agent缓存层（压缩上下文、最近工具调用） → Agent内存层（完整对话历史、向量DB、图DB），强调Agent性能是端到端数据移动问题 [^102^][^211^]
- **多Agent内存访问协议缺失**：虽然MCP解决了工具调用连接性，但Agent缓存共享协议和Agent内存访问协议（权限、范围、粒度）仍缺乏标准化 [^102^]

#### 6. 统一存储层的关键设计模式

- **Hybrid Search（混合搜索）**：sqlite-memory结合向量相似度(cosine distance)和FTS5全文搜索 [^90^]；AISAC使用SQLite关系存储+双FAISS向量索引（RAG索引+对话索引） [^97^]
- **SQLite WAL模式**：支持并发读写，~7秒写入0.5GB数据集，内存开销~39MB，p95延迟<5ms（100并发读取） [^93^]
- **Markdown First存储策略**：本地AI Agent记忆系统采用Markdown文件作为存储单元，目录结构包括IDENTITY.md、USER.md、MEMORY.md、每日活动日志和会话级记忆 [^131^]
- **PGlite在AI应用中的实践**：LobeChat在v1.37.0引入PGlite作为客户端DB引擎，实现浏览器端完整知识库对话能力，计划通过ElectricSQL的CRDT引擎实现客户端/服务端统一 [^217^]

#### 7. 性能基准与选型参考

| 指标 | SQLite嵌入式 | 外部向量DB | Agent交互目标 |
|------|-------------|-----------|-------------|
| 单记录读取延迟 | 0.05-0.2ms | N/A | <1ms |
| 批量写入吞吐量 | 800-1500 ops/sec | N/A | >1000 |
| 向量相似搜索(Top-10, 1M向量) | 20-50ms | 1-5ms | <10ms |
| 崩溃恢复时间 | 50-150ms | N/A | <100ms [^93^]

---

### 主要参与者 & 来源

| 实体 | 角色/相关性 |
|------|-----------|
| **Turso/libSQL** | SQLite fork 领导者，提供边缘复制、AgentFS SDK、嵌入式副本 [^130^][^181^] |
| **Alex Garcia (asg017)** | sqlite-vec/sqlite-vector作者，SQLite向量搜索生态核心开发者 [^124^][^135^] |
| **ElectricSQL** | PGlite（WASM Postgres）和Electric sync engine开发者 [^196^][^200^] |
| **PowerSync (JourneyApps)** | 生产级SQLite同步引擎，支持多平台 [^178^][^182^] |
| **Letta (原MemGPT)** | 有状态LLM Agent平台，证明简单文件系统即可实现74% LoCoMo得分 [^184^][^188^] |
| **Yjs/Automerge/Loro** | CRDT库三大主流选择，覆盖不同协作场景 [^126^][^127^] |
| **sqliteai/sqlite-memory** | 基于SQLite的AI Agent记忆系统，支持语义搜索和离线同步 [^90^] |
| **Vulcan (cr-sqlite)** | 为SQLite添加CRDT多写入者复制的扩展 [^139^][^183^] |
| **LobeChat** | 开源AI聊天平台，采用PGlite实现客户端数据库统一 [^217^] |
| **MemoryOS (北京邮电大学)** | 提出Agent内存操作系统框架，三层存储架构 [^213^] |
| **Tiger Data** | 提出PostgreSQL统一Agent记忆方案（pgvectorscale+hypertables）[^94^] |
| **InstantDB / LiveStore / Jazz** | 本地优先应用框架，提供数据库+同步一体化方案 [^197^][^199^] |

---

### 趋势 & 信号

1. **SQLite从"嵌入式"到"生产级统一存储"的定位跃迁**：2024-2025年，Turso、Cloudflare D1、libSQL、Litestream等项目推动SQLite成为分布式边缘数据库的核心选择 [^179^]。这一趋势直接利好AI Agent的本地存储需求。

2. **向量搜索与关系数据库的融合**：sqlite-vec、pgvector、SQLite-Vector等项目正在消除"需要单独向量数据库"的假设。对于本地优先架构，单一存储后端（SQLite/Postgres）同时处理结构化数据、全文搜索和向量搜索成为现实 [^124^][^125^][^135^]。

3. **文件系统抽象成为Agent存储的共识方向**：AgentFS（Turso）、Letta Filesystem、MemGPT的文件系统工具（grep/search_files/open）都验证了文件系统作为Agent统一接口的有效性 [^128^][^130^][^188^]。

4. **CRDT生态成熟，关键问题从"CRDT还是OT"转向"同步引擎边界"**：2026年的关键问题不再是CRDT vs OT，而是"复制Postgres行、复制文档操作、还是复制事件日志"，以及这对模式迁移和多设备身份的影响 [^126^]。

5. **Sync引擎竞争格局分化**：ElectricSQL（开源、Postgres-native）、PowerSync（生产级、多平台）、Zero（web优先、反应式）分别占据不同市场定位 [^180^]。

6. **Agent记忆架构向操作系统内存管理模型收敛**：MemoryOS、MemGPT、计算机架构视角的多Agent内存论文都指向同一方向——分层存储（L1/L2缓存→共享存储→持久存储）+ 协议化访问 [^102^][^213^]。

7. **"简单文件系统足够好"的反思性发现**：Letta的基准测试显示，简单文件系统（74.0% LoCoMo）胜过专用记忆工具（Mem0 68.5%），暗示Agent工具使用能力可能比复杂存储架构更重要 [^188^]。

---

### 争议 & 冲突观点

1. **专用向量数据库 vs SQLite向量扩展**
   - 支持专用向量DB方：Pinecone/Milvus/Weaviate在100M+向量规模下性能远超SQLite（1-5ms vs 20-50ms）[^93^]
   - 支持SQLite方：对于大多数Agent场景（<100K向量），sqlite-vec性能"足够好"（<100ms），且零基础设施成本、完全本地隐私、单文件便携性不可替代 [^125^][^132^]

2. **CRDT自动冲突解决 vs 开发者控制冲突解决**
   - ElectricSQL采用预定义CRDT（last-write-wins），简单但不可定制，可能不适合某些协作场景 [^182^]
   - PowerSync要求开发者通过API实现uploadData()和冲突解决，更灵活但更复杂 [^178^][^182^]

3. **文件系统存储 vs 数据库存储**
   - 支持文件系统方：Letta证明简单文件系统即可达到74% LoCoMo；Agent训练数据包含大量文件操作；Markdown First策略天然适合 [^188^][^131^]
   - 支持数据库方：Tiger Data认为多数据库碎片化导致运营复杂性和一致性问题；SQLite提供ACID保证、WAL并发、SQL查询能力 [^94^][^93^]

4. **本地优先 vs 云优先**
   - 本地优先方：零延迟、离线自治、降低API成本、数据主权；Fast.io提出三种模式（SQLite+复制、文件系统同步、CRDT）[^134^]
   - 云优先方：多用户共享、大规模分析、高可用性、Serverless弹性；Oracle建议最强模式是选择支持多种记忆表示的平台 [^104^]

5. **SQLite vs Postgres WASM (PGlite)**
   - SQLite方：更轻量、更广泛支持、单文件、C原生实现
   - PGlite方：完整Postgres兼容性、pgvector扩展、反应式查询、3MB WASM即可运行 [^200^][^201^]

---

### 推荐深入调研领域

1. **AgentFS类文件系统抽象的通用化设计**：研究如何将AgentFS的POSIX+KV+审计三层接口抽象为跨平台标准，评估与MCP（Model Context Protocol）的集成可能性。关键问题：文件系统接口是否足以覆盖所有Agent存储需求？

2. **sqlite-vec + FTS5混合搜索在Agent长记忆中的应用**：深入评估sqlite-vec在10万级向量下的实际性能，以及结合FTS5实现语义+关键词混合检索的方案。关键问题：向量维度、量化策略对检索质量的影响。

3. **CRDT在Agent状态同步中的具体应用模式**：研究Yjs/Automerge/Loro在Agent协作场景（多Agent共享状态、人机协作编辑）中的实际应用，评估与SQLite的集成方案（如cr-sqlite）。

4. **分层存储架构的统一访问层设计**：基于MemoryOS和MemGPT的分层思想，设计一个统一的存储访问接口（类似OS的虚拟内存系统），屏蔽底层SQLite/文件系统/向量索引的差异。

5. **ElectricSQL/PowerSync在Agent-personal-data-store中的应用**：评估sync engine将Agent本地数据与云端同步的方案，特别关注数据主权、隐私保护和离线 autonomy 的平衡。

6. **PGlite作为统一客户端数据库的可行性**：跟踪LobeChat等项目使用PGlite的实践，评估其在Agent runtime中同时处理关系数据、向量搜索和实时查询的能力。

7. **Letta文件系统的"足够好"哲学**：深入研究Letta文件系统达到74% LoCoMo的具体机制，探讨"Agent工具能力 > 存储架构复杂度"这一假设的边界条件。

8. **多Agent内存访问协议标准化**：MCP解决了工具连接性，但Agent间的内存共享协议（权限、范围、粒度、一致性模型）仍是空白领域，存在标准化机会 [^102^]。
