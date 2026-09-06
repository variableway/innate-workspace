## Facet: Tauri + Rust 桌面基座方案设计

### 关键发现

#### 1. Tauri v2 核心优势与架构定位
- Tauri v2于2024年10月达到稳定版，相比Electron在各项指标上有显著优势：包体积小96%（Hello World仅3.2MB vs 85MB）、内存少75%（单窗口42MB vs 168MB）、启动快3.7x（380ms vs 1420ms）、IPC往返延迟低3.75x（0.12ms vs 0.45ms）[^53^]
- Tauri v2采用前后端分离架构：前端在系统原生WebView中运行（iOS/macOS用WKWebView，Windows用WebView2，Linux用WebKitGTK），后端使用Rust处理系统级功能，两者通过JSON-RPC风格的IPC通信 [^336^][^338^]
- Tauri v2最大演进是完整支持iOS和Android，实现五平台（Windows、macOS、Linux、iOS、Android）单代码库开发 [^427^][^433^]
- 官方插件超过30个，覆盖文件系统、HTTP、对话框、通知、剪贴板等核心功能，插件调用开销约0.5ms/invoke [^336^]

#### 2. 插件系统架构深度解析
- Tauri v2插件由Cargo crate + 可选NPM包组成，插件项目结构包含：Rust代码（src/）、权限定义（permissions/）、Android库（android/）、iOS Swift包（ios/）、JS API绑定（guest-js/）[^430^]
- 插件Builder模式实现功能封装：`tauri::plugin::Builder::new("name").invoke_handler(...).setup(...).build()` [^335^]
- 插件支持Capability-based权限系统，每个插件管理自己的命令、事件和状态，实现命名空间隔离 [^335^][^431^]
- 移动端插件开发：Android用Kotlin/Java（@TauriPlugin注解），iOS用Swift（@objc属性），支持生命周期钩子（load、onNewIntent等）[^424^]
- 热门社区插件包括：tauri-plugin-mobile-push（iOS APNs + Android FCM推送）、tauri-plugin-polygon（异形窗口点击穿透）、tauri-plugin-mcp系列 [^428^][^427^]

#### 3. MCP集成已形成完整生态
- Tauri MCP集成出现多个互补方案：
  - `tauri-plugin-mcp-bridge`：官方 crates.io 发布的桥接插件，提供IPC监控、窗口信息查询、后端状态访问、WebSocket事件流 [^326^]
  - `tauri-mcp` (DonsWayo)：通过Unix domain socket让AI代理与Tauri应用交互，支持截图、DOM访问、元素交互、JS执行 [^330^][^331^]
  - `tauri-plugin-mcp-gui` (delorenj)：提供窗口截图、DOM获取、鼠标控制、文本输入、localStorage管理 [^341^][^342^]
  - `tauri-plugin-mcp` (davedev42)：跨平台Tauri测试自动化插件 [^333^][^334^]
  - `mcp-server-tauri` (hypothesi)：支持AI助手构建/测试/调试Tauri v2应用，功能包括UI自动化、IPC监控、移动设备管理、CLI集成 [^337^]
  - `tauri-plugin-mcp` (moinsen-dev)：综合调试/测试/自动化方案 [^339^]
- MCP Server模式（dirvine/tauri-mcp）提供进程管理、窗口操作、输入模拟、调试工具、IPC交互 [^328^]

#### 4. 本地LLM集成三种技术路径
- **路径一：Sidecar模式管理外部LLM进程** — 通过`tauri-plugin-shell`的sidecar功能嵌入和管理Ollama、ComfyUI等外部二进制 [^510^][^340^]
  - PaperNest（Tauri + React + Ollama）：完整PDF库+本地LLM聊天应用，使用SQLite存储元数据 [^458^]
  - OllamaChat（Tauri + React + SQLite）：原型级离线AI聊天应用，硬编码Ollama API端口11434 [^461^]
  - MinerU True Copy：两个Python sidecar由Rust监管，实现启动画面→sidecar启动→主UI的流程 [^340^]
- **路径二：Rust原生推理（Candle/llama-cpp-rs）** — 直接在Rust后端运行LLM推理
  - Candle：HuggingFace出品的极简Rust ML框架，支持WASM、CPU/CUDA后端，可直接运行量化LLaMA2、Phi、T5等模型 [^529^]
  - llama-cpp-4：Rust绑定的llama.cpp，支持GGML/GGUF格式，12,933+下载量 [^501^]
  - Burn：下一代Rust深度学习框架，支持WGPU GPU后端、Candle后端、LibTorch后端，可嵌入Tauri [^446^][^455^]
- **路径三：HTTP API集成多提供商** — 统一HTTP客户端连接远程/本地API
  - Nexus AI：支持Gemini、OpenAI、Groq等多提供商，集成MCP工具 [^509^]
  - Locally Uncensored：支持20+提供商（Ollama、LM Studio、vLLM、OpenAI、Anthropic等）[^502^]

