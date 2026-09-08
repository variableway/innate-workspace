## Facet 7: 多 Agent 协作协议与 Runtime 生态

### 关键发现

#### 1. 协议分层架构已清晰成型

2025-2026年间，多Agent协议生态从混乱竞争走向分层协作，形成了清晰的协议栈架构 [^235^] [^232^]：

| 层级 | 协议 | 功能 |
|------|------|------|
| 身份与安全 | W3C DID, OAuth 2.1 | 认证、令牌管理 |
| 工具/上下文访问 | **MCP** | Agent ↔ 工具/数据 |
| Agent间通信 | **A2A** | Agent ↔ Agent |
| 支付/商务 | **AP2** | 自主交易授权 |
| 商务全流程 | **UCP** | 完整购物生命周期 |
| 能力/技能描述 | Agent Skills, AGENTS.md | 程序性知识 |
| 用户交互 | AG-UI, A2UI | Agent ↔ 人类前端 |

**核心洞察**：MCP解决"垂直"问题（Agent到工具），A2A解决"水平"问题（Agent到Agent），两者互补而非竞争 [^56^] [^61^] [^163^]。Ehtesham等人的学术论文明确指出："MCP和A2A是互补的（垂直工具访问 vs 水平Agent通信），而非竞争关系" [^53^]。

#### 2. MCP生态数据：已确立为标准

- **公共注册表服务器数**：~9,400个（截至2026年4月中），较2025年底的~6,800增长约38% [^60^]
- **SDK月下载量**：9700万+（截至2026年2月）[^177^]
- **类别分布**：Connectors & SaaS (~38%)、开发者工具 (~27%)、数据与搜索 (~18%) [^60^]
- **治理**：2025年12月捐赠给Linux基金会Agentic AI Foundation（AAIF）[^121^]
- **主机支持**：Claude Desktop/Code（参考实现）、Cursor、Codex CLI、Windsurf、VS Code/Copilot [^60^]
- **AI辅助创建**：28.3%的MCP服务器检测到AI辅助创建，Claude占68.6% [^64^]

#### 3. A2A生态数据：快速增长

- **GitHub Stars**：22,000+（截至2026年4月）[^162^] [^164^] [^51^]
- **支持组织**：从2025年4月发布时的50+增长到2026年4月的150+ [^51^] [^166^]
- **活跃贡献者**：130+ [^161^]
- **SDK语言**：Python、JavaScript、Java、Go、.NET（5种生产语言）[^51^]
- **版本**：v1.0稳定版于2026年4月发布，引入签名Agent Cards、多租户 [^165^]
- **治理**：2025年6月捐赠给Linux基金会 [^161^]
- **云集成**：Microsoft Azure AI Foundry/Copilot Studio、AWS Bedrock AgentCore Runtime [^51^] [^165^]

#### 4. ACP协议存在两个完全不同的项目（命名冲突）

**ACP (Agent Communication Protocol) - IBM/BeeAI** [^167^] [^110^]：
- 由IBM Research开发，作为BeeAI平台的一部分
- 2025年4月推出，REST-native消息协议
- **重要：已合并入A2A**。IBM的ACP团队在2025年底加入Google的A2A协议，在Linux基金会下统一发展
- 新项目的ACP贡献存在于A2A的RESTful端点和多模态消息格式中

**ACP (Agent Client Protocol) - Zed Industries** [^168^] [^172^] [^175^]：
- 由Zed Industries创建（2025年8月）
- **完全不同的用途**：IDE到Agent的集成层（类似LSP对语言服务器的作用）
- 2026年2月JetBrains加入为联合维护者
- ACP Registry已有40+注册Agent [^172^]
- **关键洞察**：ACP不替代MCP。MCP将Agent连接到工具和数据源，ACP将客户端连接到Agent。它们是正交协议 [^168^]

#### 5. AGNTCY (Cisco主导的"Internet of Agents")

