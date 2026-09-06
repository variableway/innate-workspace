# 02 · 编辑器与布局深度剖析

> 直接回答"喜欢哪个布局 / 哪个 Markdown 内容"，并给出精确的代码定位，方便后续抽取。

## 一、布局：A/B 的 WorkbenchShell（推荐做骨架）

### 1.1 它为什么适合做"框架外壳"

`@innate/app-shell` 把布局做成了一个**与业务无关的可复用组件**，只暴露插槽：

```tsx
// packages/app-shell/src/workbench-shell.tsx （A/B 一致，~210 行）
export type WorkbenchShellProps = {
  brand: string
  navItems: WorkbenchShellNavItem[]
  activeItemId: string
  onSelectItem: (id: string) => void
  navGroupLabel?: string
  toolbar?: React.ReactNode          // ← header 右侧插槽
  leftPanel?: React.ReactNode         // ← 左栏插槽
  rightPanel?: React.ReactNode        // ← 右栏插槽
  bottomPanel?: React.ReactNode       // ← 底栏插槽
  hideHeader?: boolean
  children: React.ReactNode           // ← center 主区
}
```

特点：
- **CSS Grid** 双层网格：外层 `[rail | main]`，内层 `[left | center | right]`。
- **ResizeObserver** 监听内容宽度，空间不足时按比例压缩左右栏（`MAIN_PANEL_MIN_WIDTH=520`）。
- **拖拽**：绝对定位的 `<button>` + `pointermove` 监听，无第三方拖拽库依赖。
- **icon rail 折叠**：56px ↔ 232px，CSS transition 动画。
- **零业务耦合**：所有业务内容通过 `children` / 插槽传入。

### 1.2 关键文件

| 路径 | 作用 |
|---|---|
| `innate-ai-desktop/packages/app-shell/src/workbench-shell.tsx` | 主布局组件（A 版） |
| `innate-desktop-mono/packages/app-shell/src/workbench-shell.tsx` | 主布局组件（B 版，与 A 几乎一致） |
| `innate-ai-desktop/packages/app-shell/src/app-rail.tsx` | 左侧 icon 导航栏 |
| `innate-ai-desktop/apps/desktop/src/main.tsx` | **如何装配** shell 的范例（best reference） |

### 1.3 装配范例（来自 A 的 main.tsx，已精简）

```tsx
<InnateThemeProvider theme={theme}>
  <WorkbenchShell
    brand="AI Agent Base"
    navItems={navItems}
    activeItemId={activeItemId}
    onSelectItem={selectNavItem}
    leftPanel={singleSurfaceActive ? null : <LeftPanel ... />}
    rightPanel={terminal.open ? <TerminalPanel /> : null}
    toolbar={<ShellToolbar ... />}
  >
    {activePluginRoute ? <PluginRuntimeSurface ... />
     : skillPlaygroundActive ? <SkillPlaygroundSurface />
     : <HostPlaceholder ... />}
  </WorkbenchShell>
</InnateThemeProvider>
```

→ **抽取后你的应用 = 一个 `<WorkbenchShell>` + 一堆塞进插槽的页面/组件**。这就是"框架性"的体现。

---

## 二、布局：C 的四栏（参考其精致度，但耦合度高）

C 的布局散落在 `src/App.tsx`（82KB 巨文件，编排 ~70 个 hooks）+ 多个组件中，**没有抽成独立可复用的 Shell 包**。

| 路径 | 作用 |
|---|---|
| `tolaria/src/App.tsx` | 中央编排（不建议整体抽取） |
| `tolaria/src/components/ResizeHandle.tsx` | 通用拖拽手柄（**可单独抽取**，比 A 的内联实现更干净） |
| `tolaria/src/hooks/useLayoutPanels.ts` | 面板宽度 + localStorage 持久化（**可抽取**） |
| `tolaria/src/components/CommandPalette.tsx` | Cmd+K 命令面板（**可抽取**，框架级通用件） |
| `tolaria/src/components/status-bar/` | 状态栏（可参考） |

**结论**：C 的整体布局不抽，但 **`ResizeHandle` + `useLayoutPanels` + `CommandPalette` 这三个通用件值得搬进新框架**，作为 WorkbenchShell 的增强。

---

## 二·补、布局：D 的桌面窗口式外壳（🆕 第三种、可切换的范式）

