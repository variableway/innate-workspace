# README（中文）

Innate 工作区与项目索引。

本工作区是 Innate 相关文档网站的源，涵盖 Innate 技能、项目和参考文档，以及一些用 AI 构建的个人小工具。

## Innate Apps

为个人使用而构建的应用。每个 [`innate-apps/`](innate-apps/) 下的子文件夹代表一个分类。所有 Innate 相关项目（应用 + [`base/`](base/) 模板）索引在 [`registry-innate.yaml`](registry-innate.yaml) 中，由 [`scripts/scan-innate-apps.py`](scripts/scan-innate-apps.py) 同步。

### 分类

| 分类 | 描述 | 项目 |
|----------|-------------|----------|
| `content` | 内容相关应用 | innate-feeds, innate-wip |
| `edu` | 教育相关应用 | _空_ |
| `tooling` | 个人开发工具和 CLI 实用程序 | innate-aiswitcher, spark-cli |

### 项目

| 分类 | 项目 | 描述 |
|----------|---------|-------------|
| `content` | [innate-feeds](innate-apps/content/innate-feeds) | GitHub 趋势 / Star / issues 摘要聚合应用（Hono + SQLite API 或静态 GitHub Pages）。 |
| `content` | [innate-wip](innate-apps/content/innate-wip) | 个人网站与项目追踪，集成 GitHub Issues 和每周进度总结（Next.js）。 |
| `tooling` | [innate-aiswitcher](innate-apps/tooling/innate-aiswitcher) | 面向 AI 编码 Agent 的本地 LLM Provider 切换器（Go + PocketBase）。在启动 Claude Code、Codex、Gemini CLI、Trae CLI、OpenCode 等时选择要使用的 Provider/Profile。 |
| `tooling` | [spark-cli](innate-apps/tooling/spark-cli) | 面向日常开发自动化和 AI 技能集成的 CLI：多仓库 git 管理、脚本/任务工作流、系统实用程序（Go, Cobra）。 |
| `base` | [innate-fe-base](base/innate-fe-base) | Web 客户端开发基础 pnpm monorepo：共享 UI 原语、admin 场景模板和参考应用。 |
| `content` | [ai-content-os](innate-apps/content/innate-feeds/ai-content-os) | 面向公众号创作者的开源 AI 内容生产操作系统：从发现选题到发布复盘一站式完成（第三方）。 |
| `content` | [baoyu-skills](innate-apps/content/innate-feeds/baoyu-skills) | 宝玉分享的提升 AI Agent（Claude Code、Codex 等）日常工作效率的 Skills（第三方）。 |
| `base` | [oil-frontend](base/innate-fe-base/suggestion/oil-frontend) | 约束 AI 产品前端实现的 Agent Skill 集合（第三方）。 |
