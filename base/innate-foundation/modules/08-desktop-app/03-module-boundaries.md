# 模块边界

这份文档回答：一个能力应该放到 `apps/desktop`、`packages/*`、Tauri/Rust、plugin，还是 future product app 中。

## 总规则

1. `apps/desktop` 只做 Host 装配和产品 UI，不沉淀可复用 runtime 逻辑。
2. `packages/*` 放跨 app 可复用的 TypeScript/React 能力。
3. Tauri/Rust 放系统能力：文件、Git、PTY、进程、webview、secret、protocol。
4. Plugin roots 放安装产物，不是源码主线。
5. First-party React contribution 只允许共享依赖可控的 source-level package。
6. Third-party UI 短期统一走 iframe/webview。

## 目标包结构

```text
packages/
  ui/                         # shadcn/base-ui primitives
  theme/                      # theme token/profile: base, qaworkspace, odx, wandesk
  app-shell/                  # WorkbenchShell, AppRail, future ShellDock/WindowChrome
  action-runtime/             # command/shortcut/toolbar/menu/status action registry
  desktop-runtime/            # Tauri command TS wrappers
  plugin-runtime/             # manifest, installed plugin, roots, contributions
  plugin-builder/             # import/build/package planning
  plugin-ui/                  # plugin registry, importer, frame, detail, runtime status
  service-runtime/            # sidecar lifecycle on top of managed_process
  terminal/                   # xterm + PTY interactive session
  workbench/                  # files/git/workspace reusable UI and host contract
  browser-runtime/            # browser sessions, permissions, tools
  browser-ui/                 # browser panel, toolbar, annotation overlay
  task-runtime/               # sessions, runs, activity, approvals, events
  agent-runtime/              # provider registry, profile resolution, agent run model
  skill-runtime/              # SKILL.md scan/parse/registry/run binding
  memory-runtime/             # local deterministic memory store/search/context
  markdown-runtime/           # Markdown render, wikilink, ToC, runnable code integration
  document-runtime/           # document entries, frontmatter, watcher, backlinks
  editor-runtime/             # BlockNote + CodeMirror wrappers and schema registry
  document-workspace/         # Tolaria-like document workspace shell
```

## 当前已有模块

| 模块 | 当前来源 | 保留方式 | 缺口 |
|---|---|---|---|
| `@innate/ui` | `innate-ai-desktop` | 作为基础组件库 | 补全组件质量和 theme examples |
| `@innate/theme` | `innate-ai-desktop` | 保留多 theme preset，已加入 Wandesk 基础 | profile/wallpaper 持久化还需整理 |
| `@innate/app-shell` | `innate-ai-desktop` | WorkbenchShell 是主骨架 | contribution slots、status bar、dock、window chrome |
| `@innate/desktop-runtime` | `innate-ai-desktop` | Tauri wrapper 层 | 增加 service/browser/secret wrapper |
| `@innate/plugin-runtime` | `innate-ai-desktop` | manifest contract | `services[]`、`entry.health`、`ui.*`、contributions |
| `@innate/plugin-ui` | `innate-ai-desktop` | registry/importer/frame | plugin detail、runtime status、service logs |
| `@innate/terminal` | `innate-ai-desktop` | interactive PTY | multi-session、activity events、service log 区分 |
| `@innate/workbench` | `innate-ai-desktop` | files/git UI host contract | diff、branch、editor open、right panel preview |
| `@innate/tutorial` | `innate-ai-desktop` | Markdown/tutorial/runnable block 参考 | 与 markdown-runtime/editor-runtime 合并边界 |
| `@innate/agent-runtime` | `innate-ai-desktop` | provider/profile/CLI 基础 | UI 集成、persistent provider store |
| `@innate/skill-runtime` | `innate-ai-desktop` | local skill scan/parse | run/activity/provider resolver 完整串联 |
| `@innate/memory-runtime` | `innate-ai-desktop` | local deterministic memory | SQLite/vector backend 可后置 |

## 需要新增或正式化的模块

### `@innate/action-runtime`

统一 action、toolbar、command palette、native menu、status item、shortcut。

```ts
type AppAction = {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  enabled?: boolean;
  active?: boolean;
  danger?: boolean;
  placement?: "primary" | "secondary" | "overflow" | "status";
  run: () => void | Promise<void>;
};
```

这来自 Tolaria toolbar/command palette 的经验：重要动作不能只存在于一个按钮里。

### `@innate/service-runtime`

把 `managed_process_*` 升级成 plugin-aware service lifecycle。

职责：