D 的外壳是**完全独立的窗口管理器**，和 A/B 的"占满全屏三栏"是两种产品形态。它的核心是一个**纯 `useSyncExternalStore` 的 store**，零 React Context、零第三方库，迁移成本极低。

### D.1 核心机制：windowManager（~225 行，最值得抽取）

`wandesk-ui/ui/src/system/windows.ts` 是一个模块级单例 store：

```ts
// windows.ts 精髓
let windows: WindowState[] = []          // 模块级状态
const listeners = new Set<() => void>()  // 订阅者
function emit() { windows = [...windows]; listeners.forEach(l => l()) }

export const windowManager = {
  openWindow,      // 按 AppDefinition 开窗（singleton 去重）
  openComponent,   // 运行时传任意 component+props 开窗（更灵活）
  close, closeByKey, minimize, restore, maximize, focus, isActive,
  toggleFromTaskbar, updatePosition, updateSize, updateRect,
}
export function useWindows() {           // React 绑定
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
```

特点：
- **WindowState** 携带 `id/appId/windowKey/title/icon/component/props/x/y/w/h/minW/minH/zIndex/state(normal|minimized|maximized)/prevRect`。
- **z-index 重平衡** `rebalanceZ()`：激活的窗口自动置顶，其余按序下沉。
- **cascade 级联**：连续开窗按 `windows.length % 8 * 30` 偏移，避免完全重叠。
- **singleton 去重**：`openWindow` 默认同 appId 只开一个；`openComponent` 用 `windowKey` 去重。

> 这套 store **没有任何业务依赖**，是"窗口管理器"的纯净实现，**可直接整体抽取**为新框架的 `@base/window-manager`。

### D.2 声明式 App 注册表（与 windowManager 配套）

`wandesk-ui/ui/src/apps/index.ts` 极简：

```ts
export const apps: AppDefinition[] = [
  { id: "chat", name: "聊天", icon: "💬", component: ChatApp,
    defaultDesktopWindowSize: { w: 900, h: 640 } },
  { id: "notebook", name: "笔记本", icon: "📓", component: NotebookApp,
    defaultDesktopWindowSize: { w: 850, h: 600 } },
  // ...13 个 app
]
export const getApp = (appId: string) => apps.find(a => a.id === appId) || null
```

- `AppDefinition = { id, name, icon, component, defaultDesktopWindowSize, minDesktopWindowSize? }`
- **新增一个"应用"= 往数组里加一项**。这就是 D 的"应用级扩展"，比 A 的 manifest 插件轻得多（无文件、无沙箱、无权限），适合**内置应用**。

### D.3 浮窗外壳 AppWindow（8 向缩放 + 拖拽）

`wandesk-ui/ui/src/components/AppWindow.tsx`（~200 行）：
- 标题栏（双击最大化）+ 内容区（渲染 `win.component` 并注入 `windowId` prop）。
- **8 个 resize 手柄**（n/s/e/w/ne/nw/se/sw），每个是绝对定位 div + pointer 事件。
- 缩放时调用 `getResizedRect()` 处理边界 clamp（不超出可视区、不小于 minW/minH）。

### D.4 桌面视图与任务栏

| 路径 | 作用 |
|---|---|
| `wandesk-ui/ui/src/views/DesktopView.tsx` | 桌面图标网格（apps 映射成图标，双击 openWindow）+ 渲染所有窗口 + 任务栏/启动器/右键菜单装配 |
| `wandesk-ui/ui/src/components/WindowBar.tsx` | 底部任务栏：启动器按钮 + 运行中窗口列表（点击 toggleFromTaskbar） |
| `wandesk-ui/ui/src/components/LauncherPanel.tsx` | 启动器面板（搜索/网格选择 app） |
| `wandesk-ui/ui/src/components/ContextMenu.tsx` | 桌面右键菜单（换壁纸等） |
| `wandesk-ui/ui/src/components/WallpaperPicker.tsx` | 壁纸选择器 |
| `wandesk-ui/ui/src/stores/appearance.ts` | 外观 store（明暗 + 当前壁纸，同样 useSyncExternalStore） |

### D.5 两种外壳如何共存（关键设计）

A/B 的 WorkbenchShell 和 D 的窗口管理器**渲染模型不同**，但可以抽象成统一契约：

```ts
// 新框架的 ShellProvider 契约（详见 04 文档）
interface ShellHost {
  openApp(app: AppDefinition, props?): WindowHandle | void   // D: 开浮窗；A/B: 切换 center 内容
  closeApp(id): void
  activeApp$: Observable<string | null>
}
```

