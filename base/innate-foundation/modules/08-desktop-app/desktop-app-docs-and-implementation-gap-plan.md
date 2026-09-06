# Desktop App 文档合理性、实现差距与实施计划

> 审查日期：2026-08-25  
> 目标仓库：`innate-fe-base`（HEAD `dd5fb164227f`）  
> 参考实现：`base/references/desktop-ref/innate-ai-desktop`（当前目录没有独立 Git 元数据，无法固定 commit）  
> 文档范围：`docs/desktop-app/` 共 12 个 Markdown 文件、约 2,279 行

## 1. 结论

`docs/desktop-app` 的长期方向总体合理，尤其是以下判断应保留：

- local-first、filesystem-first，以及 Workspace、Agent、Plugin 都不能直接获得无限系统权限。
- Plugin Package 与 Contribution 分离。
- Terminal 与长期 Service lifecycle 分离。
- WorkbenchShell 作为主工作模式，桌面浮窗作为可选 profile。
- Markdown 先做 document model、preview/raw edit，再做 BlockNote rich editor。
- Browser 页面必须按 untrusted context 处理。

但这套文档目前**不能直接作为 `innate-fe-base` 的当前实现规范**。最主要的问题不是某个功能缺几页 UI，而是文档把参考项目中的代码写成了目标仓库的“当前能力”，同时混用了两套 Host、两套 manifest 和两套包边界。

本次审查的核心建议是：

1. 明确 `innate-fe-base/apps/desktop-base` 是唯一目标主线；`innate-ai-desktop` 只作为 donor/reference，不再称为当前主干。
2. 先完成文档、manifest、package ownership 和 native command 的基线收敛，再实现 Action、Service、Agent、Document、Browser 等新能力。
3. 将安全门槛前移到每个 vertical slice，不能把权限、CSP、workspace grant、process trust 全部留到 Phase 11。
4. 不整体复制参考项目的 `apps/desktop`；按“contract → native command → TS wrapper → UI → test”的垂直切片迁移。

整体差距属于**多版本、非单 sprint**规模：

- 从 `innate-fe-base` 到参考实现同等能力：大差距。
- 从参考实现到文档中的完整目标：仍是大差距。
- Rich editor、native browser、provider/keychain、packaging/signature 都不是参考实现已经提供的能力，不能按“迁移”估算，应按新开发估算。

## 2. 审查基线与状态定义

本文使用三种状态，避免把“有类型”误写成“已经实现”：

| 状态 | 定义 |
|---|---|
| 已接通 | UI、TS wrapper、Tauri/Rust 或持久化层已经串通，可从产品入口使用 |
| 部分 | 只有 package、contract、mock、单个 UI 或低层命令，尚未满足端到端验收 |
| 未实现 | 两边都没有对应实现，或只有文档设想 |

检查范围：

- `innate-fe-base`：`apps/desktop-base`、`apps/wandesk-ui`、`packages/desktop-shell`、`desktop-runtime`、`plugin-builder`、`workbench`、`skill-runtime`、`agent-ui`、`ui`。
- `innate-ai-desktop`：`apps/desktop`、相关 TypeScript packages、Tauri/Rust commands、现有架构文档。
- `innate-desktop-mono` 与 `tolaria` 当前不在 workspace 中，因此本次无法重新验证这两个来源的实现细节。

同目录的 `docs/analysis/desktop-app/` 分册主要比较目标文档与 `innate-ai-desktop` 参考实现；本文额外核查了真正要承接实现的 `innate-fe-base`。因此，在 `innate-fe-base` 中执行迁移时，以本文的主线收敛和 R0–R8 顺序为准，分册可作为参考项目的细节 inventory 使用。

## 3. 文档合理性评审

### 3.1 必须修改的问题

#### P0：主线定义与目标仓库冲突

`docs/desktop-app/README.md` 和目标架构把 `innate-ai-desktop/apps/desktop` 定义为当前主干，但 `innate-fe-base` 的仓库约束明确把 `apps/desktop-base` + `packages/desktop-shell` 定义为 desktop 方向主线。