- service start/stop/restart/status。
- health check。
- stdout/stderr log stream。
- process tree cleanup。
- port conflict handling。
- permission/trust prompt。
- plugin service group。

不负责：可见 interactive shell。那是 `@innate/terminal`。

### `@innate/task-runtime`

统一执行活动模型。事件来源包括：

- Agent runs and Skill runs。
- PTY/tutorial commands。
- Plugin import/build/package flows。
- Workspace file/git/process operations。

核心类型：`TaskSession`、`TaskRun`、`Activity`、`EventEnvelope`、`ApprovalRequest`。

### `@innate/document-runtime`

建立 filesystem-first Markdown document model。

建议类型：

```ts
type DocumentEntry = {
  id: string;
  path: string;
  title: string;
  fileKind: "markdown" | "canvas" | "asset" | "unknown";
  frontmatter?: Record<string, unknown>;
  links?: string[];
  backlinks?: string[];
  wordCount?: number;
  modifiedAt?: number;
};
```

来源参考 Tolaria vault，但不要直接复用 `VaultEntry` 名称和全部字段。

### `@innate/editor-runtime`

编辑器 runtime 包含两条路径：

- Rich mode：BlockNote schema，支持 document block components。
- Raw mode：CodeMirror 6，支持 Markdown/frontmatter/wiki/code highlighter。

第一版先做最小 wrapper 和 schema registry，不搬 Tolaria 的全部自研 BlockNote 控制器。

### `@innate/browser-runtime` 和 `@innate/browser-ui`

Browser 是 agent-assisted preview/validation，不是主浏览器。

职责：session、address/navigation、screenshot、annotation、permission prompt、browser tool bridge。

## App 和 Plugin 边界

### 放到 `apps/<app-id>`

- 正在和 BaseShell 一起开发。
- 需要共享 workspace packages。
- 未来可能独立打包为 desktop product。
- 需要 product-specific backend/web/desktop 源码。

### 做成 plugin

- 外部 GitHub/local app，只想安装打开。
- 静态 SPA 或 URL app。
- 有 backend 但愿意交给 Host service runtime 托管。
- 可作为用户/项目可选能力安装。

### 做成 first-party package contribution

- 需要共享 React 依赖。
- 属于核心功能，例如 Settings panel、Workbench panel、Browser panel、Document block。
- 有明确 Host API 和 permission boundary。

## Workbench 扩展点

Workbench 不应该硬编码每种文件和工具。目标 registry：

| Provider | 例子 |
|---|---|
| `workspaceProvider` | local、WSL、GitHub、S3、WebDAV |
| `previewProvider` | markdown、image、pdf、mermaid、html artifact |
| `editorProvider` | markdown、typescript、rust、json、sql |
| `gitProvider` | local-git、github、gitlab |
| `terminalProvider` | local PTY、container、remote shell |

## Agent 相关边界

| 概念 | 解释 |
|---|---|
| Agent CLI | 本地执行工具，如 codex、claude、kimi、opencode、aider |
| LLM Provider | auth、base URL、model catalog、protocol dialect |
| Agent Profile | CLI + provider + model + reasoning 的绑定 |
| Execution Profile | global/workspace/skill/task 的默认执行配置 |
| Skill | 可扫描和执行的本地能力包，通常是 `SKILL.md` |
| Tool/MCP | Agent 可调用工具，必须经过 permission/approval 模型 |

不要把 Codex/Claude/Kimi 当作普通 LLM provider。它们首先是 Agent CLI 或 Agent Provider。

## Build 与存储边界

从 `innate-desktop-mono` 保留这些规则：

- 正式产品进入 `apps/*`。
- 共享 TS 进入 `packages/*`。
- 共享 Rust 未来进入 `libs/*`。
- Reference tree 不默认进入 root workspace。
- Cargo 使用 root target，pnpm 使用 root lockfile 和 pnpm store。
- Plugin build 按需，不让每个插件复制完整 runtime。
- 不提交 `target/`、`node_modules/`、`dist/`、`.turbo/`、Tauri bundle artifact。

## 决策记录

1. `innate-ai-desktop` 是主干。
2. `innate-desktop-mono` 是参考，不继续作为主产品树。
3. Tolaria 是 Markdown/editor/workspace 参考，不整体迁移。
4. Wandesk 是 theme/window/dock 参考，不替换 runtime。
5. Plugin Package 与 Contribution 分离。
6. Service runtime 与 Terminal runtime 分离。
7. Action runtime 是 toolbar/sidebar/status/command palette 的前置基座。
8. Document runtime filesystem-first。
9. Browser 默认预览/验证用途，CDP developer mode 后置。
