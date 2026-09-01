# 实施路线

## 当前阶段判断

当前最应该做的是把底座协议和 UI action/shell 稳住，而不是继续加零散页面。顺序应该是：Action/Toolbar -> Plugin Service -> Workspace/Git -> Agent/Task UI -> Document/Markdown -> Browser -> Packaging/Security。

## Phase 0: 文档和决策冻结

目标：所有人用同一套文档判断模块归属。

交付：

- 新 `docs/` 入口和 source map。
- 主干决策：`innate-ai-desktop`。
- 参考源决策：`innate-desktop-mono`、Tolaria、Wandesk。
- 重复 roadmap 清理，不再让旧迁移文档作为主入口。

验收：新能力能明确放到 Host、package、plugin、service runtime、document runtime、agent runtime 或 Rust native。

## Phase 1: Action / Toolbar / Status 基座

目标：吸收 Tolaria toolbar 模式，让 toolbar、command palette、menu、status 统一消费 action。

任务：

1. 新增 `@innate/action-runtime`。
2. 定义 `AppAction`、`ToolbarContribution`、`StatusContribution`、`CommandContribution`。
3. 改造 `@innate/app-shell`：增加 `ShellToolbar`、`ContextToolbar`、`ShellStatusBar` slots。
4. 把 Terminal、Settings、Plugin refresh/start/back 等按钮迁入 action registry。
5. 增加 tooltip + shortcut primitive。
6. 加 Command Palette。

验收：同一个 action 可以出现在 toolbar、command palette、status bar、native menu，不重复写业务逻辑。

## Phase 2: Plugin Runtime v1.1 与 Service Runtime

目标：从 static plugin 平台升级成 local app 平台。

任务：

1. 扩展 TS/Rust manifest：`entry.health`、`services[]`、`ui.contributions`。
2. 保持 `homeCard` 和 `dev.startCommand` 兼容。
3. 新增 `@innate/service-runtime`。
4. 在 Rust `managed_process_*` 上增加 plugin-aware service commands。
5. 增加 Plugin Detail、Runtime Status、service logs。
6. 增加 trust prompt：第三方服务首次启动需要确认。
7. 支持 process tree stop、health retry、port conflict message。

验收：一个 web + backend demo plugin 可以安装、启动服务、打开 Web UI、展示日志和健康状态。

## Phase 3: Workspace / Files / Git 基座

目标：让 local-first agent workspace 有真实文件和 Git 能力。

任务：

1. Workbench file preview panel。
2. Change inspector / unified diff。
3. Git status、branch display、branch picker。
4. Open in external editor。
5. Terminal multi-session 评估。
6. Workspace/file/git 操作发 Task Activity。
7. Agent file changes 进入 review flow。

验收：用户能打开 workspace、查看文件、看 Git 状态和 diff，并让 agent 修改经过 review 的文件。

## Phase 4: Agent / Skill / Memory / Task UI 集成

目标：把已有 runtime 变成可用工作台能力。

任务：

1. Provider Store：async CLI scan、provider diagnostics、secret status。
2. Settings UI：Agent CLI、LLM Provider、Agent Profile、Execution Defaults。
3. Skill Playground 使用 provider store resolver。
4. `skill.run` 发 Task Activity。
5. Agent run/cancel/events 接入 Task Runtime。
6. Memory recall context block 接入 agent/skill run。
7. Approval UI 统一到 action/task model。

验收：用户可选择 agent/profile，运行 skill 或 agent task，看到事件流、审批、memory context 和 activity timeline。

## Phase 5: Markdown Runtime 与 Document Workspace Shell

目标：先做 files-first Markdown workspace，不急着全量富编辑器。

任务：

1. 新增 `@innate/markdown-runtime`。
2. 从 `@innate/tutorial` 抽 Markdown render、ToC、RunnableCodeBlock adapter。
3. 新增 `@innate/document-runtime`：DocumentEntry、frontmatter、headings、wikilinks。
4. 新增 `@innate/document-workspace` mock shell。
5. 抽 `DocumentToolbar` 和 `DocumentStatusBar`。
6. 接入 real folder read/list/open/save。
7. 支持 preview/raw minimal edit。

验收：可以打开一个 Markdown folder，列出文件、预览、基础编辑、保存，并显示 document toolbar/status。

## Phase 6: Editor Runtime

