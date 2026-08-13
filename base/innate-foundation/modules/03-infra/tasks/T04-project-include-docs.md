# 任务：编写 projects 引用 infra 的文档

- **状态**：pending
- **模块**：03-infra
- **优先级**：P1
- **依赖**：T02

## 目标

让 `projects/*` 知道如何 include / override 本 compose，而不是复制粘贴。

## 执行步骤

1. 写 `docs/consume-from-projects.md`：相对路径引用、override 示例、端口冲突处理
2. 给一个最小 override 示例文件（如 `examples/project-override.compose.yml`）

## 产出

- `docs/consume-from-projects.md`
- `examples/project-override.compose.yml`

## 验收标准

- [ ] 示例可被另一目录 compose 引用（文档级验证即可）
- [ ] 说明与 be-base 的推荐联调方式

## 如何执行

```text
请执行 base/innate-foundation/modules/03-infra/tasks/T04-project-include-docs.md，使用 Local Workflow。
```