- **WorkbenchShell 实现**：`openApp` = setState 切换 center 的 children（单视图占满）。
- **WindowManager 实现**：`openApp` = `windowManager.openWindow(app)`（多浮窗并存）。
- 用户在设置里切换"工作台模式 / 桌面模式"，框架重渲染对应外壳，**应用代码（AppDefinition + 组件）完全不变**。

**结论**：D 的窗口管理器是本蓝图里**最干净、最易抽取**的外壳实现（纯 store、无基元库依赖），强烈建议作为新框架的"桌面窗口式外壳"基座。

---

## 三、Markdown 编辑器：C 的 BlockNote 方案（推荐做内容层）

### 3.1 双模架构

C 同时维护**富文本模式**和**源码模式**，通过面包屑栏切换，外加 diff 视图：

```
Editor.tsx → EditorContent.tsx → EditorContentLayout.tsx
                                  ├─ SingleEditorView   (富: BlockNote)
                                  ├─ RawModeEditorSection (源: CodeMirror 6)
                                  └─ DiffView            (rich ↔ raw)
```

| 路径 | 作用 |
|---|---|
| `tolaria/src/components/Editor.tsx` | 编辑器入口 |
| `tolaria/src/components/EditorContent.tsx` | 模式分发 |
| `tolaria/src/components/editor-content/EditorContentLayout.tsx` | 三视图布局决策 |
| `tolaria/src/components/SingleEditorView.tsx` | **BlockNote 富编辑器宿主** |
| `tolaria/src/components/RawEditorView.tsx` | CodeMirror 源码编辑器 |
| `tolaria/src/hooks/useCodeMirror.ts` | CM6 扩展组装 |

### 3.2 核心可扩展机制：BlockNote Schema（这就是"文档内挂组件"的关键）

`tolaria/src/components/editorSchema.tsx` 用 `BlockNoteSchema.create(...)` 统一注册所有自定义内容类型。**这正是你要的"支持各种组件"在文档层面的落点**：

```tsx
// editorSchema.tsx 节选 —— 四类 spec 的注册
export const WikiLink = createReactInlineContentSpec({        // 内联组件
  type: "wikilink", propSchema: {...}, ...
})
const markdownHighlight = createStyleSpec({...})              // 样式组件 (==高亮==)
const MathBlock = createReactBlockSpec({...})                 // 块组件 (KaTeX)
const MermaidBlock = createReactBlockSpec({...})              // 块组件 (Mermaid)
const TldrawBlock = createReactBlockSpec({...})               // 块组件 (tldraw 白板)
const codeBlock = createCodeBlockSpec(createTolariaCodeBlockOptions()) // 代码块 (shiki)

export const editorSchema = BlockNoteSchema.create({
  blockSpecs: { ...defaultBlockSpecs, MathBlock, MermaidBlock, TldrawBlock, AudioBlock, VideoBlock },
  inlineContentSpecs: { ...defaultInlineContentSpecs, WikiLink, MathInline },
  styleSpecs: { ...defaultStyleSpecs, markdownHighlight },
})
```

