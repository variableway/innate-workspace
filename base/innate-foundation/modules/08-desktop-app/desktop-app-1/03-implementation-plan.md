# 03 · 实施计划

> 输入：`docs/desktop-app/07-implementation-roadmap.md` 的 Phase 0-11 路线 + `01-docs-review.md` 发现的文档硬伤 + `02-gap-analysis.md` 的差距清单。
> 原则：先修文档（Phase 0，防止按错误前提开工）→ 再按 roadmap 顺序落地；每个任务给出文件级落点与验收标准。

## 总览与依赖

```text
Phase 0  文档修复与决策冻结（P0，先行，1 周内）
   │
Phase 1  Action / Toolbar / Status 基座（对应 roadmap Phase 1）
   │
Phase 2  Plugin v1.1 + Service Runtime（roadmap Phase 2）──┐
   │                                                      ├─ 验收对象：apps/odx
Phase 3  Workspace / Files / Git（roadmap Phase 3）        │
   │                                                      │
Phase 4  Agent / Skill / Memory / Task UI（roadmap Phase 4）
   │
Phase 5  Markdown + Document Workspace（roadmap Phase 5）← 依赖 Phase 0 的参考源决策
   │
Phase 6  Editor Runtime（roadmap Phase 6）← 同上
   │
Phase 7  Browser Surface（roadmap Phase 7）
   │
Phase 8-11  Contribution 协议 / Theme 与 Shell Profile / Packaging / Hardening
```

规模标注：S（≤3 天）/ M（1-2 周）/ L（2 周+）。Phase 1-4 为近期主线（roadmap"近期执行队列"全覆盖），Phase 5+ 需 Phase 0 决策解锁。

---

## Phase 0：文档修复与决策冻结（S，必须最先做）

对应 `01-docs-review.md` 的 4 个 P0。

| # | 任务 | 落点 | 验收 |
|---|------|------|------|
| T0.1 | 处理 desktop-base-framework 缺失文件：推荐补写 `03-extraction-blueprint.md`、`04-component-framework-design.md`（基于 01/02 已有代码定位），或删除引用并在 source-map 标注 | `docs/desktop-app/desktop-base-framework/` | 组内无悬空引用 |
| T0.2 | **参考源决策**：恢复 `tolaria`/`wandesk-ui`/`innate-desktop-mono` 到 `base/references/desktop-ref/`，或改写 Phase 5/6/9 为"按规格重写"；在 `docs/desktop-app/README.md` 增加参考源可用性声明 | `docs/desktop-app/README.md`、`source-map.md` | 每个被引用参考源有明确状态（在库/已并入/需重写） |
| T0.3 | 把 `@innate/desktop-surface`、`admin-ui` 纳入 `03-module-boundaries.md`；裁决 desktop-surface 与 app-shell 的关系（建议：desktop-surface 演进为 Desktop Window Mode 实现体，契约统一到 `ShellAppDefinition`/`ShellHost`） | `03-module-boundaries.md`、`06-ui-shell-toolbar-theme.md` | 18 个现有包全部有归属说明 |
| T0.4 | manifest 类型收敛决策：`@innate/platform` 的扩展 `PluginManifest`（含 contributes）定为贡献类型唯一定义处；`plugin-runtime` v1 类型对齐引用；写入 `04` | `04-runtime-and-plugin-model.md` | 双轨类型有唯一权威来源 |
| T0.5 | P1/P2 级文档修正：ThemeState 命名、ShellHost 契约统一、workbench/git 现状补充、agent 契约现状补充、source-map 链接可达性标注 | 各文档 | 按 01 号审查 P1/P2 清单逐条关闭 |

## Phase 1：Action / Toolbar / Status 基座（M）

目标：同一 action 进入 toolbar / command palette / status bar / menu，不重复写业务逻辑。

| # | 任务 | 落点（新增/修改） | 验收 |
|---|------|------|------|
| T1.1 | 新建 `@innate/action-runtime`：`AppAction`、`ToolbarContribution`、`StatusContribution`、`CommandContribution`、registry（注册/查询/快捷键解析） | `packages/action-runtime/` | 类型与 `03-module-boundaries.md` 定义一致；带单测 |
| T1.2 | app-shell 增加 `ShellToolbar`、`ContextToolbar`、`ShellStatusBar` 插槽组件（消费 contribution，排序/溢出） | `packages/app-shell/src/` | 现有 WorkbenchShell 布局不回归 |
| T1.3 | 迁移存量按钮：终端开关、Settings、Plugin refresh/start/back、Home 快捷操作 → action registry | `apps/desktop/src/main.tsx`（删除 L252-261 局部 ShellToolbar）、`components/settings/`、`packages/plugin-ui/` | main.tsx 不再内联 toolbar 组件 |
| T1.4 | Command Palette：基于 `@innate/ui` 既有 cmdk 原语（`components/ui/command.tsx`）接 action registry，支持 Cmd+K | `apps/desktop` + `packages/app-shell` | 可搜索/执行全部已注册 action |
| T1.5 | tooltip + shortcut primitive | `packages/ui` | 陌生图标有 tooltip，action 可声明 shortcut |

