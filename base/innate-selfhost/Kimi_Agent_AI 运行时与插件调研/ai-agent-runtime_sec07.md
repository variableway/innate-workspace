## 7. 多Agent协作协议生态

2025年至2026年，Agent协议生态经历了一场从碎片化竞争向分层协作的结构性转变。18个月前，开发者还在追问"哪种协议会胜出"；今天，行业共识已经转向"如何正确堆叠协议层"[^564^][^565^]。这一转变并非偶然——它正在复刻互联网协议栈从混乱到有序的演化路径，为个人AI Agent Runtime的互联互操作奠定基础。

### 7.1 协议栈分层架构

#### 7.1.1 六层协议栈形成

2025年至2026年间，Agent协议生态逐渐凝聚为一个清晰的六层架构[^564^][^565^]。工具层由MCP（Model Context Protocol，模型上下文协议）主导，解决Agent访问外部工具的问题；协作层由A2A（Agent-to-Agent Protocol，Agent间协议）定义Agent间通信与任务委托；商业层出现UCP（Universal Commerce Protocol，通用商务协议）与ACP（Agent Commerce Protocol，Agent商务协议）两个竞争路线；支付授权层由AP2（Agent Payments Protocol，Agent支付协议）构建预授权框架；UI层的A2UI/AG-UI协议负责Agent输出渲染；信任层由ANP（Agent Network Protocol，Agent网络协议）基于W3C DID（Decentralized Identifier，去中心化标识符）标准提供身份认证[^344^][^345^]。

**表7-1 Agent协议栈分层架构与互联网协议栈类比**

| 协议层级 | Agent协议 | 对应互联网协议 | 解决的问题 | 创建方 | 生态规模 |
|:---|:---|:---|:---|:---|:---|
| 工具/数据层 | MCP | TCP | Agent如何访问外部工具和数据 | Anthropic (2024.11) | 9{,}400+ 服务器，9{,}700万+月下载 [^412^][^459^] |
| Agent协作层 | A2A | HTTP | Agent之间如何通信和委托任务 | Google (2025.04) | 22K+ Stars，150+ 组织 [^458^] |
| 商业层 | UCP / ACP | 应用层商务协议 | Agent如何发现商品、完成交易 | Google+Shopify / OpenAI+Stripe | 20+ / 未公开合作伙伴 [^461^] |
| 支付授权层 | AP2 | 支付网关协议 | Agent如何获得支付授权 | Google (2025.09) | 60+ 合作伙伴 [^416^] |
| UI层 | A2UI / AG-UI | HTML/CSS | Agent如何渲染用户界面 | 社区 / CopilotKit | 早期阶段 |
| 身份信任层 | ANP / Web Bot Auth | TLS | Agent身份验证和信任 | W3C / Visa / Mastercard | 学术验证阶段 [^344^] |

上表清晰揭示了Agent协议栈与互联网协议栈之间的结构性同构关系。MCP对应TCP，提供基础性的"端到端连接"能力；A2A对应HTTP，在传输层之上定义应用级语义；AGNTCY（Agent Directory，Agent目录服务）扮演DNS角色，解决Agent的发现与寻址问题；ANP对应TLS，提供密码学强度的身份保证[^344^][^349^]。这种类比不是修辞性的——学术界的协议综述研究同样采用了这一分层框架进行分析[^344^]。对于个人用户而言，这意味着当前阶段只需关注MCP和A2A两层即可构建功能完整的Agent Runtime，其余层级可在需求成熟后逐步引入。

#### 7.1.2 复刻互联网协议栈的演化路径

Agent协议栈的演化轨迹与互联网协议栈的成熟过程呈现出惊人的相似性。互联网在1980年代同样面临多种竞争协议（OSI、TCP/IP、IPX/SPX）并存的混乱局面，最终通过分层解耦和统一治理实现了互联互通。Agent领域正在经历同样的收敛过程[^564^]。

关键转折点出现在2025年12月：Anthropic将MCP捐赠给Linux Foundation下属的**AAIF（Agentic AI Foundation，智能体AI基金会）**，与A2A一同置于中立治理框架之下[^454^][^457^]。这一举措消除了"协议战争"的最大不确定性——开发者不再需要担心所选协议被单一厂商弃用。截至2026年5月，AAIF已发展至**190+成员组织**，包括Platinum级成员AWS、Anthropic、Google、Microsoft、OpenAI，以及Gold级成员IBM、Salesforce、SAP等，成为Linux Foundation增长最快的项目之一[^457^][^350^]。首任执行董事Mazin Gilbert（前Google AI）的任命进一步强化了技术中立性的制度保障[^454^]。

![MCP与A2A增长轨迹](fig_sec07_protocol_growth.png)

**图7-1** MCP服务器数量与月下载量、A2A GitHub Stars增长趋势（2024年11月—2026年5月）

