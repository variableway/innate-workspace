# Skills

AI Agent Skill 集合，每个子目录对应一个独立的 Skill 仓库。各目录的详细说明见 [docs/README.md](./docs/README.md)。

| 项目 | GitHub | 说明 |
|------|--------|------|
| `devops-skill` | [qdriven/devops-skill](https://github.com/qdriven/devops-skill) | 开发工作流 Skill（git-workflow, git-pr, local-workflow 等） |
| `figures-skill` | [qdriven/figures-skill](https://github.com/qdriven/figures-skill) | 人物思想蒸馏与多角色人格（SOUL）Skill |
| `presentation-skills` | [qdriven/presentation-skills](https://github.com/qdriven/presentation-skills) | Slides、PPT、文档、数据报告等 Presentation Skill（选型中，调研见 wip-skills/docs） |
| `fin-skills` | — | 金融数据 Skill（a-stock-data：A 股全栈数据工具包） |
| `fire-skills` | [variableway/fire-skills](https://github.com/variableway/fire-skills) | Personal Skill Workspace + 通用 Skill Manager（skill-spark, anysearch） |
| `sdlc-skills` | — | SDLC 全流程 Skill 集合（规划中） |
| `wip-skills` | — | Skill 实验暂存仓库 + 调研文档（presentation / wechat / ai-cloner） |
| `tasks/` | — | 本地任务追踪文件 |

## 克隆

Skill 仓库已注册在根目录的 `registry.yaml` 中，运行：

```bash
python3 ../scripts/clone.py
```
配套 Agent Skill 的落点，与 `base/`（基座）和 `innate-apps/`（应用）并列。

当前子目录：

| 目录 | 角色 |
|------|------|
| `wip-skills/` | Skill 实验区（含外部克隆） |
| `fe-design-skills/` | 前端设计相关 skill |

`scripts/scan.py` 登记的 reference skills（`devops-skill` 等）也克隆到本目录；根 `registry.yaml` 仍由 spark-cli 管理，本目录只是磁盘落点。

Factory 索引：

- 仓/集合清单：`registry/apps.yaml`（scan 同步，`kind` 多为 external）
- Agent 知识分层：`registry/skills.yaml`（手工维护）