目标：把 Tolaria 的编辑器能力变成可复用 package。

任务：

1. 新增 `@innate/editor-runtime`。
2. CodeMirror raw mode：Markdown/frontmatter/wikilink/search。
3. BlockNote rich mode wrapper。
4. Block schema registry。
5. WikiLink、Mermaid、Math、Code、Runnable blocks。
6. Rich/raw/preview/diff mode switch。
7. 后续再迁移 Tolaria 自研 toolbar/side menu/slash menu。

验收：文档工作区支持富编辑、源码编辑、预览，并能挂载自定义 document blocks。

## Phase 7: Browser Surface

目标：加入 Codex-like browser preview / annotation / validation 能力。

任务：

1. 新增 `@innate/browser-runtime` 和 `@innate/browser-ui`。
2. 第一版 iframe 支持 localhost、plugin、file-backed preview。
3. BrowserPanel、AddressBar、permissions。
4. Screenshot 和 annotation overlay。
5. Browser comments 接入 task context。
6. 后续切 Tauri native webview。
7. CDP/Playwright developer mode 后置。

验收：用户能在 BaseShell 打开 localhost/plugin 页面，留下视觉注释，并让 agent 根据注释修改代码。

## Phase 8: Component Contribution Protocol

目标：支持“各种组件”，但保持安全和依赖边界。

任务：

1. 定义 first-party React contribution API。
2. 定义 third-party iframe/webview contribution API。
3. 支持 slots：home、nav、route、toolbar、status、rightPanel、settings、command、browser tool、document block。
4. Registry merge：built-in + product profile + user plugin roots。
5. Contribution validation 和 ordering。

验收：一个 first-party package 可贡献 settings panel、toolbar action、document block；一个 third-party plugin 可贡献 Home card 和 iframe route。

## Phase 9: Theme Profiles 与 Wandesk Shell Profile

目标：让主壳和插件 UI 可以切换 ODX、QA Workspace、Wandesk 等主题。

已完成基础：

- `wandesk` theme preset。
- plugin iframe theme bridge。
- `ui.themeMode: inherit | isolated`。

后续任务：

1. `ShellDock`。
2. `WindowChrome`。
3. `WallpaperProfile`。
4. Optional Desktop Window Mode。
5. plugin starter 增加 theme bridge 示例。

验收：本地 iframe plugin 能跟随主题切换；external web 默认保持 isolated；Wandesk 可作为可选 shell profile。

## Phase 10: Packaging Profiles 与产品化

目标：同一框架可以打包成不同 desktop product。

任务：

1. Packaging profile：productName、identifier、icon、theme、built-in plugins、default settings。
2. Tauri resources 内置插件。
3. 用户插件仍从 plugin roots 扫描。
4. Product-specific app routes 和 settings。
5. Release profile 和签名配置。

验收：同一 BaseShell 可构建 base-only、markdown-workspace、skill-workspace、custom-client 四类产品包。

## Phase 11: Hardening

目标：补齐权限、安全、跨平台和 QA。

任务：

1. Browser allowed/blocked sites。
2. Service permission grants 和 revoke。
3. Plugin signature/hash 验证。
4. Process tree stop、日志持久化、端口冲突处理。
5. Workspace path boundary tests。
6. Playwright visual smoke：Shell、Document Workspace、Browser、Plugin Frame。
7. Cargo test 和 TS typecheck gate。
8. Secret/keychain Linux fallback diagnostics。

验收：框架具备发布前的安全边界和基础 QA。

## 近期执行队列

建议马上做这 10 个任务：

1. `@innate/action-runtime`。
2. `ShellStatusBar` + `ContextToolbar`。
3. Manifest v1.1：`services[]`、`entry.health`、`ui.contributions`。
4. Plugin-aware service manager。
5. Plugin Detail + Runtime Status。
6. Workbench file preview + change inspector + Git status。
7. Provider Store settings UI 分区。
8. Task Activity 接入 plugin import / terminal / skill run。
9. `@innate/markdown-runtime`。
10. `@innate/document-workspace` mock shell。

## 推迟事项

- 完整 plugin marketplace。
- 任意第三方 React 动态加载。
- 全量 Tolaria editor 控制器迁移。
- Full native browser/CDP。
- Workflow graph/node editor。
- 多租户云同步。
- 自动 memory extraction/vector index。
