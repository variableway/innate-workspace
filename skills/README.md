# Skills

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
