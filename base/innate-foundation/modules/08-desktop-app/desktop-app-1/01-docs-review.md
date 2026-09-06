# 01 · docs/desktop-app 文档审查

> 审查对象：`base/innate-fe-base/docs/desktop-app/` 全部 12 个文件。
> 审查基准：`base/references/desktop-ref/innate-ai-desktop` 当前代码（2026-08 核查）。

## 总体结论

**文档组整体合理，可以作为主线架构入口继续使用**。理由：

1. 分层清晰：Host / UI Foundation / Desktop Runtime / Agent Runtime / Document Workspace / Native 六层职责与"不负责"列表明确，模块归属判断有据可依。
2. Plugin Package 与 Contribution 分离、Terminal 与 Service runtime 分离、Agent CLI 与 LLM Provider 区分，这三组概念澄清正是旧文档混乱的根源，新文档处理正确。
3. 路线图排序务实：先 action/service/workspace 基座、后富编辑器/browser/marketplace，与代码现状的缺口排序一致。
4. source-map 的去重规则和"旧文档不再作为入口"的边界清楚，避免了多入口漂移。

但存在 **4 个需要修改的硬伤** 和若干小问题，见下文。修改优先级：P0（阻塞后续工作）> P1（会造成误读）> P2（建议性）。

---

## P0-1：desktop-base-framework 引用了两个不存在的文件

`desktop-base-framework/README.md` 的"阅读顺序"表列出 4 份文档，其中：

- `03-extraction-blueprint.md`（可抽取清单：哪些包/文件能搬、怎么搬、依赖如何切）— **不存在**
- `04-component-framework-design.md`（目标架构：组件注册、块类型、文档模型、可切换外壳、扩展点）— **不存在**

目录里实际只有 `README.md`、`01-four-projects-comparison.md`、`02-editor-and-layout-deep-dive.md`。

且 `01-four-projects-comparison.md` 结尾（"下一步见 …和 `03-extraction-blueprint.md`"）和 `02-editor-and-layout-deep-dive.md` 结尾（"下一步：`03-extraction-blueprint.md` 给出逐包/逐文件的抽取清单"）都把 03 当作既有文档引用。`02` 的 D.5 节还引用了 "（详见 04 文档）" 的 `ShellProvider` 契约。

**影响**：这两份缺失文档恰恰是"蓝图 → 执行"之间的桥梁（抽取清单 + 组件框架设计）。`docs/desktop-app/` 主线文档（03-module-boundaries）虽然吸收了部分内容，但 Tolaria/Wandesk 的逐文件抽取清单在新主线里并没有等价物。

**修改建议**（二选一）：

- 方案 A（推荐）：补写这两份文件。01/02 里已有足够的代码定位信息（文件路径、行数、机制描述），可以据此补全 03（抽取清单）与 04（组件框架设计），并把 `ShellProvider`/`AppDefinition` 契约与主线 `06-ui-shell-toolbar-theme.md` 的 `ShellAppDefinition`/`ShellHost` 对齐（两处目前是两套相似但不同名的契约，见 P1-3）。
- 方案 B：把 README 阅读顺序表改为 2 份 + 在 01/02 结尾删除对 03/04 的引用，并在 `source-map.md` 标注"03/04 未产出，相关内容已并入主线 03/06"。

## P0-2：文档引用的参考源不在当前工作区

`desktop-base-framework/README.md` 的目录树声称 `desktop-ref/` 下有：

```
innate-ai-desktop / innate-desktop-mono / tolaria / wandesk-ui / desktop-base-framework
```

实际 `base/references/desktop-ref/` 只有 **`flock`** 和 **`innate-ai-desktop`** 两个目录。

受影响的文档内容：

