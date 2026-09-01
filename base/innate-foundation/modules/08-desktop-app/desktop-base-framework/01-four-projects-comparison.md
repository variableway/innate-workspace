# 01 · 四项目横向对比

> 目标：为"抽取一套可承载各种组件的桌面框架底层"做选型。先看清四者各自是什么、强在哪、能不能拆。

## 1. 一句话定位

| 项目 | 定位 | 关键特征 |
|---|---|---|
| **A · innate-ai-desktop** | Tauri2 桌面外壳 + 插件(iframe)运行时 | **最像"工作台框架外壳"**：WorkbenchShell + 插件 manifest 体系，markdown 仅做**只读渲染** |
| **B · innate-desktop-mono** | A 的演进版 monorepo，同一套 shell | 与 A **几乎同构**（A/B 是同一血脉），叠加了 QA Workspace 业务面 |
| **C · tolaria** | Obsidian 式 files-first 笔记应用 | **唯一真正的可编辑 Markdown 编辑器**（BlockNote + CodeMirror 双模），自定义块丰富 |
| **D · wandesk-ui** | Tauri2 桌面 OS 式窗口管理器 | **另一种外壳范式**：浮动窗口 + 桌面图标 + 任务栏 + 启动器，声明式 App 注册；markdown 用 `marked` 只读、notebook 是纯 `<textarea>` |

> ⚠️ 重要发现：**A 和 B 是同一个项目的两个版本**（都是 `@innate/*` 命名空间，同样的 `WorkbenchShell`、`@innate/ui`、`@innate/app-shell`）。下文提到"项目 A/B"即指这一共同基础。
>
> 🆕 **D 带来第三种（也是更"桌面 OS 感"的）外壳范式**：它和 A/B 的"工作台面板"截然不同——D 把每个应用渲染成一个**自由拖拽/缩放/最大化/最小化的浮窗**，配桌面图标网格、底部任务栏、Launcher 面板、壁纸切换。这套"窗口管理器"非常独立、零业务耦合，**可作为与 A/B WorkbenchShell 并列、可切换的第二种外壳**。

## 2. 技术栈对比

| 维度 | A · innate-ai-desktop | B · innate-desktop-mono | C · tolaria | D · wandesk-ui |
|---|---|---|---|---|
| 桌面壳 | **Tauri 2.0** | **Tauri 2.0** | **Tauri v2 (2.10)** | **Tauri v2** |
| 前端 | React 19 + Vite + TS 6 | React 19 + Vite + TS 6 | React 19.2 + Vite 7 + TS 5.9 | React 19.2 + Vite 7 + TS 5.9 |
| 路由 | react-router-dom 7 (HashRouter) | （main.tsx 内手写 nav 状态机，无路由库） | 无路由库，App.tsx 中央编排 | **react-router-dom 7 (BrowserRouter)** |
| 样式 | **Tailwind CSS 4** | **Tailwind CSS 4** | **Tailwind CSS v4 + CSS 变量** | **Tailwind CSS 4**（含壁纸主题） |
| UI 基元库 | shadcn 风格，基于 **`@base-ui/react`** | shadcn 风格，基于 **`@base-ui/react`** | shadcn 风格（new-york），基于 **`radix-ui`** | **无第三方基元库**（纯手写 React + Tailwind） |
| 图标 | lucide-react | lucide-react | **Phosphor Icons** | **emoji 字符** + lucide-react |
| 状态管理 | 无（纯 useState + hooks） | 无（纯 useState + hooks） | 无（242 个自定义 hooks + Context） | **`useSyncExternalStore` 自建 store**（`stores/appearance.ts`、`stores/toast.ts`、`system/windows.ts`） |
| 表单 | react-hook-form + zod 4 | react-hook-form + zod 4 | — | — |
| 编辑器 | ❌ **无 WYSIWYG** | ❌ **无 WYSIWYG** | ✅ **BlockNote 0.46** + **CodeMirror 6** | ❌ Notebook = 纯 `<textarea>`；chat 用 `marked` 只读渲染 |
| Markdown 渲染 | react-markdown + remark-gfm + shiki | 同 A | rich: BlockNote；只读: react-markdown + rehype-highlight + DOMPurify | **`marked` 17**（字符串→HTML） |
| 终端 | xterm.js + portable-pty | xterm.js + portable-pty | ❌ 无 | ❌ 无 |
| 国际化 | 无 | 无 | Lara CLI + 18 语种 JSON | **自带 zh/en** + `scripts/start.ts` token 烘焙 |
| 数据层 | 文件/SQLite (B 有 LLM Provider Store) | 同 A | Rust vault + git 增量缓存 | **Mock 层**（`mock/api.ts` 拦截 fetch、`mock/ws.ts` 模拟流式）；正式版走 `http://127.0.0.1:9602` + `database/aios.db` |
| 测试 | Vitest | Vitest | Vitest + Playwright + cargo test | 无 |

