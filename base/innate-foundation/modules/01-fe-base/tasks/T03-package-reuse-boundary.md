# 任务：明确 packages 与 apps 的复用边界

- **状态**：pending
- **模块**：01-fe-base
- **优先级**：P1
- **依赖**：T01

## 背景

其它 `projects/*` 需要知道该依赖 `@innate/ui` 等包，还是复制 demo app。

## 目标

写清「可依赖包」vs「仅参考 app」清单，方便跨仓复用。

## 执行步骤

1. 梳理 `packages/*` 与 `apps/*` 职责（参考 AGENTS.md）
2. 写 `modules/01-fe-base/docs/reuse-boundary.md`：哪些包可被外部 workspace 引用、版本策略、哪些 app 禁止当依赖
3. 若需要，在 `innate-fe-base/docs/README.md` 增加指向该文档的链接

## 产出

- `docs/reuse-boundary.md`

## 验收标准

- [ ] 每个 package 标注：public / internal
- [ ] 每个 app 标注：reference-only
- [ ] 给出外部项目引用的推荐方式（workspace / git / 发布 npm 待定）

## 如何执行

```text
请执行 base/innate-foundation/modules/01-fe-base/tasks/T03-package-reuse-boundary.md，使用 Local Workflow。
```