| 文档 | 依赖缺失源的内容 |
|------|------------------|
| `01-product-vision.md` 参考项目角色表 | `innate-desktop-mono`、`tolaria`、`wandesk-ui` 三行 |
| `README.md` 当前主线判断 | 同上四源描述 |
| `05-workspace-markdown-git.md` | Tolaria vault/editor 的"可抽能力"表（frontmatter 解析、wikilink、watcher、git diff cache） |
| `06-ui-shell-toolbar-theme.md` | Wandesk `ShellDock`/`WindowChrome`/`LauncherPanel`/`WallpaperProfile` 抽取目标 |
| `07-implementation-roadmap.md` Phase 5/6/9 | Markdown runtime、Editor runtime（Tolaria BlockNote/CodeMirror）、Wandesk shell profile |
| `source-map.md` | 大量指向 `innate-desktop-mono/docs/*`、`tolaria`、`wandesk-ui` 的"仍有价值的旧文档"链接 |

**影响**：Phase 5/6（Markdown/Editor runtime）与 Phase 9（Wandesk shell）的"从参考源抽取"路径当前不可执行。`02-editor-and-layout-deep-dive.md` 保留了较详细的代码定位（如 `tolaria/src/components/editorSchema.tsx`、`wandesk-ui/ui/src/system/windows.ts`），短期可作"重新获取参考源"的采购清单，但不能替代真实代码。

**修改建议**：

1. 在 `README.md` 或 `source-map.md` 增加一节"参考源在工作区中的实际位置"，明确标注哪些源当前缺失、是否计划恢复。
2. 决策点：要么把 `tolaria`、`wandesk-ui`、`innate-desktop-mono` 恢复到 `desktop-ref/`，要么把依赖它们的目标改写为"依据 deep-dive 文档规格重写"。这个决策直接影响 Phase 5/6/9 的估期（重写约等于 1.5-2 倍抽取成本）。

## P0-3：遗漏了实现里已存在的两个包

实现仓库 `packages/` 下实际有 18 个包，其中两个在目标包结构（`03-module-boundaries.md` 的"目标包结构"与"当前已有模块"表）中完全没出现：

1. **`@innate/desktop-surface`**（`packages/desktop-surface/`）：已实现"桌面 OS 隐喻"组件库——`DesktopSurface`、`DesktopIconGrid`、`DesktopWindow`（可拖拽/最小化/最大化/级联/zIndex）、`DesktopTaskbar`、`LauncherPanel`，类型 `DesktopSurfaceApp` 支持 `openMode: "route" | "window" | "action"`。它已被 `apps/desktop/src/features/home/WorkspaceHomePage.tsx` 用作 Home 页。**这正是 `06-ui-shell-toolbar-theme.md` 里列为"后续"的 `ShellDock`/`WindowChrome`/`LauncherPanel` 的已有雏形**，但文档通篇未提。
2. **`admin-ui`**（`packages/admin-ui/`）：一个独立的 TanStack Start 全栈管理后台参考 App（19 个路由、场景目录），不属于 `@innate/*` 包体系，未被任何包依赖。

**影响**：

- 读者按文档执行 Phase 9 会从零"抽取 Wandesk"，而实际 `desktop-surface` 已经落地了一版（大概率就是从 Wandesk 思想演化的），会造成重复建设或方向分裂。
- `desktop-surface` 与 `06` 中规划的 `ShellAppDefinition`/`ShellHost` 契约、与 `app-shell` 的关系（平行包？合并进 app-shell？成为 Desktop Window Mode 的实现体？）没有文档裁决。

**修改建议**：

1. 在 `03-module-boundaries.md` 的"当前已有模块"表补两行：`@innate/desktop-surface`（保留方式：Desktop Window Mode 的当前实现体；缺口：与 ShellHost 契约对齐、WallpaperProfile、被 shell 层统一调度）和 `admin-ui`（保留方式：独立参考 App，不进 `@innate/*` 主线；需决策去留）。
2. 在 `06-ui-shell-toolbar-theme.md` 的 Wandesk Profile 一节注明"`@innate/desktop-surface` 已有第一版实现"，并把后续任务从"抽取"改写为"演进 + 契约统一"。
3. `07-implementation-roadmap.md` Phase 9 的任务相应改写。

## P0-4：manifest 类型双轨现状未记录

实现中同时存在两套 manifest 类型定义：

