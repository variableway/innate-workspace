# Skills 目录指南

本目录（`skills/docs/`）存放对 `skills/` 根目录下各个子目录的说明：每个目录收集什么领域的 Skill、代表性 Skill 有哪些、当前状态如何。

> 上次盘点：2026-08-16。Skill 生态指的是 Agent Skill（`SKILL.md` 规范，可被 Claude Code / ZCode / Codex 等 CLI 加载，见 [Agent Skills 文档](https://code.claude.com/docs/en/skills)）。

## 总览

| 目录 | 定位 | 代表 Skill | 状态 |
|------|------|-----------|------|
| [`devops-skill/`](#devops-skill) | 开发工作流（git/gh/安全/文档） | git-workflow, git-pr, docmd | 可用，含安装脚本 |
| [`figures-skill/`](#figures-skill) | 人物思想蒸馏与多角色人格 | thought-distiller, freud-skill, souls | 可用 |
| [`fin-skills/`](#fin-skills) | 金融数据工具 | a-stock-data | 可用 |
| [`fire-skills/`](#fire-skills) | Skill 工作台 + 通用 Skill 管理器 | skill-spark, anysearch | 可用（pnpm 工程） |
| [`presentation-skills/`](#presentation-skills) | Slides / PPT / 演示文稿 | —（选型中） | 规划中，调研已完成 |
| [`sdlc-skills/`](#sdlc-skills) | 软件开发生命周期全流程 | — | 规划中 |
| [`wip-skills/`](#wip-skills) | Skill 实验暂存 + 调研文档 | coding-glossary, feishu-wiki-dl | 实验性质 |
| [`tasks/`](#tasks) | 本地任务追踪文件 | — | 辅助目录 |
| [`docs/`](#docs) | 本目录说明 | — | 辅助目录 |

另有 `.workbuddy/`（Workbuddy 工具的本地记忆，非 Skill）、根 `README.md`（仓库入口）。

---

## devops-skill

**仓库**：[qdriven/devops-skill](https://github.com/qdriven/devops-skill)。面向日常开发运维工作流的 Skill 集合，提供 `dev-workflow-install.sh` / `.ps1` / symlink 三种安装脚本。

| Skill | 用途 |
|-------|------|
| `git-workflow` | Git 分支 / 提交 / 合流的规范工作流（根目录的 `.git-workflow.state.json` 即其状态文件） |
| `git-pr` | Pull Request 工作流（创建、审查、合并） |
| `git-worktree` | Git worktree 多工作区管理 |
| `github-cli-skill` | GitHub CLI（`gh`）使用指南 |
| `gh-create-release` | 用 `gh` 创建 Release |
| `local-workflow` | 本地开发工作流约定 |
| `scanning-for-secrets` | 密钥 / 凭据扫描 |
| `docmd` | 从代码 / 目录生成 Markdown 文档（配合 `docmd.config.js`） |

## figures-skill

**仓库**：[qdriven/figures-skill](https://github.com/qdriven/figures-skill)。"人物"向 Skill：把某个人的思想体系蒸馏成可复用的人格 / 方法论。

| Skill | 用途 |
|-------|------|
| `thought-distiller` | 思想蒸馏：从人物著作 / 言论中提炼思维模型 |
| `freud-skill` | 弗洛伊德精神分析人格 |
| `souls` | SOUL 多角色人格框架（一个目录管理多个人格定义） |

`docs/` 内有 `learning-personas-research.md`（学习型人格调研）和 `soul-multi-role.md`（多角色机制说明）。

## fin-skills

金融领域数据 Skill 合集，目标是把分散的金融数据源封装成 AI 助手可直接调用的工具。

| Skill | 用途 |
|-------|------|
| `a-stock-data` | A 股全栈数据工具包（v3.6.0）：十层架构、47 端点、15 数据源，覆盖行情 / 研报 / 信号 / 资金面 / 新闻 / 财务 / 公告 / 打板 / ETF 期权 / 舆情互动，除 iwencai 外零 Key |

## fire-skills

**仓库**：[variableway/fire-skills](https://github.com/variableway/fire-skills)。Personal Skill Workspace：一个 pnpm monorepo，既是通用 Skill 管理器，也承载作者个人 Skill 集（`ICM 论文深度分析报告.md` 等个人文件也在其中）。

| 组成 | 用途 |
|------|------|
| `skills/base/skill-spark` | Skill 管理器 CLI 的配套 Skill：安装、同步 Skill 到 Codex / Claude Code / OpenCode / Trae / Kimi 等agent |
| `skills/base/anysearch` | 实时搜索与网页内容抽取（GitHub / 文档 / 垂直领域搜索、批量搜索、URL 提取），也可用于发现相关 Skill |
| `find-skills.mjs` / `scripts/` / `packages/` | Skill 检索脚本与工程代码 |
| `docs/` | 安装、使用、use-case 文档 |

## presentation-skills

**仓库**：[qdriven/presentation-skills](https://github.com/qdriven/presentation-skills)。定位：收集制作 Slides、PPT、docs、数据报告等 Presentation 的 Skill。

**当前状态**：尚在选型阶段，目录内仅有 README，还没有引入具体 Skill。调研材料已完成，存放在 [`wip-skills/docs/presentation-docs/research/`](../wip-skills/docs/presentation-docs/research/README.md)：

- Top 20 GitHub Presentation Skill 调研（2026-07-27 快照）
- 分场景推荐调研（2026-08-16 快照）：真 .pptx 首选 Anthropic 官方 `pptx` skill 或 `hugohe3/ppt-master`；高颜值 HTML slides 首选 `op7418/guizang-ppt-skill`（中文）或 `lewislulu/html-ppt-skill`；开发者 talk 用 Slidev 官方 skill。

## sdlc-skills

软件开发生命周期（SDLC）Skill 集合的规划仓库：目标是覆盖需求分析 → 架构设计 → 编码 → 测试 → 部署 → 运维 → 项目管理 → 文档的全流程。**当前仅有 README（规划文档），尚未收录 Skill**；开发工作流类的实际内容在 `devops-skill/`。

## wip-skills

Skill 实验 / 暂存仓库，分两部分：

### `wip/` — 实验 Skill

12 个目录中目前只有 2 个有实际内容，其余 10 个为空占位（多为网站克隆 / 工具类候选名，尚未落地）：

| Skill | 用途 |
|-------|------|
| `coding-glossary` | 编程术语表 Skill：面向初学者的术语解释与 beginner-map、recipes 等参考资料（含手工评测用例） |
| `feishu-wiki-dl` | 将飞书公开知识库递归下载为本地 Markdown，无需登录 / 管理员，支持增量检测与断点续传 |
| （空占位） | `Understand-Anything`、`WebSite-Cloner`、`ai-site-cloner`、`ai-website-cloner-template`、`archify`、`calco`、`feishu-docx`、`kill-ai-slop`、`snapsite`、`true-web-clone` |

### `docs/` — 调研文档

| 目录 | 内容 |
|------|------|
| `presentation-docs/research/` | Presentation Skill 调研（2026-07-27 Top 20 + 2026-08-16 分场景推荐），服务 `presentation-skills` 选型 |
| `wechat-docs/research/` | 微信公众号内容获取 Skill 调研（2026-08-16）：单篇读取首选 `freestylefly/wechat-article-extractor-skill`；订阅 + 历史文章绕不开扫码，长期建议自建 `we-mp-rss` + 薄 Skill 包装 |
| `ai-cloner/` | ai-site-cloner 的架构 / 流水线 / 脚本参考文档 |

## tasks/

本地任务追踪文件（当前只有 `tracing/`），记录 Skill 选型 / 建设任务的来源与结论，如 `tasks/skillset/slides-skills.md` 是 presentation 调研的任务来源。

## docs/

即本目录。约定：每个子目录的定位变化、新仓库落地或移除时，同步更新本指南；深度调研报告仍放 `wip-skills/docs/`，这里只放"目录级"说明。

---

## 备注

- 根 `README.md` 提到"Skill 仓库已注册在根目录的 `registry.yaml` 中"，但当前根目录下**不存在** `registry.yaml`（2026-08-16 盘点），`../scripts/clone.py` 是否可用未验证，引用前需先确认。
- `git status` 显示 `devops-skill`、`fire-skills`、`presentation-skills` 等为嵌套 git 仓库（子模块式 clone），各目录的版本以各自仓库为准。
