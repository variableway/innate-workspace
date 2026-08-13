# 任务：集成 Skill 加载

- **状态**：pending
- **模块**：05-agent-runtime
- **优先级**：P1
- **依赖**：T03

## 目标

Runtime 能发现并加载 skill 目录（YAML frontmatter / SKILL.md 等约定需在文档写明）。

## 执行步骤

1. 定义 skill 目录布局与清单格式
2. 实现 load + 注入 system/prompt 或 fork 策略（按 ADR）
3. 用 1 个示例 skill 验证
4. 写 `docs/skills.md`

## 产出

- skill 加载代码 + 示例
- `docs/skills.md`

## 验收标准

- [ ] 示例 skill 可被 runtime 加载并影响一轮对话
- [ ] 文档说明目录约定

## 如何执行

```text
请执行 base/innate-foundation/modules/05-agent-runtime/tasks/T04-skill-loading.md，使用 Local Workflow。
```