#### 5. 存储方案全景
- **tauri-plugin-store**：持久化Key-Value存储，支持自动保存/手动保存/延迟加载（LazyStore），适用轻量配置存储 [^512^][^514^][^516^]
- **tauri-plugin-sql**：基于sqlx的SQLite/MySQL/PostgreSQL插件，支持数据库迁移（Migration）、前端JS直接查询 [^453^][^445^]
  - 可与Drizzle ORM集成，通过sqlite-proxy适配器在Tauri沙箱中使用TypeScript-first数据库开发 [^454^]
- **tauri-plugin-stronghold**：Tauri官方加密存储方案，基于IOTA Stronghold，提供安全密钥管理 [^332^]
- **keyring-rs**：跨平台OS密钥链访问（macOS Keychain、Windows Credential Manager、Linux Secret Service）[^332^]
- Webview localStorage：3~5MB限制，仅JavaScript可访问，适合应用偏好设置 [^526^]

#### 6. 安全沙箱与Capability模型
- Tauri v2采用"默认拒绝"安全哲学，所有系统资源访问需显式授权 [^426^]
- Capability系统：`capabilities/default.json`定义每个窗口可访问的API命令，支持按窗口、按平台细粒度控制 [^426^][^518^]
- OS级进程沙箱：macOS App Sandbox、Windows AppContainer、Linux Seccomp [^426^]
- 供应链安全：依赖数量远少于Electron，支持cargo-audit和cargo-deny自动检测漏洞，支持vendoring消除网络依赖 [^426^]
- 实际案例：Tauri核心过去5年无严重漏洞报告，相比Electron同期50+个严重漏洞 [^426^]
- 安全存储：tauri-plugin-keystore整合OS密钥链，secrecy crate保护内存中的密钥 [^426^]

#### 7. IPC性能优化
- 默认JSON序列化适合大多数场景，支持50k+命令/秒 [^335^]
- `tauri-conduit`：Tauri invoke()的drop-in替代方案，使用二进制IPC协议，小payload（25B）延迟从722ns降至80ns（9x提升），64KB payload从2.27ms降至202us（11x提升）[^449^]
- 优化策略：共享内存、异步通道、自定义协议用于极端吞吐量场景 [^335^]

#### 8. 打包分发与自动更新
- 平台安装包：Windows（.msi + .exe NSIS）、macOS（.dmg + .app）、Linux（.deb + .rpm + .AppImage）[^504^]
- `tauri-plugin-updater`：公钥签名验证（不可禁用）、支持GitHub Releases/静态JSON/自定义服务器 [^452^]
  - 签名密钥通过`tauri signer generate`生成，私钥安全存储 [^452^]
  - 支持版本比较器自定义、Windows更新前退出回调 [^452^]
- CI/CD：GitHub Actions矩阵构建三平台，`tauri-apps/tauri-action`自动创建Release [^504^]
- 代码签名：macOS Notarization + Windows Authenticode组合实现多层安全 [^447^]
- CrabNebula Cloud提供商业化的Tauri应用分发和更新服务 [^457^]

#### 9. Sidecar模式深度解析
- 通过`tauri-plugin-shell`嵌入外部二进制，配置在`bundle.externalBin`中 [^510^]
- 支持跨平台二进制命名（自动附加target triple后缀：x86_64-unknown-linux-gnu、aarch64-apple-darwin等）[^510^]
- 生命周期管理：spawn启动、rx.recv()实时获取stdout/stderr、child.kill()终止 [^510^]
- 实际架构模式：MinerU True Copy的"Splash → sidecar-boot → main UI"流程，Rust shell仅处理进程生命周期 [^340^]
- 参数验证：capability中配置shell:allow-execute的args字段，支持静态字符串/正则验证 [^510^]

#### 10. AI桌面应用架构模式
- **Sentinel**：Tauri v2 + React 19 + Rust，AI文件管理器，架构分为前端（ChatPanel/Stores/File Views）和后端（AI Agents/Safety Systems/Search），通过Tauri IPC通信 [^507^]
- **Locally Uncensored**：15MB单二进制（实际Tauri二进制<15MB），支持聊天/Agent模式/图像生成/视频生成，20+AI提供商 [^502^][^19^]
- **Nexus AI**：React 19 + TypeScript + Tailwind v4 + shadcn/ui + Zustand + Tauri v2，MCP工具集成 [^509^]
- **ClaudeKit Control Center**：Rust后端先行的分阶段迁移策略，isTauri()门控桌面特性 [^327^]
- **AionUI迁移案例**：Electron（248MB）→ Tauri v2（45-110MB），内存300-500MB → 80-150MB，Rust后端已完成73% HTTP化 [^508^]

#### 11. 深度链接与协议处理
- `tauri-plugin-deep-link`支持自定义URL scheme（如`myapp://`），桌面端在tauri.conf.json中注册 [^450^]
- 配合`tauri-plugin-single-instance`将深度链接转发到已运行实例 [^450^]
- 移动端支持Universal Links/App Links，通过host/pathPrefix配置 [^460^]
- 典型应用：AI Agent通过深度链接触发特定工作流或打开特定对话

