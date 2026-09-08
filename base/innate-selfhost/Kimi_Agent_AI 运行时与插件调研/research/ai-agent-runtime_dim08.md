## Facet: 多 Agent 协作协议栈

### 关键发现

#### 1. 协议栈分层架构已形成行业共识

2025-2026年，Agent协议生态从混乱竞争走向分层协作，形成了清晰的五层/六层协议栈架构 [^564^][^565^]：

| 层级 | 协议 | 解决的问题 | 创建方 |
|------|------|------------|--------|
| 工具/数据层 | MCP | Agent如何访问外部工具和数据 | Anthropic (2024.11) |
| Agent协作层 | A2A | Agent之间如何通信和委托任务 | Google (2025.04) |
| 商业层 | UCP / ACP | Agent如何发现商品、完成交易 | Google+Shopify / OpenAI+Stripe |
| 支付授权层 | AP2 | Agent如何获得支付授权 | Google (2025.09) |
| UI层 | A2UI / AG-UI | Agent如何渲染用户界面 | 社区 / CopilotKit |
| 身份信任层 | ANP / Web Bot Auth | Agent身份验证和信任 | W3C / Visa / Mastercard |

**核心洞察**：这并非碎片化，而是类似OSI模型的有机演化——每层解决特定问题，层间通过定义良好的接口协作 [^564^]。

#### 2. MCP已成为工具连接的事实标准

- **9400+** 公共服务器注册（截至2026年4月），较2025年底增长38% [^412^]
- **9700万+** 月SDK下载量（2026年3月），官方SDK在npm和PyPI累计下载超**1.5亿** [^459^][^462^]
- **78%** 的企业AI团队已在生产环境部署至少一个MCP Agent [^419^]
- 6个主流Host原生支持：Claude Desktop、Claude Code、Cursor、Codex CLI、Windsurf、VS Code/Copilot [^412^]
- 5大工具类别稳定：Connectors/SaaS(38%)、开发工具(27%)、数据/搜索(18%)、系统控制、创意内容 [^412^]
- 每一个主流AI实验室（OpenAI、Google、Microsoft、Anthropic）和IDE均已原生支持MCP [^419^]

#### 3. A2A成为Agent协作的标准化选择

- **150+** 组织支持（截至2026年4月），从50个创始伙伴增长到150+ [^458^]
- **22K+** GitHub Stars，5种生产级SDK（Python、TypeScript、Java、Go、.NET） [^458^][^416^]
- v1.0稳定版于2026年初发布，支持多租户、gRPC传输和签名Agent Card [^458^]
- 主要企业部署：Atlassian Rovo、ServiceNow Now Assist、LangChain A2A适配器 [^352^]
- A2A任务生命周期定义明确：submitted → working → input-required → completed/failed/canceled [^508^][^501^]
- Agent Card发现机制三种方式：/.well-known/agent.json直接获取、注册表查询、显式配置 [^407^]

#### 4. MCP与A2A是互补而非竞争关系

两者在架构上位于不同层级 [^350^][^352^][^418^]：

| 维度 | MCP | A2A |
|------|-----|-----|
| 通信模式 | Client-Server (Agent ↔ Tool) | Peer-to-Peer (Agent ↔ Agent) |
| 核心单元 | Tool call / Resource read | Task lifecycle |
| 发现机制 | 配置/注册表 | Agent Card自动发现 |
| 状态管理 | Session-based | Task-based状态机 |
| 传输选项 | stdio、Streamable HTTP | HTTP、SSE、webhooks、gRPC |
| 安全模型 | 协议无关(灵活但不一致) | 内置OAuth 2.0、API keys、mTLS |

**典型混合架构**：编排Agent通过A2A将任务委托给专业Agent，每个专业Agent通过MCP访问自己的工具 [^350^][^453^]。

#### 5. 安全问题是协议采用的最大障碍