- **发起方**：Cisco Outshift，2025年3月在GitHub开源 [^225^]
- **治理**：2025年7月捐赠给Linux基金会，Cisco、Dell Technologies、Google Cloud、Oracle、Red Hat为创始成员 [^115^]
- **支持公司**：65+ [^115^]，后增长到75+ [^225^]
- **核心组件**：
  - **OASF** (Open Agent Schema Framework)：Agent能力描述标准
  - **ACP** (Agent Connect Protocol)：Agent间调用标准（注意：这是Cisco的ACP，不同于IBM的ACP）
  - **Agent Directory**：去中心化Agent发现服务
  - **SLIM**：安全低延迟交互消息协议
  - **Agent Identity**：基于密码学的Agent身份框架
- **与MCP/A2A的关系**：AGNTCY使A2A Agent和MCP服务器可通过AGNTCY目录被发现，支持MCP和A2A协议的消息传输 [^115^]
- GitHub组织：**github.com/agntcy** [^227^]

#### 6. ANP (Agent Network Protocol) - 去中心化愿景

- **定位**：成为"Agent网络的标准通信协议" [^122^]
- **架构**：三层设计——身份与加密通信层（W3C DID）、元协议层（协议协商）、应用协议层（能力发现）[^110^] [^114^]
- **技术特点**：基于W3C去中心化标识符(DID)、JSON-LD语义互操作、P2P架构 [^37^]
- **采用状态**：早期阶段，面临"鸡生蛋蛋生鸡"的网络效应挑战 [^109^]
- **局限性**：DID解析和认证涉及复杂密码学操作（150-200ms），可能超出边缘计算延迟要求 [^37^]
- 2025年2月在W3C WebAgents社区组会议上展示 [^109^]

#### 7. UCP (Universal Commerce Protocol) 与 AP2 (Agent Payments Protocol)

**UCP** [^157^] [^150^]：
- Google + Shopify联合开发，2026年1月发布
- 覆盖完整购物旅程：发现→结账→售后
- 20+全球合作伙伴背书（包括Adyen、American Express、Mastercard、Visa、Stripe等）
- 与AP2兼容，通过AP2 mandates扩展获取用户同意的加密证据
- 明确支持与MCP、A2A的互操作

**AP2** [^151^] [^145^]：
- Google于2025年9月发布
- 核心抽象为**Mandate**（ digitally signed的支付授权书）
- 60+合作伙伴组织（包括Adyen、Worldpay）
- 与Visa TAP、Mastercard Agent Pay的关系：AP2是开放治理协议，后两者是网络特定实现

**协议生态位区分** [^153^] [^155^]：
- **ACP** (Stripe+OpenAI)：交易执行层，ChatGPT Instant Checkout
- **UCP** (Google+Shopify)：交易执行层，Google AI Mode/Gemini
- **AP2** (Google)：支付授权层，为UCP和ACP提供支付基础设施
- **Verifiable Intent** (Mastercard+Google)：信任验证层，跨所有协议提供密码学证明

#### 8. 学术界对协议的认可

多篇2025-2026年顶级学术论文对四大协议进行了系统比较 [^56^] [^53^]：

| 维度 | MCP | A2A | ACP (IBM) | ANP |
|------|-----|-----|-----------|-----|
| 交互模式 | JSON-RPC客户端-服务器 | HTTP JSON-RPC/SSE P2P | REST-native多部分消息 | DID+JSON-LD P2P |
| 发现机制 | 服务器配置 | Agent Cards (well-known URL) | Agent Registry | 去中心化DID |
| 通信模式 | 同步工具调用 | 任务生命周期+流式 | 异步流式 | 协议协商 |
| 安全模型 | OAuth 2.1 | OAuth2/API Keys | 可插拔认证 | W3C DID+VC |
| 最佳场景 | 工具集成 | 企业多Agent协作 | 多模态企业消息 | 去中心化Agent市场 |

学术论文提出的分阶段采用路线图 [^56^] [^237^]：
- **第一阶段**：MCP用于工具调用
- **第二阶段**：ACP用于富交互
- **第三阶段**：A2A用于企业协作
- **第四阶段**：ANP用于开放Agent市场

