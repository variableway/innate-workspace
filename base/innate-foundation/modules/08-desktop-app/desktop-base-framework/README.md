# Desktop Base Framework — 提取蓝图

本目录是一份**分析与提取蓝图**，目标是：从 `desktop-ref/` 下三个既有项目中，抽取一套**可承载各种组件的、框架性的桌面应用底层基础**。

```
desktop-ref/
├── innate-ai-desktop/      # 项目 A：Tauri2 + React19，WorkbenchShell + 插件(iframe) 体系
├── innate-desktop-mono/    # 项目 B：项目 A 的演进版，同样的 WorkbenchShell，加了 QA Workspace 业务
├── tolaria/                # 项目 C：Tauri2 + React19，Obsidian 式笔记应用，BlockNote 富编辑器
├── wandesk-ui/             # 项目 D：Tauri2 + React19，桌面 OS 式窗口管理器（浮窗+任务栏+启动器）
└── desktop-base-framework/ # ← 本目录：分析结论 + 提取蓝图（新建）
```

> 共 **四个项目**。A/B 同源（`@innate/*` 命名空间），C 是笔记深度应用，D 是窗口式桌面外壳。本蓝图会把四者的可复用部分都纳入考量，**外壳层设计为可切换**（A/B 工作台面板 ↔ D 浮动窗口）。

## 阅读顺序

| 文档 | 内容 | 决策相关 |
|---|---|---|
| `01-four-projects-comparison.md` | **四**项目横向对比（技术栈 / 布局 / 编辑器 / 组件体系） | 选型依据 |
| `02-editor-and-layout-deep-dive.md` | Markdown 编辑器 + 三种外壳布局的深度剖析，含关键代码定位 | "喜欢哪个布局/内容"的答案 |
| `03-extraction-blueprint.md` | **可抽取清单**：哪些包/文件能搬、怎么搬、依赖如何切 | 落地执行 |
| `04-component-framework-design.md` | 新框架的**目标架构**：组件注册、块类型、文档模型、**可切换外壳**、扩展点 | 设计方向 |

## 一句话结论（TL;DR）

- **外壳（布局）**：**两种范式，可切换**——
  - **工作台面板式**（A/B `WorkbenchShell`，icon rail + 可调三栏）→ 适合"IDE/工作台"型应用。
  - **桌面窗口式**（D `wandesk-ui` 的 `windowManager` + `AppWindow`，浮动窗口 + 任务栏 + 启动器）→ 适合"桌面 OS"型应用。
  - 新框架把这两者抽象成同一套 `ShellProvider` 契约，**用户可切换**。
- **Markdown 内容/编辑器**：取 **项目 C (Tolaria) 的 BlockNote 方案**——它是唯一一个真正可编辑、可扩展自定义块（Mermaid/tldraw/Math/Audio/Video/WikiLink）的实现。D 的 Notebook 只是 `<textarea>`，不可编辑富文本。
- **底层组件库**：四项目里，A/B 的 **`@innate/ui`**（54 个 shadcn 风格组件，基于 `@base-ui/react`）最完整、独立成包，直接作基础组件层；D 自带一组轻量组件（AppWindow/WindowBar/Launcher/ContextMenu），作为"桌面外壳专用件"补充。
- **框架性/可扩展底层**：组合 A 的 **Plugin Runtime（manifest + iframe/native/external 运行时）** + D 的 **AppDefinition 注册表**（声明式 app，含图标/默认尺寸/单例）+ C 的 **BlockNote schema**（文档内嵌组件块），就得到"外壳可挂应用 + 文档可挂组件块"的双层扩展框架。

> 详见 `03-extraction-blueprint.md`。