实际目标仓库中没有 `apps/desktop`，也没有文档所称的 `@innate/app-shell`、`@innate/plugin-runtime`、`@innate/plugin-ui`、`@innate/terminal`、`@innate/theme`、`@innate/agent-runtime` 和 `@innate/memory-runtime`。

建议：所有架构图统一使用：

```text
apps/desktop-base                     # 目标 Host / composition root
packages/desktop-shell                # 迁移期兼容 facade
packages/app-shell                    # 目标纯 Shell layout
packages/plugin-runtime               # 目标 manifest/registry contract
packages/plugin-ui                    # 目标 Plugin UI
packages/desktop-runtime              # Native command wrapper
references/.../innate-ai-desktop      # donor/reference only
```

#### P0：当前状态和参考状态没有分栏

`03-module-boundaries.md` 的“当前已有模块”和 `04-runtime-and-plugin-model.md` 的“当前已经成立的能力”描述的是参考项目，而不是 `innate-fe-base`。

这会导致实施者误判：例如 `innate-fe-base/packages/desktop-runtime` 确实暴露了 plugin/workspace/skill/process command wrapper，但 `apps/desktop-base/src-tauri` 没有注册任何自定义 Tauri command，`apps/desktop-base` 也没有依赖这个 package。

建议：文档中所有能力表固定拆成四列：

```text
目标能力 | innate-fe-base 当前 | innate-ai-desktop 参考 | 目标状态
```

#### P0：Manifest 存在两套不兼容协议

当前目标仓库使用：

```text
innate.desktop-plugin.v1
runtime = static | external-url
```

参考项目使用：

```text
innate.plugin.v1
runtime = iframe-static | iframe-sidecar | external-web | native
```

新文档又在不改变 `schemaVersion` 的情况下引入 `sidecar-web`、`services[]`、`entry.health` 和更多 contributions。旧 validator 会拒绝新的 runtime 字面量，因此这并不是自然兼容升级。

建议：

- 先建立内部标准化模型 `NormalizedPluginDescriptor`。
- 为 `innate.desktop-plugin.v1` 和 `innate.plugin.v1` 分别保留 legacy adapter。
- `services[]` 与 contribution schema 稳定后再发布 `innate.plugin.v2`。
- TS 和 Rust 使用同一组 JSON fixtures 做 accept/reject contract test。

#### P0：安全工作排得过晚

当前 `apps/desktop-base` 的 Tauri CSP 是 `null`；参考项目虽然有 CSP 和 workspace path scope，但仍存在以下缺口：

- `PluginFramePage` 主题同步使用 `postMessage(..., "*")`。
- 第三方 plugin iframe 没有完整 sandbox/trust policy。
- `permissions` 目前只是字符串声明，没有 grant、revoke 和执行拦截。
- `managed_process_start` 可执行 shell command，但没有 plugin trust prompt 或 workspace-scoped capability。
- Agent UI 展示 sandbox/approval 概念，不等于 native execution 已强制执行。

建议：CSP、origin、path boundary、permission grant、process trust、secret policy 必须进入对应功能的 Definition of Done，Phase 11 只保留发布加固与跨平台 QA。

#### P1：Contribution 类型混合了可序列化协议和 React 实现

文档中的 `AppAction.run`、`StatusContribution.render`、React icon/component 不能出现在第三方 manifest，也不能直接映射到 native menu。

建议拆成：

```ts
type ActionDescriptor = {
  id: string
  label: string
  iconId?: string
  scope?: string
  command: string
}

type ActionHandlerRegistration = {
  command: string
  run: (context: ActionContext) => void | Promise<void>
}
```

Manifest 只贡献 descriptor；first-party source package 和 Host 注册 handler/renderer。

#### P1：来源不可追溯且存在缺失文件

- `desktop-base-framework/README.md` 声称 `desktop-ref` 中有四个项目，但当前只有 `innate-ai-desktop`，Wandesk 已在 `apps/wandesk-ui`，`innate-desktop-mono` 和 `tolaria` 不存在。
- 同一个 README 列出的 `03-extraction-blueprint.md`、`04-component-framework-design.md` 不存在。
- `source-map.md` 引用了无法从当前 workspace 打开的旧文档。
- 参考实现目录没有独立 Git metadata，无法记录准确 revision。