**MCP安全漏洞** [^348^][^351^][^352^]：
- 2026年4月OX Security披露MCP SDK系统性漏洞：配置值直接流入STDIO传输的命令执行，影响约7000个公共MCP服务器和1.5亿+下载量 [^351^]
- Anthropic回应为"by design"，不会发布补丁——开发者需自行实现输入消毒 [^351^]
- 多个下游CVE（CVE-2025-65720、CVE-2026-30615系列等），部分Critical级别(CVSS≥9.0) [^351^]
- Tool Poisoning：恶意MCP服务器返回操纵数据影响Agent行为 [^350^]
- Prompt Injection via Tools：外部数据可能包含覆盖Agent行为的指令 [^350^]
- 2026年1月扫描发现**35%的MCP服务器**在tools/list上无认证 [^421^]

**A2A安全威胁** [^409^][^421^][^503^]：
- Agent Card伪造：攻击者发布伪造Agent Card拦截任务 [^409^]
- 级联攻击：多Agent链中一个被攻陷的Agent污染下游结果 [^350^]
- Agent Card签名是可选(MAY而非MUST)，无法密码学验证Agent身份 [^421^]
- 缺乏令牌生命周期严格限制，异步长时工作流中令牌泄露风险高 [^503^]

**学术论文评估**：安全威胁建模研究表明，MCP和Agora在创建/配置阶段风险最高，A2A处于中等风险，ANP提供最强身份保证但在误配置时影响最大 [^503^]。

#### 6. ACP存在命名冲突，需谨慎区分

- **IBM ACP (Agent Communication Protocol)**：2025年3月创建，REST-based，**已于2025年8月合并入A2A** [^482^]
- **Zed ACP (Agent Client Protocol)**：2026年1月由JetBrains和Zed Industries推出，用于IDE与Agent的集成层（类似LSP），已有40+注册Agent [^172^]
- **OpenAI ACP (Agent Commerce Protocol)**：与Stripe合作的标准化结账流程协议，用于ChatGPT Instant Checkout [^414^]

#### 7. AGNTCY提供Agent目录和发现基础设施

- Cisco Outshift孵化，已捐赠给Linux Foundation，75+公司支持 [^484^]
- 提供：Agent Directory（去中心化发现服务）、OASF（开放Agent模式框架）、SLIM（安全低延迟消息传输） [^484^][^491^]
- Agent Directory基于P2P网络（libp2p Kad-DHT），支持跨组织Agent发现 [^491^]
- A2A和MCP服务器可通过AGNTCY发现 [^484^]

#### 8. ANP定位于去中心化互联网规模Agent协作

- 基于W3C DID标准的去中心化身份认证 [^344^][^345^]
- 三层架构：身份加密通信层（DIDs）、元协议层（动态协商）、应用协议层（发现与描述） [^344^][^349^]
- 无需中央注册机构或第三方身份提供商 [^355^]
- 采用仍处于早期阶段，面临"鸡生蛋"问题 [^121^]

#### 9. AP2和UCP构建Agent商业/支付层

- **AP2 (Agent Payments Protocol)**：Google开发，2026年4月捐赠给FIDO Alliance，60+合作伙伴 [^416^]
  - 基于Mandate的授权框架：用户预定义消费策略（每日上限、商户白名单等） [^410^]
  - 支持传统支付和加密货币（稳定币USDC等） [^415^]
  - Google Gemini Spark（美国）为首个生产部署 [^410^]

- **UCP (Universal Commerce Protocol)**：Google+Shopify于2026年1月联合宣布，20+合作伙伴 [^461^]
  - 开放标准，支持REST、MCP、A2A等多种传输绑定 [^568^]
  - 用于Google AI Mode和Gemini的购物场景 [^455^]
  - 与ACP(OpenAI+Stripe)在商业层存在竞争关系 [^451^]

#### 10. 治理模式：Linux Foundation AAIF确保中立性