## Phase 2：Plugin v1.1 + Service Runtime（M-L）

目标：从 static plugin 平台升级为 local app 平台；**用 `apps/odx` 作为首个真实验收对象**。

| # | 任务 | 落点 | 验收 |
|---|------|------|------|
| T2.1 | manifest v1.1：TS（以 platform 类型为基准）+ Rust `plugins/types.rs` 同步加 `services[]`（id/command/cwd/health/port）、`entry.health`、`ui.contributions`；`dev.startCommand` 转 compatibility alias；`schemaVersion` 仍 `innate.plugin.v1`（向后兼容校验） | `packages/platform/src/plugin/manifest.ts`、`packages/plugin-runtime/src/index.ts`、`apps/desktop/src-tauri/src/plugins/types.rs` | 旧 manifest（odx/tweakcn）无需修改即可通过扫描 |
| T2.2 | 新建 `@innate/service-runtime`：service group by plugin id、start/stop/restart/status、health check（复用 Rust `http_probe`）、日志事件流 | `packages/service-runtime/` | TS 层不直接碰 `managed_process_*` |
| T2.3 | Rust `service_runtime.rs`：plugin-aware service commands、进程树 stop（unix 进程组 / win job object）、端口冲突检测、trust prompt 状态持久化（grants JSON 起步） | `apps/desktop/src-tauri/src/` | kill service 后无孤儿进程 |
| T2.4 | plugin-ui 增加 Plugin Detail / Runtime Status / Service Logs 面板 | `packages/plugin-ui/` | 可看到 stdout/stderr 流与健康状态 |
| T2.5 | trust prompt：第三方 services 首启确认 + 记住授权 | `apps/desktop` Host 层 | 未授权时 service 不启动 |
| T2.6 | odx 迁移：`.innate/plugins/odx/innate.app.json` 改为 `sidecar-web + services[]`，替代 `scripts/start-odx-plugin.mjs` 手工流程；顺带修复 `dev.cwd` 硬编码作者机器绝对路径的问题 | `.innate/plugins/odx/` | 在 BaseShell 内一键启停 odx，健康/日志可见 |
| T2.7 | plugin uninstall command + UI | Rust `plugins/`、`plugin-ui` | 可移除已安装插件 |

## Phase 3：Workspace / Files / Git（M）

| # | 任务 | 落点 | 验收 |
|---|------|------|------|
| T3.1 | Rust workspace 扩展：`workspace_git_diff`（文件级）、`workspace_git_branch_list/switch/create`、`workspace_write_text_file`（写授权 root 内）、`open_in_external_editor` | `apps/desktop/src-tauri/src/workspace.rs`、`external_open.rs` | 路径逃逸防护覆盖新命令；git 写操作（branch/commit）有确认 |
| T3.2 | workbench FileExplorer 树形化（目录递归 + 懒加载，保留 git 状态标记） | `packages/workbench/src/features/workbench/components/FileExplorer.tsx` | 大目录（500+ 条）不卡 |
| T3.3 | FilePreview 语法高亮（复用 tutorial 的 shiki 高亮器） | `FilePreview.tsx`、抽 `@innate/markdown-runtime` 前可先引用 tutorial |
| T3.4 | Change inspector / unified diff 视图（右面板） | `packages/workbench/` 新组件 | agent 修改过的文件可 review 后落盘 |
| T3.5 | Branch picker + 挂载既有 `GitStatusBar.tsx`（当前未使用）到 shell StatusBar（依赖 Phase 1） | `packages/workbench/`、app-shell | branch/dirty count 常驻 status bar |
| T3.6 | read/write root 分离授权模型起步 | Rust workspace + Host | agent 写文件必须经过 approval 或 workspace-write policy |
| T3.7 | 终端 multi-session 评估（tab 或多面板；后端 pty-N 自增已支持，前端单 session） | `packages/terminal/` | 至少支持 2 个并发 PTY 会话切换 |