建议：将 `desktop-base-framework` 移到 `docs/analysis` 作为历史比较材料；可验证来源使用真实相对链接和 revision，不可用来源标记为“历史材料，当前未挂载”。

#### P1：Roadmap 是能力清单，不是可交付版本计划

当前 0–11 阶段覆盖面完整，但存在三个问题：

- 没有先处理两套 Host/manifest/package 的迁移策略。
- Action UI 排在 native runtime 收敛前，容易继续增加只在浏览器可见的壳能力。
- 验收描述没有绑定测试、兼容策略、数据迁移和安全门槛。

建议改为本报告第 6 节的 release slices，每个 slice 必须有端到端 demo 和自动化 gate。

#### P2：文档入口没有接入仓库文档地图

`docs/README.md` 当前没有 `desktop-app` 入口，并声明 `docs/analysis` 只作为背景分析。新文档却自称统一入口，二者冲突。

建议：完成 P0 修订后，把它以“Desktop 目标架构（Proposed/Active）”加入 `docs/README.md`；在修订前不要标成 current implementation spec。

### 3.2 各文件修改建议

| 文件 | 建议 |
|---|---|
| `README.md` | 增加文档状态、目标仓库、实现基线和状态图例；把主线改为 `apps/desktop-base` |
| `01-product-vision.md` | 保留愿景；补 MVP release boundary，区分最终平台与首个可发布版本 |
| `02-target-architecture.md` | 更新 composition root；加入 `desktop-shell` 迁移边界和 normalized manifest 层 |
| `03-module-boundaries.md` | “当前已有”拆成目标仓库/参考实现两列；补 `desktop-surface` 与 `agent-ui` 的真实定位 |
| `04-runtime-and-plugin-model.md` | 明确 legacy adapter/v2 策略；补 service state machine、grant store、event versioning |
| `05-workspace-markdown-git.md` | 标明当前只有 list/read/status；write/diff/branch/review 都是目标能力 |
| `06-ui-shell-toolbar-theme.md` | 标明参考项目已经有 `desktop-surface`；拆分 descriptor 与 React handler |
| `07-implementation-roadmap.md` | 改成 release slices；将安全和测试放入每个 slice |
| `source-map.md` | 删除无法验证的“当前来源”表述；补路径、revision/快照和 unavailable 标记 |
| `desktop-base-framework/*` | 移到 `docs/analysis` 或归档；修复缺失 03/04 的索引 |

## 4. 两边代码的实际能力差距

### 4.1 可量化结构差距

文档的目标 package tree 一共列出 21 个 package 名称：

- `innate-fe-base` 当前有 5/21 个同名 package：`ui`、`desktop-runtime`、`plugin-builder`、`workbench`、`skill-runtime`。
- `innate-ai-desktop` 当前有 12/21 个同名 package。
- `innate-fe-base` 另有 `desktop-shell`，它把 shell layout、plugin contract、registry、bridge 和 UI 混在一个包中，可覆盖部分目标，但不能直接按多个目标 package 计为完成。
- 参考项目仍缺 9 个目标 package：`action-runtime`、`service-runtime`、`browser-runtime`、`browser-ui`、`task-runtime`、`markdown-runtime`、`document-runtime`、`editor-runtime`、`document-workspace`。

从参考项目迁入目标仓库时，至少有 10 个参考 package 或等价能力当前不在 `innate-fe-base`：

```text
agent-runtime, app-shell, desktop-surface, memory-runtime, platform,
plugin-runtime, plugin-ui, terminal, theme, tutorial
```

Native 层差距更直接：

- `innate-fe-base/apps/desktop-base/src-tauri`：0 个自定义 `#[tauri::command]`。
- `innate-ai-desktop/apps/desktop/src-tauri`：29 个 `#[tauri::command]`，分布在 13 个 command 模块文件中。
- 当前 `desktop-base` 的 `package.json` 只依赖 `desktop-shell` 和 `ui`，没有消费已抽取的 `desktop-runtime`、`workbench`、`skill-runtime`、`plugin-builder`。

