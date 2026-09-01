# UI Shell、Toolbar 与 Theme

## 目标

UI 层要同时满足两种需求：

1. 稳定、密集、可扩展的 AI/workspace 工具外壳。
2. 可选的更有桌面感、更好玩的 Wandesk 风格 profile。

结论：WorkbenchShell 是主骨架，Tolaria 的 toolbar/status/command palette 是 interaction reference，Wandesk 的 dock/launcher/window chrome/theme 是 optional shell profile reference。

## 两种 Shell 模式

### Workbench Mode

来自 `@innate/app-shell`。

```text
┌────┬───────────────────────────────────────────────┐
│rail│ header: brand + toolbar                        │
├────┼──────────┬─────────────────────┬──────────────┤
│    │ left     │ center main          │ right panel   │
│    │ panel    │ files/agent/docs      │ preview/logs  │
├────┴──────────┴─────────────────────┴──────────────┤
│ bottom panel: terminal / service logs / status       │
└──────────────────────────────────────────────────────┘
```

适合：AI workspace、document workspace、files/git、settings、skill playground、plugin registry。

### Desktop Window Mode

来自 Wandesk 的 window manager 思路，作为后续可选 shell profile。

```text
Desktop wallpaper
  desktop icons / launcher
  floating app windows
  taskbar/dock
  window chrome
```

适合：多 app 并行、轻量工具集合、playful desktop skin、插件窗口化。

不要马上替换 WorkbenchShell。先抽：`ShellDock`、`WindowChrome`、`LauncherPanel`、`WallpaperProfile`。

## Shell Contract

为了让两种模式共存，应用注册不应该绑定具体 shell。

```ts
type ShellAppDefinition = {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }> | string;
  route?: string;
  component?: React.ComponentType<unknown>;
  defaultWindowSize?: { width: number; height: number };
  singleton?: boolean;
};

type ShellHost = {
  openApp: (id: string, props?: Record<string, unknown>) => void;
  closeApp: (id: string) => void;
  focusApp: (id: string) => void;
};
```

Workbench Mode：`openApp` 切换 route/center surface。

Desktop Window Mode：`openApp` 打开 floating window。

## Toolbar 模型

Tolaria 的 toolbar 说明了一个关键原则：重要动作不能只存在于一个按钮。动作应该统一注册，然后被 toolbar、command palette、native menu、status item、context menu 复用。

```ts
type AppAction = {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  scope?: "global" | "workspace" | "document" | "browser" | "plugin";
  enabled?: boolean;
  active?: boolean;
  danger?: boolean;
  run: () => void | Promise<void>;
};
```

Toolbar contribution：

```ts
type ToolbarContribution = {
  id: string;
  actionId: string;
  placement: "primary" | "secondary" | "overflow";
  priority?: number;
};
```

## Context Toolbar

不同 surface 有不同上下文 toolbar：

| Surface | Toolbar 内容 |
|---|---|
| Home | scan plugins、open terminal、quick settings |
| Plugin Frame | back、start services、refresh、open browser、runtime status |
| Workspace | open folder、git branch、file search、terminal、agent run |
| Document | title/path、mode switch、TOC、Inspector、export、copy link |
| Browser | address、back/forward/reload、screenshot、annotate、inspect |
| Agent Thread | model/profile、sandbox、approval mode、run/cancel |

## Sidebar / Rail

Rail 是主导航，不应直接硬编码业务 app。目标来源：built-in + product profile + plugin contribution。

```ts
type NavContribution = {
  id: string;
  label: string;
  icon?: string;
  route: string;
  placement?: "main" | "footer";
  section?: string;
  priority?: number;
};
```

初始固定入口：

- Home。
- Workspace。
- Documents。
- Skills。
- Agents。
- Plugins。
- Settings。

后续 plugin 可贡献 nav item，但必须有 route/openMode/permission。

## StatusBar / Dock

