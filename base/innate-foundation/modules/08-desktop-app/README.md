# Local-First AI Agent Desktop 文档入口

这组文档是当前 workspace 的统一入口，用来替代分散在 `innate-ai-desktop/docs`、`innate-desktop-mono/docs`、`desktop-base-framework` 中的重复架构说明。

核心目标：做一个 local-first AI Agent desktop application 底座。它既是一个可直接使用的 AI 工作台，也是后续开发 desktop application、local app、Markdown workspace、Git/files 工具、browser preview 和 agent plugin 的基础框架。

## 阅读顺序

1. [产品愿景与边界](./01-product-vision.md)
2. [目标架构](./02-target-architecture.md)
3. [模块边界](./03-module-boundaries.md)
4. [Runtime 与 Plugin 协议](./04-runtime-and-plugin-model.md)
5. [Workspace、Markdown 与 Git](./05-workspace-markdown-git.md)
6. [UI Shell、Toolbar 与 Theme](./06-ui-shell-toolbar-theme.md)
7. [实施路线](./07-implementation-roadmap.md)
8. [来源文档索引与去重说明](./source-map.md)

## 当前主线判断

`innate-ai-desktop` 是当前主干：Tauri Host、React AppShell、plugin runtime、terminal、workspace、agent/skill/memory runtime 都以它为准。

`innate-desktop-mono` 是有价值的历史参考：保留其中 agent core、plugin 分层、provider store、workspace gap、build/storage 策略的思想，但不再作为主项目继续叠加。

Tolaria 是 Markdown/editor/document workspace 参考源：抽 BlockNote/CodeMirror 双模、document toolbar、status bar、command palette、vault/files-first 模型，不直接搬整个产品。

Wandesk 是可选 UI profile 参考源：抽 theme、wallpaper、dock/taskbar、window chrome、launcher，不替换主 runtime。

## 文档去重规则

- 旧文档里的“当前代码状态”只保留仍准确的部分。
- 多份 roadmap 合并成一份实施路线。
- 插件、sidecar、agent provider、workspace provider 不再混用一个 “plugin” 概念。
- UI layout、Markdown editor、runtime protocol 分开写，避免一个文档同时承担所有职责。
- 历史迁移记录、旧产品名、一次性任务报告不进入新入口，只在 source map 中保留来源链接。

## 一句话目录边界

```text
apps/desktop              Desktop Host 与产品装配
apps/<app-id>             可选内置 app 源码，按 web/backend/desktop 拆分
packages/*                可复用 TS/React runtime 与 UI
apps/desktop/src-tauri    Native commands、PTY、plugin protocol、workspace、process
plugin roots              用户/开发/打包后的可安装 app，不是源码主线
docs/*                    当前统一后的架构、路线、协议文档
references or old trees   参考源，不默认进入主 build
```

## 当前优先级

1. 固定 Shell、Action、Toolbar、StatusBar 的 contribution 模型。
2. 将 plugin runtime 升级到 service-aware protocol。
3. 把 workspace/files/git/terminal 变成稳定的 agent workbench 基座。
4. 抽 Markdown document workspace：先 shell 和 document model，后 rich editor。
5. 建立 agent/skill/memory/task runtime 的 UI 集成。
6. 做 browser preview / annotation / agent validation。
7. 最后做 packaged plugin、签名、marketplace、复杂 provider 扩展。
