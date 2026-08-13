# 任务：编写 be-starter Skill

- **状态**：pending
- **模块**：02-be-base
- **优先级**：P1
- **依赖**：T03

## 目标

对齐 FE `fe-starter`：Agent 可通过 skill 基于本脚手架（或外部后端参考仓）生成/改造后端代码。

## 执行步骤

1. 参考 `innate-fe-base/packages/skills-kit` 的 skill 结构与 sync 模式
2. 在本模块创建 `skills/be-starter/SKILL.md`（及必要 references）
3. 写清触发词、必读文件、禁止事项、验收方式
4. 在模块 README 写安装/同步说明（可先本地路径，不必强求多 Agent sync）

## 产出

- `skills/be-starter/`
- README 使用说明

## 验收标准

- [ ] Skill 可被 Agent 按 Local Workflow 以外的「按 skill 执行」方式理解并落地一个小改动
- [ ] 明确「从零脚手架」与「基于已有后端改造」两条路径

## 如何执行

```text
请执行 base/innate-foundation/modules/02-be-base/tasks/T04-be-starter-skill.md，使用 Local Workflow。
```
