# 产品愿景与边界

## 目标

目标不是只做一个 Markdown editor，也不是做一个插件市场 demo。目标是做一个 local-first AI Agent Desktop 底座：

- 能作为最终用户的 AI 工作台使用。
- 能作为其他 desktop application 的基础框架使用。
- 能打开本地文件、Git workspace、Markdown 文档、教程、终端、browser preview 和 sidecar web app。
- 能用统一 runtime 承载 Codex、Claude、Kimi、OpenCode、Aider、DeepSeek、本地模型和未来 provider。
- 能让 app/plugin 贡献页面、toolbar action、status item、settings panel、document block、browser tool 和 workflow。

## 产品形态

这个底座支持三种产品形态。

| 形态 | 说明 | 适用场景 |
|---|---|---|
| BaseShell Desktop | 一个通用 desktop host，扫描并打开 plugins/apps | AI 工作台、技能库、教程、文件/Git、插件启动器 |
| Product Desktop | 基于同一套 packages 打包成独立产品 | 客户定制 app、品牌化工具、离线工具 |
| Local App Plugin | 被 BaseShell 安装/托管的 web、sidecar 或外部 app | GitHub/local web app、后台服务、工具面板 |

## Local-First 原则

1. 用户 workspace、技能、memory、provider 配置优先存本地。
2. 文件、Git、终端、sidecar 和 browser 都必须有明确权限边界。
3. Agent 可以调用本地 CLI 或 sidecar，但不能默认拥有全系统权限。
4. Secret 不写入普通 SQLite/JSON；只存 metadata 和 keychain reference。
5. Project config 可以提交到仓库，但不包含 secret。
6. Browser 页面内容视为 untrusted context，不能直接进入 agent prompt 或本地执行链。

## 应用开发底座

作为 desktop application framework，它需要提供：

- Tauri + React Host。
- 可复用 Shell layout 和主题。
- 文件系统、Git、PTY、managed process、browser/webview 的 typed runtime wrapper。
- App/plugin manifest 和 contribution registry。
- Service runtime，用于长期后台服务、sidecar、MCP server、local model server。
- Agent runtime、Skill runtime、Memory runtime、Task runtime。
- Markdown/document workspace runtime。
- Packaging profile，用同一套底座构建不同桌面产品。

## 不做什么

短期不做这些：

- 不直接把 `tolaria` 整体迁进来。
- 不把 `innate-desktop-mono` 继续作为主干扩张。
- 不让第三方 React bundle 直接进入主 renderer 依赖树。
- 不把 `dev.startCommand` 当成正式 sidecar protocol。
- 不让 plugin 前端直接访问 Tauri API、secret、workspace path。
- 不把 browser 做成用户主浏览器替代品。
- 不在 service permission、plugin trust、workspace grant 没稳定前做完整 marketplace。

## 参考项目角色

| 来源 | 保留价值 | 使用方式 |
|---|---|---|
| `innate-ai-desktop` | 当前主干和最新实现 | 继续开发主 Host 和 packages |
| `innate-desktop-mono` | agent core、plugin 分层、provider store、workspace gap、build/storage 策略 | 合并思想，不继续继承旧结构 |
| `tolaria` | Markdown editor、四栏文档工作区、toolbar/status/command palette、files-first vault | 抽模块和交互模型，不搬完整 app |
| `wandesk-ui` | playful desktop theme、dock、launcher、window chrome、wallpaper profile | 做可选 theme/profile 和 window shell primitive |
| `desktop-base-framework` | 本 session 的横向比较 | 归并到本组文档后不再作为主入口 |

## 成功标准

第一阶段成功不是功能多，而是边界清楚：

1. 一个静态 web app 可以被安装、扫描、打开。
2. 一个 web + backend app 可以由 Host 托管服务、检查健康、展示日志、打开 UI。
3. 一个 Markdown folder 可以作为 document workspace 打开、预览、编辑、保存。
4. 一个 Git workspace 可以展示 status、diff、branch，并能被 agent 作为受控工作目录使用。
5. 一个 Skill 可以被扫描、绑定 agent profile、运行，并发出 Task Activity。
6. 一个 Agent provider 可以运行、取消、发事件、请求审批。
7. 同一个 action 可以进入 toolbar、command palette、status bar、menu。
8. Theme 可以在 ODX、QA Workspace、Wandesk 等 profile 间切换，插件可选择继承或隔离。