## Phase 4：Agent / Skill / Memory / Task UI 集成（M）

| # | 任务 | 落点 | 验收 |
|---|------|------|------|
| T4.1 | Provider Store v1：SQLite（app data）建表 `llm_providers/llm_models/agent_cli_statuses/agent_profiles/execution_profiles`；CLI async scan 入库（收敛 Rust 19 def 与 TS 9 CLI 双清单为单一来源） | 新 `packages/agent-runtime/src/store/` 或独立 provider-store 包 + Rust/TS 桥 | 重启后 provider/profile 配置不丢 |
| T4.2 | Secret 后端：OS keychain（keyring crate），SQLite 只存 `api_key_configured/tail/secret_ref`；Linux fallback 诊断 | Rust 新 `secret.rs` | 明文不出 keychain |
| T4.3 | Settings UI 分区：Agent CLI / LLM Provider / Agent Profile / Execution Defaults | `apps/desktop/src/features/settings/` | 可完成"配 provider → 配 profile → 默认执行链" |
| T4.4 | `@innate/task-runtime`：`TaskSession/TaskRun/Activity/EventEnvelope/ApprovalRequest` 类型 + 事件总线；替换 `task_sessions.rs` JSON CRUD 与 `run-skill.mjs` 私有活动记录 | 新 `packages/task-runtime/` | plugin import / terminal command / skill run / agent run 四源统一进 timeline |
| T4.5 | agent 事件补齐：`cancel` 实现（中断 sidecar 流 + 进程组）、`approval.required` 事件链 + Host 审批 UI | `packages/agent-runtime/src/providers/cli.ts`、Rust `agent_runtime.rs` | 可取消运行中的 agent；审批请求在 UI 可批/拒 |
| T4.6 | Skill Playground 接 provider store resolver + `skill.run` 发 Task Activity | `apps/desktop/src/features/`、`packages/skill-runtime` | skill 从扫描到运行到活动记录全链路 |
| T4.7 | Memory recall context block 注入 agent/skill run（`scripts/innate-agent.ts` 已有 `--memory-query`，上移到 runtime） | `packages/memory-runtime`、agent-runtime | run 请求自动带 memory context |

## Phase 5：Markdown Runtime + Document Workspace Shell（M，依赖 T0.2 决策）

| # | 任务 | 落点 | 验收 |
|---|------|------|------|
| T5.1 | 新建 `@innate/markdown-runtime`：从 `@innate/tutorial` 抽 `MarkdownContent`、`getTutorialToc`、`RunnableCodeBlock` adapter、shiki 高亮器；GFM/ToC/wikilink 预处理/frontmatter 解析/safe HTML | `packages/markdown-runtime/`（tutorial 改为依赖它） | tutorials 页零回归 |
| T5.2 | 新建 `@innate/document-runtime`：`DocumentEntry`（frontmatter/headings/links/backlinks/bodyPreview）+ 目录扫描 + 最小 watcher contract | `packages/document-runtime/` | 打开 md folder 生成文档索引 |
| T5.3 | 新建 `@innate/document-workspace` mock shell：`DocumentWorkspaceShell/Sidebar/List/EditorArea/RightPanel/Toolbar/StatusBar` + `useDocumentPanelLayout` | `packages/document-workspace/` | mock 数据可跑通四栏布局 |
| T5.4 | 接真实文件：folder read/list/open/save（走 workspace API）+ preview/raw minimal edit | 同上 + Rust workspace | 打开真实 md folder：列出、预览、基础编辑、保存 |
| T5.5 | Documents 一级导航入口 + rail 贡献 | `apps/desktop/src/main.tsx`（依赖 Phase 1 contribution） | rail 出现 Documents |

## Phase 6：Editor Runtime（L，依赖 T0.2 决策）

| # | 任务 | 落点 | 验收 |
|---|------|------|------|
| T6.1 | `@innate/editor-runtime` CodeMirror raw mode：markdown language + frontmatter/wikilink 高亮 + search | `packages/editor-runtime/` | raw 模式可编辑保存 |
| T6.2 | BlockNote rich mode wrapper + block schema registry（`DocumentBlockContribution`） | 同上 | 文档规定的 5 个首版块：WikiLink/Mermaid/Math/Shiki Code/Runnable |
| T6.3 | Runnable code block 挂为 document block（复用 terminal command bus；短期命令走可见 PTY，长期服务走 service runtime） | editor-runtime + terminal | 文档内命令可确认执行并记 activity |
| T6.4 | rich/raw/preview/diff 模式切换 + DocumentToolbar 接 action registry | document-workspace + app-shell | 同一 action 出现在 toolbar 与 command palette |