因此，当前最大差距是**native wiring 与 package convergence**，不是富编辑器。

### 4.2 功能矩阵

| 能力域 | `innate-fe-base` 当前 | `innate-ai-desktop` 参考 | 文档目标差距 |
|---|---|---|---|
| Tauri Host | 最小窗口、single-instance、opener；无自定义 command | 29 commands、plugin protocol、PTY、workspace、agent/skill/process | 需要把目标 Host 接通，而非只保留 wrapper |
| Shell | `DesktopShell` 单页 rail/header/iframe | `WorkbenchShell` + Home `DesktopSurface` 浮窗 | 缺 Action/Toolbar/Status/Command registry |
| Theme | `@innate/ui` color mode + variant | base/qaworkspace/odx/wandesk + iframe bridge | 需统一为目标 theme contract，避免两套 provider |
| Static Plugin | Web manifest、registry、event bridge、手工内置清单 | 扫描/安装/plugin protocol/registry UI 已接通 | 需统一 schema、native install 和兼容 adapter |
| Sidecar/Service | 只有未接通的 managed-process wrapper | low-level process start/status/list/stop + URL probe | 缺 services[]、health retry、logs UI、tree stop、trust/grant |
| Plugin Contributions | sidebar/homeCard | home card、frame、theme；platform 中有更宽 contract | 缺统一 validation、ordering、first/third-party 边界 |
| Plugin Security | event bridge origin/source 校验较好；Tauri CSP 为 null | plugin path scope/CSP 较好；theme message 使用 `*`；无 grant | 两边都未达到目标安全模型 |
| Terminal | 未实现 | xterm + portable-pty 已接通 | 缺 multi-session、Task Activity、service log 分流 |
| Workspace/Files | contract + browser in-memory mock | list/read/1MB preview/path scope 已接通 | 缺 watcher、write policy、external editor |
| Git | contract 中只有 status | status + branch name | 缺 diff、branch list/switch/create、change review |
| Agent | 只有 `agent-ui` 展示组件 | CLI registry/detect、sidecar streaming run；无 cancel，approval 未端到端强制 | 缺稳定 provider lifecycle、cancel/resume、approval/tool loop |
| Skill | parser/scanner/registry package已实现，但未接 App | scan/install/run/UI 已接通 | 缺 provider store resolver、统一 activity |
| Memory | 未实现 | local JSON/in-memory runtime 与 CLI；UI 仍是 planned | 缺 Host persistence/UI/context policy |
| Task/Activity | EventLog 和 `agent-ui` timeline，不是执行 runtime | JSON task sessions + agent stream；未统一所有 activity | 缺 task-runtime、approval、append-only/SQLite event model |
| Markdown/Tutorial | 未实现 | read-only Markdown、ToC、Shiki、RunnableCodeBlock | 可作为 markdown-runtime donor，但需安全执行策略 |
| Document/Editor | 未实现 | 未实现 | 两边都缺；Tolaria 源码当前不可用，属于新开发 |
| Browser | Plugin iframe，不是 browser tool surface | Plugin iframe，不是 browser runtime | 两边都缺 screenshot/annotation/session/native webview |
| Provider Store/Secret | 未实现 | 未实现；只有 contract/设计 | 两边都缺 SQLite migration、keychain、diagnostics |
| Packaging Profiles | 单一 Tauri config | 单一 Tauri config | 两边都缺产品 profile、built-in resources、签名发布 |
| QA | 相关包 typecheck、88 tests、Web build、Cargo check 通过 | Cargo check 通过；当前快照无 node_modules，TS 未复跑；相关 runtime 只有 5 个 test 文件 | 缺 contract fixtures、native integration、Playwright、跨平台 gate |

### 4.3 参考实现不能直接视为完成的部分

迁移时需要显式排除以下“看起来已经有、实际上仍是 skeleton”的能力：

