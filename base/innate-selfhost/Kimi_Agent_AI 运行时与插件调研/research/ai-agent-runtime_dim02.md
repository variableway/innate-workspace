## Facet: 轻量级 Agent Runtime 核心引擎对比

### 关键发现

#### 1. 极致轻量级引擎的性能基准

- **ZeroClaw (Rust)**: 二进制3.4MB，冷启动<10ms，空闲内存<5MB，吞吐量450 tasks/sec [^324^][^320^]。采用trait-based模块化架构，所有组件（Provider、Channel、Tool、Memory）均可替换，零unsafe代码 [^324^][^539^]。在0.8GHz单核ARM设备上仍可保持<10ms启动，适合$10级边缘硬件 [^313^]。

- **NullClaw (Zig)**: 二进制仅678KB，冷启动<2ms，内存占用~1MB，零外部依赖 [^433^][^439^]。使用Zig的手动内存管理，支持x86_64/ARM64/RISC-V架构，是已知最小的完整Agent Runtime [^545^][^440^]。

- **PicoClaw (Go)**: 二进制~10MB，冷启动<1s，内存<10MB，支持RISC-V/ARM/MIPS/x86全架构 [^358^][^376^]。由Sipeed硬件公司开发，可直接在$10树莓派上运行，支持GPIO/I2C/SPI硬件接口 [^358^][^543^]。

- **NanoClaw (TypeScript)**: 代码量仅~700行，Docker容器隔离，冷启动~3ms，内存占用~1.2MB [^484^][^533^]。与Docker Sandboxes合作提供MicroVM级隔离（gVisor/Firecracker后端），每个Agent会话运行在独立容器中 [^493^][^490^]。

#### 2. 安全优先架构的Runtime

- **OpenParallax (Go)**: 80MB静态编译二进制，提出"思考者绝不执行"范式——LLM推理与工具执行在物理上分离 [^3^][^317^]。采用3进程架构（Process Manager + Engine + Agent），4层Shield安全管道（Policy→Heuristic→LLM Evaluator→Human Approval）阻止98.9%攻击且零误报 [^3^][^536^]。

- **IronClaw (Rust)**: WASM沙箱隔离每个工具，能力型权限模型（capability-based），秘密在主机边界注入，LLM永不接触原始凭证 [^357^][^362^]。4层防御架构（Safety→WASM Sandbox→Docker Sandbox→Secret Management），WASM启动微秒级，默认16MB内存限制 [^359^]。

- **Moltis (Rust)**: 单二进制（~44MB标准版/~3.4MB轻量版），Docker/Podman/Apple Container三层沙箱，0 unsafe代码，2,300+测试 [^343^][^350^]。核心Agent循环仅~5K LoC，59个工作区crate模块化设计，支持MCP stdio/HTTP/SSE [^346^][^349^]。

#### 3. Python生态轻量级Runtime

- **Nanobot (Python)**: 约4,000行代码，asyncio单进程架构，200KB wheel包，内存<80MB（测试中），启动<2秒 [^307^][^312^]。MCP原生支持，ReAct主循环架构透明可审计，8,000+ GitHub stars（4天内获得）[^318^][^325^]。

- **Agno (原Phidata)**: Agent实例化~3μs，内存占用~6.6KiB/Agent，比LangGraph快529倍，内存使用低24倍 [^443^][^449^]。支持23+模型提供商，原生多模态，惰性加载集成，水平扩展无状态架构 [^431^][^432^]。

#### 4. 企业级与专业Runtime

- **OpenFang (Rust)**: 137K LoC，14 crate，~32MB二进制，冷启动180ms，空闲内存40MB [^356^][^367^]。16层安全防御（WASM双计量沙箱+Merkle审计链+污点追踪），7个自主"Hands"代理，30个预建Agent [^369^][^372^]。

- **GoClaw (Go)**: ~25MB单二进制，8阶段Agent Pipeline，22+ LLM提供商，多租户PostgreSQL架构 [^483^][^496^]。3层内存系统（L0/L1/L2），知识库（Wikilink语义网格），Agent自我进化能力 [^496^]。

- **9Lives (TypeScript)**: 本地优先Runtime，Docker Compose部署，支持Raspberry Pi 5（8GB RAM推荐），核心概念为Lives/Skills/Crews/Lanes [^1^]。

#### 5. 跨框架性能基准对比