#### 9. 生产部署与企业采用

**SAP** [^229^]：
- 采用A2A作为多Agent协作的首选标准
- 通过Agent Gateway实现A2A协议支持
- 通过MCP Gateway使SAP API可作为MCP工具暴露
- Joule Agent同时作为A2A客户端和MCP消费者

**IBM ContextForge** [^224^] [^234^]：
- 开源MCP网关、注册表和代理
- 支持MCP、A2A、REST/gRPC API的统一端点
- 40+插件用于额外传输、协议和集成

**Google Cloud/Shopify/Walmart等** [^150^] [^157^]：
- Walmart同时支持ChatGPT (ACP生态) 和 Gemini (UCP生态)
- Shopify商家通过平台级集成自动获得UCP和ACP访问

**A2A企业实践案例** [^116^]：
- 智能客服系统（7x24在线、多语言、知识库集成）
- 智能运维平台（自动故障处理、性能优化）
- 数据分析中心（实时处理、智能决策）
- 客服效率提升300%，运维响应时间减少80%

#### 10. 安全威胁与防护

学术论文Anbiaee等人(2026)对MCP、A2A、Agora、ANP进行了比较安全分析 [^53^] [^59^]：
- 识别出跨协议生命周期的12种协议级风险
- MCP面临工具投毒、数据泄露、C2攻击等威胁
- A2A的Agent Card签名是可选的，存在身份伪造风险
- 所有协议在会话关闭时缺乏凭证撤销机制

### 主要参与者 & 来源

#### 核心协议与治理
- **Anthropic**：MCP创建者，2025年12月捐赠给Linux基金会 [^121^]
- **Google**：A2A、AP2、UCP创建者，2025年6月将A2A捐赠给Linux基金会 [^163^]
- **Linux Foundation / AAIF (Agentic AI Foundation)**：MCP和A2A的中立治理机构 [^176^]
- **Cisco / AGNTCY**：Internet of Agents基础设施，OASF、Agent Directory、SLIM [^115^] [^225^]
- **IBM / BeeAI**：原始ACP创建者（已合并入A2A），ContextForge网关 [^167^] [^224^]
- **Zed Industries**：ACP (Agent Client Protocol) 创建者，IDE-Agent集成标准 [^168^]
- **ANP开源技术社区**：Agent Network Protocol [^122^]

#### 商业协议
- **Stripe + OpenAI**：Agentic Commerce Protocol (ACP-commerce) [^150^]
- **Shopify + Google**：Universal Commerce Protocol (UCP) [^157^]
- **Mastercard + Google**：Verifiable Intent信任层 [^153^]

#### 企业采用者
- **SAP**：A2A作为多Agent协作首选标准，MCP用于内部增强 [^229^]
- **Microsoft**：Azure AI Foundry、Copilot Studio集成A2A [^51^]
- **AWS**：Bedrock AgentCore Runtime支持A2A [^165^]
- **Salesforce、ServiceNow、Atlassian**：A2A创始合作伙伴 [^163^]

#### 开源项目与工具
- **OpenClaw**：228K GitHub stars，最大开源Agent框架，支持MCP和A2A [^58^]
- **Hrafn**：Rust编写的轻量模块化Agent Runtime，MCP作为插件协议，A2A原生支持 [^228^]
- **Agenspy**：基于DSPy的协议优先Agent框架，支持MCP和A2A [^231^]
- **LangGraph + LangSmith**：有状态Agent运行时，支持MCP [^118^]

#### 学术来源
- **Ehtesham等人(2025)**：四大协议（MCP、ACP、A2A、ANP）的综合比较调查 [^56^]
- **Anbiaee等人(2026)**：MCP、A2A、Agora、ANP的安全威胁建模比较 [^53^]
- **多所大学**：清华大学、北京大学、牛津大学、上海交通大学等在Agent协议领域发表研究 [^119^]