- Workbench 的 Agent 写入路径仍是 `desktop-mock-run`，只向 `.innate/agent-notes.md` 追加内容。
- Home 的 Recent Activity 是 future task-runtime preview。
- Memory、MCP tools、workspace actions 在 Skill UI 中仍标记为 planned。
- Task session 是 JSON CRUD，不是文档目标中的统一 Task/Activity/Approval runtime。
- Agent 有 run/stream，但没有 cancel command；UI 中的 mode/sandbox/approval 没有完整传入并由 Host 强制。
- Sidecar 仍依赖 `dev.startCommand` 和通用 managed process，不是 plugin-aware service manager。
- Plugin theme bridge 使用 wildcard target origin，不能直接照搬。
- Reference 的 `desktop-surface` 已在 Home 使用，文档却仍把类似能力全部写成后续工作，说明文档基线已落后于代码。

## 5. 推荐的目标边界

### 5.1 唯一主线

```text
innate-fe-base/apps/desktop-base
  = 唯一产品 Host、路由、产品 profile、runtime 注入点

innate-ai-desktop
  = 只读 donor/reference；迁移完成后不参与 build/release
```

### 5.2 Package 收敛

```text
@innate/platform          纯跨层 contract
@innate/app-shell         纯 layout/slots，不知道 plugin/agent/workspace
@innate/action-runtime    descriptor、handler、context、placement registry
@innate/plugin-runtime    normalized manifest、legacy adapters、scan/install DTO
@innate/plugin-ui         registry/importer/frame/detail/runtime status
@innate/desktop-runtime   Tauri command/event wrappers，不依赖 React shell
@innate/desktop-shell     迁移期 facade；完成后只负责组合或弃用
```

当前 `desktop-runtime -> desktop-shell` 的依赖方向应取消。Runtime contract 不应依赖 UI Shell package。

### 5.3 不应直接搬运的代码

- 不整体复制参考项目的 `apps/desktop/src/main.tsx`。
- 不复制 wildcard `postMessage`、无 trust prompt 的 shell command 启动路径。
- 不把 mock workbench/Recent Activity 当成正式 runtime。
- 不在 legacy `schemaVersion` 下直接增加旧 validator 不认识的 runtime 值。
- Tolaria 源未恢复并固定 revision 前，不按“迁移现有 BlockNote 实现”排期。

## 6. 分阶段实施计划

以下阶段是依赖顺序，不要求一个人串行完成。粗略工期按单人、已有代码可复用、不中断需求变更估算，仅用于判断量级。

### R0：文档与 ADR 收敛（2–4 人日）

任务：

1. 修订 `docs/desktop-app` 的主线、状态表和 source map。
2. 新增 ADR：Host 主线、manifest 兼容、package ownership、contribution execution。
3. 将 `desktop-base-framework` 迁到 analysis/archive。
4. 把修订后的 Desktop 文档接入 `docs/README.md`。
5. 建立 baseline inventory 自动检查：目标 package、Tauri command、文档链接。

验收：

- 文档中不存在把参考实现写成目标仓库当前能力的表述。
- 所有来源可打开或明确标为 unavailable。
- 新能力能唯一归属到 app/package/native/plugin。

### R1：Contract 与 Package 收敛（1–2 周）

任务：

1. 新增 `@innate/platform`、`@innate/plugin-runtime`、`@innate/app-shell` 基线。
2. 从 `desktop-shell` 移出 manifest/registry 类型，保留 legacy adapter。
3. 定义 `NormalizedPluginDescriptor` 和两套 v1 adapter。
4. 定义可序列化 Action/Contribution descriptor 与 Host handler registry。
5. 建 TS/Rust 共用 manifest fixtures 和 compatibility tests。
6. 明确 `desktop-shell` 的 facade/deprecation 计划。

验收：

- `desktop-runtime` 不再依赖 `desktop-shell`。
- 两套现有 manifest 都能转换到同一内部模型。
- Rust/TS 对合法和非法 fixtures 的判断一致。

### R2：Native Runtime MVP（2–4 周）

按垂直切片从参考项目选择性迁移：