- `packages/plugin-runtime/src/index.ts`：`InnatePluginManifest`（v1，无 `services[]`、无 `contributes`）——被 Rust `plugins/types.rs` 镜像，是**实际生效**的一套。
- `packages/platform/src/plugin/manifest.ts`：扩展版 `PluginManifest`，已含 `contributes`（appRoutes/shell/sidecars/workspaceProviders/previewProviders/editorProviders/llmProviders/agentProviders/toolProviders/skillProviders/workflowProviders）和 `packaging`——**只有类型，无任何消费方**。

`04-runtime-and-plugin-model.md` 把 `services[]`、`ui.contributions` 描述为"下一步协议工作"，但没有说明 platform 包里已经躺着一套更完整的贡献类型，也没裁决两套类型以哪套为准、如何收敛。

**修改建议**：在 `04` 的"Plugin Manifest v1 当前形态"一节增加一段：记录 `@innate/platform` 扩展 manifest 的存在，并给出收敛决策（建议：platform 作为贡献类型的唯一定义处，plugin-runtime 的 v1 类型逐步引用/对齐 platform，Rust 端同步）。

---

## P1：会造成误读的问题

### P1-1：`04` 的"当前已经成立的能力"基本准确，个别措辞偏乐观

逐条核对结果：

| 文档表述 | 核查结果 |
|---|---|
| `iframe-static` 经 `plugin://`（win 为 `http://plugin.localhost`）打开 | ✅ `plugins/plugin_protocol.rs` 实现，含路径穿越校验与独立 CSP |
| `iframe-sidecar` 打开 loopback URL，必要时 `managed_process_start` 启动 `dev.startCommand` | ✅ `main.tsx` L228-236 `onStartServices` |
| plugin roots 三层（env / `.innate/plugins` / appData） | ✅ `plugins/plugin_paths.rs` |
| Tauri commands：scan/roots/install | ✅ |
| low-level managed process | ✅ `managed_process.rs`（start/status/list/stop + 逐行输出事件） |
| workspace commands、PTY、agent/skill/memory runtime 基础 | ✅，但建议注明：workspace 仅 read + git status（无 write/diff/branch），agent runtime 无 cancel/approval 事件实现，这些在 `03-module-boundaries.md` 的缺口列里已有，但 `04` 的语气容易让人以为"基础=接近可用" |

### P1-2：`06` 的 ThemeState 类型名与实现不符

文档写 `type ThemeState = {...}`；实现里没有这个类型名，实际是 `ThemeStorage`（内部）与导出的 `InnateThemeContextValue { themeName, colorMode, resolvedMode, setThemeName, setColorMode }`（`packages/theme/src/index.tsx`）。4 个 preset（base/qaworkspace/odx/wandesk）与 iframe theme bridge（query 参数 + postMessage + 37 个 CSS 变量）的描述准确，bridge 实现在 `packages/plugin-ui/src/components/PluginFramePage/PluginFramePage.tsx` 而非 theme 包——建议文档注明落点。

### P1-3：两套 Shell 契约命名不一致

- `06-ui-shell-toolbar-theme.md`：`ShellAppDefinition` / `ShellHost { openApp, closeApp, focusApp }`。
- `desktop-base-framework/02` D.5 节：`ShellHost { openApp(app, props), closeApp(id), activeApp$ }`（返回 `WindowHandle | void`，含 Observable）。

两套语义相同但签名不同。若 P0-1 采用方案 A 补写 04 文档，必须先统一为一份契约。

### P1-4：`05` 对 workbench 现状的缺口描述准确，但可补充现状细节

`03-module-boundaries.md` 说 `@innate/workbench` 缺"diff、branch、editor open、right panel preview"——核查属实（`FileExplorer.tsx` 是平铺列表非树、`FilePreview.tsx` 是无高亮 `<pre>`、`GitStatusBar.tsx` 写好了但未被 `WorkbenchPage` 挂载、无 diff/branch picker）。建议在 `05` 的"当前基础"里补充一条：Git 集成目前只有 `workspace_git_status` 一个命令 + 文件状态标记，`git.diff/branch.*` 全部未实现，避免读者高估 Phase 3 的起点。

---

## P2：建议性改进