**每种 spec 都包含两部分**：
1. **parse 规则**：从 markdown HTML 识别出该块（如识别 ` ```mermaid ` 围栏 → MermaidBlock）。
2. **render 组件**：一个 React 组件负责渲染与交互（双击进入源码编辑、懒加载 tldraw 等）。

→ **新增一个"组件"= 新增一个 spec + 一个 React 组件**。这是最干净的文档级扩展框架。

### 3.3 已实现的自定义块清单（可直接复用）

| 块类型 | 文件 | 说明 |
|---|---|---|
| WikiLink `[[...]]` | `editorSchema.tsx` | 内联，断链着色/图标/别名 |
| MathInline / MathBlock | `utils/mathMarkdown.ts` | KaTeX，双击可编辑源码 |
| MermaidBlock | `utils/mermaidMarkdown.ts` + `MermaidDiagram.tsx` | 图表 |
| TldrawBlock | `utils/tldrawMarkdown.ts` + `TldrawWhiteboard.tsx` | 白板，懒加载 |
| AudioBlock / VideoBlock | `editorSchema.tsx` | 媒体 |
| codeBlock (shiki) | `codeBlockOptions.ts` | 代码高亮 |

### 3.4 自定义交互控制器（替换 BlockNote 默认 UI）

C 把 BlockNote 原生的工具栏/侧菜单/slash 菜单全部**禁用并自研**，这是它"不像默认 BlockNote"的原因：

| 路径 | 作用 |
|---|---|
| `tolaria/src/components/tolariaEditorFormatting.tsx` | 自研格式工具栏 |
| `tolaria/src/components/tolariaBlockNoteSideMenu.tsx` | 自研块侧菜单 |
| `tolaria/src/components/SingleEditorView.tsx` | 装配所有控制器 + slash/wikilink/mention/emoji 建议 |

> 抽取建议：第一版**保留 BlockNote 原生 UI**（省一大半工作量），只搬 schema + 自定义块。控制器按需后续替换。

### 3.5 源码模式：CodeMirror 6 扩展集

| 路径 | 作用 |
|---|---|
| `tolaria/src/hooks/useCodeMirror.ts` | 扩展组装入口 |
| `tolaria/src/extensions/markdownHighlight.ts` | `==高亮==` 装饰 |
| `tolaria/src/extensions/frontmatterHighlight.ts` | YAML frontmatter 高亮 |
| `tolaria/src/extensions/zoomCursorFix.ts` | 缩放光标修正 |

### 3.6 只读渲染（阅读态/预览态）

`tolaria/src/components/MarkdownContent.tsx`：`react-markdown` + `remark-gfm` + `rehype-highlight` + DOMPurify。与 A/B 的只读方案同源，可统一。

---

## 四、A 的独门：可运行代码块（建议作为"动态组件块"移植）

A 的 markdown 虽然只读，但它有一套 **RunnableCodeBlock**——代码块可点击执行，走 PTY 输出：

| 路径 | 作用 |
|---|---|
| `innate-ai-desktop/packages/tutorial/src/components/RunnableCodeBlock/RunnableCodeBlock.tsx` | 可执行代码块 UI |
| `innate-ai-desktop/packages/terminal/` | xterm.js + PTY 运行时 |
| `innate-ai-desktop/packages/tutorial/src/components/MarkdownContent/MarkdownContent.tsx` | react-markdown + shiki 渲染 |

→ 可以把 RunnableCodeBlock **包装成一个 BlockNote 块 spec**，塞进 C 的 schema，得到"文档里嵌可运行代码"的能力。

---

## 五、文件系统 / Vault（C 最成熟，建议作为数据层）

C 是 files-first，Rust 侧的 vault 模块非常完整，可直接服务于"打开/保存 markdown 文档"：

| 路径 | 作用 |
|---|---|
| `tolaria/src-tauri/src/vault/entry.rs` | `VaultEntry` 数据模型（90+ 字段） |
| `tolaria/src-tauri/src/vault/cache.rs` | git diff 增量缓存（v14） |
| `tolaria/src-tauri/src/vault/parsing.rs` | frontmatter + body 解析 |
| `tolaria/src-tauri/src/vault_watcher.rs` | `notify` 文件监听 |
| `tolaria/src-tauri/src/search.rs` | 关键词搜索 |

> 如果你的新框架也要"本地文件为源"，直接搬这一层；如果用 SQLite/自定义存储，则只取 `entry.rs` 的字段设计作参考。

---

## 六、小结：布局与编辑器的"最优组合"

```
┌─────────────────────────────────────────────────────────┐
│  WorkbenchShell  (取自 A/B @innate/app-shell)           │  ← 框架外壳
│  + ResizeHandle / useLayoutPanels / CommandPalette (C)  │  ← 增强
├──────────┬────────────────────────┬────────────────────┤
│  左栏     │   center = 编辑器/页面  │   右栏              │
│ 文件树    │  ┌──────────────────┐ │  Inspector/TOC     │
│ (C vault) │  │ BlockNote 编辑器  │ │                    │
│           │  │ (取自 C)          │ │                    │
│           │  │ + 自定义块 schema │ │                    │
│           │  │ + Runnable 块 (A) │ │                    │
│           │  └──────────────────┘ │                    │
└──────────┴────────────────────────┴────────────────────┘
   底层组件：@innate/ui (A/B, 54 组件) + 主题 @innate/theme
   扩展层：A 的 Plugin Runtime（挂应用） + C 的 schema（挂文档块）
```

下一步：`03-extraction-blueprint.md` 给出**逐包/逐文件的抽取清单与依赖切割顺序**。
