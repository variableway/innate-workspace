# README（中文）

Innate 工作区与项目索引。

本工作区是 Innate 相关文档网站的源，涵盖 Innate 技能、项目和参考文档，以及一些用 AI 构建的个人小工具。

## Innate Apps

为个人使用而构建的应用。每个 [`innate-apps/`](innate-apps/) 下的子文件夹代表一个分类。项目索引在 [`registry-innate-apps.yaml`](registry-innate-apps.yaml) 中，由 [`scripts/scan-innate-apps.py`](scripts/scan-innate-apps.py) 同步。

### 分类

| 分类 | 描述 | 项目 |
|----------|-------------|----------|
| `content` | 内容相关应用 | _空_ |
| `edu` | 教育相关应用 | _空_ |
| `tooling` | 个人开发工具和 CLI 实用程序 | innate-aiswitcher, spark-cli |

### 项目

| 分类 | 项目 | 描述 |
|----------|---------|-------------|
| `tooling` | [innate-aiswitcher](innate-apps/tooling/innate-aiswitcher) | 面向 AI 编码 Agent 的本地 LLM Provider 切换器（Go + PocketBase）。在启动 Claude Code、Codex、Gemini CLI、Trae CLI、OpenCode 等时选择要使用的 Provider/Profile。 |
| `tooling` | [spark-cli](innate-apps/tooling/spark-cli) | 面向日常开发自动化和 AI 技能集成的 CLI：多仓库 git 管理、脚本/任务工作流、系统实用程序（Go, Cobra）。 |