## Phase 7：Browser Surface（M）

| # | 任务 | 落点 | 验收 |
|---|------|------|------|
| T7.1 | `@innate/browser-runtime`：session、permission prompt（domain allowlist）、browser tool bridge（白名单动作 open/click/type/screenshot/inspect/readonly eval） | `packages/browser-runtime/` | 页面内容按 untrusted 处理，不进 agent prompt 原文 |
| T7.2 | `@innate/browser-ui`：BrowserPanel、AddressBar、annotation overlay | `packages/browser-ui/` | localhost 与 `plugin://` 页面可打开 |
| T7.3 | Rust `browser.rs` 第一版：webview session + screenshot | `apps/desktop/src-tauri/` | 跨公网 CSP 受限页面可截图（第二阶段目标） |

## Phase 8-11（按 roadmap 原样执行，关键调整一处）

- Phase 8 Component Contribution Protocol：slots 落到 `ui.contributions`（T2.1 已铺类型），registry merge built-in + product + plugin roots。
- Phase 9 Theme/Wandesk Shell Profile：**改写为"演进 `@innate/desktop-surface`"**而非从 Wandesk 抽取——补 `WallpaperProfile`、`ShellDock`（running apps/services/tasks）、与 `ShellAppDefinition`/`ShellHost` 契约统一；Wandesk 源若未恢复则以 `02-editor-and-layout-deep-dive.md` 的机制描述为准实现。
- Phase 10 Packaging Profiles：productName/identifier/icon/theme/built-in plugins；同一底座出 base-only / markdown-workspace / skill-workspace / custom-client 四类包。
- Phase 11 Hardening：browser allowed/blocked、grants revoke、签名/hash、进程树/日志持久化、workspace 边界测试、Playwright visual smoke（Shell/Document/Browser/PluginFrame）、Cargo test + TS typecheck gate、keychain Linux fallback。

## 近期执行队列（与 roadmap"近期 10 项"对齐后的落点）

1. `@innate/action-runtime`（T1.1）
2. `ShellStatusBar` + `ContextToolbar`（T1.2）
3. Manifest v1.1：`services[]`、`entry.health`、`ui.contributions`（T2.1）
4. Plugin-aware service manager（T2.2/T2.3）
5. Plugin Detail + Runtime Status（T2.4）
6. Workbench file preview + change inspector + Git status（T3.2-T3.4）
7. Provider Store settings UI 分区（T4.1/T4.3）
8. Task Activity 接入 plugin import / terminal / skill run（T4.4）
9. `@innate/markdown-runtime`（T5.1）
10. `@innate/document-workspace` mock shell（T5.3）

外加一项 roadmap 没有但必须做的第 0 项：**Phase 0 文档修复**（T0.1-T0.5）。

## 里程碑建议

| 里程碑 | 内容 | 出口标准 |
|--------|------|----------|
| M1（≈2 周） | Phase 0 + Phase 1 | 文档无悬空引用/参考源有决策；action 基座可用，Cmd+K 可用 |
| M2（≈4-6 周） | Phase 2 + odx 迁移 | odx 在 BaseShell 内启停、健康/日志/trust 全链路 |
| M3（≈6-8 周） | Phase 3 + Phase 4 | 真实 workspace + git diff/branch；agent 可取消/审批；provider 配置持久化 |
| M4（按 T0.2 决策排期） | Phase 5 + 6 | Markdown folder 打开/预览/编辑/保存；双模编辑器 |
| M5 | Phase 7-11 | Browser、contribution 协议、packaging、hardening |

## 风险与对策

| 风险 | 对策 |
|------|------|
| T0.2 决策拖延会阻塞 M4 排期 | 限时决策；缺源时按 deep-dive 文档规格重写（成本 ×1.5-2 计入 M4） |
| service 进程树清理跨平台差异大 | T2.3 单独留 buffer；unix 进程组先行，windows job object 后补 |
| SQLite 引入改变包依赖形态 | Provider Store 放 Rust 侧（rusqlite）或复用 odx daemon 的 better-sqlite3 经验，Phase 4 开工前定 |
| editor runtime（BlockNote/CodeMirror）版本升级频繁 | 锁版本 + wrapper 隔离（文档 `05` 已要求最小 wrapper） |
| 文档修复与代码并行会产生新漂移 | Phase 0 完成前冻结架构性 PR；之后遵循 source-map 维护规则：架构变更先改 `docs/desktop-app/` |
