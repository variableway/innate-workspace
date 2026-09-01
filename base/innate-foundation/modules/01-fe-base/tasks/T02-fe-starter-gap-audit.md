# 任务：审计 fe-starter 冷启动覆盖缺口

- **状态**：pending
- **模块**：01-fe-base
- **优先级**：P1
- **依赖**：T01

## 背景

活跃 skill 为 `fe-starter`（`packages/skills-kit`）。landing / auth / chat 等模式可能仍在 archive 或不完整。

## 目标

产出缺口清单与优先级，决定补 skill 还是补 template scene。

## 执行步骤

1. 阅读 `innate-fe-base/packages/skills-kit/README.md` 与 `skills/fe-starter`
2. 对照 `skills-archive` 与 `docs/analysis`，列出新项目冷启动常见场景
3. 写审计报告到 `modules/01-fe-base/docs/fe-starter-gap-audit.md`（在本模块下创建 docs/）
4. 每条缺口标注：补 skill / 补 scene-spec / 暂缓

## 产出

- `modules/01-fe-base/docs/fe-starter-gap-audit.md`

## 验收标准

- [ ] 至少覆盖 admin / auth / landing / data-table / chat 五类场景的有无判断
- [ ] 每条有明确下一步建议

## 如何执行

```text
请执行 base/innate-foundation/modules/01-fe-base/tasks/T02-fe-starter-gap-audit.md，使用 Local Workflow。
```