| 项目 | 语言 | 二进制 | 冷启动 | 空闲内存 | 吞吐量 | 关键特性 |
|------|------|--------|--------|----------|--------|----------|
| NullClaw | Zig | 678KB | <2ms | ~1MB | 18,000 req/s | 极致最小化 [^439^] |
| ZeroClaw | Rust | 3.4MB | <10ms | <5MB | 12,000 req/s | 性能/功能比最优 [^533^] |
| NanoClaw | TS | ~0.8MB | ~3ms | ~1.2MB | 18,000 req/s | 容器隔离 [^533^] |
| PicoClaw | Go | ~10MB | <1s | <10MB | N/A | IoT硬件支持 [^358^] |
| Moltis | Rust | ~28MB | ~15ms | ~8.5MB | 8,500 req/s | 企业级全功能 [^533^] |
| IronClaw | Rust | ~5MB | ~15ms | ~35MB | N/A | WASM安全沙箱 [^308^] |
| Nanobot | Python | N/A | <2s | ~80MB | N/A | 4K LOC可审计 [^312^] |
| OpenParallax | Go | ~80MB | N/A | N/A | N/A | 认知-执行分离 [^3^] |
| Agno | Python | N/A | ~3μs | ~6.6KiB | N/A | 微秒实例化 [^443^] |

*数据来源：各项目官方文档与基准测试，测试环境差异可能导致数值不同* [^533^][^439^][^320^]

#### 6. 语言生态对比

- **Rust阵营（ZeroClaw/IronClaw/Moltis/OpenFang）**: 编译时内存安全，零GC暂停，单二进制静态编译，适合边缘/安全敏感场景。Rust在AI-era论文标题中出现率最高（26/80），但实际库生态仅占6.05% [^344^]。

- **Go阵营（PicoClaw/OpenParallax/GoClaw）**: 静态编译无依赖，goroutine高效并发，跨平台分发便利。Go在MCP服务器生态中占6.22% [^344^]。

- **Python阵营（Nanobot/Agno）**: 生态系统最成熟（60.2% stars占比），开发效率最高，但运行时最重。适合快速原型和学术场景 [^344^][^318^]。

- **Zig阵营（NullClaw）**: 零运行时开销，手动内存管理，编译目标可控。处于早期但代表极致轻量方向 [^545^]。

### 主要参与者 & 来源

| 实体 | 角色/相关性 |
|------|-----------|
| **ZeroClaw (zeroclaw-labs)** | Rust轻量级Agent Runtime标杆，Harvard/MIT/Sundai学生开发，~26K stars [^539^][^535^] |
| **OpenParallax (openparallax)** | Go语言安全优先Agent Runtime，学术论文背书（arXiv:2604.12986），认知-执行分离架构创新者 [^3^][^317^] |
| **9Lives (flaz78)** | TypeScript本地优先Runtime，Docker部署，RPi支持 [^1^] |
| **Nanobot (HKUDS)** | Python轻量级Agent，~4K LOC，学术背景（香港大学），MCP原生支持 [^307^][^325^] |
| **Agno (原Phidata)** | Python高性能Agent框架，微秒实例化，~50x内存优化，MPL 2.0许可证 [^443^][^431^] |
| **Moltis (moltis-org)** | Rust企业级Agent Server，单二进制，2,300+测试，Hacker News首页 [^343^][^345^] |
| **IronClaw (NEAR AI)** | Rust安全优先Agent框架，WASM沙箱，Transformer合著者参与 [^357^][^362^] |
| **PicoClaw (Sipeed)** | Go IoT Agent，<10MB RAM，支持RISC-V，硬件公司背景 [^358^] |
| **NullClaw** | Zig极致轻量Agent，678KB二进制，开源社区驱动 [^433^][^545^] |
| **OpenFang (RightNow AI)** | Rust Agent操作系统，137K LOC，自主"Hands"代理 [^356^][^369^] |
| **NanoClaw (qwibitai)** | TypeScript安全Agent，~700 LOC，Docker Sandboxes合作 [^484^][^493^] |
| **GoClaw (nextlevelbuilder)** | Go多租户Agent网关，8阶段Pipeline，22+提供商 [^483^] |

### 趋势 & 信号

1. **从臃肿到极简的逆向运动**: OpenClaw（TypeScript, 430K LOC, >1GB RAM）催生了数十个轻量级替代方案，生态呈现明显的"bimodal distribution"——企业级编排器保持复杂度，极简实现剥离非必要层 [^439^][^309^]。ZeroClaw实现了98.9%的二进制大小缩减（vs OpenClaw）[^320^]。

2. **Rust成为Agent Runtime首选语言**: Rust阵营项目（ZeroClaw、Moltis、IronClaw、OpenFang、ZeptoClaw等）在安全性和性能上全面领先，2026年已成为新Agent Runtime开发的首选语言 [^439^][^531^]。

3. **静态单二进制成为部署标准**: Go和Rust项目均趋向单二进制静态编译（ZeroClaw 3.4MB、OpenParallax 80MB、Moltis 44MB、PicoClaw ~10MB），消除Node.js/Python运行时依赖 [^317^][^343^][^358^]。