1. host info、external open、HTTP probe。
2. plugin roots、scan、static install、`plugin://` protocol。
3. workspace root/list/read/git status。
4. PTY create/write/resize/close 与事件。
5. managed process start/status/list/stop 与输出事件。
6. skill scan/install；Agent command 暂不在本阶段迁移。
7. `desktop-base` 接入 `desktop-runtime`，移除“只有 wrapper 没有 command”的状态。

安全与质量门槛：

- 非空 CSP、最小 Tauri capabilities。
- path canonicalization、symlink/path traversal tests。
- plugin protocol MIME/CSP tests。
- command/event schema tests。
- `cargo fmt --check`、`cargo clippy`、`cargo test`、`cargo check`。

验收：

- 一个 static plugin 能从本地目录安装、扫描并通过 plugin protocol 打开。
- 用户能打开 workspace、浏览文本文件、查看 Git status，并打开真实 PTY。

### R3：Shell 与核心 UI 接通（2–3 周）

任务：

1. 迁移/重构 `WorkbenchShell`、`desktop-surface`、theme profiles。
2. 迁移 `terminal`、`plugin-ui` 和参考 Workbench UI，但不迁移 mock agent 行为。
3. `desktop-base` 建立 Home、Workspace、Plugins、Skills、Settings 路由。
4. 实现 Action registry、ContextToolbar、StatusBar、Command Palette 第一版。
5. 现有 `desktop-shell` event bridge 作为兼容资产保留，严格 origin/source 校验不能回退。

验收：

- 同一 action 可被 toolbar 和 command palette 调用，业务 handler 只有一份。
- Plugin、Workspace、Terminal 都从 `desktop-base` 正式入口访问。
- Workbench/desktop window 两种 surface 共用 app descriptor，而不是复制业务组件。

### R4：Plugin Service v2 与 Trust（3–4 周）

任务：

1. 确定并发布 v2 manifest：`services[]`、`entry.health`、UI contributions。
2. `@innate/service-runtime`：group、start/stop/restart、health、retry、logs、port conflict。
3. Rust 实现 process tree cleanup，区分 service logs 和 interactive PTY。
4. 建 permission grant store：首次启动确认、remember/revoke、审计记录。
5. Plugin Detail、Runtime Status、Logs UI。
6. iframe sandbox/theme/event bridge 安全复核；禁止 wildcard target origin。

验收：

- Web + backend demo plugin 可安装、请求授权、启动、健康检查、查看日志、停止整组进程。
- 未授权 plugin 无法启动进程或访问 workspace handle。

### R5：Workspace、Git 与 Task Activity（3–5 周）

任务：

1. Git diff、branch list/switch/create，commit 后置且单独确认。
2. File preview、Change Inspector、external editor、watcher contract。
3. Workspace read/write grant 分离；write/apply patch 进入 review flow。
4. 新增 `@innate/task-runtime`，统一 plugin/service/terminal/workspace/skill/agent events。
5. Activity 持久化与 schema migration；优先 SQLite 或 append-only event log。
6. Approval UI 和 action/runtime 绑定。

验收：

- Agent 或工具提出文件修改后，用户能查看 diff、接受/拒绝，再由 Host 写入。
- Plugin import、service、terminal、workspace 操作出现在同一 Activity timeline。

### R6：Agent、Skill、Memory 与 Provider Store（4–6 周）

任务：

1. 迁移 `agent-runtime`、`memory-runtime`，复用已经存在的 `skill-runtime`。
2. 补 Agent run/cancel/events；resume 作为后续可选能力。
3. sandbox/approval 不只显示在 UI，必须进入 provider/native execution policy。
4. Provider Store：LLM provider、model、Agent profile、Execution profile、diagnostics。
5. OS keychain secret ref；SQLite 只保留 metadata。
6. Memory recall 进入受控 context block；保留 deterministic search 作为第一版。
7. Skill run 全量接入 Task Activity 和 provider resolver。

验收：

- 用户可选择 Agent profile，运行和取消一个真实任务。
- 需要写文件、执行命令或访问网络时产生可审计审批。
- raw secret 不出现在 SQLite、project config、日志或 Activity payload。