**关键差异**：
- A/B 与 C 的 **UI 基元底层不同**（Base UI vs Radix）。D **完全不用基元库**，组件是裸 React+Tailwind 手写——这意味着 D 的外壳组件**迁移到任何基元库都很容易**（无 Radix/Base-UI 反向耦合）。
- A/B 是 **"工作台面板 + 插件"** 架构；C 是 **"单产品深度打磨"** 架构；**D 是"桌面 OS 多窗口"架构**。
- D 的状态管理用了 `useSyncExternalStore` 自建轻量 store（`windowManager`/`appearance`/`toast`），比 A/B/C 的散落 hooks 更规范，**值得作为新框架的状态层范式**。

## 3. Markdown 编辑器对比（你最关心的"内容"维度）

| 维度 | A · innate-ai-desktop | B · innate-desktop-mono | C · tolaria | D · wandesk-ui |
|---|---|---|---|---|
| 编辑能力 | ❌ 只读渲染 | ❌ 只读渲染 | ✅ **可编辑**（双模可切换） | ❌ Notebook 是纯 `<textarea>` |
| 渲染方案 | `react-markdown` + `remark-gfm` + **shiki** 高亮 | 同 A（`react-markdown` + shiki） | 富模式用 BlockNote；只读用 `react-markdown` + `rehype-highlight` + DOMPurify | **`marked` 17**（字符串→HTML，无 GFM 扩展管道） |
| 富文本引擎 | 无 | 无 | **BlockNote 0.46**（ProseMirror/TipTap 底层） | 无 |
| 源码模式 | 无 | 无 | **CodeMirror 6**（markdown 语法 + frontmatter 高亮 + 自动 BiDi） | 仅 `<textarea>`（无语法高亮、无快捷键） |
| 自定义块 | ❌ 无通用块注册 | ❌ 无 | ✅ **Mermaid / tldraw 白板 / KaTeX 数学 / Audio / Video / WikiLink / 代码块(shiki)** | ❌ 无 |
| 双向链接 | 无 | 无 | ✅ `[[wikilink]]` 内联内容 spec，含断链着色、图标、别名 | 无 |
| Diff 视图 | 无 | 无 | ✅ rich ↔ raw diff | 无 |
| 可运行代码块 | ✅ RunnableCodeBlock（走 PTY） | 同 A | ❌ | ❌ |
| 文档模型 | 纯字符串 md | 纯字符串 md | BlockNote block 树 ↔ md 双向序列化 | 纯字符串（notebook 存数据库） |

**结论**：
- **"喜欢哪个 Markdown 内容"** → **C (Tolaria) 的 BlockNote 方案**。它是四者里唯一一个真正可编辑、可扩展、自带富/源码/diff 三视图、且已经把"自定义组件块"这条路径走通的实现。
- A/B 的 markdown 只是"展示教程/聊天回复"用的，**不是编辑器**。可运行代码块（PTY 执行）是 A 的独门优势，可作为插件块移植。
- **D 的 Notebook 不具备参考价值**（纯 textarea），但它的 **`marked` 只读渲染** 可作为轻量预览件备选（比 react-markdown 体积小，但安全性/扩展性弱，需自行加 DOMPurify）。