图7-1展示了MCP和A2A adoption的加速曲线。MCP月SDK下载量从2024年11月的200万增长至2026年3月的9{,}700万+，达到同等规模所用时间仅为React的一半[^462^]。同期公共MCP服务器从不足100个增至9{,}400+个[^412^]，A2A积累22K+ Stars和150+组织支持[^458^]。2025年9月AAIF成立后两条曲线斜率明显变陡，表明治理中立化对生态增长具有显著催化效应。

#### 7.1.3 Linux Foundation AAIF统一治理

AAIF采用经典开源基金会模式：技术规范由社区贡献者驱动，战略方向由会员选举的理事会决定[^454^]。MCP和A2A在AAIF框架下实现了协调而非竞争——MCP团队专注工具层原语扩展，A2A团队聚焦多Agent协作场景[^458^][^507^]。

这种治理模式解决了开源协议的核心困境：无中立治理的协议要么被单一厂商控制，要么因社区分裂而失效。190+成员规模确保了协议演进能平衡多方利益[^457^]。

### 7.2 核心协议深度对比

#### 7.2.1 MCP：Agent→Tool垂直连接的事实标准

MCP由Anthropic于2024年11月发布，不到18个月已确立为Agent与外部工具集成的行业标准[^412^]。截至2026年4月，其生态规模达到三个里程碑：9{,}400+公共服务器注册（较2025年底增长38%）[^412^]、9{,}700万+月SDK下载量（累计超1.5亿）[^459^][^462^]、78%的企业AI团队已在生产环境部署至少一个MCP Agent[^419^]。6个主流Host已原生支持MCP[^412^]，每一个主流AI实验室和IDE均已纳入MCP生态[^419^]。

MCP采用Client-Server架构，核心原语包括Tools（可执行函数）、Resources（只读数据源）和Prompts（可复用模板）[^326^][^344^]。传输层支持stdio（本地进程间通信）和Streamable HTTP（远程服务，支持OAuth 2.1认证）两种模式[^404^]。

MCP的成功很大程度上源于其"USB-C效应"——它解决了经典的 $M \times N$ 集成问题（$M$ 个Agent需要与 $N$ 个工具分别对接），将其简化为 $M + N$ 标准化连接[^331^]。对插件架构而言，这一特性意味着Tauri Runtime可以通过单一MCP Client Manager同时接入9{,}400+可用服务器，无需为每个工具编写定制适配代码。

#### 7.2.2 A2A：Agent→Agent水平协调的标准化选择

A2A由Google于2025年4月推出，定位Agent间的对等协作（Peer-to-Peer），与MCP的Agent-to-Tool垂直连接形成互补[^458^]。截至2026年4月，A2A已获得22K+ GitHub Stars，提供五种生产级SDK，v1.0稳定版支持多租户架构和gRPC传输[^458^][^416^]。150+组织从v0.1时的50个创始伙伴增长而来[^352^][^458^]。

A2A的核心抽象是Task（任务）生命周期：submitted → working → input-required → completed/failed/canceled[^508^][^501^]。Agent发现通过Agent Card实现——JSON格式元数据可通过`/.well-known/agent.json`直接获取、注册表查询或显式配置三种方式分发[^407^]。典型混合架构中，编排Agent通过A2A委托任务给专业Agent，每个专业Agent再通过MCP访问自身工具集[^350^][^453^]。

#### 7.2.3 AGNTCY：P2P去中心化Agent发现目录

AGNTCY由Cisco Outshift孵化，已捐赠给Linux Foundation，获得75+公司支持[^484^]。它提供三项核心基础设施：Agent Directory（基于libp2p Kad-DHT的去中心化发现服务）、OASF（Open Agent Schema Framework，开放Agent模式框架）和SLIM（Secure Low-latency Messaging，安全低延迟消息传输）[^484^][^491^]。AGNTCY的定位相当于互联网中的DNS，解决Agent寻址问题，A2A和MCP服务器均可通过其目录被发现[^484^]。

**表7-2 核心协议参数对比**

| 参数 | MCP | A2A | AGNTCY |
|:---|:---|:---|:---|
| 通信模式 | Client-Server (Agent ↔ Tool) | Peer-to-Peer (Agent ↔ Agent) | P2P目录服务（发现层） |
| 核心单元 | Tool call / Resource read | Task生命周期（6状态） | Agent Directory / OASF模式 |
| 发现机制 | 配置/注册表 | Agent Card自动发现 | libp2p Kad-DHT去中心化网络 |
| 传输选项 | stdio、Streamable HTTP | HTTP、SSE、webhooks、gRPC | SLIM消息传输 |
| 安全模型 | 协议无关（灵活但不一致） | 内置OAuth 2.0、mTLS、API keys | 依赖底层协议 |
| GitHub Stars / 生态规模 | 9{,}400+服务器，1.5亿+总下载 [^412^][^462^] | 22K+ Stars，150+组织 [^458^] | 75+公司，Linux Foundation托管 [^484^] |
| 治理机构 | AAIF（Linux Foundation） | AAIF（Linux Foundation） | Linux Foundation |
| 稳定版本 | 2025-11-25（当前版） | v1.0（2026年4月） | 持续迭代 |
| 个人用户启动时间 | ~30分钟 | ~2-4小时 | 需要基础设施部署 |
| 典型应用场景 | 工具调用、数据访问 | 多Agent编排、任务委托 | 跨组织Agent发现 |

