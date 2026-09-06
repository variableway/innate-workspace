## Executive Summary (执行摘要)

### 调研背景与核心发现

个人AI Agent（人工智能代理）正从"多软件拼凑"向"单Runtime + Plugin"模式跃迁。本报告对30余个开源项目展开系统性评估，覆盖插件架构、桌面基座、统一存储、安全沙箱等8个技术维度，凝练为10项跨维度洞察。核心发现可概括为三个关键词：**MCP标准化**、**Tauri基座化**、**SQLite统一化**。

MCP（Model Context Protocol，模型上下文协议）在发布后的18个月内完成了从实验性提案到事实标准的跃迁。截至2026年5月，MCP生态已积累9,400余个公共服务器、9,700万月SDK下载量，78%的企业AI团队已在生产环境部署[^412^][^459^][^419^]。2025年12月Anthropic将MCP捐赠给Linux Foundation下属的AAIF（Agentic AI Foundation，智能体AI基金会），190余个成员组织的加入确保了协议演进的技术中立性[^457^][^454^]。MCP的"USB-C效应"——将 $M \times N$ 的集成复杂度简化为 $M + N$ 的标准化连接——使其成为Agent Runtime插件层的不二选择[^331^]。

桌面基座层的竞争格局已然明朗。Tauri v2在Hello World基准测试中实现包体积3.2 MB（较Electron缩减96%）、内存42 MB（降低75%）、冷启动380 ms（提升3.7倍）[^53^]。Stack Overflow 2025调查显示72%的桌面开发者正考虑或已完成向Tauri迁移[^53^]。Tauri的五平台单代码库能力与Capability-based权限模型，使其成为构建个人AI Agent桌面Runtime的首选基座[^427^][^426^]。

存储层正经历SQLite的"文艺复兴"。sqlite-vec扩展赋予其向量搜索能力[^454^]，AgentFS将Agent完整运行时状态存储于单个SQLite文件[^391^]，OpenClaw的Active Memory插件验证了混合检索（70%向量+30% BM25）场景的生产适用性[^403^]。"Agent State = 一个SQLite文件"正成为本地优先Runtime的设计共识[^811^][^394^]。

安全已成为不可回避的差异化因素。OpenClaw的470余项安全公告、ClawHavoc攻击（1,184个恶意技能影响135,000个暴露点）、以及OWASP Agentic Top 10 2026框架的发布，标志着2026年Q2成为"Agent安全元年"[^598^][^642^][^693^]。Cisco RSA 2026调查揭示85%的企业在试验AI Agent，但仅5%投入生产——安全是最大障碍[^846^]。这一格局为Rust内存安全、WASM Capability-based沙箱和Tauri"默认拒绝"权限模型创造了最佳入场时机。

### 推荐技术栈

基于8个技术维度的交叉分析，本报告推荐**Tauri v2桌面基座 + Rust Agent Runtime + MCP Plugin系统 + SQLite统一存储**的四层架构，作为面向"一个软件搞定"场景的当前最优技术组合。

![推荐架构：Tauri + Rust + MCP + SQLite](fig_sec00_architecture.png)

*图：推荐架构概览——四层分层设计覆盖UI呈现、核心编排、插件执行与数据持久化全链路。数据来源：Tauri官方基准测试、MCP生态统计、SQLite官方文档，2026年5月。*

该架构的核心优势在于各组件天然互补：Tauri提供轻量级桌面壳与Capability-based安全框架，Rust核心运行时保障内存安全与高性能编排，MCP Plugin系统接入9,400+服务器生态[^53^][^412^][^811^][^599^]。

实施路径建议分三阶段：**第一阶段（MVP，4-6周）**：Tauri v2桌面壳+Ollama Sidecar本地LLM+MCP stdio连接5-10个核心服务器+SQLite存储对话历史。**第二阶段（功能完善，8-12周）**：WASM沙箱执行第三方插件+A2A通信+sqlite-vec向量搜索与RAG（Retrieval-Augmented Generation，检索增强生成）。**第三阶段（生态扩展）**：MCP应用商店+CRDT多设备同步+ANP信任层。

### Top 5 推荐方案速查

