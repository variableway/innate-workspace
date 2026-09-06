# Workspace、Markdown 与 Git

## 目标

Workspace 层要支撑两类使用方式：

1. 普通开发/Agent 工作区：文件树、预览、Git status/diff/branch、终端、browser preview、agent file changes。
2. Markdown document workspace：本地 Markdown folder、frontmatter、wikilink、BlockNote/CodeMirror 编辑、TOC/Inspector、可运行代码块。

这两类不应该割裂。Markdown workspace 本质上也是 filesystem-first workspace，只是有更强的 document runtime 和 editor runtime。

## 当前基础

`innate-ai-desktop` 已有：

- Tauri workspace commands：default root、list directory、read text file、git status 等基础。
- `@innate/workbench`：可复用 workspace/file/git UI host contract。
- `@innate/tutorial`：Markdown render、ToC、Runnable code block、Shiki。
- `@innate/terminal`：xterm + PTY。

`innate-desktop-mono` 有价值内容：

- Workspace gap analysis：文件预览、变更审查器、Git branch picker、编辑器打开、终端面板、开发者 browser。
- Terminal 统一方案：保留 portable-pty，增强 multi-session。

Tolaria 有价值内容：

- files-first vault。
- Markdown/frontmatter parsing。
- watcher。
- git diff 增量缓存。
- BlockNote rich editor + CodeMirror raw mode。
- Document toolbar、status bar、command palette、quick open。

## Workspace Workbench 目标 UI

```text
┌───────────────┬─────────────────────────────┬──────────────────┐
│ Workspace Rail │ Main Surface                 │ Right Panel       │
│ files/search   │ editor / preview / thread    │ file preview      │
│ git branches   │ markdown / diff / browser    │ diff inspector    │
│ skills/tools   │ terminal-triggered context   │ browser/comments  │
├───────────────┴─────────────────────────────┴──────────────────┤
│ Bottom Panel: PTY terminal or service logs                       │
└──────────────────────────────────────────────────────────────────┘
```

高优先级：

- File preview panel。
- Change inspector / unified diff view。
- Git status + branch picker。
- Open in external editor。
- Terminal bottom panel。
- Agent run activity timeline。

中优先级：

- Browser preview panel。
- File watcher event UI。
- Search and quick open。
- Git commit/stash UI。

## 文件系统模型

所有文件操作走 Host workspace API。

```ts
type WorkspaceRoot = {
  id: string;
  label: string;
  path: string;
  kind: "local" | "project" | "plugin" | "remote";
  writable: boolean;
};

type WorkspaceEntry = {
  path: string;
  name: string;
  kind: "file" | "directory" | "symlink";
  size?: number;
  modifiedAt?: number;
  gitStatus?: string;
};
```

权限：

- Read root 与 write root 分开授权。
- Agent 写文件前走 approval 或 workspace-write policy。
- Plugin/sidecar 不直接拿裸路径；Host 注入授权 root 或 capability handle。

## Git 能力

第一阶段只做 local git provider：

- `git.status`
- `git.diff`
- `git.branch.list`
- `git.branch.switch`
- `git.branch.create`
- `git.commit` 后置，必须有明确确认。

UI：

- Sidebar/StatusBar 显示当前 branch 和 dirty count。
- Right Panel 显示 diff/change inspector。
- Composer 附近可显示 branch picker。
- Agent 产生 file changes 后进入 review flow，而不是静默 commit。

## Markdown Runtime

`@innate/markdown-runtime` 负责只读和结构化 Markdown 能力：

- GFM render。
- Shiki/highlight。
- ToC。
- Wikilink preprocessing。
- Frontmatter parse。
- Runnable code block adapter。
- Safe HTML policy。

它应该吸收 `@innate/tutorial` 里的 Markdown renderer 和 RunnableCodeBlock，同时给 document workspace 和 tutorial/runtime 复用。

## Document Runtime

Document runtime 负责 filesystem-first 文档模型，而不是 UI。

```ts
type DocumentEntry = {
  id: string;
  path: string;
  title: string;
  fileKind: "markdown" | "canvas" | "asset" | "unknown";
  frontmatter?: Record<string, unknown>;
  bodyPreview?: string;
  links?: string[];
  backlinks?: string[];
  headings?: Array<{ depth: number; text: string; slug: string }>;
  wordCount?: number;
  modifiedAt?: number;
  gitStatus?: string;
};
```