- **Agentic AI Foundation (AAIF)** 于2025年12月在Linux Foundation下成立 [^454^][^457^]
- 6位创始成员：Anthropic、OpenAI、Google、Microsoft、AWS、Block [^350^]
- 截至2026年5月：**190+成员组织**，包括Platinum(AWS、Anthropic、Google、Microsoft、OpenAI等)、Gold(IBM、Salesforce、SAP等)、Silver(Zapier、Hugging Face等) [^457^][^350^]
- 首任执行董事Mazin Gilbert（前Google AI） [^454^]
- MCP和A2A均归AAIF治理，确保规范团队协调而非竞争 [^457^]

---

### 主要参与者 & 来源

| 实体 | 角色/相关性 |
|------|------------|
| **Anthropic** | MCP创建者；AAIF联合创始人；推动MCP成为工具层标准 |
| **Google** | A2A创建者；AP2和UCP创建者；AAIF成员；构建完整Agent商业栈 |
| **OpenAI** | AAIF联合创始人；AGENTS.md创始项目；ACP(OpenAI版)用于ChatGPT商务 |
| **Linux Foundation / AAIF** | 中立治理机构；190+成员；托管MCP、A2A、AGNTCY |
| **IBM** | ACP(已合并入A2A)；BeeAI项目；AAIF Gold成员 |
| **Cisco** | AGNTCY协议发起者；Agent Directory和SLIM传输 |
| **Shopify** | UCP联合开发者；Agentic Storefronts推出者 |
| **Stripe** | ACP(OpenAI版)合作者；x402/MPP支付协议 |
| **FIDO Alliance** | AP2捐赠接收方；建立AP2工作组 |
| **Zed Industries / JetBrains** | ACP(IDE版)创建者；定义IDE-Agent集成标准 |
| **ANP社区** | W3C DID的去中心化Agent协议；早期采用阶段 |

---

### 趋势 & 信号

1. **协议栈而非单一标准**：行业已放弃"哪种协议会赢"的框架，转向"正确堆叠哪些层" [^564^][^565^]。MCP+A2A+UCP/AP2的互补架构成为共识。

2. **MCP从实验到默认标准的加速**：16个月内月下载量从200万增至9700万+，是React达到同等规模所用时间的一半 [^462^]。78%企业AI团队已部署MCP [^419^]。

3. **企业级安全成为MCP的H2 2026重点**：传输演进、Agent通信增强、企业就绪（审计、SSO、网关模式）是AAIF路线图四大优先领域 [^85^]。

4. **A2A从概念到生产就绪**：v1.0发布、150+组织支持、5种语言SDK、Google Agent Engine/Azure AI Foundry/AWS Bedrock托管支持 [^458^][^416^]。

5. **商业层协议快速成熟**：AP2(60+伙伴)、UCP(20+伙伴)、ACP在2026年上半年密集推出，构成Agent商业化的完整支付-交易栈 [^414^][^461^]。

6. **协议治理去中心化**：AAIF成为增长最快的Linux Foundation项目之一，MCP和A2A均从中立基金会获得长期维护保障 [^454^]。

7. **安全研究从理论到实证**：2025-2026年发表多篇学术论文对MCP/A2A/ANP进行安全威胁建模，识别出10+ CVE漏洞 [^348^][^351^][^503^]。

8. **个人用户场景MCP优先，A2A后续添加**：对于个人开发者和小团队，MCP是首选起点（30分钟即可运行）；A2A在需要多Agent协调时再引入 [^566^][^490^]。

---

### 争议 & 冲突观点

#### 1. MCP安全模型：灵活性的代价

- **Anthropic立场**：STDIO执行模型是"安全默认"，输入消毒是开发者的责任 [^351^]
- **安全社区立场**：这是一个"by design"的系统性漏洞，OWASP ASI04攻击类别在协议规模上的体现，影响1.5亿+SDK下载 [^351^]
- **实际影响**：多个下游Critical级CVE，生产部署需额外实现沙箱化（容器、seccomp、AppArmor/SELinux） [^351^]

#### 2. MCP vs A2A是否存在竞争

- **Google官方立场**：A2A补充MCP而非替代，MCP处理垂直Agent-Tool连接，A2A处理水平Agent-Agent协调 [^350^]
- **开发者社区共识**：两者互补（14/39 Reddit线程强烈认同）[^490^]
- **学术评估**：两者确保Agent能相互通信，但不确保它们在做什么上达成一致——语义一致性问题未解决 [^448^]

