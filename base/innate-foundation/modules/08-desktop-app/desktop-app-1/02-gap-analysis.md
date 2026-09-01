# 02 · 目标架构与当前实现的差距分析

> 目标基准：`docs/desktop-app/02-target-architecture.md`、`03-module-boundaries.md`、`04-runtime-and-plugin-model.md`、`05-workspace-markdown-git.md`、`06-ui-shell-toolbar-theme.md`。
> 实现基准：`base/references/desktop-ref/innate-ai-desktop`（apps × 4、packages × 18、Rust 30 个 Tauri command、11 个 scripts）。

## 一、总体量化

| 维度 | 目标（文档） | 当前（实现） | 完成度估计 |
|------|--------------|--------------|------------|
| UI Foundation 包 | ui / theme / app-shell / action-runtime | ui ✅ / theme ✅ / app-shell ⚠️ / action-runtime ❌ | ~70% |
| Desktop Runtime 包 | desktop-runtime / plugin-runtime / service-runtime / terminal / workbench / browser-runtime + browser-ui | desktop-runtime ✅ / plugin-runtime ⚠️ / terminal ⚠️ / workbench ⚠️ / service-runtime ❌ / browser ❌ | ~45% |
| Agent 系 Runtime 包 | agent-runtime / skill-runtime / memory-runtime / task-runtime + Provider Store | agent ⚠️ / skill ⚠️ / memory ✅ / task-runtime ❌ / Provider Store ❌ | ~50% |
| Document 系包 | markdown-runtime / document-runtime / editor-runtime / document-workspace | 全部 ❌（可复用资产散落在 `@innate/tutorial` 内） | ~10%（仅资产存在） |
| Rust Native 模块 | plugins/* / managed_process / service_runtime / terminal / workspace / browser / secret | plugins/* ✅ / managed_process ✅ / terminal ✅ / workspace ⚠️ / service_runtime ❌ / browser ❌ / secret ❌ | ~55% |
| Host 装配 | Shell contribution 模型、action registry、command palette | 路由 + 插槽式装配成立，contribution/action 全无 | ~50% |
| **整体底座** | — | — | **~35%** |

计数口径：文档目标包结构共 22 个 `packages/*`；实现已有其中 12 个（ui、theme、app-shell、desktop-runtime、plugin-runtime、plugin-builder、plugin-ui、terminal、workbench、agent-runtime、skill-runtime、memory-runtime），缺 **9 个**：`action-runtime`、`service-runtime`、`task-runtime`、`browser-runtime`、`browser-ui`、`markdown-runtime`、`document-runtime`、`editor-runtime`、`document-workspace`。另有 1 个文档未记录的包（`desktop-surface`）和 2 个辅助包（utils、tsconfig）。

## 二、逐模块差距

### 1. apps/desktop（Host）

**已成立**：

- `main.tsx` 装配 `WorkbenchShell`，HashRouter 路由 9 条：`/`（Home，用 `@innate/desktop-surface` 渲染桌面式首页）、`/workbench`、`/plugins`、`/tutorials`、`/skill-library`、`/skills`、`/feeds`、`/settings`、`/plugin/:pluginId`。
- i18n（中英）、主题切换（4 preset）、设置摆放（header/bottom toolbar）。
- PluginFrameRoute 具备 theme bridge 与 `onStartServices`（`dev.startCommand` → `managed_process_start`）。

**差距**：

| 目标 | 现状 | 差距 |
|------|------|------|
| App/Plugin Registry（contribution merge：built-in + product + plugin） | navItems 硬编码在 `main.tsx` L119-126 | 无 registry，无 `NavContribution` 消费方 |
| 权限提示/trust prompt | 无 | sidecar 首启无确认（文档 `04` 规则 1 未落地） |
| 文档规划的初始入口 Home/Workspace/Documents/Skills/Agents/Plugins/Settings | 现有 home/tutorials/skill-library/skills/feeds/settings | 缺 Workspace/Documents/Agents 三个一级入口（workbench 存在但不在 rail 首位） |
| StatusBar / ContextToolbar / Command Palette | 无（`ui` 包有 cmdk 原语 `command.tsx` 但零接入） | 全部缺失 |

### 2. @innate/app-shell

已实现 `WorkbenchShell`（三栏 + 拖拽 + AppRail 折叠）+ `AppRail`。缺：`ShellToolbar`（现在只是 `React.ReactNode` prop，Host 侧是 `main.tsx` 里 10 行的局部组件）、`ContextToolbar`、`ShellStatusBar`、`ShellDock`、`WindowChrome`、任何 contribution slot 类型（`NavContribution`/`StatusContribution`/`AppAction` 全仓库零命中）。注意 `@innate/desktop-surface` 已含 DesktopWindow/Taskbar/LauncherPanel，可视为 Window Mode 雏形，但与 app-shell 无契约关联（见 01 号审查 P0-3）。

### 3. Plugin 体系（plugin-runtime / plugin-ui / Rust plugins/*）

**已成立**：manifest v1 校验（TS+Rust 双侧）、三 root 扫描、静态 app 安装（拒绝隐藏 build，强制可见 PTY）、`plugin://` 协议（路径校验 + 独立 CSP）、registry/importer/frame UI、iframe theme bridge（query + postMessage + 37 CSS 变量）。`.innate/plugins/` 有两个真实样例（odx = iframe-sidecar，tweakcn-community = external-web）。

**差距（对应文档 v1.1 目标）**：

| 目标 | 现状 |
|------|------|
| `runtime: "sidecar-web"` | 枚举仅有 `iframe-static / iframe-sidecar / external-web / native`（`native` 无实现） |
| `services[]`（id/command/cwd/health/port） | ❌ 仅有 `dev.startCommand` 单条过渡字段 |
| `entry.health` | ❌（Rust 有独立 `http_probe` 命令但未与 manifest 关联） |
| `ui.contributions` | ❌（`@innate/platform` 有类型，无消费方；Rust 侧无） |
| Plugin Detail / Runtime Status / service logs UI | ❌（plugin-ui 只有 registry/importer/frame） |
| 进程树清理、端口冲突检测、health retry、trust prompt | ❌（`managed_process.rs` 500ms 轮询 + 单进程 stop，无树、无端口、无 grant 记忆） |
| plugin uninstall | ❌（只有 install） |

### 4. Service / Task runtime

- `@innate/service-runtime`：**不存在**。现状是裸 `managed_process_*` 四命令 + 前端在 PluginFrame 里直接调 `startManagedProcess`。
- `@innate/task-runtime`：**不存在**。现状是 `task_sessions.rs` 的 JSON CRUD（`appDataDir/skill-workbench/task-sessions.json`）+ `scripts/skill-runtime/run-skill.mjs` 里一套独立的活动记录。两处互不相通，也没有 `Activity`/`EventEnvelope`/`ApprovalRequest` 类型。

### 5. Workspace / Git（workbench 包 + Rust workspace.rs）

**已成立**：workspace root 探测与设置、列目录（500 条截断）、读文本（1MB 上限 + 二进制检测 + 语言推断）、`git status --porcelain`（shell out）、agent note 追加、路径逃逸防护。

**差距**：

| 目标 | 现状 |
|------|------|
| 树形 file explorer | 平铺列表 + up 导航（`FileExplorer.tsx`） |
| File preview panel（语法高亮） | `<pre>` 纯文本（`FilePreview.tsx`） |
| Change inspector / unified diff | ❌ 无 `git.diff` 命令，无 diff UI |
| Branch picker / `git.branch.*` | ❌（分支名仅作徽章显示；`GitStatusBar.tsx` 写了但未挂载） |
| `workspace:write`、agent file change review flow | ❌（Rust 侧只读；agent note 是唯一写操作） |
| Open in external editor | ❌（只有 `open_external_url` 且限 https） |
| Workspace 权限模型（read/write root 分离授权） | ❌（单一全局 root Mutex） |

### 6. Agent / Skill / Memory

| 能力 | 目标 | 现状 |
|------|------|------|
| provider registry | `AgentProviderContribution` 注册/能力匹配 | ✅ `agent-runtime/src/registry.ts`（内存 Map + capability 匹配） |
| profile 解析 | task > skill > project > user 默认链 | ✅ `profile.ts`（含逐字段 source 追踪） |
| CLI 适配 | codex/claude/kimi/opencode/aider/deepseek… | ⚠️ 9 个 known CLI；仅 5 个可 run（codex/claude/deepseek/kimi/opencode），其余 detection-only；Rust `agent_detect.rs` 另有 19 个 def（两处清单不一致） |
| run / cancel / resume / events | 统一事件流 | ⚠️ run 走 7462 端口 TS sidecar NDJSON（`agent-run-event`）；**cancel/resume 无实现**；`approval.required`/`tool.*`/`file.changed` 事件从未 emit（approval 只是透传 CLI 参数的 profile 字段） |
| Provider Store（SQLite：llm_providers/agent_profiles/execution_profiles 等表） | Host-owned 持久化 | ❌ 唯一近似物是 `run-skill.mjs` 的脚本级 JSON store，与 agent-runtime 不互通 |
| Secret / keychain | 只存 ref + keychain | ❌ 全仓库无 keychain 代码（仅 `llm-provider.ts` 有 `apiKeySecretRef?` 类型字段） |
| skill scan/parse/validate | 只读扫描 | ✅ 完整（自写 YAML 子集解析器 + ODX 兼容 od.* 字段） |
| skill 运行串联 + Task Activity | skill.run 发活动 | ❌ 未串联（skill-runtime 不执行；执行在脚本/agent 侧） |
| skill pack import/export | — | ❌ 仅文档规划 |
| memory store/search/context | local-first | ✅ 基本完整（scope×kind、JSON 持久化、打分搜索、context 渲染、全套 CLI） |

### 7. Document / Markdown 系（目标 4 包全缺）

- `@innate/markdown-runtime`：❌。可迁移资产：`@innate/tutorial` 的 `MarkdownContent.tsx`（react-markdown + remark-gfm + shiki）、`RunnableCodeBlock.tsx`（PTY 执行 + no-run meta）、`getTutorialToc()`。
- `@innate/document-runtime`：❌。无 DocumentEntry/frontmatter 模型/watcher/backlinks（Tolaria 参考源缺失，见 01 号审查 P0-2）。
- `@innate/editor-runtime`：❌。无 BlockNote/CodeMirror 任何集成（全仓库无这两个依赖）。
- `@innate/document-workspace`：❌。
- 注：`apps/desktop` 的 tutorials 页（11 篇 md）是当前唯一的 Markdown 消费场景，只读。

### 8. Browser（目标 browser-runtime + browser-ui + Rust browser.rs）

**完全缺失**。现状仅：`open_external_url`（https 白名单 + 系统浏览器）、`http_probe`（loopback 健康探测）、manifest `ui.openMode: "external-browser"`。无 BrowserPanel/AddressBar/screenshot/annotation。

### 9. Native 层其他差距

- Rust 无 HTTP 客户端 crate：sidecar 通信与 probe 全部手写 `TcpStream` HTTP/1.1（`agent_runtime.rs`、`http_probe.rs`）。功能可用，但 service health 重试/外部 URL 校验等扩展会受限。
- `find_workspace_root` 探测逻辑在 4 个模块各复制一份。
- `agent_runtime` sidecar 用 `pnpm exec tsx` 拉起（启动慢、依赖 pnpm 环境），文档未把这个实现细节记录为风险。

### 10. 其他 apps 的差距口径

- `apps/odx`：成熟完整产品（daemon 273 文件 + better-sqlite3 + 140 skills），是 sidecar plugin 活样板；但文档目标中"web + backend demo plugin 安装→托管服务→健康→日志→打开 UI"的**平台能力**（service runtime）还没有，odx 目前靠 `scripts/start-odx-plugin.mjs` 脚本拉起。
- `apps/reasonix-v2`：半成品（desktop UI 较全，核心 CacheFirstLoop 不在仓库，dashboard/tests 空）。
- `apps/skillsets`：空壳（2 个 md）。
- 这三者对底座差距分析的影响：odx 应作为 Phase 2（service runtime）的首个真实验收对象。

## 三、风险热点（结合差距）

| 风险 | 说明 | 缓解 |
|------|------|------|
| 参考源缺失阻塞 Phase 5/6/9 | Tolaria/Wandesk/mono 不在工作区 | 先做 01 号审查 P0-2 的决策 |
| manifest 双轨 drift | plugin-runtime v1 与 platform 扩展类型各自演化 | Phase 2 第一步先收敛类型 |
| agent 双清单不一致 | Rust 19 个 def vs TS 9 个 known CLI | 以 Rust detect 为准生成 TS 清单或反之，二选一 |
| sidecar 启动路径脆弱 | `pnpm exec tsx` + 手写 HTTP | service runtime 化时一并解决 |
| 文档承诺的权限模型无处落地 | capabilities/default.json 只有 `core:default + dialog:allow-open` | 在 service_runtime.rs / workspace write 引入时同步建 permission 层 |
