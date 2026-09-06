## Facet: Plugin 架构模式与标准

### 关键发现

#### 1. MCP已成为AI插件的事实标准协议

MCP（Model Context Protocol）由Anthropic于2024年底推出，到2026年已成为AI Agent领域的"USB-C"标准接口 [^59^][^73^]。截至2025年初，MCP生态已有超过1,000个可用服务器，市场预计达到18亿美元 [^86^]。

**MCP核心架构组件** [^59^][^63^]：
- **Host（宿主应用）**：用户交互的AI应用（如Claude Desktop、IDE扩展），管理连接和安全
- **Client（客户端）**：Host内部的连接管理器，每个MCP Server对应一个Client，负责协议通信
- **Server（服务器）**：暴露能力的轻量服务，通过JSON-RPC提供Tools、Resources、Prompts三大原语
- **Context Bus（上下文总线）**：Agent与Server间的专用通信通道，保持上下文分离和可追溯性
- **Schema Registry（Schema注册表）**：工具、资源、Prompt的结构化描述（JSON Schema驱动）

**三大核心原语** [^59^][^72^]：
- **Tools**：可执行函数（API调用、数据库查询），通过`tools/list`发现，`tools/call`调用
- **Resources**：结构化数据对象（文件、数据库实体），通过URI标识，支持订阅更新
- **Prompts**：预定义指令模板，支持参数化动态实例化

**传输层设计** [^76^][^79^][^82^]：

| 传输方式 | 适用场景 | 特点 |
|---------|---------|------|
| stdio | 本地工具 | 子进程管道通信，零网络开销，单租户 |
| SSE（已废弃） | 远程连接（遗留） | 双端点设计，存在时序和兼容性 issues |
| Streamable HTTP | 远程/生产部署 | 单端点，支持OAuth 2.1，可多租户扩展 |

#### 2. WASM作为插件沙箱的执行层正在崛起

WebAssembly（WASM）正成为AI Agent插件隔离的首选轻量级方案，满足五个关键要求：隔离性、快速启动、低资源占用、多语言支持、可组合性 [^64^]。

**WASM沙箱安全模型** [^69^][^71^][^74^]：
- **内存隔离**：代码在独立线性内存中执行，所有访问自动边界检查
- **默认拒绝（Default-Deny）**：模块无权访问文件系统、网络或其他资源
- **Capability-Based Security**：主机必须显式授予能力（imports）
- **资源限制**：CPU通过fuel计量（如Wasmtime的fuel系统），内存可限制（默认10MB）
- **执行超时**：每次执行有墙钟时间限制（默认30秒）

**关键项目实践** [^64^][^78^][^161^]：
- **MCP-SandboxScan**：学术论文实现，使用WASM/WASI沙箱安全执行不可信MCP工具，用Rust实现
- **codemode-lite**：Red Hat项目，9文件~2000行Python，支持Podman容器和Pyodide WASM两种后端
- **Extism**：通用WASM插件框架，已被Helm 4采用（Kubernetes包管理器），支持多种语言PDK
- **Helm 4**：2025年11月采用Extism作为插件系统，标志着WASM沙箱从实验性进入基础设施级
- **mcp-run-python**：Pydantic项目，使用Pyodide在Deno中运行Python（但已退休，因安全问题）
- **JieGou**：企业MCP治理平台，所有MCP服务器在隔离沙箱中运行

**隔离技术对比谱系** [^64^][^69^]：

| 方案 | 启动时间 | 内存开销 | 隔离级别 | 语言支持 |
|------|---------|---------|---------|---------|
| Regex/受限Python | 0ms | 0MB | 弱 | Python |
| V8 Isolates | ~1ms | ~2MB | 强 | JS only |
| **Extism/WASM** | ~5ms | ~5MB | **强** | **任意→WASM** |
| **WASI/Wasmtime** | ~10ms | ~5MB | **强** | **任意→WASM** |
| 容器（Docker） | ~200ms | ~200MB | 强 | 任意 |
| MicroVM（Firecracker） | ~125ms | ~128MB | 非常强 | 任意 |

#### 3. 传统插件系统 vs MCP 的架构对比

**Claude Code的三层扩展架构**是最有参考价值的对比案例 [^65^]：

| 扩展类型 | 定位 | 构建复杂度 | 分发方式 | 适用场景 |
|---------|------|-----------|---------|---------|
| **Plugins** | 消费预建工具 | 无需编程 | 应用市场安装 | 常见集成（GitHub、Jira） |
| **MCP Servers** | 自定义系统集成 | 需要编码 | Git仓库/内部部署 | 专有系统桥接 |
| **Skills** | 团队工作流约定 | 仅需Markdown | 项目仓库 | 标准化流程 |

**MCP vs 传统API集成** [^70^][^75^]：
- **MCP优势**：一次性集成后可用任意MCP Server；跨模型兼容；动态上下文驱动访问；标准化安全模型
- **传统API优势**：更成熟的生态；更细粒度的控制；无需额外抽象层
- **迁移策略**：MCP可作为轻量级包装器包裹现有API，保护既有投资 [^70^]

