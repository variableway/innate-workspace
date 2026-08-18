# base/

开发基础仓库目录。规划与可执行任务已拆到独立项目：

→ **[`innate-foundation/`](./innate-foundation/)**（模块拆分 + Local Workflow 任务）

## 模块对应

| # | 能力 | 模块目录 | 现状 |
|---|------|----------|------|
| 1 | 前端基础代码 + 前端开发 Skill | [`innate-foundation/modules/01-fe-base`](./innate-foundation/modules/01-fe-base/)（代码在 [`innate-fe-base`](./innate-fe-base/)） | 已有，增强中 |
| 2 | 后端基础 + backend-go Skill | [`innate-backend`](./innate-backend/)（任务仍见 [`02-be-base`](./innate-foundation/modules/02-be-base/)） | Skill 在本目录旁 [`innate-backend`](./innate-backend/)；CLI/server 见 [`innate-backend/innate-go`](./innate-backend/innate-go/) |
| 3 | 基础设施 + docker-compose | [`innate-foundation/modules/03-infra`](./innate-foundation/modules/03-infra/) | 待建 |
| 4.1 | AI Agent Provider Configuration Lib | [`innate-foundation/modules/04-agent-provider`](./innate-foundation/modules/04-agent-provider/) | 待抽离 |
| 4.2 | AI Agent Runtime | [`innate-foundation/modules/05-agent-runtime`](./innate-foundation/modules/05-agent-runtime/) | 待抽离 |
| 5 | Desktop / Tauri 可共享打包框架 | [`innate-foundation/modules/06-desktop-shell`](./innate-foundation/modules/06-desktop-shell/) | 编译缓存已落地 [`innate-backend/innate-go/desktop`](./innate-backend/innate-go/desktop/)；shell lib 待建 |
| 6 | Desktop Application 基础组件 | [`innate-foundation/modules/07-desktop-components`](./innate-foundation/modules/07-desktop-components/) | 待建 |

参考实现：`flock/`（第三方，定位见 foundation 治理任务 G02）。想法 backlog：[`todo-ideas.md`](./todo-ideas.md)。