#### 3. 商业层协议竞争：UCP vs ACP

- **UCP路线**（Google+Shopify）：开放标准，去中心化商户源真理论，跨平台 [^461^]
- **ACP路线**（OpenAI+Stripe）：平台中介结账，ChatGPT生态优先 [^417^]
- **当前状态**：两者共存，商户需同时支持以覆盖不同AI渠道；Shopify Agentic Storefronts默认启用ACP [^451^]

#### 4. Agent Card身份验证强度

- **A2A规范**：Agent Card签名是可选(MAY而非MUST) [^421^]
- **安全最佳实践**：建议使用mTLS、DNSSEC、证书固定和声誉系统 [^409^]
- **实际风险**：无密码学验证时，Agent身份无法被密码学确认，除非实现者主动选择签名 [^421^]

---

### 推荐深入调研领域

1. **MCP供应链安全框架**：7000+公共MCP服务器的安全审计、信任评分和注册表验证机制。随着服务器数量突破10000+，供应链攻击面急剧扩大。建议调研MCPInspect等预集成分析工具 [^348^] 和企业级MCP网关（Cloudflare、AWS、Azure）的安全策略。

2. **A2A企业级部署模式**：跨组织Agent协作的身份联邦（OAuth 2.0 Token Exchange RFC 8693）、服务网格mTLS集成、API Gateway模式（Kong、Apigee）[^416^]。金融服务、供应链、保险行业的生产部署案例值得深度跟踪。

3. **Agent商业协议（UCP/AP2/ACP）竞争格局**：2026年是Agent商业化的元年，三大商业/支付协议的技术选型直接影响电商、SaaS和支付提供商的战略方向。需跟踪FIDO Alliance AP2工作组的进展和欧洲银行管理局的SCA指导。

4. **ANP去中心化Agent网络的采用障碍**：ANP在理论上是唯一提供密码学强身份保证的协议 [^503^]，但面临经典的网络协议"鸡生蛋"问题 [^121^]。需跟踪W3C WebAgents社区组的标准化进展和实际采用数据。

5. **多协议编排框架的演化**：OpenAI Symphony、LangGraph、CrewAI等编排框架如何在MCP+A2A之上构建更高层抽象。编排层可能成为下一个竞争热点 [^418^]。

6. **个人开发者和小团队的协议采用路径**：当前文档和资源主要面向企业用户，个人开发者的实际痛点（如MCP服务器安装复杂度、A2A发现机制的配置难度）缺乏系统性研究。

---

### 参考来源索引