**核心架构差异** [^73^][^75^]：
- 传统插件：为每个集成构建独立插件，点对点连接
- MCP：Hub-and-Spoke架构，一个MCP Server可被任意兼容客户端使用
- MCP更适合AI自主性：暴露上下文而非仅端点，AI可动态发现和决策

#### 4. 多运行时插件架构模式

**Dify Plugin Daemon**是插件多运行时的典型实现 [^126^][^127^][^132^]：

| 运行时类型 | 通信方式 | 适用场景 |
|-----------|---------|---------|
| **Local Runtime** | STDIN/STDOUT子进程 | 本地开发部署 |
| **Debug Runtime** | TCP全双工 | 开发调试/热重载 |
| **Serverless Runtime** | HTTP（AWS Lambda） | SaaS大规模部署 |
| **Enterprise Runtime** | 受控环境 | 企业私有部署 |

Dify的安全模型采用**加密签名而非沙箱**，允许插件拥有完整能力但通过公钥验证保持安全 [^127^]。

**插件生命周期管理** [^56^][^58^]：
- **发现（Discovery）**：扫描插件目录，解析manifest
- **注册（Registration）**：将声明的工具加载到Agent可用工具集
- **调用（Invocation）**：Agent决策后将参数传给插件处理函数
- **响应处理**：处理结果回流到Agent上下文，影响后续推理

**静态 vs 动态加载** [^56^]：
- **静态加载**：启动时加载，简单可靠，但需重启才能更新
- **动态加载**：按需加载，支持热重载，内存占用更小，但需处理并发和状态
- **推荐策略**：LangGraph/LangChain的MCP集成支持运行时动态增删MCP Server

#### 5. 开发者体验分析

**MCP Server开发** [^125^][^129^][^137^]：

| SDK | 特点 | 适用场景 |
|-----|------|---------|
| **Python SDK** | 基于asyncio，FastMCP框架简洁 | 数据处理、ML集成、快速原型 |
| **TypeScript SDK** | Node.js事件驱动，I/O性能强 | 高并发、IDE扩展、网络密集型 |
| **EasyMCP** | Express风格API | TypeScript开发者的友好选择 |
| **FastMCP** | 装饰器注册，最小配置 | Python开发者的首选框架 |

**构建一个MCP Server的复杂度** [^125^]：
- 最小实现：定义Server名称+版本 → 注册能力 → 连接传输层
- 一个完整的天气服务MCP Server：约20分钟可完成（TypeScript和Python双版本）
- 关键设计决策：选择传输层（stdio本地/HTTP远程）、定义Tool Schema、处理错误和重试

**关键痛点** [^128^][^78^]：
- Python SDK的asyncio模式对新手有学习曲线
- SSE传输层存在兼容性陷阱（Claude Desktop不支持原生SSE）
- 工具Schema的token开销：60个工具可消耗~47k tokens [^168^]
- 动态发现和Schema注册的平衡需要精心设计

#### 6. VS Code AI扩展模型

VS Code提供了全面的AI扩展性框架 [^77^]：
- **Language Model API**：扩展集成AI能力的基础
- **MCP工具注册**：扩展可注册MCP工具
- **Chat Participant**：自定义聊天参与者
- **Inline Completions API**：代码补全扩展
- 扩展通过`package.json`的`contributes`字段声明能力，与MCP的manifest驱动模式一致

#### 7. 浏览器扩展模型

浏览器作为AI Agent的运行环境正在兴起 [^87^][^84^]：
- **OpenAI Codex Chrome Extension**：直接在浏览器会话中运行，访问已登录网站
- **Agent-Jake**：通过MCP和WebSocket桥接AI Agent与浏览器自动化
- **Manifest V3**：Chromium扩展标准，提供DOM访问和本地推理API
- **安全考量**：需要细粒度的权限模型（per-domain），跨表面记忆同步是挑战

#### 8. 安全与供应链风险

**OpenClaw安全审计**（学术论文）揭示了关键风险 [^53^][^54^][^58^]：
- 插件在操作者级别信任下运行，加载的技能被Agent Runtime视为可信指令源
- 攻击面覆盖：发现、注册、工具调用、响应处理各阶段
- 三大生态系统（OpenClaw、Anthropic Skills、MCP）共同弱点：缺乏形式化能力模型约束 [^73^]

**轻量级Agent的安全推荐层次** [^162^]：
- **小unsafe表面**：核心代码用Safe Rust；unsafe隔离到FFI和预编译WASM边界
- **沙箱执行**：Docker + Apple Container，per-session隔离
- **Secret处理**：使用`secrecy::Secret`，drop时清零
- **工具调用钩子**：`BeforeToolCall`钩子可检查/拦截任何工具调用
- **供应链完整性**：Sigstore无密钥签名、SHA-256/SHA-512校验

### 主要参与者 & 来源