4. **安全架构从"信任Agent"转向"隔离Agent"**: OpenParallax的"思考者绝不执行"、IronClaw的WASM沙箱、NanoClaw的容器隔离、Moltis的多层沙箱，都体现了"假设Agent被攻破"的零信任设计理念 [^3^][^362^][^493^]。

5. **MCP成为工具互操作标准**: 几乎所有新Runtime（Moltis、IronClaw、Nanobot、Agno等）都原生支持MCP（Model Context Protocol），stdio/HTTP/SSE三种传输方式成为标配 [^343^][^357^][^307^]。

6. **边缘部署成为差异化战场**: ZeroClaw（$10设备）、PicoClaw（RISC-V）、NullClaw（$5 ARM IoT）竞相降低硬件门槛，AWS IoT Greengrass nucleus lite也推出<5MB内存的轻量Runtime [^451^][^313^][^358^]。

7. **WASM作为Agent沙箱技术成熟**: IronClaw、Moltis、OpenFang均采用WASM沙箱，WASM runtime生态（Wasmtime、Wasmer、WAMR、WasmEdge）为嵌入式到云端的各场景提供支持 [^357^][^453^]。

### 争议 & 冲突观点

1. **性能 vs 安全 的权衡**:
   - ZeroClaw阵营认为：Agent Runtime首先必须快，安全通过allowlist和编译时保证即可 [^539^]
   - IronClaw/OpenParallax阵营认为：提示级防护在架构上不足，安全需要结构性强制执行（认知-执行分离、WASM沙箱），性能损失（WASM开销10-20%）值得 [^3^][^362^]
   - NanoClaw的中间路线：用容器隔离换安全，每次启动新容器有延迟，但隔离级别最高 [^493^]

2. **代码量可审计性 vs 功能完整性**:
   - NanoClaw (~700 LOC) 和 Nanobot (~4K LOC) 强调"小到可以理解"，一次晚餐即可审完整代码 [^484^][^312^]
   - Moltis (~270K LOC) 和 OpenFang (~137K LOC) 认为生产级Runtime需要完整功能（语音、记忆、多通道、可观测性），复杂度是必要的 [^346^][^356^]

3. **Python vs 系统语言（Rust/Go）的选择**:
   - Agno证明Python可以实现微秒级实例化（~3μs），挑战了"Python慢"的刻板印象 [^443^]
   - 但Rust/Go阵营指出，Python的GIL和GC在高并发场景仍是瓶颈，且部署依赖管理复杂 [^372^][^539^]

4. **静态编译 vs 容器化部署**:
   - ZeroClaw/PicoClaw主张单二进制静态编译，无Docker依赖，适合边缘设备 [^324^][^358^]
   - NanoClaw/9Lives依赖Docker进行安全隔离，认为容器是安全模型而非部署便利 [^1^][^493^]

5. **学术基准的可信度争议**:
   - CLEAR评估框架（2025年11月论文）发现，实验室基准与生产部署之间存在37%的平均差距，成本差异可达50倍，但公共基准很少将成本作为一级指标 [^544^]
   - Agno自称比LangGraph快529倍、内存低24倍，但备注"请在您自己的机器上运行评估"[^443^]

### 推荐深入调研领域

1. **WASM沙箱在Agent Runtime中的实际性能开销**: IronClaw和OpenFang都使用WASM沙箱，但具体延迟影响（声称10-20%）需要独立基准验证。WASM runtime选择（Wasmtime vs Wasmer vs WAMR）对不同场景的适用性。

2. **大规模Agent编排（1000+并发）的Runtime表现**: 当前基准多关注单Agent性能，Agno声称支持水平扩展，但千级并发Agent的实际表现数据稀缺 [^443^]。

3. **供应链安全与技能市场生态**: OpenClaw的ClawHub有13,729+技能但检测到800+恶意技能（"ClawHavoc"攻击）[^320^]。轻量级Runtime（如ZeroClaw）放弃技能市场换取安全，但限制了扩展性——这一权衡需要更深入分析。

4. **边缘设备上的实际部署体验**: 多数性能数据来自实验室环境，$10 RISC-V设备在真实网络条件下的Agent执行延迟、稳定性、功耗数据缺乏。

5. **Parallax范式（思考-执行分离）的通用化**: OpenParallax的4层Shield管道阻止了98.9%攻击 [^3^]，但该架构是否适用于非个人/企业级多Agent场景，以及Tier 2 LLM Evaluator的成本模型值得研究。

6. **MCP作为通用协议的标准化进程**: 各Runtime对MCP的支持程度不同（stdio vs HTTP/SSE），协议版本兼容性、性能特征、安全模型需要标准化分析。

7. **Agent Runtime的FinOps与成本模型**: 不同Runtime对LLM API调用量的影响差异显著（CrewAI比LangChain/CrewAI多3x token开销）[^544^]，需要建立统一的成本评估框架。