| 编号 | 来源 | 类型 | 日期 |
|------|------|------|------|
| [^85^] | workos.com - Everything about MCP in 2026 | 技术博客 | 2026-03 |
| [^121^] | preprints.org - Multi-Agent Orchestration Survey | 学术论文 | 2026-04 |
| [^172^] | groundy.com - ACP Registry Zed JetBrains | 技术博客 | 2026-04 |
| [^344^] | arxiv - A Survey of AI Agent Protocols | 学术论文 | 2025 |
| [^345^] | arxiv - Agent Network Protocol Technical White Paper | 学术论文 | 2025-07 |
| [^346^] | arxiv - MCP vs A2A Empirical Benchmark | 学术论文 | 2026-03 |
| [^348^] | arxiv - Security Issues in MCP Ecosystem | 学术论文 | 2025-10 |
| [^350^] | pickaxe.co - MCP vs A2A Comparison Guide | 技术博客 | 2026-05 |
| [^351^] | zealynx.io - Anthropic MCP SDK Vulnerability Analysis | 安全研究 | 2026-05 |
| [^352^] | futureagi.com - MCP vs A2A 2026 Guide | 技术博客 | 2026-05 |
| [^355^] | data443.com - ACP vs ANP Explained | 技术博客 | 2026-05 |
| [^407^] | arxiv - A2A with Ledger-Anchored Identities | 学术论文 | 2025-07 |
| [^409^] | arxiv - Building Secure Agentic AI with A2A | 学术论文 | 2025-02 |
| [^410^] | findskill.ai - AP2 Guide | 技术博客 | 2026-05 |
| [^412^] | digitalapplied.com - MCP Ecosystem H1 2026 | 研究报告 | 2026-05 |
| [^414^] | paz.ai - AP2 vs Visa TAP vs Mastercard | 技术博客 | 2026-05 |
| [^415^] | cobo.com - AP2 Protocol Guide for Web3 | 技术博客 | 2026-05 |
| [^416^] | zylos.ai - A2A ACP ANP in Production | 技术博客 | 2026-04 |
| [^418^] | srs.pub - AI Agent Protocol Landscape Report | 技术博客 | 2026-05 |
| [^419^] | digitalapplied.com - MCP Adoption Statistics | 研究报告 | 2026-04 |
| [^421^] | snailsploit.com - MCP vs A2A Attack Surface | 安全研究 | 2026-03 |
| [^451^] | evolveamz.com - UCP vs ACP for Shopify | 技术博客 | 2026-05 |
| [^453^] | ranksquire.com - AI Agents Orchestration 2026 | 技术博客 | 2026-04 |
| [^454^] | intuitionlabs.ai - Agentic AI Foundation Guide | 技术博客 | 2026-04 |
| [^455^] | launchtip.com - Shopify UCP Guide | 技术博客 | 2026-04 |
| [^457^] | agentmarketcap.ai - MCP Production Reliability | 技术博客 | 2026-04 |
| [^458^] | agentmarketcap.ai - A2A v1.0 150 Organizations | 技术博客 | 2026-04 |
| [^459^] | agentmarketcap.ai - MCP 97M Downloads Analysis | 技术博客 | 2026-04 |
| [^461^] | joinhexagon.com - UCP Explained for Merchants | 技术博客 | 2026-03 |
| [^482^] | jitendrazaa.com - MCP vs A2A vs ACP vs ANP Guide | 技术博客 | 2026-02 |
| [^484^] | nextplatform.com - Cisco AGNTCY to Linux Foundation | 技术媒体 | 2025-07 |
| [^490^] | apigene.ai - MCP vs A2A When to Use | 技术博客 | 2026-03 |
| [^491^] | outshift.cisco.com - AGNTCY Agent Directory | 技术博客 | 2025-05 |
| [^492^] | shipsquad.ai - MCP vs A2A Protocol War | 技术博客 | 2026-02 |
| [^493^] | truefoundry.com - MCP vs A2A Compare | 技术博客 | 2025-09 |
| [^496^] | xugj520.cn - MCP vs A2A vs ACP Comparison | 技术博客 | 2025-04 |
| [^500^] | arxiv - OpenAI Symphony Reference | 学术论文 | 2026-04 |
| [^501^] | arxiv - A2A Protocol Technical Overview | 学术论文 | 2025 |
| [^503^] | arxiv - Security Threat Modeling MCP A2A ANP | 学术论文 | 2025-07 |
| [^508^] | data443.com - A2A How AI Agents Communicate | 技术博客 | 2026-05 |
| [^564^] | adamsilvaconsulting.com - Agent Protocol Stack | 技术博客 | 2026-04 |
| [^565^] | stellagent.ai - MCP vs A2A vs AP2 Complete Guide | 技术博客 | 2026-04 |
| [^566^] | augmentcode.com - A2A vs MCP for Coding | 技术博客 | 2026-04 |
| [^567^] | moltbook-ai.com - MCP vs A2A 2026 | 技术博客 | 2026-03 |
| [^568^] | joinhexagon.com - Agentic Commerce Protocol Stack | 技术博客 | 2026-03 |
| [^569^] | ceaksan.com - AI Agent Protocol Guide | 技术博客 | 2026-03 |

---

*报告生成时间: 2026年6月 | 基于20+次独立搜索，覆盖学术论文、技术博客、官方文档、安全研究报告和社区讨论*