来自 Tolaria 的可抽能力：

| 能力 | 使用方式 |
|---|---|
| frontmatter/body parsing | 迁入 markdown/document runtime |
| wikilink model | 迁入 markdown runtime 和 editor schema |
| watcher | 参考实现，先做 minimal contract |
| git diff cache | 后置，先做普通 git diff |
| search | 先做 filename/body keyword，后续索引 |

不直接搬：Tolaria 的完整 `VaultEntry`、AutoGit、sync、AI workspace、MCP bridge、updater、telemetry。

## Editor Runtime

编辑器采用双模：

```text
DocumentToolbar
  rich mode: BlockNote
  raw mode: CodeMirror 6
  preview mode: Markdown renderer
  diff mode: rich/raw or git diff
```

### Rich Mode

使用 BlockNote schema，支持 document block components。

第一版自定义块：

- WikiLink inline。
- Mermaid block。
- Math inline/block。
- Code block with Shiki。
- Runnable code block，复用 `@innate/terminal`。

后续再加：tldraw、audio/video、artifact preview、browser snapshot、agent output block。

### Raw Mode

使用 CodeMirror 6。

第一版扩展：

- Markdown language。
- Frontmatter highlighting。
- Wikilink highlighting。
- Search。
- Basic lint/diagnostics hook。

### Block Component Registry

```ts
type DocumentBlockContribution = {
  id: string;
  blockType: string;
  label: string;
  parseMarkdown?: (input: unknown) => unknown;
  render: React.ComponentType<unknown>;
  serializeMarkdown?: (value: unknown) => string;
};
```

Document block 是“支持各种组件”的细粒度层；plugin/app shell 是粗粒度层。

## Document Workspace Shell

不要直接搬 Tolaria 四栏 app。应抽一个干净的 workspace shell：

```text
@innate/document-workspace
  DocumentWorkspaceShell
  DocumentSidebar
  DocumentList
  DocumentEditorArea
  DocumentRightPanel
  DocumentToolbar
  DocumentStatusBar
  useDocumentPanelLayout
```

DocumentToolbar 参考 Tolaria `BreadcrumbBar`，但接入统一 `AppAction`。

可放入 toolbar 的 action：

- rename title/file。
- rich/raw/preview/diff mode。
- TOC/Inspector toggle。
- favorite/archive/delete。
- copy path/deep link。
- export。
- open in editor。
- run code block policy。

StatusBar contribution：

- workspace root。
- Git branch/status。
- word count。
- sync/watcher state。
- active agent/task state。
- theme/settings shortcut。

## Runnable Code Block

`@innate/tutorial` 的 RunnableCodeBlock 是关键资产。目标不是只在教程里运行，而是成为 Markdown/document block：

```text
Markdown fenced code block
  -> render runnable block
  -> user confirms command
  -> visible PTY or managed service depending on command type
  -> Task Activity emitted
```

规则：

- 短命令和教程命令走 visible PTY。
- 长期服务命令走 service runtime。
- workspace-write 命令必须确认。
- 输出可以进入 terminal panel，也可以记录 activity。

## Agent 与 Workspace 的关系

Agent 工作时需要 Workspace 上下文，但 Workspace 不属于 Agent。

Agent run request 应包含：

- workspace root handle。
- sandbox policy。
- approval policy。
- selected files/context blocks。
- memory context。
- active skill。
- current Git branch/status。

Agent 文件修改后进入 review：

1. Agent emits proposed file changes。
2. Change inspector 展示 diff。
3. 用户接受/拒绝/编辑。
4. Host 执行 write/apply patch。
5. Git status 更新。
6. Task Activity 记录结果。

## 实施顺序

1. Workbench file preview + Git status + branch display。
2. Change inspector。
3. External editor open。
4. Task Activity 接入 workspace/file/git/terminal。
5. `@innate/markdown-runtime` 从 tutorial renderer 抽出。
6. `@innate/document-runtime` minimal file model + frontmatter + headings。
7. `@innate/document-workspace` mock data shell。
8. CodeMirror raw mode。
9. BlockNote rich mode + schema registry。
10. Runnable code block 作为 document block。