## 4. 整体布局对比（你最关心的"布局"维度）

### A/B · WorkbenchShell（`@innate/app-shell`）

```
┌────┬───────────────────────────────────────────────┐
│icon│ header (brand + 折叠按钮 + toolbar)            │
│rail├──────────┬─────────────────────┬──────────────┤
│    │ left     │      center main    │   right      │
│ 56 │ panel    │   (min 520px)       │   panel      │
│ ↔  │ 220-420  │                     │   340-820    │
│232 │          │  ←拖柄→        ←拖柄→│              │
│px  │          │                     │              │
├────┴──────────┴─────────────────────┴──────────────┤
│            bottom panel (可选, h-56)                │
└────────────────────────────────────────────────────┘
```

- **文件**：`packages/app-shell/src/workbench-shell.tsx`（~210 行，A 与 B 完全一致）
- 特点：**CSS Grid + ResizeObserver**，空间紧张时按比例收缩侧栏；左侧 icon rail 可折叠（56↔232px）；拖柄是绝对定位的 `<button>`，pointer 事件驱动。
- **这是"最通用的应用框架外壳"**——左导航 + 中内容 + 右辅助 + 底工具栏，几乎所有桌面 IDE/工作台都是这个骨架。

### C · 四栏笔记布局

```
┌──────────┬─────────────┬────────────────────┬────────────┐
│ Sidebar  │  Note List  │     Editor         │  Right     │
│ 文件树    │  / Pulse    │  (BlockNote/CM)    │  Inspector │
│ 收藏/类型 │  搜索/筛选   │  + BreadcrumbBar   │  / TOC     │
│ 220-400  │  220-500    │  flex-1            │  200-500   │
└──────────┴─────────────┴────────────────────┴────────────┘
        + 顶层：CommandPalette(Cmd+K) / QuickOpen / SearchPanel / StatusBar / AI Workspace
```

- **文件**：`src/App.tsx`（~82KB，中央编排）+ `src/components/ResizeHandle.tsx`（拖拽）+ `useLayoutPanels`（localStorage 持久化）
- 特点：**四栏专门为"笔记浏览 → 编辑 → 检查"工作流定制**；单笔记打开（无 tab，ADR-0003）；导航历史替代 tab；多窗口可弹出独立笔记。

### D · 桌面 OS 式窗口布局（🆕 第三种范式）

```
┌─────────────────────────────────────────────────────────────┐
│  桌面（壁纸可换）                                              │
│   ┌────┐ ┌────┐ ┌────┐  ← 桌面图标网格（apps 声明式注册）       │
│   │ 💬 │ │ 📓 │ │ ⚡ │     双击 → openWindow(app)               │
│   └────┘ └────┘ └────┘                                       │
│        ┌───────────────┐  ┌───────────┐                      │
│        │ 浮窗(AppWindow)│  │ 浮窗        │  ← 自由拖拽/8向缩放/ │
│        │ title bar     │  │            │     最大化/最小化/    │
│        │ <app 内容>    │  │            │     z-index 层级管理  │
│        └───────────────┘  └───────────┘                      │
├─────────────────────────────────────────────────────────────┤
│  WindowBar 任务栏（启动器按钮 + 运行中窗口 + 托盘）  h=44      │
└─────────────────────────────────────────────────────────────┘
   + LauncherPanel（Cmd/搜索式应用启动器）
   + ContextMenu（桌面右键菜单：换壁纸等）
   + WallpaperPicker / GlobalToast
```

- **文件**：
  - `wandesk-ui/ui/src/system/windows.ts`（**核心：纯 `useSyncExternalStore` 的窗口管理器**，~225 行，零业务耦合）
  - `wandesk-ui/ui/src/components/AppWindow.tsx`（浮窗外壳：标题栏 + 8 向 resize + pointer 拖拽）
  - `wandesk-ui/ui/src/views/DesktopView.tsx`（桌面图标网格 + 窗口渲染）
  - `wandesk-ui/ui/src/components/WindowBar.tsx`（底部任务栏）
  - `wandesk-ui/ui/src/components/LauncherPanel.tsx`（启动器面板）
  - `wandesk-ui/ui/src/apps/index.ts`（**声明式 App 注册表**）