### R7：Markdown Document MVP（3–5 周）

任务：

1. 从参考 `tutorial` 抽 `@innate/markdown-runtime`：GFM、Shiki、ToC、safe HTML、Runnable adapter。
2. 新增 `@innate/document-runtime`：frontmatter、heading、wikilink、DocumentEntry、watcher。
3. 新增 `@innate/document-workspace` shell。
4. 先实现 preview + CodeMirror raw edit + save + diff。
5. Runnable block 走 visible PTY 或 service runtime，并发 Task Activity。

验收：

- 本地 Markdown folder 可打开、列出、预览、编辑、保存和查看 diff。
- 外部文件变化可被检测，不发生静默覆盖。

### R8：Rich Editor、Browser 与产品化（6–10+ 周，建议拆版本）

任务：

1. Tolaria 来源恢复并固定 revision 后，重新评估 BlockNote schema 的可迁移性；否则按新实现处理。
2. `@innate/editor-runtime`：BlockNote wrapper、schema registry、rich/raw/preview/diff。
3. `@innate/browser-runtime`/`browser-ui`：session、navigation、screenshot、annotation、permission。
4. Native webview 和 CDP/Playwright developer mode 分开交付。
5. Packaging profile、built-in resources、brand、icon、signing、release channel。
6. Plugin hash/signature、跨平台 process/path/keychain fallback、visual/native smoke。

验收：

- Rich editor 与 browser 分别有独立 release gate，不互相阻塞基础 Workbench 发布。
- 至少 macOS/Windows/Linux 的 CI 或发布前验证矩阵明确并可复跑。

## 7. 建议的首批执行队列

不要直接从旧 roadmap 的 10 个 UI/feature 任务开始。建议首批按以下顺序：

1. 修订文档状态和主线，建立 4 个 ADR。
2. 定义 normalized plugin contract + legacy adapters。
3. 解除 `desktop-runtime -> desktop-shell` 的反向依赖。
4. 迁移 plugin scan/install/protocol vertical slice。
5. 为 `desktop-base` 配置非空 CSP 和 native contract tests。
6. 迁移 workspace list/read/git status vertical slice。
7. 迁移 PTY vertical slice。
8. 接入 WorkbenchShell/Plugin UI/Terminal UI。
9. 实现 Action registry 的 descriptor/handler 分层。
10. 再进入 services[] 和 plugin-aware service manager。

这 10 项完成后，目标仓库才真正达到“可继续扩展的 desktop foundation”基线。

## 8. 验证记录

`innate-fe-base` 本次已执行：

```text
相关 6 个 package typecheck                         PASS
desktop-shell / desktop-runtime / plugin-builder /
workbench / skill-runtime tests：88 tests           PASS
@innate/desktop-base Vite production build          PASS
apps/desktop-base/src-tauri cargo check              PASS
```

Web build 有一个非阻塞告警：主 JS chunk 约 953 KB（minified），后续 Shell/Editor/Browser 接入前应建立 route-level lazy loading 和 chunk budget。

参考实现本次已执行：

```text
apps/desktop/src-tauri cargo check                   PASS
```

参考目录当前没有 `node_modules`，因此没有重新运行其 TypeScript typecheck/test；代码中可见的 runtime tests 主要集中在 Agent、Memory、Skill 三个 package，共 5 个 test 文件。迁移时不能依赖参考项目现有测试覆盖，必须在目标仓库补齐 contract、native integration 和 UI smoke。

## 9. 最终判断

文档需要修改，但不需要推翻。产品愿景与大部分模块分层可以保留；必须重写的是“当前状态、主线归属、manifest 兼容、安全阶段和实施顺序”。

最合理的实现策略不是把 `innate-ai-desktop` 整棵复制进来，而是让 `innate-fe-base` 成为唯一产品主线，逐个迁移已经验证的 native/runtime vertical slice，同时保留 `desktop-shell` 现有的安全 event bridge 和 `innate-fe-base` 更完整的 UI/test 工程约束。