表7-2从10个维度对比了三项核心协议。MCP处理垂直方向的Agent-to-Tool连接，A2A处理水平方向的Agent-to-Agent协调，两者在Google官方参考架构中被同时使用[^350^][^352^]。开发者社区在14/39的Reddit讨论线程中强烈认同这一互补关系[^490^]。

AGNTCY处于更早期阶段。尽管其去中心化发现能力在理论上更抗审查，但实际采用面临"鸡生蛋"问题：Agent Directory的价值取决于注册Agent的数量，而Agent只有在其有价值时才会注册[^121^]。对个人用户而言，AGNTCY的部署复杂度远高于直接使用MCP注册表或A2A的`.well-known`发现机制。

安全维度上，三者风险画像差异显著。2026年4月OX Security披露MCP SDK系统性漏洞（配置值直接流入STDIO传输的命令执行，影响约7{,}000个公共服务器和1.5亿+下载量），Anthropic定性为"by design"，不发布补丁[^351^]。A2A内置OAuth 2.0和mTLS，但Agent Card签名在规范中为可选（MAY而非MUST），身份验证强度取决于实现者[^421^]。学术威胁建模研究表明，MCP和AGNTCY在创建/配置阶段风险最高，A2A处于中等风险，ANP提供最强身份保证但误配置时影响最大[^503^]。

### 7.3 协议选型建议

#### 7.3.1 个人用户：MCP优先

对于个人开发者和小团队，MCP是当前阶段的不二之选。一个最小可用的MCP工作流可以在约30分钟内搭建完成：安装Host（如Claude Desktop或Cursor）、配置mcp.json、从注册表选择所需服务器即可运行[^566^][^490^]。MCP的成熟度体现在三方面：9{,}400+公共服务器覆盖了Connectors/SaaS（38%）、开发工具（27%）、数据/搜索（18%）等五大工具类别[^412^]；官方SDK提供TypeScript和Python两种主流语言支持；6个主流Host的原生集成意味着同一MCP Server可以在不同客户端间无缝迁移[^412^]。

个人用户在选择MCP服务器时应关注安全扫描结果。2026年1月的社区扫描显示35%的MCP服务器在tools/list端点上无认证[^421^]，建议优先选择经过审核的注册表（如Smithery、Glama）中评分较高的服务器，并在本地部署MCP-Scan等安全检查工具。

#### 7.3.2 多Agent场景：MCP+A2A组合

当系统涉及3个及以上Agent的协调时，建议引入A2A作为协作层。MCP与A2A的互补关系已在多个生产环境中验证：编排Agent通过A2A将复杂任务分解并委托给专业Agent，每个专业Agent通过MCP独立访问其专属工具集[^350^][^453^]。这种架构模式既保留了MCP丰富的工具生态，又获得了A2A在任务生命周期管理、Agent发现和跨组织协作方面的能力。

A2A的引入门槛高于MCP。个人用户需要额外理解Task状态机、Agent Card配置和OAuth 2.0认证流程，预计首次完整配置需要2–4小时[^490^]。建议从两个Agent的协作场景开始（如一个研究Agent通过A2A委托给一个代码生成Agent），逐步扩展至多Agent编排。

#### 7.3.3 渐进式采用路线图

综合协议成熟度、生态规模和个人用户需求，建议采用渐进式协议采用策略，而非一次性引入全部六层。第一阶段（当前）聚焦MCP，实现Agent与外部工具的标准化连接；第二阶段（3+ Agent场景）引入A2A，构建多Agent协作能力；第三阶段（跨组织场景）评估AGNTCY的去中心化发现能力；第四阶段（高安全要求场景）探索ANP的密码学身份保证机制[^566^]。

这一路线图的底层逻辑与互联网协议栈的采用历史高度一致：TCP/IP在1980年代先行普及，HTTP在1990年代随着Web爆发成为应用层标准，DNS和TLS则在需求成熟后自然嵌入。对个人AI Agent Runtime而言，MCP+A2A两层已覆盖当前绝大多数使用场景，过早引入上层协议会增加不必要的复杂度。AAIF的统一治理为这一渐进策略提供了长期兼容性的制度保障——MCP和A2A在AAIF框架下的协调发展，确保了今日的投资不会因协议分裂而贬值[^457^]。