### 主要参与者 & 来源
- **Tauri官方团队** (tauri-apps)：框架核心+30+官方插件，文档权威 [v2.tauri.app](https://v2.tauri.app)
- **HuggingFace Candle**：Rust原生ML推理框架，适用于嵌入式LLM场景 [github.com/huggingface/candle](https://github.com/huggingface/candle)
- **eugenehp/llama-cpp-rs**：llama.cpp Rust绑定，GGUF格式本地推理 [crates.io/crates/llama-cpp-4](https://crates.io/crates/llama-cpp-4)
- **tracel-ai/burn**：Rust深度学习框架，多后端支持 [github.com/tracel-ai/burn](https://github.com/tracel-ai/burn)
- **PurpleDoubleD/Locally Uncensored**：生产级Tauri AI桌面应用，20+LLM提供商支持 [github.com/PurpleDoubleD/locally-uncensored](https://github.com/PurpleDoubleD/locally-uncensored)
- **lilfourn/Sentinel**：Agentic AI文件管理器，Tauri v2 + React 19 [github.com/lilfourn/Sentinel](https://github.com/lilfourn/Sentinel)
- **navjotdhanawat/nexus-ai**：多提供商AI聊天桌面应用 [github.com/navjotdhanawat/nexus-ai](https://github.com/navjotdhanawat/nexus-ai)
- **tauri-plugin-mcp生态**：多个互补MCP插件项目（delorenj、DonsWayo、davedev42、moinsen-dev）
- **CrabNebula**：Tauri商业化分发平台，提供自动更新服务 [docs.crabnebula.dev](https://docs.crabnebula.dev)

### 趋势 & 信号
- **Tauri v2成为AI桌面应用首选框架**：GitHub数据显示Tauri仓库年增长率55%，Electron增长已停滞 [^53^]
- **MCP集成成为标配**：2025年出现6+个Tauri MCP插件项目，形成调试/测试/自动化的完整工具链 [^326^][^328^][^330^][^331^][^333^][^341^]
- **多提供商LLM支持成趋势**：单一应用同时支持Ollama（本地）+ OpenAI/Anthropic（云端）+ 其他本地后端成为主流架构 [^502^][^509^]
- **React 19 + Tailwind v4 + Zustand成为前端标配**：所有调研的Tauri AI应用均采用此技术栈 [^502^][^507^][^509^]
- **移动端扩展**：Tauri v2的iOS/Android支持推动AI Agent从桌面向移动端扩展 [^427^][^432^]
- **Rust AI推理生态成熟**：Candle + llama-cpp-rs + Burn覆盖从轻量到高性能的推理需求 [^446^][^501^][^455^]
- **Sidecar模式成为本地LLM集成最佳实践**：通过进程管理外部AI服务，保持Tauri应用轻量 [^340^][^510^]

### 争议 & 冲突观点
- **Electron vs Tauri选择之争**：
  - Tauri方：包大小96%更小、内存75%更少、IPC更快、安全模型更严格、支持移动端 [^53^][^433^]
  - Electron方：构建速度更快（初始构建22s vs 48s）、生态系统更成熟、跨平台渲染一致性有保障 [^53^]
  - 社区共识：新项目2026年应默认选Tauri，除非需要Electron的成熟生态 [^53^]
- **本地LLM集成路径选择**：
  - Sidecar派（主流）：通过HTTP API连接Ollama/ComfyUI，简单可靠，但需要用户单独安装服务 [^458^][^461^]
  - 原生推理派（前沿）：Candle/llama-cpp-rs直接嵌入，单二进制无外部依赖，但模型管理和硬件加速复杂 [^501^][^529^]
  - 混合派：自动检测本地服务+一键安装引导，Locally Uncensored采用此模式 [^502^]
- **IPC性能瓶颈**：
  - Tauri默认JSON序列化在1KB payload时82%开销来自序列化，仅6%来自传输 [^449^]
  - tauri-conduit通过二进制协议实现11x提升，但增加复杂度 [^449^]
- **安全vs开发体验**：Capability系统虽然安全但配置复杂，有开发者报告"sandbox permissions阻塞了两天"[^429^]

### 推荐深入调研领域
- **Rust原生LLM推理在Tauri中的实际集成**：Candle/llama-cpp-rs的具体集成模式、模型量化策略、内存管理、GPU加速配置
- **Tauri插件系统与AI Agent插件市场的设计**：如何设计类似VS Code Extension的AI Agent插件市场，支持热加载和安全隔离
- **多窗口AI Agent架构**：Tauri v2多窗口能力如何支持复杂AI工作流（并排聊天、工具面板、预览窗口）
- **移动端AI Agent体验**：Tauri v2的iOS/Android支持对AI Agent移动端适配的具体挑战
- **Tauri + Rust AI推理的性能基准测试**：不同推理后端（Candle vs llama-cpp-rs vs Burn）在桌面场景的实际性能对比
- **AI Agent桌面应用的安全模型扩展**：在Capability系统之上如何设计AI Agent特有的权限模型（文件访问、网络请求、代码执行）
- **本地知识库与RAG架构**：Tauri桌面应用中向量数据库（如chroma-rs）的集成模式
- **流式响应架构优化**：Tauri IPC如何高效处理LLM token流式输出（当前多数实现存在缓冲延迟问题）[^19^]