Tolaria 的 StatusBar 和 Wandesk 的 WindowBar 都有价值，但用途不同。

| 来源 | 可抽价值 | 落点 |
|---|---|---|
| Tolaria StatusBar | workspace/git/sync/zoom/theme/MCP 状态 | `ShellStatusBar` |
| Wandesk WindowBar | launcher、running windows、active state、clock | `ShellDock` / Desktop Window Mode |

Status contribution：

```ts
type StatusContribution = {
  id: string;
  side: "left" | "right";
  priority: number;
  render: () => React.ReactNode;
};
```

常驻 status：

- workspace root。
- Git branch + dirty count。
- agent provider/profile。
- service health。
- task run status。
- terminal status。
- theme/language/settings。

## Command Palette

Command Palette 是 action runtime 的 UI，不是单独业务功能。

能力：

- 搜 action。
- 快速打开 app/plugin/document/file。
- 切换 agent profile/theme/workspace。
- 运行常用 command。
- 展示 shortcut。

来源：Tolaria `CommandPalette`、`QuickOpenPalette`，但要去掉 Tolaria 产品态耦合。

## Theme System

当前 `@innate/theme` 已有：

- `base`
- `qaworkspace`
- `odx`
- `wandesk`

主题状态：

```ts
type ThemeState = {
  themeName: "base" | "qaworkspace" | "odx" | "wandesk";
  colorMode: "light" | "dark" | "system";
  resolvedMode: "light" | "dark";
};
```

Host 设置：

- `data-innate-theme`
- `data-theme`
- `.light` / `.dark`
- CSS variables

## Wandesk Profile

Wandesk 不作为新的主 runtime。它作为 optional UI profile：

| Wandesk 来源 | 抽取目标 |
|---|---|
| wallpaper CSS | theme profile/wallpaper profile |
| `WindowBar` | bottom dock/taskbar reference |
| `LauncherPanel` | app launcher/search reference |
| `AppWindow` | `WindowChrome` primitive |
| `appearance.ts` | profile-driven light/dark/wallpaper store |

已完成基础：`wandesk` theme preset 和 plugin iframe theme bridge。

后续：

1. `ShellDock`：底部 dock，可显示 running apps/services/tasks。
2. `WindowChrome`：plugin frame、browser panel、document workspace 的统一窗口 chrome。
3. `WallpaperProfile`：把 wallpaper 与 theme/color mode 绑定。
4. `DesktopWindowShell`：可选 shell，不替换 WorkbenchShell。

## Plugin UI Skinning

插件 UI 默认策略：

| Plugin | 默认 |
|---|---|
| static iframe | inherit host theme |
| sidecar iframe | inherit host theme |
| external web | isolated |
| first-party React | inherit |

Manifest：

```json
{
  "ui": {
    "openMode": "iframe",
    "themeMode": "inherit"
  }
}
```

不要强制第三方页面使用 Wandesk。插件应能选择继承或隔离。

## Layout Guidelines

遵循这些约束：

- 工具类产品保持信息密度，避免营销式 hero。
- Sidebar/toolbar/status 用稳定尺寸，避免动态内容挤压布局。
- icon button 用 lucide icons，陌生图标有 tooltip。
- toolbar action 支持 keyboard shortcut。
- cards 只用于重复项、modal、framed tool，不把 page section 包成 card。
- 文本在按钮/卡片/侧栏内不能溢出。
- Theme 不做单一色相堆叠，Wandesk 也必须保留可读性和工作效率。

## 实施顺序

1. `@innate/action-runtime`。
2. `ShellToolbar`、`ContextToolbar`、`ShellStatusBar`。
3. 把现有 Settings/Terminal/Plugin actions 改为 action registry。
4. Command Palette。
5. PluginFrame toolbar + Runtime Status。
6. DocumentToolbar。
7. BrowserToolbar。
8. Wandesk `ShellDock` / `WindowChrome` optional profile。
