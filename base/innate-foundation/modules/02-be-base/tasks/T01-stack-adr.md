# 任务：后端技术栈 ADR

- **状态**：pending
- **模块**：02-be-base
- **优先级**：P0
- **依赖**：G01

## 背景

候选包括 Go、PocketBase、Rust、Node 等；`innate-aiswitcher` 已是 Go + PocketBase 参考。

## 目标

做出可执行的技术栈决策，并写成 ADR，供后续脚手架任务遵守。

## 执行步骤

1. 对比至少 2 种栈：与现有 projects 一致性、Agent 可生成性、桌面/服务端复用
2. 写 `modules/02-be-base/docs/adr-001-stack.md`：决策、理由、反选理由、后果
3. 在模块 README 顶部标注选定栈

## 产出

- `docs/adr-001-stack.md`
- README 栈标注

## 验收标准

- [ ] ADR 有明确 Decision
- [ ] 列出至少 3 条 Consequences
- [ ] 后续 T02 可直接按该栈开工，无歧义

## 如何执行

```text
请执行 base/innate-foundation/modules/02-be-base/tasks/T01-stack-adr.md，使用 Local Workflow。
```
