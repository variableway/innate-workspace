# Sprint 3 — app-content 模板固化

> 状态：todo ｜ 前置：Sprint 2（模板的 .npmrc 与 @innate/ui 依赖才真实可用） ｜ 设计依据：innate-factory.md §10 Phase 3

## 总体目标

从 innate-wip 固化出第一个应用模板 `factory/templates/app-content`——**模板 = 基座成熟模式的快照**（实验室→固化→量产→回流的第一条产线）。模板是真实可构建工程，不是文档。

## 任务表

| ID | 任务 | 状态 | 依赖 |
|----|------|------|------|
| [T01](./T01-extract-app-content.md) | 从 innate-wip 固化 app-content 模板 | todo | Sprint 2 |
| [T02](./T02-starter-skill.md) | 模板内置 AGENTS.md + starter skill + .npmrc | todo | T01 |
| [T03](./T03-smoke-ci.md) | 模板冒烟 CI | todo | T01 |

## 验收

- 模板裸 `pnpm build` 绿（占位符替换后）
- 冒烟 CI 在模板变更时 + 每周跑
- 固化清单中的"删除项"全部执行（个人数据/密钥/git 历史零残留）