- 特点：**每个 app = 一个浮窗**，自由拖拽/缩放/最大化/最小化/层叠；`windowManager` 用外部 store + `emit()` 通知，组件用 `useWindows()` 订阅；**AppDefinition 极简**（id/name/icon/component/defaultDesktopWindowSize/minDesktopWindowSize）。这套和 A/B 的"占满全屏的三栏"是两种完全不同的产品形态。

**结论（布局选型）**：
- **"喜欢哪个布局"** → 现在有 **两种可切换的通用外壳**：
  - **工作台面板式**（A/B `WorkbenchShell`）→ 适合 IDE/工作台/管理后台型应用。
  - **桌面窗口式**（D `windowManager`）→ 适合桌面 OS/多任务并行型应用（更"好玩"、更像 macOS 桌面）。
  - C 的四栏是"笔记专用"，抽取成本高，建议只取其编辑器，不取其外壳。
- **推荐**：新框架把两者抽象成同一套 `ShellProvider` 契约（见 04 文档），**用户可切换**。这样"喜欢哪个布局"不再是非此即彼的选择。

## 5. 组件体系对比

| 维度 | A/B · `@innate/ui` | C · `src/components/ui/` | D · `ui/src/components/` |
|---|---|---|---|
| 组件数 | **~54 个**（accordion…tooltip 全套） | ~17 个（基础子集） | ~7 个（但都是"桌面外壳专用件"） |
| 底层 | `@base-ui/react` | `radix-ui` | **无**（纯 React + Tailwind 手写） |
| 变体 | class-variance-authority + tailwind-merge | 同 | 直接 Tailwind class |
| `cn()` | `@innate/utils` 提供 | `src/lib/utils.ts` | 无（直接拼字符串） |
| `components.json` | ✅ 有（shadcn 配置） | ✅ 有 | ❌ 无 |
| 补充库 | cmdk, vaul, sonner, embla, recharts, react-day-picker, react-resizable-panels, react-hook-form | react-day-picker, @dnd-kit, react-virtuoso | lucide-react, marked |
| 主题 | `@innate/theme`（多主题 scope：base/odx/qaworkspace） | app-owned light/dark/system + `theme.json`（BlockNote 排版变量） | **壁纸主题切换**（`stores/appearance.ts`，明/暗 + 多壁纸） |
| D 独有件 | — | — | **AppWindow / WindowBar(任务栏) / LauncherPanel(启动器) / ContextMenu / WallpaperPicker / GlobalToast / ReloadModal** |

**结论**：
- **基础组件层**（按钮/输入/对话框/表格等通用件）→ 抽取 **A/B 的 `@innate/ui`**（覆盖最全、独立成包、已被两个项目验证）。C 的组件是 shadcn 标准子集，可按需补进同一套。
- **桌面外壳专用件**（浮窗/任务栏/启动器）→ 抽取 **D 的 `ui/src/components/`**（无基元库耦合，迁移到 `@innate/ui` 之上零阻力）。这两者**互补不冲突**：`@innate/ui` 管"通用控件"，D 的组件管"窗口外壳"。

## 6. 可扩展性 / 插件 / 组件块体系对比（"框架性"核心）