1. **`07-implementation-roadmap.md` 缺工作量与依赖标注**：11 个 Phase 没有相对规模（S/M/L）和依赖关系图，"近期执行队列"10 项与 Phase 的对应关系需要读者自行映射。建议在 Phase 标题后加规模标注，并给队列每项标注所属 Phase。
2. **`04` 的 Agent Runtime Model 一节可补实现现状**：`AgentProviderContribution.run/cancel/resume` 契约在 `packages/platform/src/ai/agent-provider.ts` 已定义（9 种 `AgentEvent` 含 `approval.required`），但所有现有 provider 均未实现 `cancel`、从未 emit `approval.required`/`tool.*`/`file.changed`。文档只写目标不写现状，容易误判完成度。
3. **`02-target-architecture.md` 的 Native 边界表**与实际 Rust 模块对应关系良好（`managed_process.rs`/`terminal.rs`/`workspace.rs`/`plugins/*` 均存在；`service_runtime.rs`/`browser.rs`/`settings/secret.rs` 标 future 正确）。建议补一行 `agent_runtime.rs`/`agent_detect.rs`/`skills.rs`/`task_sessions.rs`/`http_probe.rs`/`external_open.rs` 这些**已存在但架构图未画**的模块，否则读者会以为 agent run 走纯前端。
4. **source-map 的"仍有价值的旧文档"链接应标注可达性**：指向 `innate-desktop-mono/docs/*` 等工作区外/已移除路径的条目，建议加"（源已移除，内容已并入本文档组）"标注，与 P0-2 呼应。
5. **`apps/odx` 的角色值得单独一段**：它是仓库里最重的资产（daemon 273 文件 + better-sqlite3 + 140 个 skills），是 sidecar plugin 形态的活样板，也是未来 Provider Store SQLite 化的参考。目前文档组只在 plugin 流程图里间接提到，建议在 `04` 的 Sidecar 一节加"参考实现：`.innate/plugins/odx`"。

---

## 文档质量逐份评分

| 文档 | 结构 | 与代码一致性 | 主要问题 |
|------|------|--------------|----------|
| `README.md` | 好 | 好 | 参考源描述与工作区实际不符（P0-2） |
| `01-product-vision.md` | 好 | 好 | 参考项目角色表含缺失源（P0-2） |
| `02-target-architecture.md` | 好 | 好 | Native 模块清单少列 6 个已存在模块（P2-3） |
| `03-module-boundaries.md` | 好 | 中 | 遗漏 desktop-surface/admin-ui（P0-3）；其余"当前已有模块"表与代码核对基本准确 |
| `04-runtime-and-plugin-model.md` | 好 | 中 | manifest 双轨未记录（P0-4）；agent 契约现状缺失（P2-2） |
| `05-workspace-markdown-git.md` | 好 | 中 | workbench/git 现状可更精确（P1-4）；Tolaria 依赖源缺失（P0-2） |
| `06-ui-shell-toolbar-theme.md` | 好 | 中 | ThemeState 命名（P1-2）；desktop-surface 未提（P0-3）；契约与 deep-dive 不一致（P1-3） |
| `07-implementation-roadmap.md` | 好 | 好 | 缺规模/依赖标注（P2-1）；Phase 9 需因 desktop-surface 改写（P0-3） |
| `source-map.md` | 好 | 中 | 大量链接指向已不存在路径（P0-2） |
| `desktop-base-framework/README.md` | 中 | 中 | 引用 2 个不存在的文件（P0-1） |
| `desktop-base-framework/01-*.md` | 好 | — | 结尾引用不存在的 03（P0-1） |
| `desktop-base-framework/02-*.md` | 好 | — | 同上；契约命名待统一（P1-3） |

## 修改后的验收方式

1. `docs/desktop-app/` 内所有内部链接可达（无悬空引用）。
2. "当前已有模块"表与 `innate-ai-desktop/packages/` 目录一一对应（18 个包全部有归属说明）。
3. 每个被标记"已实现/部分实现"的表述都能指向具体代码路径复核。
4. 参考源的可用性状态在 README 一处集中声明，各文档不再各自假设。