下表从个人用户"一个软件搞定"的核心场景出发，对综合评估最优的5个开源方案进行速查对比。评估基于六维加权评分模型（影响力20%、轻量程度20%、本地优先能力20%、Plugin扩展性15%、部署体验15%、安全性10%），满分60分。

| 排名 | 项目 | Stars | 语言 | 总分 | 核心定位 | MCP支持 | 适用场景 | 关键优势 | 主要风险 |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| 1 | **Ollama** | 161K | Go | 72.8 | 本地LLM基础设施 | API兼容 | 所有本地部署场景 | `ollama run`一行启动，OpenAI兼容API，消费级硬件运行70B模型 [^573^] | 本身非完整Agent，需配合Agent框架 |
| 2 | **Goose** | 32K | Rust | 70.3 | 企业级编码Agent | 原生支持 | 开发者/平台团队 | Rust实现+WASM沙箱，70+ MCP扩展，Linux Foundation AAIF背书 [^487^] | Homebrew安装对新手不友好 |
| 3 | **Cline** | 61K | TypeScript | 70.5 | VS Code编码Agent | 原生支持 | VS Code用户/个人开发者 | Human-in-the-Loop安全设计，3M+安装量，MCP Marketplace集成 [^437^] | 缺乏OS级沙箱，存在注入漏洞历史 [^440^] |
| 4 | **ZeroClaw** | 8.5K | Rust | — | 极致轻量Runtime | 原生支持 | 安全敏感/资源受限场景 | 3.4MB二进制，<10ms冷启动，Rust内存安全，OpenClaw安全事件后快速增长 [^324^] | 功能精简，生态早期 |
| 5 | **OpenHands** | 71K | Python | — | 自主开发Agent | 支持 | 开发团队/自动化需求 | Clone→Modify→Build→Test→PR全工作流，460名贡献者 [^775^] | 资源需求高，超出"轻量级"范畴 |

*表：Top 5推荐方案速查——按个人用户场景适配度排序，数据来源：GitHub API、六维评估综合计算，2026年5月。*

上表排序反映了安全优先的选型取向。Ollama作为本地LLM基础设施的不可替代性（161K Stars[^573^]）使其成为任何本地方案的必选项。Goose的Rust实现与WASM沙箱[^487^]在安全优先级提升的2026年具有独特优势。Cline凭借3M+ VS Code安装量[^437^]成为IDE集成场景首选，但缺乏OS级沙箱[^440^]。ZeroClaw以3.4MB二进制和<10ms冷启动定义"安全+轻量"新标准[^324^]。OpenHands的71K Stars和自动构建工作流[^775^]预示了Agent Runtime从"静态Plugin"向"自进化系统"演进——AGENTS.md已被60,000+项目采用[^682^]。

### 关键洞察与行动建议

10项跨维度洞察揭示了几个高阶判断。其一，MCP的"USB-C效应"正在创造"Agent应用商店"机会——9,400+服务器、7,800 GitHub仓库的数据背后隐藏着去中心化的应用分发生态[^412^][^448^][^459^]，但ClawHavoc攻击暴露了"完全开放"模式的安全缺陷[^642^]。其二，"懒猫模式"（硬件+OS+LPK商店）与"Tauri基座Plugin模式"在架构层面高度同构——懒猫LPK近似MCP Server Marketplace，LZCOS近似Tauri+Rust+SQLite——存在"软件版懒猫"的中间地带产品机会。其三，协议栈分层正复刻互联网协议栈演化路径：MCP→TCP，A2A→HTTP，AGNTCY→DNS，ANP→TLS[^344^][^349^]；个人用户Runtime当前只需实现MCP+A2A两层。

行动建议归纳为三项。**立即行动**：Ollama本地LLM + Tauri v2桌面基座 + MCP Client核心工具 + SQLite默认存储——最低风险与最高回报比。**短期关注（2026年Q3-Q4）**：WASM/WASI沙箱标准化（预计2027年Q1默认标准[^696^]）、MCP与A2A协议收敛（IBM确认统一agent card[^169^]）。**中期布局（2027年）**：AP2支付协议跨厂商采纳（60+合作伙伴[^792^]）。Gartner预测尽管超40% agentic AI项目将在2027年底前被取消，但到2028年15%日常工作决策将由Agent自主完成[^843^][^849^]——早期采用者将占据结构性优势。