### 趋势 & 信号

1. **协议整合而非分裂**：IBM的ACP (Agent Communication Protocol) 合并入A2A，ACP→A2A的合并和AAIF的创建确认行业在整合 [^235^]。Gartner报告多Agent系统查询量增长1,445%（2024年Q1至2025年Q2）[^171^]

2. **Linux Foundation成为中立治理中心**：MCP（2025年12月）和A2A（2025年6月）都捐赠给Linux基金会，AGNTCY（2025年7月）也加入 [^115^] [^176^]。这消除了单一厂商控制的顾虑

3. **从协议到经济的扩展**：AP2和UCP的出现标志着Agent协议从通信层扩展到经济层，Agent间可自主完成交易 [^142^] [^157^]

4. **MCP成为事实标准**：H1 2026 MCP从开放规范转变为运营标准，竞争性的专有格式失去份额，大多数新工具集成现在先支持MCP [^60^]

5. **企业级安全和治理成为必需品**：OAuth绑定的远程服务器、作用域权限、审计日志从研究模式转变为SDK和厂商部署的标准功能 [^60^]

6. **分层架构成为共识**：MCP（工具层）+ A2A（Agent层）+ AP2/UCP（商务层）的分层架构已被学术界和产业界共同认可 [^232^] [^235^]

7. **AGNTCY作为基础设施层整合MCP和A2A**：AGNTCY使A2A Agent和MCP服务器可通过统一目录被发现，提供跨协议的互操作基础设施 [^115^]

8. **个人/开发者友好**：MCP对个人开发者最友好（USB-C类比），已有数千个社区服务器；A2A的学习曲线较陡，但"开发者报告在1-2小时内实现首次消息交换" [^163^]

### 争议 & 冲突观点

1. **MCP vs A2A是否存在竞争？**
   - 主流观点：互补而非竞争——MCP解决垂直问题（Agent到工具），A2A解决水平问题（Agent到Agent）[^61^] [^163^] [^171^]
   - 但Li和Xie(2025)的研究指出整合A2A和MCP时存在"模式转换和生命周期管理"的关键痛点 [^53^]
   - 实际问题：许多文章错误地将它们框定为竞争者 [^171^]

2. **协议碎片化风险**
   - 观点1：行业正在整合（ACP→A2A合并、AAIF创建），信号积极 [^235^]
   - 观点2：仍然存在多个重叠协议（两个ACP、UCP vs ACP-commerce、Visa TAP vs Mastercard Agent Pay vs AP2），存在混淆风险 [^168^] [^151^]
   - Tomasev等人(2026)指出："四个协议（MCP、A2A、AP2、UCP）都不覆盖智能委托的完整周期，每个只解决了部分问题，综合标准的空间仍然开放" [^142^]

3. **ANP的去中心化愿景是否现实？**
   - 支持者：ANP的P2P架构和W3C DID为开放互联网Agent市场提供了真正的去中心化基础设施 [^122^]
   - 批评者：DID解析的密码学开销（150-200ms）不适合延迟敏感场景；P2P发现可能引发信号风暴；面临经典网络协议的"鸡生蛋"问题 [^37^] [^109^]

4. **A2A的生产就绪程度**
   - 支持者：v1.0稳定版已发布，150+组织支持，主要云平台集成 [^51^]
   - 谨慎者：A2A于2025年4月发布，"大多数宣布的合作伙伴缺乏经过验证的生产部署" [^108^]。建议企业在重大承诺之前进行POC验证

5. **Agent商务协议的分裂**
   - UCP（Google+Shopify）vs ACP-commerce（Stripe+OpenAI）代表了两个巨头阵营的不同路径
   - 但两者设计为互补而非竞争：大多数零售商需要同时支持两者 [^150^] [^156^]
   - Mastercard承诺参与所有主要协议（UCP、AP2、A2A、ACP），反映行业预期 [^151^]