| 维度 | A · innate-ai-desktop | B · innate-desktop-mono | C · tolaria | D · wandesk-ui |
|---|---|---|---|---|
| **应用级注册/插件** | ✅ **Plugin Runtime**：`innate.app.json` manifest，4 种运行时（iframe-static / iframe-sidecar / external-web / native），扫描/校验/安装流程完整 | ✅ 同 A（共享 `@innate/platform` 契约） | ❌ 无第三方插件运行时 | ✅ **声明式 AppDefinition 注册表**（`apps/index.ts`：id/name/icon/component/默认尺寸/单例），无 manifest 文件、无沙箱 |
| **文档内组件块** | ❌ 无通用块注册 | ❌ 无 | ✅ **BlockNote schema 注册**：`createReactBlockSpec` / `createReactInlineContentSpec` / `createStyleSpec` / `createCodeBlockSpec`，统一在 `editorSchema.tsx` | ❌ 无 |
| **扩展点** | manifest 的 `contributes.shell`(sidebar/homeCard) + `contributes.appRoutes` | 同 A | schema specs + CodeMirror extensions + vault 配置约定 | `AppDefinition` 数组 + `windowManager.openComponent()`（运行时可传任意组件+props） |
| **AI/MCP** | ✅ agent-runtime + MCP 桥接 | ✅ 同 A + LLM Provider Store (SQLite) | ✅ 7 种 CLI agent 适配器 + 内置 MCP server（14 个工具） | ✅ 多个 AI app（chat/claude-code/codex/hermes/openclaw），走 mock ws 模拟流式 |

**结论（最重要）**：
- **A 的 Plugin Runtime** = "外壳层面挂应用"的框架机制（粗粒度，一个插件 = 一个 iframe/进程，带 manifest + 沙箱 + 权限）。**最正规、最像"框架"**。
- **D 的 AppDefinition + windowManager.openComponent** = "外壳层面挂应用"的**轻量版**（声明式数组 + 运行时打开，无 manifest 文件、无沙箱，但更简单、更"组件化"）。适合"内置应用"而非"第三方插件"。
- **C 的 BlockNote schema** = "文档层面挂组件块"的框架机制（细粒度，一个块 = 一个 React 组件 + 解析规则）。
- **你要的"支持各种组件的框架性底层" = 三者融合**：
  - 外壳层：A 的 manifest 插件体系（第三方/重型）+ D 的 AppDefinition（内置/轻量）**双轨**。
  - 文档层：C 的 schema 体系（组件块）。
  - 详见 `04-component-framework-design.md`。

## 7. 选型建议汇总

| 你想要的 | 取自 | 理由 |
|---|---|---|
| **布局骨架（工作台面板式）** | **A/B `WorkbenchShell`** | 最通用、最中立、Grid+ResizeObserver、已是独立包 |
| **布局骨架（桌面窗口式）🆕** | **D `windowManager` + `AppWindow` + `DesktopView`** | 浮窗+任务栏+启动器，桌面 OS 感，零业务耦合，纯 useSyncExternalStore |
| **Markdown 编辑器内容** | **C BlockNote 方案** | 唯一可编辑可扩展，自定义块丰富 |
| **基础组件库** | **A/B `@innate/ui`** | 54 组件、独立包、shadcn 标准 |
| **桌面外壳专用件 🆕** | **D `ui/src/components/`**（AppWindow/WindowBar/LauncherPanel/ContextMenu/WallpaperPicker） | 无基元库耦合，迁移零阻力 |
| **主题系统** | **A/B `@innate/theme`** + **D 壁纸主题** | A/B 多 scope 主题可叠加；D 的明暗+壁纸切换可并入 |
| **应用级扩展（重型/第三方）** | **A Plugin Runtime** | manifest + 多运行时 + 沙箱 + 权限，框架级 |
| **应用级注册（轻量/内置）🆕** | **D `AppDefinition` + `windowManager.openComponent`** | 声明式、运行时打开、无 manifest，适合内置 app |
| **文档级扩展（组件块）** | **C BlockNote schema** | 组件块注册机制 |
| **可运行代码块** | **A RunnableCodeBlock** | 走 PTY 执行，独门 |
| **文件系统/Vault** | **C vault 模块**（Rust） | files-first、git diff 增量缓存、watcher，最成熟 |
| **国际化 🆕** | **D `language/` + 烘焙脚本** 或 **C Lara CLI** | D 的 zh/en token 烘焙更轻；C 的 18 语种更全 |
| **状态层范式 🆕** | **D `useSyncExternalStore` store** | 比 A/B/C 散落 hooks 更规范，可作新框架状态层基线 |

下一步见 `02-editor-and-layout-deep-dive.md`（深入编辑器与三种外壳布局的代码定位）和 `03-extraction-blueprint.md`（可抽取清单）。