| 实体 | 角色/相关性 |
|------|-----------|
| **Anthropic** | MCP协议创始者，定义JSON-RPC标准，Claude Code三层扩展架构 |
| **OpenAI** | Codex Chrome Extension推动浏览器原生Agent，支持MCP |
| **Alibaba Cloud** | WASM沙箱插件实践（Higress内核），生产级API网关方案 |
| **Red Hat** | codemode-lite项目，WASM+Podman双后端代码执行 |
| **Fermyon/Spin** | Wasmcp项目，WASM Component + MCP Server结合 |
| **Bytecode Alliance** | Wasmtime运行时开发，WASI标准推动 |
| **Extism** | 通用WASM插件框架，被Helm 4采用 |
| **Dify** | 多运行时插件Daemon（Local/Debug/Serverless/Enterprise） |
| **Linux Foundation/Agentic AI Foundation** | MCP治理机构，通过工作组管理规范演进 |
| **Moltis (OpenClaw)** | Rust实现的个人Agent服务器，MCP+沙箱+多Provider，"One binary"理念 |
| **Pydantic** | mcp-run-python（已退休），转向Monty项目 |
| **Zed Industries** | Rust+WASM扩展模型的探索，讨论Rhai脚本层 |
| **JieGou** | 企业MCP治理平台，250+集成，3级认证 |

### 趋势 & 信号

1. **MCP成为通用接口**：多家主流平台采用（Claude、ChatGPT、Gemini、Copilot、Cursor、VS Code、Zed），2025年底已有1000+连接器 [^85^][^86^]

2. **WASM作为插件执行层崛起**：Helm 4采用Extism（2025年11月）标志着WASM从实验性进入基础设施级 [^64^]；MCP-SandboxScan等学术研究验证了安全执行模型 [^161^]

3. **协议治理正规化**：MCP由Linux Foundation下属的Agentic AI Foundation治理，通过SEPs（规范增强提案）演进 [^85^]

4. **远程MCP标准化**：SaaS厂商集群（GitHub、Stripe、Notion等）统一采用Streamable HTTP + OAuth 2.1模式 [^75^]

5. **代码执行即服务**：从专用工具调用向代码生成+沙箱执行转变，Cloudflare Code Mode实现98%+ token节省 [^85^]

6. **"One binary"个人Agent**：Moltis等项目追求单二进制+沙箱执行+多Provider的轻量级方案 [^162^]

7. **安全治理分层**：社区→验证→认证的三级认证体系出现 [^164^]

8. **发现机制演进**：从静态Schema加载到运行时发现（如codemode-lite的`_discover()`和`_schema()`），减少上下文开销 [^160^][^168^]

### 争议 & 冲突观点

1. **WASM vs 容器沙箱**：
   - **WASM派**：启动快（~5ms）、内存小（~5MB）、语言无关、默认拒绝安全模型 [^71^]
   - **容器派**：完整Linux兼容、成熟生态、更强的隔离（共享内核风险低） [^69^]
   - **中间路线**：Firecracker MicroVM（~125ms启动）或gVisor提供折中 [^69^]

2. **MCP是否过度设计**：
   - **支持方**：MCP解决MxN集成问题，统一安全模型，降低维护负担 [^70^][^73^]
   - **质疑方**：简单场景下传统函数调用更直接；MCP增加了一层抽象和协议复杂性；SSE传输层的历史问题暴露了协议成熟度不足 [^78^]

3. **签名验证 vs 沙箱隔离**：
   - Dify选择**加密签名**验证插件完整性，允许完整能力 [^127^]
   - MCP-SandboxScan和JieGou选择**WASM沙箱**执行隔离 [^161^][^164^]
   - 两者不互斥，可分层使用

4. **mcp-run-python项目退休的警示**：Pydantic发现"没有安全的方式在pyodide中运行Python"，Python代码可执行任意JavaScript，WASM隔离有局限性 [^165^]

5. **Agent Skills生态系统的结构性弱点**：三大主流生态系统（OpenClaw、Anthropic Skills、MCP）均缺乏形式化的能力模型——声明"搜索文件"的工具可能实际执行任意shell命令 [^73^]

### 推荐深入调研领域

1. **MCP Server运行时沙箱化**：研究如何将现有MCP Server运行在WASM沙箱中（wasmcp+Spin方案），验证工具调用链的安全性——直接影响"一个软件搞定"方案的安全基线

2. **轻量级WASM运行时集成**：调研将Wasmtime嵌入Agent Runtime的技术路径，支持插件的AOT编译和运行时加载——决定单机方案的可行性

3. **能力模型与最小权限设计**：研究形式化的能力声明机制（capability declaration），解决当前MCP Server"声明与实际行为不符"的安全缺口——来自学术论文 [^73^] 的关键发现

4. **Plugin发现与版本管理**：调研MCP Server Registry的设计、版本兼容性管理、动态加载/卸载的实现——影响"开箱即用"体验

5. **多语言SDK统一**：对比Python（FastMCP）和TypeScript（EasyMCP）的开发者体验，研究统一PDK（Plugin Development Kit）的可能性——降低生态门槛

6. **"One Binary"架构设计模式**：深入研究Moltis等项目如何将LLM网关、沙箱执行、MCP支持、多Provider集成到单个可执行文件中——直接对标"一个软件搞定"需求