6. **安全批评**
   - 学术研究发现所有主要协议都存在安全漏洞：MCP缺乏会话关闭时的凭证撤销、敏感工具的同意门和强制审计跟踪；A2A的Agent Card签名是可选的，未指定委托范围 [^55^]
   - 所有五个被研究的协议在形式化安全验证中均未通过 [^55^]

### 对个人用户场景的适用性

| 协议/项目 | 个人适用性 | 说明 |
|-----------|-----------|------|
| **MCP** | ★★★★★ | 最成熟的个人工具。数千个社区服务器，Claude Desktop/Cursor/VS Code等主流工具原生支持。个人开发者可在几小时内搭建自己的MCP服务器 [^60^] |
| **A2A** | ★★★☆☆ | 主要是企业级多Agent协作。个人开发者可用，但学习曲线较陡。有用例：Claude Code A2A Server暴露编码Agent能力 [^222^] |
| **ACP (Zed)** | ★★★★☆ | IDE-Agent集成，对使用Zed/JetBrains的开发者有用。Registry有40+Agent可注册 [^172^] |
| **AGNTCY** | ★★☆☆☆ | 偏企业级基础设施。但CoffeeAgntcy参考实现可帮助个人开发者理解组件 [^225^] |
| **ANP** | ★★☆☆☆ | 去中心化愿景对Web3/去中心化爱好者有吸引力，但工具链和生态尚不成熟 [^122^] |
| **UCP/AP2** | ★☆☆☆☆ | 商务支付协议，主要面向零售商和平台，个人用户间接受益（通过AI购物体验）|
| **Hrafn** | ★★★★☆ | Rust编写的轻量Runtime，可在树莓派上运行，MCP作为插件协议，适合个人本地部署 [^228^] |
| **OpenClaw** | ★★★★★ | 228K GitHub stars，最大开源Agent框架，本地优先、隐私优先，支持MCP和A2A [^58^] |

### 推荐深入调研领域

1. **MCP Server安全模型与沙箱化**：学术研究发现MCP服务器缺乏强制执行的能力模型，声称"搜索文件"的服务器可能执行任意shell命令 [^58^]。个人用户部署MCP服务器的安全风险值得专门研究

2. **AGNTCY与MCP/A2A的集成实践**：AGNTCY定位为"MCP和A2A之上的基础设施层"，但其Agent Directory、SLIM消息协议的实际采用率和开发者体验需要更多数据 [^115^]

3. **Agent商务协议（UCP/AP2/ACP-commerce）的生产部署**：目前大多数信息来自厂商公告，缺乏独立第三方的实际性能和可靠性数据

4. **ANP的采用率和去中心化Agent网络的可行性**：ANP面临经典网络协议的"鸡生蛋"问题，需要调研其实际采用情况和开发者社区规模

5. **MCP+A2A混合架构的最佳实践**：虽然分层架构已被认可，但实际生产中的模式（如SAP的Agent Gateway+MCP Gateway模式）值得深入研究 [^229^] [^232^]

6. **个人开发者友好的Agent Runtime选择**：Hrafn（Rust、树莓派可运行）、OpenClaw（本地优先）等项目的实际使用体验对比 [^228^] [^223^]

7. **Agent协议的插件化架构实现**：MCP本身的设计就是"插件协议"（Agent通过MCP连接工具），ACP (Zed) 的Registry模式，以及Hrafn的"MCP as plugin"设计模式值得分析 [^228^] [^172^]

---

**数据来源与搜索覆盖**:
- 学术论文：arXiv多篇顶级论文（Ehtesham 2025, Anbiaee 2026等）
- 官方来源：Linux Foundation公告、Google Developers Blog、Cisco官方文档
- 技术博客：Digital Applied, Rapidclaw, MorphLLM, Casys.ai等
- GitHub仓库：官方MCP、A2A、AGNTCY仓库
- 新闻来源：PR Newswire, The Fast Mode, Elogic Research
- 搜索次数：15+次独立搜索，覆盖英文和中文来源
- 搜索时间范围：2025年4月 - 2026年5月
